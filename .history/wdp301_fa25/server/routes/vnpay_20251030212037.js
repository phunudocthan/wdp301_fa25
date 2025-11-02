const express = require("express");
const crypto = require("crypto");
const qs = require("qs");
const Order = require("../models/Order");
const requestIp = require("request-ip");
require("dotenv").config();

const router = express.Router();

const vnp_TmnCode = process.env.VNP_TMNCODE;
const vnp_HashSecret = process.env.VNP_HASHSECRET;
const vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const vnp_ReturnUrl = process.env.VNP_RETURNURL;

router.post("/create_payment_url", async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    if (!orderId || !amount)
      return res.status(400).json({ message: "Thiếu orderId hoặc amount" });

    const ipAddr = requestIp.getClientIp(req) || "127.0.0.1";
    const date = new Date();
    const createDate = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}${String(date.getSeconds()).padStart(2, "0")}`;

    const amountVNPay = Math.round(Number(amount) * 100);

    // Tạo object tham số
    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: vnp_TmnCode,
      vnp_Amount: amountVNPay,
      vnp_CurrCode: "VND",
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toán đơn hàng #${orderId}`,
      vnp_OrderType: "other",
      vnp_Locale: "vn",
      vnp_ReturnUrl: vnp_ReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    // 🔹 Sort keys theo a-z
    vnp_Params = sortObject(vnp_Params);

    // 🔹 Chuỗi dữ liệu để ký (không encode)
    const signData = qs.stringify(vnp_Params, { encode: false });

    // 🔹 Tạo chữ ký
    const hmac = crypto.createHmac("sha512", vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    // 🔹 Thêm chữ ký vào params
    vnp_Params["vnp_SecureHash"] = signed;

    // 🔹 Tạo URL có encode
    const paymentUrl = vnp_Url + "?" + qs.stringify(vnp_Params, { encode: true });

    console.log("🔗 Payment URL:", paymentUrl);
    return res.json({ paymentUrl });
  } catch (err) {
    console.error("Lỗi tạo URL:", err);
    res.status(500).json({ message: "Lỗi tạo URL thanh toán" });
  }
});

// ✅ Hàm sort chuẩn VNPay
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (let key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}

router.get("/return", async (req, res) => {
  let vnp_Params = req.query;
  const secureHash = vnp_Params.vnp_SecureHash;
  delete vnp_Params.vnp_SecureHash;
  delete vnp_Params.vnp_SecureHashType;

  vnp_Params = sortObject(vnp_Params);
  const signData = qs.stringify(vnp_Params, { encode: false });
  const checkSum = crypto
    .createHmac("sha512", vnp_HashSecret)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  if (secureHash === checkSum) {
    const order = await Order.findById(vnp_Params.vnp_TxnRef);
    if (!order) return res.send("❌ Order không tồn tại");

    order.paymentInfo = vnp_Params;
    if (vnp_Params.vnp_ResponseCode === "00") {
      order.paymentStatus = "paid";
      order.status = "confirmed";
      order.paidAt = new Date();
      await order.save();
      res.send("✅ Thanh toán thành công!");
    } else {
      order.paymentStatus = "failed";
      await order.save();
      res.send("❌ Thanh toán thất bại!");
    }
  } else {
    res.send("⚠️ Sai chữ ký!");
  }
});

module.exports = router;
