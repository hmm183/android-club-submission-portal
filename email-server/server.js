require('dotenv').config();
const express = require('express');
const nodemailer =require('nodemailer');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 10000;

// Middleware
app.use(express.json());
const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Health check route
app.get('/', (req, res) => {
  res.status(200).send('Email server is running.');
});

// **THE FIX:** This route now responds immediately and sends the email in the background.
app.post('/send-confirmation', (req, res) => {
  const { teamName, leaderEmail } = req.body;

  if (!teamName || !leaderEmail) {
    return res.status(400).json({ success: false, message: 'Missing teamName or leaderEmail.' });
  }

  // Step 1: Send an immediate success response to the frontend.
  res.status(200).json({ success: true, message: 'Submission received. A confirmation email is being sent.' });

  // Step 2: Perform the slow email-sending task in the background.
  // We define an async function to do the work.
  const sendEmail = async () => {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: `Organizing Committee <${process.env.EMAIL_USER}>`,
        to: leaderEmail,
        subject: '✅ Submission Received - September Sprint',
        html: `
          <h2>Thank You For Your Submission!</h2>
          <p>This is a confirmation that your team, <strong>${teamName}</strong>, has successfully submitted its project for the <b>September Sprint</b>.</p>
          <p>Our raters will review it shortly. Good luck!</p>
          <br/>
          <p>- The ANDROID CLUB</p>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Background confirmation email sent to ${leaderEmail}`);

    } catch (error) {
      console.error('Error sending background email:', error);
    }
  };

  // Call the function to run it without waiting for it to finish.
  sendEmail();
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
