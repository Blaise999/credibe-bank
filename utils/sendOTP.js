const { Resend } = require("resend");
require("dotenv").config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOTP = async ({ to, subject, body, pdfBuffer = null }) => {
  if (!to || !subject || !body) {
    throw new Error("❌ Missing email fields (to, subject, body)");
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY not loaded. Check your .env");
    throw new Error("Resend API key not configured");
  }

  const attachments = pdfBuffer
    ? [{
        filename: "receipt.pdf",
        content: pdfBuffer.toString("base64"),
        type: "application/pdf",
      }]
    : [];

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2 style="color: #00b4d8;">${subject}</h2>
      <p>${body}</p>
      <p style="color: #888; font-size: 12px;">Please do not share this code with anyone.</p>
    </div>
  `;

  try {
    console.log("📤 Preparing to send email to:", to);

    const response = await resend.emails.send({
      from: "noreply@thecredibe.com", // Use your verified domain
      to,
      subject,
      html: emailHtml,
      attachments,
    });

    console.log("📨 Resend raw response:", response);

    if (!response || response.error) {
      console.error("❌ Email send failed:", response?.error || "No response at all");
      throw new Error("Resend failed to send email");
    }

    console.log("✅ OTP email sent successfully to:", to);
  } catch (err) {
    console.error("❌ Resend Exception:", err.message);
    throw err;
  }
};

module.exports = sendOTP;
