require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sendConfirmationEmail } = require('./emailService'); // Import the new service

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
  res.status(200).send('Email server is running and ready.');
});

// This route now responds instantly.
app.post('/send-confirmation', (req, res) => {
  const { teamName, leaderEmail } = req.body;

  if (!teamName || !leaderEmail) {
    return res.status(400).json({ success: false, message: 'Missing fields.' });
  }

  // 1. Respond immediately to the frontend.
  res.status(200).json({ success: true, message: 'Submission received. Confirmation email is being sent.' });

  // 2. Send the email in the background without making the user wait.
  sendConfirmationEmail(teamName, leaderEmail);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
