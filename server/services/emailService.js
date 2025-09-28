const nodemailer = require('nodemailer');

async function getTransporter() {
  const hasCreds = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
  if (!hasCreds) {
    // Fallback: create an Ethereal test account for development
    const testAccount = await nodemailer.createTestAccount();
    const transport = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.warn('[emailService] Using Ethereal test SMTP. Preview URLs will be available in logs.');
    return transport;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendVerificationEmail(to, link) {
  const transporter = await getTransporter();
  const appName = process.env.APP_NAME || 'Lego Store';
  const info = await transporter.sendMail({
    from: `${appName} <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: 'Verify your email',
    html: `
      <p>Xin chào,</p>
      <p>Vui lòng xác minh email của bạn bằng cách nhấp vào liên kết dưới đây:</p>
      <p><a href="${link}" target="_blank">Xác minh email</a></p>
      <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
    `,
  });

  // Log preview URL for Ethereal (useful in dev)
  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) {
    console.log(`[emailService] Preview URL: ${preview}`);
  }
}

module.exports = { sendVerificationEmail };


