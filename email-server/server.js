require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 10000;

// Middleware to parse JSON bodies
app.use(express.json());

// CORS configuration to allow requests ONLY from your frontend
const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Health check route to see if the server is running
app.get('/', (req, res) => {
  res.status(200).send('Email server is running.');
});

// The API endpoint that receives data from your frontend and sends the email
app.post('/send-confirmation', async (req, res) => {
  const { teamName, leaderEmail } = req.body;

  // Basic validation
  if (!teamName || !leaderEmail) {
    return res.status(400).json({ success: false, message: 'Missing teamName or leaderEmail.' });
  }

  // **THE FIX:** The transporter is created inside the handler.
  // This creates a fresh connection for every request, preventing timeouts.
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

  try {
    // Attempt to send the email
    await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent to ${leaderEmail}`);
    res.status(200).json({ success: true, message: 'Confirmation email sent successfully.' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, message: 'Failed to send confirmation email.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
