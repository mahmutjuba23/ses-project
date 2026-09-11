"use strict";

/**
 * Mailer smoke-test
 *
 * Usage (run from project root):
 *   node scripts/test-mailer.js            → runs all tests (waits 5s between each)
 *   node scripts/test-mailer.js connection → only verifies the SMTP connection
 *   node scripts/test-mailer.js text       → sends plain-text email only
 *   node scripts/test-mailer.js html       → sends raw HTML email only
 *   node scripts/test-mailer.js template   → sends Pug template (welcome.pug) only
 */

require("dotenv").config();
const { sendMail, verifyConnection } = require("../src/services/mailer.service");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Mailtrap sandbox accepts any address; this resolves to something in your inbox
const TEST_RECIPIENT = process.env.SMTP_USER + "@mailtrap.io";

const MODE = process.argv[2] || "all";

async function testConnection() {
  console.log("\n[1/1] Verifying SMTP connection…");
  console.log("      Host:", process.env.SMTP_HOST);
  console.log("      Port:", process.env.SMTP_PORT);
  console.log("      User:", process.env.SMTP_USER);
  await verifyConnection();
  console.log("      ✓ Connection OK\n");
}

async function testText() {
  console.log("\n[text] Sending plain-text email to", TEST_RECIPIENT, "…");
  const info = await sendMail({
    to: TEST_RECIPIENT,
    subject: "[SES Test] Plain-text email",
    text: "Hello from the SES mailer service! Plain-text check passed ✓",
  });
  console.log("       ✓ Sent — messageId:", info.messageId, "\n");
}

async function testHtml() {
  console.log("\n[html] Sending raw HTML email to", TEST_RECIPIENT, "…");
  const info = await sendMail({
    to: TEST_RECIPIENT,
    subject: "[SES Test] Raw HTML email",
    html: `
      <div style="font-family:sans-serif;padding:24px">
        <h2 style="color:#1a73e8">SES Mailer — HTML check ✓</h2>
        <p>This email was sent from <strong>mailer.service.js</strong> using raw HTML.</p>
        <p style="color:#888;font-size:12px">Timestamp: ${new Date().toISOString()}</p>
      </div>
    `,
  });
  console.log("       ✓ Sent — messageId:", info.messageId, "\n");
}

async function testTemplate() {
  console.log("\n[template] Sending Pug template email (welcome.pug) to", TEST_RECIPIENT, "…");
  const info = await sendMail({
    to: TEST_RECIPIENT,
    subject: "[SES Test] Pug template email",
    template: "welcome",
    locals: {
      name: "Test Student",
      loginUrl: "http://localhost:3010/login",
    },
  });
  console.log("           ✓ Sent — messageId:", info.messageId, "\n");
}

async function main() {
  console.log("\n=== SES Mailer Smoke-Test (mode:", MODE, ")===");

  try {
    if (MODE === "connection") {
      await testConnection();
    } else if (MODE === "text") {
      await testConnection();
      await testText();
    } else if (MODE === "html") {
      await testConnection();
      await testHtml();
    } else if (MODE === "template") {
      await testConnection();
      await testTemplate();
    } else {
      // Run all — wait 5 s between each to respect Mailtrap free-tier (1 msg/s window)
      await testConnection();
      await testText();
      console.log("      Waiting 5s before next send (Mailtrap rate-limit)…");
      await sleep(5000);
      await testHtml();
      console.log("      Waiting 5s before next send (Mailtrap rate-limit)…");
      await sleep(5000);
      await testTemplate();
    }

    console.log("=== Done! Open https://mailtrap.io/inboxes → Sandbox → your inbox ===\n");
  } catch (err) {
    console.error("\n✗ TEST FAILED:", err.message, "\n");
    process.exit(1);
  }
}

main();
