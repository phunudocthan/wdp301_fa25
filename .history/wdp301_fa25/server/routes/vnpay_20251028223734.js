// routes/vnpay.js
import qs from "qs";
import crypto from "crypto";
import Order from "../models/Order.js";

const express = require('express');
const router = express.Router();

// 🟢 Tạo URL thanh toán VNPay
router.post("/create_payment_url", async (req, res) => {
  try {
    const { orderId, amount, bankCode } = req.body;

    const vnp_TmnCode = process.env.VNP_TMNCODE;
    const vnp_HashSecret = process.env.VNP_HASHSECRET;
    const vnp_Url = process.env.VNP_URL; // ví dụ: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
    const vnp_ReturnUrl = process.env.VNP_RETURNURL; // ví dụ: http://localhost:5173/vnpay/return

    // Nếu test local, fix IP
    const ipAddr = "127.0.0.1";

    // 🕒 Lấy thời gian theo giờ VN
    const date = new Date();
    const createDate = new Date(date.getTime() + 7 * 60 * 60 * 1000)
      .toISOString()
      .replace(/[-:.TZ]/g, "")
      .slice(0, 14);

    const orderRef = `${orderId}-${Date.now()}`;

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: orderRef,
      vnp_OrderInfo: `Thanh toan don hang #${orderId}`,
      vnp_OrderType: "billpayment",
      vnp_Amount: amount * 100, // VNPay yêu cầu nhân 100
      vnp_ReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    if (bankCode) vnp_Params["vnp_BankCode"] = bankCode;

    // Sắp xếp params và ký
    const sorted = Object.keys(vnp_Params)
      .sort()
      .reduce((obj, key) => ((obj[key] = vnp_Params[key]), obj), {});

    const signData = qs.stringify(sorted, { encode: false });
    const hmac = crypto.createHmac("sha512", vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    sorted["vnp_SecureHash"] = signed;
    const paymentUrl = `${vnp_Url}?${qs.stringify(sorted, { encode: true })}`;

    return res.json({ paymentUrl });
  } catch (err) {
    console.error("VNPay create_payment_url error:", err);
    res.status(500).json({ message: "VNPay create_payment_url failed" });
  }
});

// 🟢 Xử lý callback từ VNPay
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
      return res.status(400).send("Invalid signature");
    }

    const orderId = vnp_Params.vnp_TxnRef.split("-")[0];
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
