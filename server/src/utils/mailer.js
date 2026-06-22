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

async function sendEmail({ toEmail, subject, text, html }) {
  if (!resend) {
    console.warn(`RESEND_API_KEY not configured — would have emailed "${subject}" to ${toEmail}`);
    return;
  }
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM || 'Town Rides <onboarding@resend.dev>',
    to: toEmail,
    subject,
    text,
    html,
  });
  if (error) {
    throw new Error(error.message || 'Resend failed to send the email.');
  }
}

export async function sendAccountSuspendedEmail(toEmail, fullName) {
  await sendEmail({
    toEmail,
    subject: 'Your Town Rides account has been suspended',
    text: `Hi ${fullName},\n\nYour Town Rides account has been suspended by an admin. You will not be able to log in until it's reinstated. If you think this was a mistake, please reach out to a Town Rides admin in your community.`,
    html: `
      <p>Hi ${fullName},</p>
      <p>Your Town Rides account has been suspended by an admin. You will not be able to log in until it's reinstated.</p>
      <p>If you think this was a mistake, please reach out to a Town Rides admin in your community.</p>
    `,
  });
}

export async function sendAccountDeletedEmail(toEmail, fullName) {
  await sendEmail({
    toEmail,
    subject: 'Your Town Rides account has been deleted',
    text: `Hi ${fullName},\n\nYour Town Rides account has been permanently deleted by an admin, along with your rides, messages, ratings, and other account data. You can no longer log in. If you think this was a mistake, please reach out to a Town Rides admin in your community.`,
    html: `
      <p>Hi ${fullName},</p>
      <p>Your Town Rides account has been permanently deleted by an admin, along with your rides, messages, ratings, and other account data. You can no longer log in.</p>
      <p>If you think this was a mistake, please reach out to a Town Rides admin in your community.</p>
    `,
  });
}
