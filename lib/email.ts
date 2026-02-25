import nodemailer from "nodemailer";

export async function sendDependantApprovalEmail({ to, resetLink }: { to: string; resetLink: string }) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "Your Account Has Been Approved",
    html: `
      <p>Your account has been approved.</p>
      <p>Email: <b>${to}</b></p>
      <p><a href="${resetLink}">Click here to set your new password</a></p>
      <p>You can now log in to the app after updating your password.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendEmail({ to, subject, text }: { to: string; subject: string; text: string }) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
  };

  await transporter.sendMail(mailOptions);
}
