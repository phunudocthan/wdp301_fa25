// routes/vnpay.js
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const qs = require("qs");
const Order = require("../models/Order");

/* =========================
   Helpers (simple version)
========================= */

// Chuyển USD -> VND
function convertAmount(amount, isUSD = true) {
  let amountVND = Math.round(amount * (isUSD ? 23000 : 1));
  if (amountVND < 5000) amountVND = 5000;
  return amountVND;
}

// Tạo mã giao dịch đơn giản
function createTxnRef(orderId) {
  return `${String(orderId).replace(/[^a-zA-Z0-9]/g, "")}_${Date.now().toString().slice(-6)}`;
}

// Tạo chữ ký đơn giản (chỉ test, KHÔNG dùng production)
function createSimpleSign(params, secret) {
  // ✅ Chỉ nối các key=value, sau đó hash MD5 đơn giản
  const sortedKeys = Object.keys(params).sort();
  const signData = sortedKeys.map(k => `${k}=${params[k]}`).join("&") + secret;
  return crypto.createHash("md5").update(signData).digest("hex");
}

// Build URL test (chỉ để test, không theo chuẩn VNPay)
function buildSimpleUrl(params, secret, baseUrl) {
  const vnp_SecureHash = createSimpleSign(params, secret);
  const query = qs.stringify({ ...params, vnp_SecureHash }, { encode: true });
  return `${baseUrl}?${query}`;
}

// yyyyMMddHHmmss theo GMT+7
function getCreateDateGmt7() {
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const pad = n => n.toString().padStart(2, "0");
  return (
    now.getUTCFullYear() +
    pad(now.getUTCMonth() + 1) +
    pad(now.getUTCDate()) +
    pad(now.getUTCHours()) +
    pad(now.getUTCMinutes()) +
    pad(now.getUTCSeconds())
  );
}

/* =========================
   Routes
========================= */

// 🟢 Tạo URL thanh toán test
router.post("/create_payment_url", async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    if (!orderId || !amount)
      return res.status(400).json({ message: "Missing orderId or amount" });

    const vnp_TmnCode = process.env.VNP_TMNCODE || "TESTCODE";
    const vnp_HashSecret = process.env.VNP_HASHSECRET || "TESTSECRET";
    const vnp_Url = process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    const vnp_ReturnUrl = process.env.VNP_RETURNURL || "http://localhost:3000/vnpay/return";

    const vnp_TxnRef = createTxnRef(orderId);
    const amountVND = convertAmount(amount, true);
    const vnp_CreateDate = getCreateDateGmt7();

    const params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode,
      vnp_Amount: amountVND * 100,
      vnp_CurrCode: "VND",
      vnp_TxnRef,
      vnp_OrderInfo: `TEST Order ${orderId}`,
      vnp_OrderType: "billpayment",
      vnp_Locale: "vn",
      vnp_ReturnUrl,
      vnp_CreateDate,
    };

    const paymentUrl = buildSimpleUrl(params, vnp_HashSecret, vnp_Url);

    console.log("🧩 [DEBUG] Payment URL:", paymentUrl);
    console.log("🧩 [DEBUG] Sign Data:", params);

    await Order.findByIdAndUpdate(orderId, { vnp_TxnRef });

    return res.json({ paymentUrl });
  } catch (err) {
    console.error("VNPay create_payment_url error:", err);
    res.status(500).json({ message: "VNPay create_payment_url failed" });
  }
});

// 🟢 Callback test
router.get("/return", async (req, res) => {
  try {
    console.log("🧩 [DEBUG] VNPay Return Query:", req.query);

    const txnRef = req.query.vnp_TxnRef;
    const responseCode = req.query.vnp_ResponseCode || "00"; // giả sử thành công khi test

    const order = await Order.findOne({ vnp_TxnRef: txnRef });
    if (!order) return res.status(400).send("Order not found");

    if (responseCode === "00") {
      await Order.findByIdAndUpdate(order._id, {
        paymentStatus: "paid",
        status: "confirmed",
        paidAt: new Date(),
      });
      return res.redirect(`http://localhost:5173/order-success/${order._id}`);
    } else {
      await Order.findByIdAndUpdate(order._id, {
        paymentStatus: "failed",
        status: "canceled",
      });
      return res.redirect(`http://localhost:5173/order-failed/${order._id}`);
    }
  } catch (err) {
    console.error("VNPay return error:", err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
