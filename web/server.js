const express = require("express");
require("dotenv").config();
const paypal = require("paypal-rest-sdk");
paypal.configure({
  mode: "sandbox",
  client_id: process.env.client_id,
  client_secret: process.env.client_secret,
});
const path = require("path");
const port = process.env.PORT || 8080;
const sendGmail = require("./utils/sendGmail");

const app = express();

app.use(express.static("public"));
app.set("views", path.join(__dirname, "./views"));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).render("index");
});

app.get("/select.amount", (req, res) => {
  res.status(200).render("selectAmount");
});

let globalDonationAmount;
let verifiedGmail;

app.post("/donate", async (req, res) => {
  const donationAmount = req.body.donationAmount;
  const gmail = req.body.email;

  if (donationAmount <= 0) {
    return res.status(400).render("errors", { error: "Invalid Amount." });
  } else {
    globalDonationAmount = donationAmount;
  }

  verifiedGmail = gmail;

  const donation = {
    intent: "sale",
    payer: {
      payment_method: "paypal",
    },
    redirect_urls: {
      return_url: "https://paypalonate.azurewebsites.net/donate.success",
      cancel_url: "https://paypalonate.azurewebsites.net/donate.cancel",
    },
    transactions: [
      {
        amount: {
          currency: "USD",
          total: donationAmount,
        },
        description: "Donation to Help.",
      },
    ],
  };

  paypal.payment.create(donation, function (error, payment) {
    if (error) {
      return res
        .status(500)
        .render("errors", { error: "Error making the Payment." });
    } else {
      for (let i = 0; i < payment.links.length; i++) {
        if (payment.links[i].rel === "approval_url") {
          res.redirect(payment.links[i].href);
        }
      }
    }
  });
});

app.get("/donate.success", (req, res) => {
  const payerID = req.query.PayerID;
  const paymentID = req.query.paymentId;

  const donate = {
    payer_id: payerID,
    transactions: [
      {
        amount: {
          currency: "USD",
          total: globalDonationAmount,
        },
      },
    ],
  };

  paypal.payment.execute(paymentID, donate, function (error, payment) {
    if (error) {
      throw error;
    } else {
      res.render("donationSuccess", { donatedAmount: globalDonationAmount });
      sendGmail(verifiedGmail, globalDonationAmount);
    }
  });
});

app.get("/donate.cancel", (req, res) => res.render("Donation Cancelled."));

app.listen(port, () => {
  console.log(`Listening on port: ${port}`);
});
