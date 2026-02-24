require('./load-env.cjs');
const { pool } = require('../services/db.cjs');
const { emailService } = require('../services/emailService.cjs');

// Check for events that need reminders (1 hour before)
const checkAttendanceReminders = async () => {
  try {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    
    // Get events in the next hour that haven't been reminded
    const result = await pool.query(
      `SELECT e.*, u.email, u.name 
       FROM events e
       JOIN users u ON e.user_id = u.id
       WHERE e.date >= $1 
       AND e.date <= $2
       AND (e.reminder_sent IS NULL OR e.reminder_sent = FALSE)
       AND e.time IS NOT NULL`,
      [now.toISOString(), oneHourLater.toISOString()]
    );

    for (const event of result.rows) {
      const eventDate = new Date(event.date);
      const eventTime = event.time;
      
      // Parse time and check if it's within 1 hour
      const [hours, minutes] = eventTime.split(':');
      const eventDateTime = new Date(eventDate);
      eventDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const timeDiff = eventDateTime.getTime() - now.getTime();
      const hoursUntil = timeDiff / (1000 * 60 * 60);
      
      if (hoursUntil > 0 && hoursUntil <= 1) {
        // Send reminder email
        try {
          await emailService.sendAttendanceReminderEmail(
            event.email,
            event.name,
            event.title,
            event.date,
            event.time
          );
          
          // Mark as reminded
          await pool.query(
            `UPDATE events SET reminder_sent = TRUE WHERE id = $1`,
            [event.id]
          );
          
          console.log(`✅ Reminder sent for event: ${event.title} to ${event.email}`);
        } catch (error) {
          console.error(`❌ Failed to send reminder for event ${event.id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error checking attendance reminders:', error);
  }
};

// Run every 5 minutes
setInterval(checkAttendanceReminders, 5 * 60 * 1000);

// Run immediately on start
checkAttendanceReminders();

console.log('✅ Attendance reminder service started - checking every 5 minutes');

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down attendance reminder service...');
  process.exit(0);
});

module.exports = { checkAttendanceReminders };
