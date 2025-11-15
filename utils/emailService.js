const nodemailer = require("nodemailer");
const config = require("../config/config");

/**
 * Create and configure email transporter
 */
const createTransporter = () => {
  // If SMTP is not configured, return null (emails will be logged instead)
  if (!config.email.enabled) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.email.smtp.host,
    port: config.email.smtp.port,
    secure: config.email.smtp.secure, // true for 465, false for other ports
    auth: {
      user: config.email.smtp.user,
      pass: config.email.smtp.password,
    },
    tls: {
      rejectUnauthorized: config.email.smtp.rejectUnauthorized,
    },
  });
};

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML email body
 * @param {string} options.text - Plain text email body (optional)
 * @param {Array} options.attachments - Email attachments (optional)
 * @returns {Promise<Object>} - Send result
 */
const sendEmail = async ({ to, subject, html, text, attachments = [] }) => {
  try {
    // Validate email configuration
    if (!config.email.enabled) {
      return {
        success: false,
        message: "Email service is disabled",
        preview: { to, subject, text: text || html.substring(0, 100) },
      };
    }

    const transporter = createTransporter();
    if (!transporter) {
      throw new Error("Email transporter not configured");
    }

    const mailOptions = {
      from: `${config.email.from.name} <${config.email.from.address}>`,
      to: to,
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML tags for text version
      attachments: attachments,
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Verify SMTP connection
 */
const verifyConnection = async () => {
  try {
    if (!config.email.enabled) {
      return { verified: false, message: "Email service is disabled" };
    }

    const transporter = createTransporter();
    if (!transporter) {
      return { verified: false, message: "Email transporter not configured" };
    }

    await transporter.verify();
    return { verified: true, message: "SMTP connection successful" };
  } catch (error) {
    return { verified: false, message: error.message };
  }
};

/**
 * Email templates
 */
const templates = {
  /**
   * Welcome email template
   */
  welcome: (userName, email) => {
    return {
      subject: "Welcome to Budget Tracker!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            .button { display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Budget Tracker!</h1>
            </div>
            <div class="content">
              <h2>Hello ${userName}!</h2>
              <p>Thank you for registering with Budget Tracker. Your account has been successfully created.</p>
              <p>Your email address: <strong>${email}</strong></p>
              <p>You can now start tracking your finances and managing your budget effectively.</p>
              <p>If you have any questions, feel free to contact our support team.</p>
              <p>Best regards,<br>The Budget Tracker Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to Budget Tracker!
        
        Hello ${userName}!
        
        Thank you for registering with Budget Tracker. Your account has been successfully created.
        
        Your email address: ${email}
        
        You can now start tracking your finances and managing your budget effectively.
        
        If you have any questions, feel free to contact our support team.
        
        Best regards,
        The Budget Tracker Team
      `,
    };
  },

  /**
   * Password reset email template
   */
  passwordReset: (userName, resetToken, resetUrl) => {
    return {
      subject: "Password Reset Request",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f44336; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            .button { display: inline-block; padding: 12px 24px; background: #f44336; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .token { background: #fff; padding: 10px; border: 1px solid #ddd; font-family: monospace; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hello ${userName}!</h2>
              <p>We received a request to reset your password for your Budget Tracker account.</p>
              <p>Click the button below to reset your password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <div class="token">${resetUrl}</div>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
              <p>Best regards,<br>The Budget Tracker Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>For security reasons, this link expires in 1 hour.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request
        
        Hello ${userName}!
        
        We received a request to reset your password for your Budget Tracker account.
        
        Click the link below to reset your password:
        ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you did not request a password reset, please ignore this email or contact support if you have concerns.
        
        Best regards,
        The Budget Tracker Team
      `,
    };
  },

  /**
   * Login notification email template
   */
  loginNotification: (userName, ipAddress, deviceInfo, timestamp) => {
    return {
      subject: "New Login Detected",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .info-box { background: #fff; padding: 15px; border-left: 4px solid #2196F3; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            .warning { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Login Detected</h1>
            </div>
            <div class="content">
              <h2>Hello ${userName}!</h2>
              <p>We detected a new login to your Budget Tracker account.</p>
              <div class="info-box">
                <p><strong>Login Details:</strong></p>
                <p>Time: ${timestamp}</p>
                <p>IP Address: ${ipAddress}</p>
                <p>Device: ${deviceInfo.platform}</p>
                <p>Browser: ${deviceInfo.browser}</p>
              </div>
              <div class="warning">
                <p><strong>Didn't log in?</strong></p>
                <p>If you didn't perform this login, please secure your account immediately by changing your password.</p>
              </div>
              <p>Best regards,<br>The Budget Tracker Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        New Login Detected
        
        Hello ${userName}!
        
        We detected a new login to your Budget Tracker account.
        
        Login Details:
        Time: ${timestamp}
        IP Address: ${ipAddress}
        Device: ${deviceInfo.platform}
        Browser: ${deviceInfo.browser}
        
        Didn't log in?
        If you didn't perform this login, please secure your account immediately by changing your password.
        
        Best regards,
        The Budget Tracker Team
      `,
    };
  },

  /**
   * Email verification template
   */
  verification: (userName, verificationUrl) => {
    return {
      subject: "Verify Your Email Address",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            .button { display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .token { background: #fff; padding: 10px; border: 1px solid #ddd; font-family: monospace; margin: 10px 0; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verify Your Email Address</h1>
            </div>
            <div class="content">
              <h2>Hello ${userName}!</h2>
              <p>Thank you for registering with Budget Tracker. Please verify your email address to complete your registration.</p>
              <p>Click the button below to verify your email:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <div class="token">${verificationUrl}</div>
              <p><strong>This verification link will expire in 24 hours.</strong></p>
              <p>If you did not create an account with Budget Tracker, please ignore this email.</p>
              <p>Best regards,<br>The Budget Tracker Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>For security reasons, this link expires in 24 hours.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Verify Your Email Address
        
        Hello ${userName}!
        
        Thank you for registering with Budget Tracker. Please verify your email address to complete your registration.
        
        Click the link below to verify your email:
        ${verificationUrl}
        
        This verification link will expire in 24 hours.
        
        If you did not create an account with Budget Tracker, please ignore this email.
        
        Best regards,
        The Budget Tracker Team
      `,
    };
  },
};

module.exports = {
  sendEmail,
  verifyConnection,
  templates,
};

