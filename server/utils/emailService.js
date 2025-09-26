const nodemailer = require('nodemailer');

// Email configuration
const createTransporter = () => {
  // For development - use Gmail or other SMTP service
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Use App Password for Gmail
    },
  });

  // Alternative: Use other SMTP services
  // return nodemailer.createTransporter({
  //   host: process.env.SMTP_HOST,
  //   port: process.env.SMTP_PORT,
  //   secure: false,
  //   auth: {
  //     user: process.env.SMTP_USER,
  //     pass: process.env.SMTP_PASS,
  //   },
  // });
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const transporter = createTransporter();
    
    const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    
    const mailOptions = {
      from: `"LEGO E-commerce" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request - LEGO E-commerce',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Password Reset</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              background-color: #f8f9fa;
              padding: 20px;
              border-radius: 5px;
            }
            .content {
              padding: 20px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #007bff;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🧱 LEGO E-commerce</h1>
              <h2>Password Reset Request</h2>
            </div>
            
            <div class="content">
              <p>Hello,</p>
              
              <p>You recently requested to reset your password for your LEGO E-commerce account. Click the button below to reset it:</p>
              
              <div style="text-align: center;">
                <a href="${resetURL}" class="button">Reset Your Password</a>
              </div>
              
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 3px;">
                ${resetURL}
              </p>
              
              <p><strong>Important:</strong> This link will expire in 10 minutes for security reasons.</p>
              
              <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
              
              <p>Best regards,<br>
              The LEGO E-commerce Team</p>
            </div>
            
            <div class="footer">
              <p>This is an automated message, please do not reply to this email.</p>
              <p>&copy; 2024 LEGO E-commerce. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        LEGO E-commerce - Password Reset Request
        
        Hello,
        
        You recently requested to reset your password for your LEGO E-commerce account.
        
        Please click the following link to reset your password:
        ${resetURL}
        
        This link will expire in 10 minutes for security reasons.
        
        If you didn't request this password reset, please ignore this email.
        
        Best regards,
        The LEGO E-commerce Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

// Send account locked notification
const sendAccountLockedEmail = async (email, lockDuration) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"LEGO E-commerce Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Account Temporarily Locked - LEGO E-commerce',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Account Locked</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              background-color: #fff3cd;
              padding: 20px;
              border-radius: 5px;
              border-left: 4px solid #ffc107;
            }
            .content {
              padding: 20px;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 Account Temporarily Locked</h1>
            </div>
            
            <div class="content">
              <p>Hello,</p>
              
              <p>Your LEGO E-commerce account has been temporarily locked due to multiple failed login attempts.</p>
              
              <p><strong>Lock Duration:</strong> ${lockDuration} minutes</p>
              
              <p>For your security, please:</p>
              <ul>
                <li>Wait for the lock period to expire</li>
                <li>Ensure you're using the correct password</li>
                <li>Consider resetting your password if you've forgotten it</li>
                <li>Contact support if you suspect unauthorized access</li>
              </ul>
              
              <p>If you didn't attempt to log in, please secure your account immediately by contacting our support team.</p>
              
              <p>Best regards,<br>
              The LEGO E-commerce Security Team</p>
            </div>
            
            <div class="footer">
              <p>This is an automated security notification.</p>
              <p>&copy; 2024 LEGO E-commerce. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Account locked email sent:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Error sending account locked email:', error);
    // Don't throw error for notification emails
    return {
      success: false,
      error: error.message,
    };
  }
};

// Send welcome email for new registrations
const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"LEGO E-commerce" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to LEGO E-commerce! 🧱',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to LEGO E-commerce</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              background-color: #d4edda;
              padding: 20px;
              border-radius: 5px;
            }
            .content {
              padding: 20px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #28a745;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🧱 Welcome to LEGO E-commerce!</h1>
            </div>
            
            <div class="content">
              <p>Hello ${name},</p>
              
              <p>Welcome to LEGO E-commerce! We're excited to have you join our community of LEGO enthusiasts.</p>
              
              <p>With your new account, you can:</p>
              <ul>
                <li>Browse our extensive collection of LEGO sets</li>
                <li>Create wishlists for your favorite items</li>
                <li>Track your orders and purchase history</li>
                <li>Leave reviews and ratings</li>
                <li>Get notified about new arrivals and special offers</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${process.env.CLIENT_URL}" class="button">Start Shopping</a>
              </div>
              
              <p>If you have any questions, our support team is here to help!</p>
              
              <p>Happy building!<br>
              The LEGO E-commerce Team</p>
            </div>
            
            <div class="footer">
              <p>&copy; 2024 LEGO E-commerce. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error for welcome emails
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendAccountLockedEmail,
  sendWelcomeEmail,
};
