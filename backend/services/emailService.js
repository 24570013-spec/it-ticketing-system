'use strict';

const nodemailer = require('nodemailer');

/**
 * Sends a status-change notification email to the ticket owner.
 * Reads SMTP config from environment variables.
 * @param {string} userEmail
 * @param {string} ticketTitle
 * @param {string} newStatus
 * @returns {Promise<void>}
 */
async function sendStatusChangeEmail(userEmail, ticketTitle, newStatus) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP configuration is missing. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env');
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to: userEmail,
    subject: `Ticket status updated: ${ticketTitle}`,
    text: `Your ticket "${ticketTitle}" has been updated to status: ${newStatus}.\n\nLogin to the IT Helpdesk system to view details.`,
  });
}

module.exports = { sendStatusChangeEmail };
