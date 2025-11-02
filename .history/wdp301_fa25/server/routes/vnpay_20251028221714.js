// routes/vnpay.js
import express from "express";
import qs from "qs";
import crypto from "crypto";

const router = express.Router();
router.get("/return", async (req, res) => {
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

  if (secureHash === signed) {
    const orderId = vnp_Params.vnp_TxnRef.split("-")[0];
    const responseCode = vnp_Params.vnp_ResponseCode;

    if (responseCode === "00") {
      // ✅ Thanh toán thành công
      await Order.findByIdAndUpdate(orderId, { status: "paid" });
      return res.redirect(`http://localhost:3000/order-success/${orderId}`);
    } else {
      await Order.findByIdAndUpdate(orderId, { status: "failed" });
      return res.redirect(`http://localhost:3000/order-failed/${orderId}`);
    }
  } else {
    res.status(400).send("Invalid signature");
  }
});

router.post("/create_payment_url", async (req, res) => {
  const { orderId, amount, bankCode } = req.body;

  const vnp_TmnCode = process.env.VNP_TMNCODE;
  const vnp_HashSecret = process.env.VNP_HASHSECRET;
  const vnp_Url = process.env.VNP_URL;
  const vnp_ReturnUrl = process.env.VNP_RETURNURL;

  const date = new Date();
  const createDate = date
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14);
  const orderRef = `${orderId}-${Date.now()}`;

  const ipAddr = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  let vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderRef,
    vnp_OrderInfo: `Thanh toan don hang #${orderId}`,
    vnp_OrderType: "billpayment",
    vnp_Amount: amount * 100, // nhân 100 theo chuẩn VNPay
    vnp_ReturnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
  };

  if (bankCode) vnp_Params["vnp_BankCode"] = bankCode;

  // Sắp xếp params và tạo hash
  const sorted = Object.keys(vnp_Params)
    .sort()
    .reduce((obj, key) => {
      obj[key] = vnp_Params[key];
      return obj;
    }, {});

  const signData = qs.stringify(sorted, { encode: false });
  const hmac = crypto.createHmac("sha512", vnp_HashSecret);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  sorted["vnp_SecureHash"] = signed;
  const paymentUrl = `${vnp_Url}?${qs.stringify(sorted, { encode: true })}`;

  res.json({ paymentUrl });
});

export default router;
