// routes/vnpay.js
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const qs = require("qs"); // stringify ổn định cho VNPay
const Order = require("../models/Order");

/* =========================
   Helpers
========================= */

// Convert USD -> VND (mặc định) và ép min 5,000 VND
function convertAmount(amount, isUSD = true) {
  let amountVND = Math.round(amount * (isUSD ? 23000 : 1));
  if (amountVND < 5000) amountVND = 5000;
  return amountVND;
}

// Tạo vnp_TxnRef: chỉ chữ/số + hậu tố 6 số time để đảm bảo unique
function createTxnRef(orderId) {
  const cleanOrderId = String(orderId).replace(/[^a-zA-Z0-9]/g, "");
  const timestamp6 = Date.now().toString().slice(-6);
  return `${cleanOrderId}${timestamp6}`;
}

// Sort key tăng dần và loại bỏ null/undefined/""
function sortObject(obj) {
  const sorted = {};
  Object.keys(obj)
    .sort()
    .forEach((k) => {
      const v = obj[k];
      if (v !== null && v !== undefined && v !== "") sorted[k] = v;
    });
  return sorted;
}

// Tạo chữ ký HMAC-SHA512 theo cách VNPay khuyến nghị:
// - sort keys
// - stringify KHÔNG encode khi ký (encode:false)
function createVnpSign(params, secret) {
  const sorted = sortObject(params);
  const signData = qs.stringify(sorted, { encode: false });
  return crypto.createHmac("sha512", secret)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");
}

// Build URL thanh toán:
// - thêm vnp_SecureHashType
// - ký với encode:false
// - khi đưa lên URL thì encode:true
function buildVnpUrl(params, secret, baseUrl) {
  const sorted = sortObject(params);
  sorted.vnp_SecureHashType = "HmacSHA512";
  const vnp_SecureHash = createVnpSign(sorted, secret);

  const query = qs.stringify({ ...sorted, vnp_SecureHash }, { encode: true });
  return `${baseUrl}?${query}`;
}

// yyyyMMddHHmmss theo GMT+7 (theo yêu cầu VNPay)
function getCreateDateGmt7() {
  const now = new Date();
  const gmt7 = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const pad = (n) => n.toString().padStart(2, "0");
  return (
    gmt7.getUTCFullYear().toString() +
    pad(gmt7.getUTCMonth() + 1) +
    pad(gmt7.getUTCDate()) +
    pad(gmt7.getUTCHours()) +
    pad(gmt7.getUTCMinutes()) +
    pad(gmt7.getUTCSeconds())
  );
}

/* =========================
   Routes
========================= */

// 🟢 Tạo URL thanh toán VNPay
router.post("/create_payment_url", async (req, res) => {
  try {
    const { orderId, amount, bankCode, isUSD = true } = req.body || {};
    if (!orderId || !amount) {
      return res.status(400).json({ message: "Missing orderId or amount" });
    }

    const vnp_TmnCode = process.env.VNP_TMNCODE?.trim();
    const vnp_HashSecret = process.env.VNP_HASHSECRET?.trim();
    const vnp_Url = process.env.VNP_URL?.trim(); // https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
    const vnp_ReturnUrl = process.env.VNP_RETURNURL?.trim();

    if (!vnp_TmnCode || !vnp_HashSecret || !vnp_Url || !vnp_ReturnUrl) {
      return res.status(500).json({ message: "VNPay env missing" });
    }

    const ipAddr =
      req.headers["x-forwarded-for"] ||
      req.socket?.remoteAddress ||
      req.connection?.remoteAddress ||
      "127.0.0.1";

    const vnp_CreateDate = getCreateDateGmt7();

    const vnp_TxnRef = createTxnRef(orderId);
    const amountVND = convertAmount(Number(amount), Boolean(isUSD));
    const vnp_Amount = String(amountVND * 100); // đơn vị x100

    // Tránh ký tự có dấu để khỏi lệch encode
    const vnp_OrderInfo = `Thanh toan don hang #${orderId}`;

    const vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef,
      vnp_OrderInfo,
      vnp_OrderType: "billpayment",
      vnp_Amount,
      vnp_ReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate,
    };
    if (bankCode) vnp_Params.vnp_BankCode = bankCode;

    const paymentUrl = buildVnpUrl(vnp_Params, vnp_HashSecret, vnp_Url);

    // Lưu TxnRef để map khi /return
    try {
      await Order.findByIdAndUpdate(orderId, { vnp_TxnRef });
    } catch (e) {
      console.error("Failed to save vnp_TxnRef on Order", orderId, e);
    }

    return res.json({ paymentUrl, vnp_TxnRef });
  } catch (err) {
    console.error("VNPay create_payment_url error:", err);
    res.status(500).json({ message: "VNPay create_payment_url failed" });
  }
});

// 🟢 Callback xử lý từ VNPay
router.get("/return", async (req, res) => {
  try {
    const vnp_HashSecret = process.env.VNP_HASHSECRET?.trim();
    if (!vnp_HashSecret) return res.status(500).send("VNPay secret missing");

    const vnp_Params = { ...req.query };
    const secureHash = vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    // Verify: sort + stringify encode:false như lúc ký
    const signCheck = createVnpSign(vnp_Params, vnp_HashSecret);

    if (secureHash !== signCheck) {
      console.error("VNPay invalid signature:", { secureHash, signCheck });
      return res.status(400).send("Invalid signature");
    }

    const txnRef = vnp_Params.vnp_TxnRef;
    const responseCode = vnp_Params.vnp_ResponseCode;

    const order = await Order.findOne({ vnp_TxnRef: txnRef });
    if (!order) {
      console.error("VNPay: order not found for txnRef", txnRef);
      return res.status(400).send("Order not found");
    }

    const orderId = order._id.toString();

    if (responseCode === "00") {
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: "paid",
        status: "confirmed",
        paidAt: new Date(),
        paymentInfo: {
          vnp_TransactionNo: vnp_Params.vnp_TransactionNo,
          vnp_ResponseCode: vnp_Params.vnp_ResponseCode,
          vnp_BankCode: vnp_Params.vnp_BankCode,
          vnp_BankTranNo: vnp_Params.vnp_BankTranNo,
          vnp_PayDate: vnp_Params.vnp_PayDate,
        },
      });
      return res.redirect(`http://localhost:5173/order-success/${orderId}`);
    } else {
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: "failed",
        status: "canceled",
        paymentInfo: {
          vnp_ResponseCode: vnp_Params.vnp_ResponseCode,
        },
      });
      return res.redirect(`http://localhost:5173/order-failed/${orderId}`);
    }
  } catch (err) {
    console.error("VNPay return error:", err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
