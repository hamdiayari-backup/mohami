// Load environment variables first
require('./load-env.cjs');

// Initialize database first
// Note: We need to use the db.cjs file which has initDB
const { initDB } = require('../services/db.cjs');

async function startWebSocketServer() {
  try {
    // Initialize database
    await initDB();
    console.log('✅ Database initialized');
    
    // Start WebSocket server
    require('./websocket-server.cjs');
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startWebSocketServer();
