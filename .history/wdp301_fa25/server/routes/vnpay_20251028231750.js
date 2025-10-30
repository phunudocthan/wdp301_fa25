// routes/vnpay.js
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const Order = require("../models/Order");

// 🔹 Convert amount sang VND nguyên, tối thiểu 5000
function convertAmount(amount, isUSD = true) {
  let amountVND = Math.round(amount * (isUSD ? 23000 : 1));
  if (amountVND < 5000) amountVND = 5000;
  return amountVND;
}

// 🔹 Tạo vnp_TxnRef hợp lệ: chữ + số, duy nhất
function createTxnRef(orderId) {
  const cleanOrderId = orderId.replace(/[^a-zA-Z0-9]/g, "");
  const timestamp = Date.now().toString().slice(-6); // 6 chữ số cuối
  return `${cleanOrderId}${timestamp}`;
}

// 🔹 Sort object theo key tăng dần, loại bỏ null/undefined
function sortObject(obj) {
  const sorted = {};
  Object.keys(obj).sort().forEach(key => {
    if (obj[key] !== null && obj[key] !== undefined && obj[key] !== "") {
      sorted[key] = obj[key];
    }
  });
  return sorted;
}

// 🔹 Tạo chữ ký HMAC SHA512
function createVnpSign(params, secret) {
  const sorted = sortObject(params);
  const signData = Object.keys(sorted).map(k => `${k}=${sorted[k]}`).join("&");
  return crypto.createHmac("sha512", secret).update(signData, "utf-8").digest("hex");
}

// 🔹 Tạo URL thanh toán VNPay
function buildVnpUrl(params, secret, baseUrl) {
  const vnp_SecureHash = createVnpSign(params, secret);
  const query = Object.keys(params)
    .map(k => `${k}=${encodeURIComponent(params[k])}`)
    .join("&");
  return `${baseUrl}?${query}&vnp_SecureHash=${vnp_SecureHash}`;
}

// 🟢 Tạo URL thanh toán VNPay
router.post("/create_payment_url", async (req, res) => {
  try {
    const { orderId, amount, bankCode } = req.body;
    if (!orderId || !amount)
      return res.status(400).json({ message: "Missing orderId or amount" });

    const vnp_TmnCode = process.env.VNP_TMNCODE;
    const vnp_HashSecret = process.env.VNP_HASHSECRET;
    const vnp_Url = process.env.VNP_URL;
    const vnp_ReturnUrl = process.env.VNP_RETURNURL;

    const ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      "127.0.0.1";

    const date = new Date();
    const createDate = new Date(date.getTime() + 7 * 60 * 60 * 1000)
      .toISOString()
      .replace(/[-:.TZ]/g, "")
      .slice(0, 14);

    const orderRef = createTxnRef(orderId);
    const amountVND = convertAmount(amount, true);
    const amountForVNP = (amountVND * 100).toString();

    const vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: orderRef,
      vnp_OrderInfo: `Thanh toán đơn hàng #${orderId}`,
      vnp_OrderType: "billpayment",
      vnp_Amount: amountForVNP,
      vnp_ReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    if (bankCode) vnp_Params.vnp_BankCode = bankCode;

    const paymentUrl = buildVnpUrl(vnp_Params, vnp_HashSecret, vnp_Url);

    // Lưu txnRef vào DB
    try {
      await Order.findByIdAndUpdate(orderId, { vnp_TxnRef: orderRef });
    } catch (e) {
      console.error("Failed to save vnp_TxnRef on Order", orderId, e);
    }

    return res.json({ paymentUrl });
  } catch (err) {
    console.error("VNPay create_payment_url error:", err);
    res.status(500).json({ message: "VNPay create_payment_url failed" });
  }
});

// 🟢 Callback xử lý từ VNPay
router.get("/return", async (req, res) => {
  try {
    const vnp_Params = { ...req.query };
    const secureHash = vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    const vnp_HashSecret = process.env.VNP_HASHSECRET;

    const vnp_SecureHashCheck = createVnpSign(vnp_Params, vnp_HashSecret);

    if (secureHash !== vnp_SecureHashCheck) {
      console.error("VNPay invalid signature:", { secureHash, vnp_SecureHashCheck });
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
