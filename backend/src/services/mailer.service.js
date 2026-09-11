"use strict";

const nodemailer = require("nodemailer");
const pug = require("pug");
const path = require("path");

// ─── Email templates root ────────────────────────────────────────────────────
// All .pug email templates live under src/views/emails/
const TEMPLATES_DIR = path.join(__dirname, "../views/emails");

// ─── Transporter (singleton) ─────────────────────────────────────────────────
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    // STARTTLS – secure:false means the connection starts unencrypted then
    // upgrades via STARTTLS (correct for ports 25, 587, 2525).
    // Set secure:true only when using port 465 (direct TLS).
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Mailtrap accepts PLAIN, LOGIN, and CRAM-MD5
    authMethod: "PLAIN",
  });

  return _transporter;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Compile a Pug email template to an HTML string.
 *
 * @param {string} templateName  Filename without extension, e.g. "welcome"
 * @param {object} [locals={}]   Variables passed into the template
 * @returns {string}             Rendered HTML
 */
function renderTemplate(templateName, locals = {}) {
  const file = path.join(TEMPLATES_DIR, `${templateName}.pug`);
  return pug.renderFile(file, { ...locals, cache: process.env.NODE_ENV === "production" });
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Send an email.
 *
 * @param {object} options
 * @param {string|string[]} options.to           Recipient address(es)
 * @param {string}          options.subject      Email subject
 *
 * Provide exactly ONE of the following content options:
 * @param {string} [options.template]  Pug template name (relative to src/views/emails/)
 * @param {object} [options.locals]    Variables forwarded to the Pug template
 * @param {string} [options.html]      Pre-rendered HTML string
 * @param {string} [options.text]      Plain-text fallback (auto-generated when omitted)
 *
 * Optional overrides:
 * @param {string} [options.from]      Override the default sender
 * @param {string[]} [options.cc]      CC addresses
 * @param {string[]} [options.bcc]     BCC addresses
 * @param {object[]} [options.attachments]  Nodemailer attachment objects
 *
 * @returns {Promise<object>} Nodemailer sendMail info object
 */
async function sendMail({ to, subject, template, locals = {}, html, text, from, cc, bcc, attachments }) {
  // Build HTML from a Pug template or use the supplied html string
  let htmlBody = html;
  if (template) {
    htmlBody = renderTemplate(template, locals);
  }

  if (!htmlBody && !text) {
    throw new Error("mailer.sendMail: provide either `template`, `html`, or `text`.");
  }

  const fromAddress = from || `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`;

  const message = {
    from: fromAddress,
    to: Array.isArray(to) ? to.join(", ") : to,
    subject,
    html: htmlBody,
    // Plain-text fallback – strip HTML tags for a basic approximation
    text: text || (htmlBody ? htmlBody.replace(/<[^>]+>/g, "") : undefined),
    ...(cc && { cc: Array.isArray(cc) ? cc.join(", ") : cc }),
    ...(bcc && { bcc: Array.isArray(bcc) ? bcc.join(", ") : bcc }),
    ...(attachments && { attachments }),
  };

  const info = await getTransporter().sendMail(message);
  return info;
}

/**
 * Verify the SMTP connection.  Useful for health-checks or startup diagnostics.
 *
 * @returns {Promise<boolean>}
 */
async function verifyConnection() {
  await getTransporter().verify();
  return true;
}

module.exports = { sendMail, verifyConnection, renderTemplate };
