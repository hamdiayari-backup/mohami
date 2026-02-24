// Initialize database first
const { initDB } = require('../services/db.cjs');

async function startReminderService() {
  try {
    // Initialize database
    await initDB();
    console.log('✅ Database initialized for reminder service');
    
    // Start reminder service
    require('./attendance-reminder.cjs');
  } catch (error) {
    console.error('❌ Failed to start reminder service:', error);
    process.exit(1);
  }
}

startReminderService();
