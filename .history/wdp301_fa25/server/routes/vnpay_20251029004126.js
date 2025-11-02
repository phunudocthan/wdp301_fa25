const express = require("express");
const crypto = require("crypto");
const qs = require("qs");
const Order = require("../models/Order");

const router = express.Router();

const vnp_TmnCode = process.env.VNP_TMNCODE; // Mã website VNPay
const vnp_HashSecret = process.env.VNP_HASHSECRET; // Secret key
const vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const vnp_ReturnUrl = process.env.VNP_RETURNURL; // URL callback

// Tạo URL VNPay
// Tạo URL VNPay
router.post("/create_payment_url", async (req, res) => {
  let { orderId, amount } = req.body; // luôn gửi USD từ frontend

  console.log("===== VNPay Debug Start =====");
  console.log("orderId:", orderId);
  console.log("amount (USD):", amount);

  if (!orderId || !amount) {
    console.log("Thiếu orderId hoặc amountUSD");
    return res.status(400).json({ message: "Thiếu orderId hoặc amountUSD" });
  }

  // Chuyển USD -> VND (Tỷ giá 1:1, nhưng quan trọng là loại bỏ thập phân)
   // BƯỚC SỬA LỖI QUAN TRỌNG: Nhân 100 ngay để chuyển 299.99 thành 29999 (đơn vị nhỏ nhất)
  const amountVNPay = Math.round(Number(amount) * 100);
   
  console.log("amountVnd (sau convert, đã nhân 100):", amountVNPay);
  console.log("vnp_Amount (giá trị VNPay):", amountVNPay);
   
  
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, "0");
  const createDate =
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds());

  const vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode,
    vnp_Amount: amountVNPay, // ✅ Gán 29999 (là số nguyên)
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderId,
    vnp_OrderInfo: `${orderId}`,
    vnp_OrderType: "other",
    vnp_Locale: "vn",
    vnp_ReturnUrl,
    vnp_CreateDate: createDate,
  };
  console.log("vnp_Params trước khi hash:", vnp_Params);

  const sortedParams = {};
  Object.keys(vnp_Params)
    .sort()
    .forEach((key) => (sortedParams[key] = vnp_Params[key]));

  const signData = qs.stringify(sortedParams, { encode: false });
  console.log("signData:", signData);

  const vnp_SecureHash = crypto
    .createHmac("sha512", vnp_HashSecret)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  console.log("vnp_SecureHash:", vnp_SecureHash);

  const vnp_UrlWithParams =
    vnp_Url +
    "?" +
    qs.stringify(sortedParams) +
    "&vnp_SecureHash=" +
    vnp_SecureHash;
  console.log("vnp_UrlWithParams:", vnp_UrlWithParams);
  console.log("===== VNPay Debug End =====");

  res.json({ paymentUrl: vnp_UrlWithParams });
});

// Callback VNPay
router.get("/return", async (req, res) => {
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
    if (!order) return res.send("Order không tồn tại");

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

    res.send(
      vnp_Params.vnp_ResponseCode === "00"
        ? "Thanh toán thành công"
        : "Thanh toán thất bại"
    );
  } else {
    res.send("Chữ ký không hợp lệ");
  }
});

module.exports = router;
