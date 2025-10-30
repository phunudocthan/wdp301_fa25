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
  let { orderId, amount } = req.body;
  if (!orderId || !amount)
    return res.status(400).json({ message: "Thiếu orderId hoặc amount" });

  const amountVNPay = Math.round(Number(amount) * 100);
  const ipAddr = requestIp.getClientIp(req) || "127.0.0.1";

  const vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode,
    vnp_Amount: amountVNPay,
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderId,
    vnp_OrderInfo: `Thanh toán đơn hàng #${orderId}`,
    vnp_OrderType: "other",
    vnp_Locale: "vn",
    vnp_ReturnUrl,
    vnp_IpAddr: ipAddr, // ✅ tên đúng
    vnp_CreateDate: new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14),
  };

  const sortedParams = {};
  Object.keys(vnp_Params).sort().forEach(key => sortedParams[key] = vnp_Params[key]);

  const signData = qs.stringify(sortedParams, { encode: false });
  const vnp_SecureHash = crypto
    .createHmac("sha512", vnp_HashSecret)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  const paymentUrl = `${vnp_Url}?${qs.stringify(sortedParams)}&vnp_SecureHash=${vnp_SecureHash}`;
  res.json({ paymentUrl });
});

router.get("/return", async (req, res) => {
  const vnp_Params = req.query;
  const secureHash = vnp_Params.vnp_SecureHash;
  delete vnp_Params.vnp_SecureHash;
  delete vnp_Params.vnp_SecureHashType;

  const sortedParams = {};
  Object.keys(vnp_Params).sort().forEach(key => sortedParams[key] = vnp_Params[key]);
  const signData = qs.stringify(sortedParams, { encode: false });
  const checkSum = crypto
    .createHmac("sha512", vnp_HashSecret)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  if (secureHash === checkSum) {
    const order = await Order.findById(vnp_Params.vnp_TxnRef);
    if (!order) return res.send("Order không tồn tại");

    order.paymentInfo = vnp_Params;
    order.paymentStatus = vnp_Params.vnp_ResponseCode === "00" ? "paid" : "failed";
    await order.save();

    res.send(vnp_Params.vnp_ResponseCode === "00" ? "Thanh toán thành công" : "Thanh toán thất bại");
  } else {
    res.send("Sai chữ ký");
  }
});

module.exports = router;
