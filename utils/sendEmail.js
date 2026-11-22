import nodemailer from "nodemailer";

// Nodemailer
const sendEmail = async (options) => {
  // 1- Create a transporter (service that will send the email like Gmail).
  // The tests build the message without sending it
  const transporter = nodemailer.createTransport(
    process.env.NODE_ENV === "test"
      ? { jsonTransport: true }
      : {
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT, // true for 465, false for 587
          secure: true,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        },
  );

  // 2- Define the email options (from, to, subject, text, html)
  const mailOptions = {
    from: `E-shop App <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // 3- Send the email
  await transporter.sendMail(mailOptions);
};

export default sendEmail;
