const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

module.exports = async function generatePDF(transactionData) {
  const { from, to, amount, toIban, note, date, recipient, _id } = transactionData;

  // Load HTML template
  const templatePath = path.join(__dirname, "../templates/receiptTemplate.html");
  let html = fs.readFileSync(templatePath, "utf8");

  // Format values
  const formattedDate = new Date(date || Date.now()).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const ref = _id?.toString().slice(-6).toUpperCase() || Math.random().toString(36).slice(2, 10).toUpperCase();
  const rawAccount = toIban?.replace(/\s+/g, "") || "";
  const maskedAccount = rawAccount.length >= 4 ? "**** **** **** " + rawAccount.slice(-4) : "****";
  const formattedAmount = parseFloat(amount).toFixed(2);

  // Resolve sender and recipient names
  const senderName =
    typeof from === "object"
      ? from.fullName || from.name || from.email || "Sender"
      : from || "Sender";

  const recipientName =
    recipient ||
    (typeof to === "object" ? to.fullName || to.name || to.email : to) ||
    "Recipient";

  // Placeholder map
  const dataMap = {
    "{{senderName}}": senderName,
    "{{recipientName}}": recipientName,
    "{{iban}}": toIban || "N/A",
    "{{amount}}": `€${formattedAmount}`,
    "{{fee}}": `€0.00`,
    "{{total}}": `€${formattedAmount}`,
    "{{note}}": note || "No note",
    "{{date}}": formattedDate,
    "{{reference}}": ref,
    "{{maskedAccount}}": maskedAccount
  };

  // Replace all placeholders using global RegExp
  for (const [key, value] of Object.entries(dataMap)) {
    const regex = new RegExp(key.replace(/[{}]/g, "\\$&"), "g");
    html = html.replace(regex, value);
  }

  // Generate PDF
  const browser = await chromium.launch({
    headless: true
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
