// routes/vnpay.js
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const qs = require("qs");
const Order = require("../models/Order");
require("dotenv").config();

/* =========================
   CONFIG & HELPERS
========================= */

const VNPAY_CONFIG = {
  vnp_TmnCode: process.env.VNP_TMNCODE,
  vnp_HashSecret: process.env.VNP_HASHSECRET,
  vnp_Url: process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  vnp_ReturnUrl: process.env.VNP_RETURNURL || "http://localhost:5000/api/vnpay/return",
};

// Chuyển USD → VND, nhân 100
function convertAmount(amount, isUSD = true) {
  let amountVND = Math.round(amount * (isUSD ? 25000 : 1)); // 1 USD ≈ 25,000 VND
  if (amountVND < 5000) amountVND = 5000;
  return amountVND * 100; // VNPay yêu cầu nhân 100
}

// Tạo mã giao dịch duy nhất
function createTxnRef(orderId) {
  const cleanId = String(orderId).replace(/[^a-zA-Z0-9]/g, "");
  const timestamp = Date.now().toString().slice(-6);
  return `${cleanId}_${timestamp}`;
}

// Lấy thời gian GMT+7 (yyyyMMddHHmmss)
function getCreateDateGmt7() {
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const pad = (n) => n.toString().padStart(2, "0");
  return (
    now.getUTCFullYear() +
    pad(now.getUTCMonth() + 1) +
    pad(now.getUTCDate()) +
    pad(now.getUTCHours()) +
    pad(now.getUTCMinutes()) +
    pad(now.getUTCSeconds())
  );
}

// TẠO CHỮ KÝ SHA256 ĐÚNG CHUẨN VNPAY
function createSecureHash(params, secretKey) {
  const sortedKeys = Object.keys(params)
    .filter((key) => params[key] !== "" && params[key] !== null)
    .sort();

  const signData = sortedKeys
    .map((key) => `${key}=${encodeURIComponent(params[key]).replace(/%20/g, "+")}`)
    .join("&");

  console.log("SIGN DATA:", signData); // DEBUG

  return crypto.createHmac("sha256", secretKey).update(signData).digest("hex");
}

// Xây URL thanh toán
function buildPaymentUrl(params, secretKey, baseUrl) {
  const vnp_SecureHash = createSecureHash(params, secretKey);
  const queryString = qs.stringify(
    { ...params, vnp_SecureHash },
    { encode: false }
  );
  return `${baseUrl}?${queryString}`;
}

/* =========================
   ROUTES
========================= */

// TẠO URL THANH TOÁN
router.post("/create_payment_url", async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({ message: "Thiếu orderId hoặc amount" });
    }

    if (!VNPAY_CONFIG.vnp_HashSecret.includes("YOUR_SANDBOX")) {
      console.warn("CẢNH BÁO: Chưa cấu hình VNP_HASHSECRET!");
    }

    const vnp_TxnRef = createTxnRef(orderId);
    const vnp_CreateDate = getCreateDateGmt7();
    const vnp_Amount = convertAmount(amount, true);

    const params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: VNPAY_CONFIG.vnp_TmnCode,
      vnp_Amount: vnp_Amount.toString(),
      vnp_CurrCode: "VND",
      vnp_TxnRef,
      vnp_OrderInfo: `TEST Order ${orderId}`,
      vnp_OrderType: "billpayment",
      vnp_Locale: "vn",
      vnp_ReturnUrl: VNPAY_CONFIG.vnp_ReturnUrl,
      vnp_CreateDate,
      vnp_IpAddr: req.ip?.replace("::ffff:", "") || "127.0.0.1",
    };

    const paymentUrl = buildPaymentUrl(
      params,
      VNPAY_CONFIG.vnp_HashSecret,
      VNPAY_CONFIG.vnp_Url
    );

    // Cập nhật Order
    await Order.findByIdAndUpdate(orderId, { vnp_TxnRef });

    console.log("PAYMENT URL:", paymentUrl);
    console.log("PARAMS:", params);

    return res.json({ paymentUrl });
  } catch (err) {
    console.error("LỖI TẠO URL:", err);
    return res.status(500).json({ message: "Tạo URL thất bại" });
  }
});

// CALLBACK TỪ VNPAY
router.get("/return", async (req, res) => {
  try {
    const query = req.query;
    console.log("VNPAY RETURN:", query);

    const vnp_TxnRef = query.vnp_TxnRef;
    const vnp_ResponseCode = query.vnp_ResponseCode;
    const vnp_SecureHash = query.vnp_SecureHash;

    // XÁC MINH CHỮ KÝ TRẢ VỀ
    const signDataParams = { ...query };
    delete signDataParams.vnp_SecureHash;

    const calculatedHash = createSecureHash(signDataParams, VNPAY_CONFIG.vnp_HashSecret);
    const isValidSignature = calculatedHash === vnp_SecureHash;

    if (!isValidSignature) {
      console.log("CHỮ KÝ KHÔNG HỢP LỆ!");
      return res.status(400).send("Chữ ký không hợp lệ");
    }

    const order = await Order.findOne({ vnp_TxnRef });
    if (!order) return res.status(404).send("Không tìm thấy đơn hàng");

    if (vnp_ResponseCode === "00") {
      await Order.findByIdAndUpdate(order._id, {
        paymentStatus: "paid",
        status: "confirmed",
        paidAt: new Date(),
        vnp_ResponseCode,
      });
      return res.redirect(`http://localhost:5173/order-success/${order._id}`);
    } else {
      await Order.findByIdAndUpdate(order._id, {
        paymentStatus: "failed",
        status: "canceled",
        vnp_ResponseCode,
      });
      return res.redirect(`http://localhost:5173/order-failed/${order._id}`);
    }
  } catch (err) {
    console.error("LỖI CALLBACK:", err);
    return res.status(500).send("Lỗi server");
  }
});

// (TÙY CHỌN) IPN - Xử lý thông báo từ VNPay
router.post("/ipn", async (req, res) => {
  try {
    const { vnp_TxnRef, vnp_ResponseCode, vnp_SecureHash } = req.body;
    const signParams = { ...req.body };
    delete signParams.vnp_SecureHash;

    const validHash = createSecureHash(signParams, VNPAY_CONFIG.vnp_HashSecret);
    if (validHash !== vnp_SecureHash) {
      return res.json({ RspCode: "97", Message: "Invalid signature" });
    }

    const order = await Order.findOne({ vnp_TxnRef });
    if (!order) return res.json({ RspCode: "01", Message: "Order not found" });

    if (vnp_ResponseCode === "00" && order.paymentStatus !== "paid") {
      await Order.findByIdAndUpdate(order._id, {
        paymentStatus: "paid",
        status: "confirmed",
        paidAt: new Date(),
      });
    }

    return res.json({ RspCode: "00", Message: "Confirm Success" });
  } catch (err) {
    return res.json({ RspCode: "99", Message: "Unknown error" });
  }
});

module.exports = router;