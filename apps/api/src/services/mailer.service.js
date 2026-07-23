import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let transporter = null;

function getTransporter() {
  if (!env.smtp.host) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.password } : undefined,
    });
  }
  return transporter;
}

export const mailerService = {
  async send({ to, subject, html, text }) {
    const client = getTransporter();
    if (!client) {
      logger.warn({ to, subject }, 'smtp_not_configured_email_not_sent');
      return;
    }
    await client.sendMail({ from: env.smtp.from, to, subject, html, text });
  },
};
