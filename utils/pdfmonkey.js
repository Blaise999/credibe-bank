const axios = require("axios");

const PDFMONKEY_API_KEY = process.env.PDFMONKEY_API_KEY;
const PDFMONKEY_TEMPLATE_ID = process.env.PDFMONKEY_TEMPLATE_ID;

module.exports = async function generatePDFMonkeyPDF(transaction) {
  try {
    const payload = {
      document: {
        document_template_id: PDFMONKEY_TEMPLATE_ID,
        payload: {
          senderName: transaction.from?.fullName || "Unknown Sender",
          recipientName: transaction.recipient || "Unknown Recipient",
          iban: transaction.toIban || "Unknown IBAN",
          maskedAccount: transaction.from?.iban?.slice(-4) || "****",
          amount: transaction.amount || 0,
          fee: 0,
          total: transaction.amount || 0,
          reference: transaction._id?.toString().slice(-6).toUpperCase() || "ABC123",
          date: new Date(transaction.date || Date.now()).toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          })
        }
      }
    };

    const response = await axios.post("https://api.pdfmonkey.io/api/v1/documents", payload, {
      headers: {
        Authorization: `Bearer ${PDFMONKEY_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      }
    });

    const docId = response.data.data.id;

    // ⏳ Wait until it's done generating
    let pdfUrl = null;
    let tries = 0;

    while (!pdfUrl && tries < 10) {
      const statusRes = await axios.get(`https://api.pdfmonkey.io/api/v1/documents/${docId}`, {
        headers: { Authorization: `Bearer ${PDFMONKEY_API_KEY}` }
      });

      if (statusRes.data.data.status === "done") {
        pdfUrl = statusRes.data.data.download_url;
        break;
      }

      await new Promise(res => setTimeout(res, 1000));
      tries++;
    }

    if (!pdfUrl) throw new Error("PDF generation timed out");

    const pdfRes = await axios.get(pdfUrl, { responseType: "arraybuffer" });
    return Buffer.from(pdfRes.data);
  } catch (err) {
    console.error("❌ PDFMonkey PDF generation error:", err.message);
    throw err;
  }
};
