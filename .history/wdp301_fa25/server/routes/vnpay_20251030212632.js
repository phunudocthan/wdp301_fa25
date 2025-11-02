const express = require("express");
const crypto = require("crypto");
const qs = require("qs");
const Order = require("../models/Order");
const requestIp = require("request-ip");
require("dotenv").config();
const router = express.Router();

const vnp_TmnCode = (process.env.VNP_TMNCODE || "").trim();
const vnp_HashSecret = (process.env.VNP_HASHSECRET || "").trim();
const vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const vnp_ReturnUrl = (process.env.VNP_RETURNURL || "").trim();

// Helper: sort object keys a->z and remove undefined/null
function normalizeAndSort(obj) {
  const cleaned = {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v === undefined || v === null) continue;
    // convert boolean/number to string, trim strings
    cleaned[k] = typeof v === "string" ? v.trim() : String(v);
  }
  const sorted = {};
  Object.keys(cleaned)
    .sort()
    .forEach((k) => (sorted[k] = cleaned[k]));
  return sorted;
}

function makeSecureHash(paramsObj) {
  // signData must be qs.stringify(..., { encode: false })
  const signData = qs.stringify(paramsObj, { encode: false });
  const hmac = crypto.createHmac("sha512", vnp_HashSecret);
  const hash = hmac.update(Buffer.from(signData, "utf8")).digest("hex");
  return { signData, hash };
}

router.post("/create_payment_url", async (req, res) => {
  try {
    const { orderId, amount } = req.body || {};
    if (!orderId || !amount) return res.status(400).json({ message: "Thiếu orderId hoặc amount" });

    // Convert USD -> VND minimal unit (nhân 100)
    const amountVNPay = Math.round(Number(amount) * 100);

    // IP: chuyển ::1 -> 127.0.0.1
    let ipAddr = requestIp.getClientIp(req) || "127.0.0.1";
    if (ipAddr === "::1") ipAddr = "127.0.0.1";

    // CreateDate in YYYYMMDDHHmmss (local server time)
    const d = new Date();
    const createDate = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}${String(d.getSeconds()).padStart(2, "0")}`;

    // Build params using exact VNPay field names
    const vnp_Params_raw = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: vnp_TmnCode,
      vnp_Amount: amountVNPay,
      vnp_CurrCode: "VND",
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toán đơn hàng #${orderId}`,
      vnp_OrderType: "other",
      vnp_Locale: "vn",
      vnp_ReturnUrl: vnp_ReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    // Normalize & sort
    const vnp_Params = normalizeAndSort(vnp_Params_raw);

    // Create signData and secureHash
    const { signData, hash } = makeSecureHash(vnp_Params);

    // For payment URL we append vnp_SecureHash and encode the query
    const paramsForUrl = { ...vnp_Params, vnp_SecureHash: hash };
    const url = vnp_Url + "?" + qs.stringify(paramsForUrl, { encode: true });

    // DEBUG LOGS (Important: do NOT print your HASH SECRET)
    console.log("----- VNPay DEBUG START -----");
    console.log("vnp_Params (sorted):", vnp_Params);
    console.log("signData (to hash) --->");
    console.log(signData);
    console.log("computed vnp_SecureHash --->", hash);
    console.log("paymentUrl --->", url);
    console.log("----- VNPay DEBUG END -----");

    return res.json({ paymentUrl: url, debug: { signData, vnp_SecureHash: hash } });
  } catch (err) {
    console.error("Error create_payment_url:", err);
    return res.status(500).json({ message: "Lỗi tạo URL", error: String(err) });
  }
});

router.get("/return", async (req, res) => {
  try {
    let vnp_Params = { ...req.query };
    const recvSecureHash = vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    // Normalize & sort the incoming params before checking
    vnp_Params = normalizeAndSort(vnp_Params);
    const { signData, hash } = makeSecureHash(vnp_Params);

    console.log("----- VNPay RETURN DEBUG START -----");
    console.log("received params (sorted):", vnp_Params);
    console.log("signData (from return) --->");
    console.log(signData);
    console.log("computed hash(from our secret) --->", hash);
    console.log("recvSecureHash (from query) --->", recvSecureHash);
    console.log("----- VNPay RETURN DEBUG END -----");

    if (hash !== recvSecureHash) {
      // respond with detail for debug (do NOT include secret)
      return res.status(400).send("Sai chữ ký");
    }

    const order = await Order.findById(vnp_Params.vnp_TxnRef);
    if (!order) return res.send("Order không tồn tại");

    order.paymentInfo = vnp_Params;
    order.paymentStatus = vnp_Params.vnp_ResponseCode === "00" ? "paid" : "failed";
    if (order.paymentStatus === "paid") {
      order.paidAt = new Date();
      order.status = "confirmed";
    }
    await order.save();

    return res.send(vnp_Params.vnp_ResponseCode === "00" ? "Thanh toán thành công" : "Thanh toán thất bại");
  } catch (err) {
    console.error("Error /return:", err);
    return res.status(500).send("Lỗi xử lý callback");
  }
});

module.exports = router;
