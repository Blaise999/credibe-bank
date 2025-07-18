const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

module.exports = async function generatePDF(transactionData) {
  const { from, to, amount, toIban, note, date, recipient, _id } = transactionData;

  // Load HTML template
  const templatePath = path.join(__dirname, "../templates/receiptTemplate.html");
  let html = fs.readFileSync(templatePath, "utf8");

  // Format date
  const formattedDate = new Date(date || Date.now()).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const ref = _id?.toString().slice(-6).toUpperCase() || Math.random().toString(36).slice(2, 10).toUpperCase();

  // Replace placeholders in HTML
  html = html
    .replace("{{senderName}}", from || "N/A")
    .replace("{{recipientName}}", recipient || to || "N/A")
    .replace("{{iban}}", toIban || "N/A")
    .replace("{{amount}}", `€${amount}`)
    .replace("{{note}}", note || "No note")
    .replace("{{date}}", formattedDate)
    .replace("{{reference}}", ref);

  // Launch Puppeteer
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: true,
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
  });

  await browser.close();
  return pdfBuffer;
};
