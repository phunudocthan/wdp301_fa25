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
  vnp_TmnCode: process.env.VNP_TMNCODE || "OZLHEH3D",
  vnp_HashSecret: process.env.VNP_HASHSECRET || "YOUR_SANDBOX_SECRET_KEY", // REPLACE WITH ACTUAL SECRET KEY
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

// Simplified SHA-256 signature for testing
function createSecureHash(params, secretKey) {
  const sortedKeys = Object.keys(params)
    .filter((key) => key !== "vnp_SecureHash" && params[key] != null && params[key] !== "")
    .sort();
  const signData = sortedKeys
    .map((key) => `${key}=${encodeURIComponent(params[key]).replace(/%20/g, "+")}`)
    .join("&");
  console.log("🧩 [DEBUG] SIGN DATA:", signData);
  const hash = crypto.createHmac("sha256", secretKey).update(signData).digest("hex");
  console.log("🧩 [DEBUG] GENERATED HASH:", hash);
  return hash;
}

// Xây URL thanh toán
function buildPaymentUrl(params, secretKey, baseUrl) {
  const vnp_SecureHash = createSecureHash(params, secretKey);
  const queryString = qs.stringify({ ...params, vnp_SecureHash }, { encode: false });
  return `${baseUrl}?${queryString}`;
}

/* =========================
   ROUTES
========================= */

// Tạo URL thanh toán
router.post("/create_payment_url", async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    if (!orderId || !amount) {
      console.log("🧩 [DEBUG] Missing orderId or amount:", { orderId, amount });
      return res.status(400).json({ message: "Thiếu orderId hoặc amount" });
    }

    if (VNPAY_CONFIG.vnp_HashSecret === "RFBSZPJA8LDVX1H1AI609VKNCWHGSLRX") {
      console.error("🧩 [ERROR] VNP_HASHSECRET not configured!");
      return res.status(500).json({ message: "VNPay secret key not configured" });
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
      vnp_IpAddr: req.ip?.replace("::ffff:", "") || "127.0.0.1", // Use IPv4
    };

    const paymentUrl = buildPaymentUrl(params, VNPAY_CONFIG.vnp_HashSecret, VNPAY_CONFIG.vnp_Url);

    // Cập nhật Order
    const order = await Order.findByIdAndUpdate(orderId, { vnp_TxnRef }, { new: true });
    if (!order) {
      console.log("🧩 [DEBUG] Order not found for ID:", orderId);
      return res.status(404).json({ message: "Order not found" });
    }

    console.log("🧩 [DEBUG] PAYMENT URL:", paymentUrl);
    console.log("🧩 [DEBUG] PARAMS:", params);

    return res.json({ paymentUrl });
  } catch (err) {
    console.error("🧩 [ERROR] Tạo URL thất bại:", err);
    return res.status(500).json({ message: "Tạo URL thanh toán thất bại" });
  }
});

// Callback từ VNPay
router.get("/return", async (req, res) => {
  try {
    console.log("🧩 [DEBUG] VNPAY RETURN:", JSON.stringify(req.query, null, 2));

    const query = req.query;
    const vnp_TxnRef = query.vnp_TxnRef;
    const vnp_ResponseCode = query.vnp_ResponseCode;
    const vnp_SecureHash = query.vnp_SecureHash;

    // Xác minh chữ ký
    const signParams = { ...query };
    delete signParams.vnp_SecureHash;
    const calculatedHash = createSecureHash(signParams, VNPAY_CONFIG.vnp_HashSecret);
    if (calculatedHash !== vnp_SecureHash) {
      console.log("🧩 [DEBUG] Invalid signature. Expected:", calculatedHash, "Received:", vnp_SecureHash);
      return res.status(400).send("Chữ ký không hợp lệ");
    }

    const order = await Order.findOne({ vnp_TxnRef });
    if (!order) {
      console.log("🧩 [DEBUG] Order not found for vnp_TxnRef:", vnp_TxnRef);
      return res.status(404).send("Không tìm thấy đơn hàng");
    }

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
    console.error("🧩 [ERROR] Callback error:", err);
    return res.status(500).send("Lỗi server");
  }
});

module.exports = router;