import nodemailer from 'nodemailer';
import { getConfig } from '../config/env.js';

let transport;
// Emails sent without SMTP (development and tests) are kept here and printed in the log.
export const outbox = [];

function getTransport() {
  const { email } = getConfig();
  if (!email.host) return null;
  if (!transport) {
    transport = nodemailer.createTransport({
      host: email.host,
      port: email.port,
      secure: email.port === 465,
      auth: email.user ? { user: email.user, pass: email.password } : undefined,
    });
  }
  return transport;
}

// Sends { to, subject, text, html }. Never throws: a failed email must not undo a booking.
export async function sendEmail(message) {
  const { email } = getConfig();
  const mail = { from: email.from, ...message };
  const smtp = getTransport();
  if (!smtp) {
    outbox.push(mail);
    if (outbox.length > 50) outbox.shift();
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[email] (not sent, EMAIL_HOST is blank) To: ${mail.to} | ${mail.subject}\n${mail.text}\n`);
    }
    return { sent: false };
  }
  try {
    await smtp.sendMail(mail);
    return { sent: true };
  } catch (err) {
    console.error(`[email] Could not send "${mail.subject}" to ${mail.to}: ${err.message}`);
    return { sent: false, error: err.message };
  }
}
