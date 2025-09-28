const nodemailer = require("nodemailer");

function resolveCreds() {
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const host = process.env.SMTP_HOST || (user && user.includes("gmail") ? "smtp.gmail.com" : undefined);
  const port = Number(process.env.SMTP_PORT || 587);

  return { user, pass, host, port };
}

async function getTransporter() {
  const { user, pass, host, port } = resolveCreds();
  const hasCreds = Boolean(user && pass);

  if (!hasCreds) {
    const testAccount = await nodemailer.createTestAccount();
    console.warn("[emailService] No SMTP credentials found. Using Ethereal test account.");
    console.warn(`[emailService] Ethereal user: ${testAccount.user}`);

    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  return nodemailer.createTransport({
    host: host || "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

async function sendVerificationEmail(to, link) {
  const transporter = await getTransporter();
  const appName = process.env.APP_NAME || "Lego Store";
  const fromAddress = process.env.SMTP_FROM || process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER;

  const info = await transporter.sendMail({
    from: `${appName} <${fromAddress}>`,
    to,
    subject: "Verify your email",
    html: `
      <p>Xin chào,</p>
      <p>Vui lòng xác minh email của bạn bằng cách nhấp vào liên kết dưới đây:</p>
      <p><a href="${link}" target="_blank">Xác minh email</a></p>
      <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
    `,
  });

  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) {
    console.log(`[emailService] Preview URL: ${preview}`);
  } else {
    console.log("[emailService] Verification email sent to", to);
  }
}

module.exports = { sendVerificationEmail };
