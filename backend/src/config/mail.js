const nodemailer = require('nodemailer');
const { logger } = require('./logger');

const isTest = process.env.NODE_ENV === 'test';

const transporter = isTest
  ? nodemailer.createTransport({
      jsonTransport: true,
    })
  : nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '1025', 10),
      secure: false,
      ignoreTLS: true,
    });

const sendPasswordResetEmail = async (toEmail, token) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/reset-password?token=${token}`;

  const mailOptions = {
    from: '"Minimalist Notes" <no-reply@minimalistnotes.local>',
    to: toEmail,
    subject: 'Password Reset Request',
    text: `You requested a password reset. Please use the following link to reset your password within 15 minutes:\n\n${resetLink}\n\nIf you did not request this, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
        <h2 style="color: #2563eb; margin-bottom: 16px;">Password Reset Request</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.5;">
          You requested a password reset for your Minimalist Notes account. Click the button below to set a new password:
        </p>
        <div style="margin: 24px 0;">
          <a href="${resetLink}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #64748b; font-size: 12px;">This link will expire in 15 minutes. If you did not request this password reset, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 11px;">Or copy and paste this URL into your browser:<br/><a href="${resetLink}" style="color: #2563eb;">${resetLink}</a></p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info({ email: toEmail, messageId: info.messageId }, 'Password reset email sent');
    return info;
  } catch (error) {
    logger.error({ email: toEmail, error: error.message }, 'Failed to send password reset email');
    throw error;
  }
};

module.exports = {
  transporter,
  sendPasswordResetEmail,
};
