import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendPasswordResetEmail(toEmail, resetUrl) {
  if (!resend) {
    console.warn(`RESEND_API_KEY not configured — would have emailed reset link to ${toEmail}: ${resetUrl}`);
    return;
  }
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM || 'Town Rides <onboarding@resend.dev>',
    to: toEmail,
    subject: 'Reset your Town Rides password',
    text: `We received a request to reset your Town Rides password. Open this link to choose a new one (expires in 1 hour):\n\n${resetUrl}\n\nIf you didn't request this, you can ignore this email.`,
    html: `
      <p>We received a request to reset your Town Rides password.</p>
      <p><a href="${resetUrl}">Click here to choose a new password</a> (this link expires in 1 hour).</p>
      <p>If you didn't request this, you can ignore this email.</p>
    `,
  });
  if (error) {
    throw new Error(error.message || 'Resend failed to send the email.');
  }
}
