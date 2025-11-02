// routes/vnpay.js
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const qs = require("qs");
const Order = require("../models/Order");
const Invoice = require("../models/Invoice"); // Ensure you have this model
require("dotenv").config();

/* =========================
   CONFIG & HELPERS
========================= */

const VNPAY_CONFIG = {
  vnp_TmnCode: process.env.VNP_TMNCODE || "OZLHEH3D",
  vnp_HashSecret: process.env.VNP_HASHSECRET || "YOUR_SANDBOX_SECRET_KEY",
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

// Tạo chữ ký SHA-512
function createSecureHash(params, secretKey) {
  const sortedKeys = Object.keys(params)
    .filter((key) => key !== "vnp_SecureHash" && params[key] != null && params[key] !== "")
    .sort();
  const signData = sortedKeys
    .map((key) => `${key}=${encodeURIComponent(params[key]).replace(/%20/g, "+")}`)
    .join("&");
  console.log("🧩 [DEBUG] SIGN DATA:", signData);
  const hash = crypto.createHmac("sha512", secretKey).update(signData).digest("hex");
  console.log("🧩 [DEBUG] GENERATED HASH:", hash);
  return hash;
}

// Xây URL thanh toán
function buildPaymentUrl(params, secretKey, baseUrl) {
  const vnp_SecureHash = createSecureHash(params, secretKey);
  const queryString = qs.stringify({ ...params, vnp_SecureHash }, { encode: false });
  return `${baseUrl}?${queryString}`;
}

// Tạo URL chuyển hướng
function buildRedirectUrl(responseCode, orderId) {
  return responseCode === "00"
    ? `http://localhost:5173/order-success/${orderId}`
    : `http://localhost:5173/order-failed/${orderId}`;
}

/* =========================
   ROUTES
========================= */

// Tạo URL thanh toán
router.post("/create_payment_url", async (req, res) => {
  try {
    console.log("🧩 [DEBUG] VNPAY_CONFIG:", VNPAY_CONFIG);
    const { orderId, amount } = req.body;

    if (!orderId || !amount) {
      console.log("🧩 [DEBUG] Missing orderId or amount:", { orderId, amount });
      return res.status(400).json({ message: "Thiếu orderId hoặc amount" });
    }

    if (VNPAY_CONFIG.vnp_HashSecret === "YOUR_SANDBOX_SECRET_KEY") {
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

    const vnp_Params = req.query;
    const vnp_TxnRef = vnp_Params.vnp_TxnRef;
    const vnp_ResponseCode = vnp_Params.vnp_ResponseCode || "99";
    const vnp_SecureHash = vnp_Params.vnp_SecureHash;

    // Xác minh chữ ký
    const signParams = { ...vnp_Params };
    delete signParams.vnp_SecureHash;
    const checkSum = createSecureHash(signParams, VNPAY_CONFIG.vnp_HashSecret);

    if (vnp_SecureHash !== checkSum) {
      console.warn(`🧩 [DEBUG] Invalid secure hash for order ${vnp_TxnRef}. Expected: ${checkSum}, Received: ${vnp_SecureHash}`);
      return res.redirect(buildRedirectUrl("99", vnp_TxnRef.split("_")[0]));
    }

    const orderId = vnp_TxnRef.split("_")[0];
    const order = await Order.findById(orderId);
    if (!order) {
      console.warn(`🧩 [DEBUG] Order not found: ${orderId}`);
      return res.redirect(buildRedirectUrl("99", orderId));
    }

    if (vnp_ResponseCode === "00" && order.payment_status !== "paid") {
      await Order.findByIdAndUpdate(orderId, {
        payment_status: "paid",
        updated_at: new Date(),
        vnp_ResponseCode,
      });

      // Tạo hóa đơn nếu chưa có
      const existingInvoice = await Invoice.findOne({ order_id: orderId });
      if (!existingInvoice) {
        await Invoice.create({
          order_id: orderId,
          branch_id: order.branch_id || "default_branch", // Adjust based on your schema
        });
      }
    }

    return res.redirect(buildRedirectUrl(vnp_ResponseCode, orderId));
  } catch (err) {
    console.error("🧩 [ERROR] Callback error:", err);
    return res.redirect(buildRedirectUrl("99", vnp_TxnRef ? vnp_TxnRef.split("_")[0] : ""));
  }
});


module.exports = router;