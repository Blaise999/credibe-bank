const { Resend } = require("resend");
require("dotenv").config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOTP = async ({ to, subject, body, pdfBuffer = null }) => {
  if (!to || !subject || !body) {
    throw new Error("Missing email fields (to, subject, body)");
  }

 const attachments = pdfBuffer
  ? [{
      filename: "receipt.pdf",
      content: pdfBuffer,
      encoding: "base64"
    }]
  : [];

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2 style="color: #00b4d8;">${subject}</h2>
      <p>${body}</p>
      <p>Please do not share this code with anyone.</p>
    </div>
  `;

  try {
    const { error } = await resend.emails.send({
      from: "noreply@thecredibe.com",
      to,
      subject,
      html: emailHtml,
      attachments,
    });

    if (error) {
      console.error("❌ Resend Email Error:", error);
      throw new Error("Failed to send email");
    }

    console.log("✅ OTP email sent to:", to);
  } catch (err) {
    console.error("❌ Resend Exception:", err.message);
    throw err;
  }
};

module.exports = sendOTP;