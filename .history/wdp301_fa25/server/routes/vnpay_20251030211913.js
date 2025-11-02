const express = require("express");
const crypto = require("crypto");
const qs = require("qs");
const Order = require("../models/Order");
const requestIp = require("request-ip");
require("dotenv").config();

const router = express.Router();

// ========================
// ⚙️ Cấu hình VNPay
// ========================
const vnp_TmnCode = process.env.VNP_TMNCODE;
const vnp_HashSecret = process.env.VNP_HASHSECRET;
const vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const vnp_ReturnUrl = process.env.VNP_RETURNURL;

// ========================
// 🧾 Tạo URL thanh toán VNPay
// ========================
router.post("/create_payment_url", async (req, res) => {
  try {
    let { orderId, amount } = req.body;

    console.log("===== VNPay Debug Start =====");
    console.log("orderId:", orderId);
    console.log("amount (USD):", amount);

    if (!orderId || !amount) {
      return res.status(400).json({ message: "Thiếu orderId hoặc amountUSD" });
    }

    // ✅ Chuyển sang VND và nhân 100 theo quy định của VNPay
    const amountVNPay = Math.round(Number(amount) * 100);
    console.log("amountVnd (đã nhân 100):", amountVNPay);

    // ✅ Lấy IP client (chuyển IPv6 ::1 thành 127.0.0.1)
    let ipAddr = requestIp.getClientIp(req) || "127.0.0.1";
    if (ipAddr === "::1") ipAddr = "127.0.0.1";

    // ✅ Định dạng thời gian theo chuẩn VNPay YYYYMMDDHHmmss
    const date = new Date();
    const createDate = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}${String(date.getSeconds()).padStart(2, "0")}`;

    // ✅ Tạo danh sách tham số gửi lên VNPay
    const vnp_Params = {
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

    console.log("vnp_Params trước khi hash:", vnp_Params);

    // ✅ Sắp xếp tham số theo thứ tự a-z
    const sortedParams = {};
    Object.keys(vnp_Params)
      .sort()
      .forEach((key) => (sortedParams[key] = vnp_Params[key]));

    // ✅ Chuẩn hóa dữ liệu để hash
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac("sha512", vnp_HashSecret);
    const vnp_SecureHash = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    // ✅ Tạo URL hoàn chỉnh
    const vnp_UrlWithParams =
      vnp_Url +
      "?" +
      qs.stringify(sortedParams, { encode: true }) +
      "&vnp_SecureHash=" +
      vnp_SecureHash;

    console.log("vnp_UrlWithParams:", vnp_UrlWithParams);
    console.log("===== VNPay Debug End =====");

    return res.json({ paymentUrl: vnp_UrlWithParams });
  } catch (error) {
    console.error("❌ Lỗi khi tạo URL VNPay:", error);
    res.status(500).json({ message: "Lỗi tạo URL thanh toán VNPay", error });
  }
});

// ========================
// 🔄 Xử lý callback từ VNPay
// ========================
router.get("/return", async (req, res) => {
  try {
    const vnp_Params = req.query;
    const secureHash = vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    const sortedParams = {};
    Object.keys(vnp_Params)
      .sort()
      .forEach((key) => (sortedParams[key] = vnp_Params[key]));

    const signData = qs.stringify(sortedParams, { encode: false });
    const checkSum = crypto
      .createHmac("sha512", vnp_HashSecret)
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex");

    if (secureHash === checkSum) {
      const order = await Order.findById(vnp_Params.vnp_TxnRef);
      if (!order) return res.send("❌ Order không tồn tại");

      order.paymentInfo = {
        vnp_TxnRef: vnp_Params.vnp_TxnRef,
        vnp_TransactionNo: vnp_Params.vnp_TransactionNo,
        vnp_ResponseCode: vnp_Params.vnp_ResponseCode,
        vnp_BankCode: vnp_Params.vnp_BankCode,
        vnp_BankTranNo: vnp_Params.vnp_BankTranNo,
        vnp_PayDate: vnp_Params.vnp_PayDate,
      };

      if (vnp_Params.vnp_ResponseCode === "00") {
        order.paymentStatus = "paid";
        order.paidAt = new Date();
        order.status = "confirmed";
      } else {
        order.paymentStatus = "failed";
      }

      await order.save();

      return res.send(
        vnp_Params.vnp_ResponseCode === "00"
          ? "✅ Thanh toán thành công!"
          : "❌ Thanh toán thất bại!"
      );
    } else {
      res.send("❌ Chữ ký không hợp lệ");
    }
  } catch (error) {
    console.error("❌ Lỗi callback VNPay:", error);
    res.status(500).send("Lỗi xử lý callback VNPay");
  }
});

module.exports = router;
