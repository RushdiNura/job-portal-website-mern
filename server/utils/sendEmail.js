import nodemailer from "nodemailer";

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_HOST) {
    console.log(`[email:dev] To: ${to} | Subject: ${subject}`);
    return { delivered: false, dev: true };
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "no-reply@jobportal.com",
    to,
    subject,
    html,
  });
  return { delivered: true };
};

export default sendEmail;
