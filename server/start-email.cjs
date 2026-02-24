// Initialize database first
const { initDB } = require('../services/db.cjs');

async function startEmailServer() {
  try {
    // Initialize database
    await initDB();
    console.log('✅ Database initialized for email server');
    
    // Start email server
    require('./email-server.cjs');
  } catch (error) {
    console.error('❌ Failed to start email server:', error);
    process.exit(1);
  }
}

startEmailServer();
