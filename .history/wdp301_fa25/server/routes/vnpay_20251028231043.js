// routes/vnpay.js
const express = require("express");
const router = express.Router();
const qs = require("qs");
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

    const ipAddr = req.ip === "::1" ? "127.0.0.1" : req.ip;

    const date = new Date();
    const createDate = new Date(date.getTime() + 7 * 60 * 60 * 1000)
      .toISOString()
      .replace(/[-:.TZ]/g, "")
      .slice(0, 14);

    const orderRef = createTxnRef(orderId);
    const amountVND = convertAmount(amount, true); // amount in VND (rounded)
    // VNPay expects amount in the smallest currency unit (VND * 100). Ensure integer and string.
    const amountForVNP = String(Math.max(0, Math.round(amountVND)) * 100);

    let vnp_Params = {
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

    // 🔹 Sắp xếp params và tạo chữ ký
    const sorted = Object.keys(vnp_Params)
      .sort()
      .reduce((obj, key) => ((obj[key] = vnp_Params[key]), obj), {});

    const signData = qs.stringify(sorted, { encode: false });
    const hmac = crypto.createHmac("sha512", vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    sorted.vnp_SecureHash = signed;
    const paymentUrl = `${vnp_Url}?${qs.stringify(sorted, { encode: true })}`;

    // persist txnRef on the order so the return callback can reliably find the order
    try {
      await Order.findByIdAndUpdate(orderId, { vnp_TxnRef: orderRef });
    } catch (e) {
      console.error('Failed to save vnp_TxnRef on Order', orderId, e);
      // continue — returning a payment URL is still useful
    }

    console.log("VNPay paymentUrl:", paymentUrl);
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

    const sorted = Object.keys(vnp_Params)
      .sort()
      .reduce((obj, key) => ((obj[key] = vnp_Params[key]), obj), {});

    const signData = qs.stringify(sorted, { encode: false });
    const hmac = crypto.createHmac("sha512", vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    if (secureHash !== signed) {
      console.error("VNPay invalid signature:", { secureHash, signed });
      return res.status(400).send("Invalid signature");
    }

    // 🔹 Lấy orderId từ TxnRef (cắt 6 chữ số cuối timestamp)
    const orderId = vnp_Params.vnp_TxnRef.slice(0, -6);
    const responseCode = vnp_Params.vnp_ResponseCode;

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
