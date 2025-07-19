const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

module.exports = async function generatePDF(transactionData) {
  const { from, to, amount, toIban, note, date, recipient, _id } = transactionData;

  const templatePath = path.join(__dirname, "../templates/receiptTemplate.html");
  let html = fs.readFileSync(templatePath, "utf8");

  const formattedDate = new Date(date || Date.now()).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const ref = _id?.toString().slice(-6).toUpperCase() || Math.random().toString(36).slice(2, 10).toUpperCase();

  // Masked Account logic (show last 4 digits only)
  const rawAccount = toIban?.replace(/\s+/g, "") || "";
  const maskedAccount = rawAccount.length >= 4
    ? "**** **** **** " + rawAccount.slice(-4)
    : "****";

  // Format amount (2 decimals)
  const formattedAmount = parseFloat(amount).toFixed(2);

  // Replace all placeholders
  html = html
    .replace(/{{senderName}}/g, from || "N/A")
    .replace(/{{recipientName}}/g, recipient || to || "N/A")
    .replace(/{{iban}}/g, toIban || "N/A")
    .replace(/{{amount}}/g, `€${formattedAmount}`)
    .replace(/{{note}}/g, note || "No note")
    .replace(/{{date}}/g, formattedDate)
    .replace(/{{reference}}/g, ref)
    .replace(/{{maskedAccount}}/g, maskedAccount)
    .replace(/{{fee}}/g, "€0.00")
    .replace(/{{total}}/g, `€${formattedAmount}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
  });

  await browser.close();
  return pdfBuffer;
};
