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

  // ✅ Clean name logic
  const senderName = from?.name || from?.email || "User";
  const recipientName = recipient || to?.name || "Recipient";

  html = html
    .replace("{{senderName}}", senderName)
    .replace("{{recipientName}}", recipientName)
    .replace("{{iban}}", toIban || "N/A")
    .replace("{{amount}}", `€${amount}`)
    .replace("{{note}}", note || "No note")
    .replace("{{date}}", formattedDate)
    .replace("{{reference}}", ref);

  console.log("✅ PDF HTML compiled successfully");

  const browser = await chromium.launch({
    headless: true,
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
  });

  await browser.close();
  return pdfBuffer;
};
