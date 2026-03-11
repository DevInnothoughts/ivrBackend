const nodemailer = require("nodemailer");

const { EMAIL_USER, EMAIL_PASS, EMAIL_HOST, EMAIL_PORT } = process.env;

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT == 465,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

const sendNewLeadEmail = async ({
  toEmail,
  executiveName,
  leadName,
  leadPhone,
  leadSource,
}) => {
  if (!toEmail) {
    console.warn("Email skipped: No recipient email provided for assignment.");
    return;
  }

  const mailOptions = {
    from: EMAIL_USER,
    to: toEmail,
    subject: `JLR–Navnit Motors | New Lead Assigned`,
    html: `
      <p>Dear <strong>${executiveName}</strong>,</p>
      <p>You have been assigned a new lead. Please find the details below:
      <ul style="list-style-type: none; padding: 0;">
      <li><strong>Source:</strong> ${leadSource || "N/A"}</li>
        <li><strong>Name:</strong> ${leadName || "N/A"}</li>
        <li><strong>Phone:</strong> ${leadPhone || "N/A"}</li>
      </ul></p>
      <p style="font-weight: bold; color: #c0392b;">
        Action Required: Kindly contact the lead at the earliest and update the CRM accordingly.
      </p>
      <p style="margin-top: 20px;">
      Regards,<br>
      <strong>Admin Team</strong>
      </p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Assignment email sent successfully to ${toEmail}.`);
  } catch (error) {
    console.error(`Error sending email to ${toEmail}:`, error.message);
  }
};

module.exports = {
  sendNewLeadEmail,
};
