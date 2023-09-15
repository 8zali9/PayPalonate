const nodemailer = require("nodemailer");

const sendGmail = async (receiverGmail, invoiceAmount) => {
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.Gmail,
      pass: process.env.GmailPassword,
    },
  });

  let info = await transporter.sendMail({
    from: "PaymentGateway <PaymentGatewayIntegrationTest@gmail.com>",
    to: receiverGmail,
    subject: `Thank You for Your $${invoiceAmount} Donation.`,
    html: `
    <h1>Invoice</h1>
    <h2>Your Donation Matters!</h2>
    <p>We truly appreciate your time and effort in testing our application.</p>
    `,
  });
};

module.exports = sendGmail;
