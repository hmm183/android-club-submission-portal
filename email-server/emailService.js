require('dotenv').config();
const nodemailer = require('nodemailer');

/**
 * Sends a submission confirmation email.
 * This function creates a new connection for every email to ensure reliability.
 * @param {string} teamName - The name of the team.
 * @param {string} leaderEmail - The team leader's email address.
 */
async function sendConfirmationEmail(teamName, leaderEmail) {
  try {
    // Creates a fresh, reliable connection every time to prevent timeouts.
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Your 16-character Google App Password
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
    console.log(`Confirmation email sent to ${leaderEmail}`);

  } catch (error) {
    console.error(`Failed to send email to ${leaderEmail}:`, error);
  }
}

module.exports = { sendConfirmationEmail };
