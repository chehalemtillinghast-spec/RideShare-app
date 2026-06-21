import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const smtpConfigured = process.env.SMTP_USER && process.env.SMTP_PASS;

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

export async function sendPasswordResetEmail(toEmail, resetUrl) {
  if (!transporter) {
    console.warn(`SMTP not configured — would have emailed reset link to ${toEmail}: ${resetUrl}`);
    return;
  }
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: toEmail,
    subject: 'Reset your Town Rides password',
    text: `We received a request to reset your Town Rides password. Open this link to choose a new one (expires in 1 hour):\n\n${resetUrl}\n\nIf you didn't request this, you can ignore this email.`,
    html: `
      <p>We received a request to reset your Town Rides password.</p>
      <p><a href="${resetUrl}">Click here to choose a new password</a> (this link expires in 1 hour).</p>
      <p>If you didn't request this, you can ignore this email.</p>
    `,
  });
}
