import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendRegistrationOTP = async (email, otp, name) => {
  const appName = process.env.APP_NAME || "Co-working Space";

  const mailOptions = {
    from: `"${process.env.MAIL_FROM_NAME || appName}" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Verify Your Email - ${appName}`,
    text: `Hello ${name},

Thank you for registering with ${appName}.

Your email verification OTP is: ${otp}

This OTP is valid for 5 minutes. Please do not share it with anyone.

If you did not request this verification, please ignore this email.

Regards,
${appName} Team`,
    html: `
      <div style="max-width:600px;margin:20px auto;padding:30px;font-family:Arial,sans-serif;border:1px solid #e5e7eb;border-radius:12px;color:#333;">
        <h2 style="color:#2563eb;">Verify Your Email Address</h2>

        <p>Hello <strong>${name}</strong>,</p>

        <p>Thank you for registering with ${appName}.</p>

        <p>Use the following OTP to verify your email address:</p>

        <div style="margin:25px 0;padding:18px;background:#f3f4f6;text-align:center;border-radius:8px;">
          <h1 style="letter-spacing:10px;color:#2563eb;margin:0;">
            ${otp}
          </h1>
        </div>

        <p>This OTP is valid for <strong>5 minutes</strong>.</p>

        <p style="color:#dc2626;font-size:13px;">
          Please do not share this OTP with anyone.
        </p>

        <p>If you did not request this verification, you can ignore this email.</p>

        <p style="margin-top:30px;">
          Regards,<br/>
          <strong>${appName} Team</strong>
        </p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

export default transporter;
