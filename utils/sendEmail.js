const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASS  // app password
  }
});

module.exports = async function sendEmail({ to, subject, text }) {
  await transporter.sendMail({
    from: `"IntelliHire" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text
  });
};