const { Pool } = require('@neondatabase/serverless');
const ws = require('ws');

// Set WebSocket for Neon serverless driver (required for Node.js)
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = ws;
}

// Neon Tech Database Connection String
const CONNECTION_STRING = process.env.DATABASE_URL || 
  'postgresql://neondb_owner:npg_KEsP4OGUo9DB@ep-royal-term-adwe3fhj-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({ 
  connectionString: CONNECTION_STRING,
  ssl: { rejectUnauthorized: false }, // Required for Neon Tech
  webSocketConstructor: ws // Provide WebSocket constructor for Neon
});

// Export initDB function (simplified version for WebSocket server)
const initDB = async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection verified');
    
    // Create chat tables if they don't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        user_name TEXT,
        user_email TEXT,
        status TEXT DEFAULT 'active',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_message_at TEXT
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        sender_type TEXT NOT NULL,
        sender_id TEXT,
        sender_name TEXT,
        message TEXT NOT NULL,
        created_at TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        attachments JSONB DEFAULT '[]'
      );
    `);
    
    // Email Queue Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_queue (
        id TEXT PRIMARY KEY,
        to_email TEXT NOT NULL,
        subject TEXT NOT NULL,
        html_content TEXT NOT NULL,
        text_content TEXT,
        status TEXT DEFAULT 'pending',
        created_at TEXT NOT NULL,
        sent_at TEXT,
        error_message TEXT
      );
    `);

    // Platform Visitors Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS platform_visitors (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        page_visited TEXT,
        visit_date TEXT NOT NULL,
        is_unique BOOLEAN DEFAULT TRUE,
        created_at TEXT NOT NULL
      );
    `);
    
    // Add columns if they don't exist (migrations)
    try {
      await pool.query(`ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'`);
      await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE`);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS password_reset_otp (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          otp TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          created_at TEXT NOT NULL
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS signup_email_otp (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          otp TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          created_at TEXT NOT NULL
        )
      `);
      await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS time TEXT`);
      await pool.query('CREATE INDEX IF NOT EXISTS idx_visitors_date ON platform_visitors(visit_date)');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_visitors_session ON platform_visitors(session_id)');
    } catch (e) {
      // Columns might already exist
    }
  } catch (err) {
    console.error('❌ Database initialization error:', err);
    throw err;
  }
};

module.exports = { pool, initDB };
