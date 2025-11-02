const express = require("express");
const crypto = require("crypto");
const qs = require("qs");
const moment = require("moment");
const Order = require("../models/Order");
const requestIp = require("request-ip");
require("dotenv").config();

const router = express.Router();

// ENV cấu hình
const vnp_TmnCode = (process.env.VNP_TMNCODE || "").trim();
const vnp_HashSecret = (process.env.VNP_HASHSECRET || "").trim();
const vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const vnp_ReturnUrl = (process.env.VNP_RETURNURL || "http://localhost:5000/api/vnpay/return").trim();


// 🟢 TẠO URL THANH TOÁN
router.post("/create_payment_url", async (req, res) => {
    try {
        const { amount, orderDescription, orderId } = req.body;

        const date = new Date();
        const createDate = moment(date).format("YYYYMMDDHHmmss");
        const orderRef = orderId || moment(date).format("HHmmss");

        // Chuẩn hóa IP
        const clientIp = requestIp.getClientIp(req) || "127.0.0.1";
        const vnp_IpAddr = clientIp.includes("::1") ? "127.0.0.1" : clientIp;

        // B1: Tạo params
        let vnp_Params = {
            vnp_Version: "2.1.0",
            vnp_Command: "pay",
            vnp_TmnCode,
            vnp_Locale: "vn",
            vnp_CurrCode: "VND",
            vnp_TxnRef: orderRef,
            vnp_OrderInfo: orderDescription || `Thanh toan don hang ${orderRef}`,
            vnp_OrderType: "other",
            vnp_Amount: Math.round(amount *24000 * 100), // ⚠️ VNPay yêu cầu nhân 100
            vnp_ReturnUrl,
            vnp_IpAddr,
            vnp_CreateDate: createDate,
        };

        // B2: Sort & encode chuẩn
        vnp_Params = sortObject(vnp_Params);

        // B3: Tạo chuỗi để ký
        const signData = qs.stringify(vnp_Params, { encode: false });

        // B4: Hash SHA512
        const hmac = crypto.createHmac("sha512", vnp_HashSecret);
        const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

        // B5: Gắn hash
        vnp_Params["vnp_SecureHashType"] = "SHA512";
        vnp_Params["vnp_SecureHash"] = signed;

        // B6: Tạo URL thanh toán
        const paymentUrl = vnp_Url + "?" + qs.stringify(vnp_Params, { encode: false });

        console.log("----- VNPay DEBUG START -----");
        console.log("vnp_Params (sorted):", vnp_Params);
        console.log("signData (to hash):", signData);
        console.log("computed vnp_SecureHash:", signed);
        console.log("paymentUrl:", paymentUrl);
        console.log("----- VNPay DEBUG END -----");

        return res.json({ code: "00", message: "success", paymentUrl });
    } catch (err) {
        console.error("VNPay create_payment_url error:", err);
        return res.status(500).json({ code: "99", message: "error", error: err.message });
    }
});


// 🟢 CALLBACK VNPay RETURN
router.get("/return", async (req, res) => {
    try {
        let vnp_Params = { ...req.query };

        const receivedHash = vnp_Params.vnp_SecureHash;
        delete vnp_Params.vnp_SecureHash;
        delete vnp_Params.vnp_SecureHashType;

        vnp_Params = sortObject(vnp_Params);
        const signData = qs.stringify(vnp_Params, { encode: false });

        const hmac = crypto.createHmac("sha512", vnp_HashSecret);
        const checkHash = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

        console.log("----- VNPay RETURN DEBUG -----");
        console.log("signData (from VNPay):", signData);
        console.log("computed hash:", checkHash);
        console.log("received hash:", receivedHash);
        console.log("-----------------------------");

        if (checkHash !== receivedHash) {
            return res.status(400).send("Sai chữ ký");
        }

        const order = await Order.findById(vnp_Params.vnp_TxnRef);
        if (!order) return res.send("Order không tồn tại");

        order.paymentInfo = vnp_Params;
        order.paymentStatus = vnp_Params.vnp_ResponseCode === "00" ? "paid" : "failed";

        if (order.paymentStatus === "paid") {
            order.paidAt = new Date();
            order.status = "confirmed";
        }

        await order.save();

        // 🔥 Redirect về frontend sau khi thanh toán xong
        if (vnp_Params.vnp_ResponseCode === "00") {
            return res.redirect("http://localhost:3000/orders?status=success");
        } else {
            return res.redirect("http://localhost:3000/orders?status=failed");
        }
    } catch (err) {
        console.error("Error /vnpay/return:", err);
        return res.status(500).send("Lỗi xử lý callback");
    }
});


// 🧩 Hàm sort object chuẩn VNPay
function sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
        sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
    }
    return sorted;
}

module.exports = router;
