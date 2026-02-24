const nodemailer = require('nodemailer');
require('./load-env.cjs');
const { pool } = require('../services/db.cjs');

// Create SMTP transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

// Process email queue
const processEmailQueue = async () => {
  try {
    const result = await pool.query(
      `SELECT * FROM email_queue WHERE status = 'pending' ORDER BY created_at ASC LIMIT 10`
    );

    if (result.rows.length === 0) return;

    const transporter = createTransporter();

    for (const email of result.rows) {
      try {
        await transporter.sendMail({
          from: `"${process.env.MAIL_FROM_NAME || 'Mouhami AI'}" <${process.env.MAIL_FROM_ADDRESS}>`,
          to: email.to_email,
          subject: email.subject,
          html: email.html_content,
          text: email.text_content || email.html_content.replace(/<[^>]*>/g, ''),
        });

        // Mark as sent
        await pool.query(
          `UPDATE email_queue SET status = 'sent', sent_at = $1 WHERE id = $2`,
          [new Date().toISOString(), email.id]
        );

        console.log(`✅ Email sent to ${email.to_email}`);
      } catch (error) {
        console.error(`❌ Failed to send email to ${email.to_email}:`, error.message);
        await pool.query(
          `UPDATE email_queue SET status = 'failed', error_message = $1 WHERE id = $2`,
          [error.message, email.id]
        );
      }
    }
  } catch (error) {
    console.error('❌ Error processing email queue:', error);
  }
};

// Process queue every 30 seconds
setInterval(processEmailQueue, 30000);

// Process immediately on start
processEmailQueue();

console.log('✅ Email server started - processing queue every 30 seconds');

// Keep server running
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down email server...');
  process.exit(0);
});

module.exports = { processEmailQueue, createTransporter };
