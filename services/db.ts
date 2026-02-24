
import { Pool } from '@neondatabase/serverless';

// Neon Tech Database Connection String
const CONNECTION_STRING = process.env.DATABASE_URL || 
  'postgresql://neondb_owner:npg_KEsP4OGUo9DB@ep-royal-term-adwe3fhj-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

export const pool = new Pool({ 
  connectionString: CONNECTION_STRING,
  ssl: { rejectUnauthorized: false } // Required for Neon Tech
});

export const initDB = async () => {
  try {
    // Test connection first
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to Neon Tech database successfully');
    
    // Users Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        subscription_plan TEXT DEFAULT 'basic',
        avatar TEXT
      );
    `);

    // Cases Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cases (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        client_name TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        date_created TEXT NOT NULL,
        documents JSONB DEFAULT '[]',
        analysis TEXT,
        user_id TEXT,
        chat_history JSONB DEFAULT '[]'
      );
    `);

    // Contracts Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contracts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        parties TEXT NOT NULL,
        content TEXT NOT NULL,
        date_created TEXT NOT NULL,
        user_id TEXT
      );
    `);

    // Calendar Events Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT,
        type TEXT NOT NULL,
        description TEXT,
        user_id TEXT,
        case_id TEXT,
        reminder_sent BOOLEAN DEFAULT FALSE
      );
    `);
    
    // Add reminder_sent column if it doesn't exist
    try {
      await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE`);
    } catch (e) {
      // Column might already exist
    }

    // Invoices Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        status TEXT NOT NULL,
        plan_name TEXT NOT NULL,
        user_id TEXT,
        receipt_data TEXT
      );
    `);

    // Notifications Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        created_at TEXT NOT NULL,
        link TEXT,
        metadata JSONB DEFAULT '{}'
      );
    `);

    // Create index for faster queries
    try {
      await pool.query('CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read)');
    } catch (e) {
      // Index might already exist
    }

    // Chat Conversations Table
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

    // Chat Messages Table
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
        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
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
    
    // Create index for visitors
    try {
      await pool.query('CREATE INDEX IF NOT EXISTS idx_visitors_date ON platform_visitors(visit_date)');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_visitors_session ON platform_visitors(session_id)');
    } catch (e) {
      // Indexes might already exist
    }

    // Create indexes for chat tables
    try {
      await pool.query('CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id)');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_chat_conversations_status ON chat_conversations(status)');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id)');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at)');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status)');
    } catch (e) {
      // Indexes might already exist
    }

    // System Settings Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // Initialize default settings if not exist
    const settingsCheck = await pool.query("SELECT * FROM system_settings WHERE key = 'pricing'");
    if (settingsCheck.rows.length === 0) {
      await pool.query(
        `INSERT INTO system_settings (key, value, updated_at) VALUES ($1, $2, $3)`,
        ['pricing', JSON.stringify({ pro: 59, enterprise: 199 }), new Date().toISOString()]
      );
    }

    const limitsCheck = await pool.query("SELECT * FROM system_settings WHERE key = 'plan_limits'");
    if (limitsCheck.rows.length === 0) {
      await pool.query(
        `INSERT INTO system_settings (key, value, updated_at) VALUES ($1, $2, $3)`,
        ['plan_limits', JSON.stringify({ basic: { cases: 5, contracts: 2, maxFileSizeMB: 100 }, pro: { cases: 50, contracts: 100, maxFileSizeMB: 100 }, enterprise: { cases: 9999, contracts: 9999, maxFileSizeMB: 1024 } }), new Date().toISOString()]
      );
    }

    // Migrations
    try { await pool.query(`ALTER TABLE cases ADD COLUMN IF NOT EXISTS chat_history JSONB DEFAULT '[]'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE cases ADD COLUMN IF NOT EXISTS assigned_to_user_id TEXT`); } catch (e) {}
    try { await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS case_id TEXT`); } catch (e) {}
    try { await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS time TEXT`); } catch (e) {}
    
    // New Migrations for Payments
    try { await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS receipt_data TEXT`); } catch (e) {}

    // User IP binding for session security (prevent account sharing)
    try { await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS allowed_ip TEXT`); } catch (e) {}

    // Enterprise: organization owner (for team/office plans)
    try { await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_owner_id TEXT REFERENCES users(id)`); } catch (e) {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TEXT`); } catch (e) {}
    try { await pool.query(`ALTER TABLE platform_visitors ADD COLUMN IF NOT EXISTS country TEXT`); } catch (e) {}
    try { await pool.query(`ALTER TABLE cases ADD COLUMN IF NOT EXISTS created_by_user_id TEXT`); } catch (e) {}

    // Internal messages (chat between team members)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS internal_messages (
        id TEXT PRIMARY KEY,
        from_user_id TEXT NOT NULL,
        to_user_id TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE
      )
    `);
    try { await pool.query('CREATE INDEX IF NOT EXISTS idx_internal_messages_conversation ON internal_messages(from_user_id, to_user_id)'); } catch (e) {}

    // IP verification OTP (when user logs in from new IP)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ip_verification_otp (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        otp TEXT NOT NULL,
        new_ip TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
    try { await pool.query('CREATE INDEX IF NOT EXISTS idx_ip_otp_user ON ip_verification_otp(user_id)'); } catch (e) {}

    // Password reset OTP (forgot password flow)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_otp (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        otp TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
    try { await pool.query('CREATE INDEX IF NOT EXISTS idx_password_reset_otp_email ON password_reset_otp(email)'); } catch (e) {}

    // Signup email verification OTP
    await pool.query(`
      CREATE TABLE IF NOT EXISTS signup_email_otp (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        otp TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
    try { await pool.query('CREATE INDEX IF NOT EXISTS idx_signup_email_otp_email ON signup_email_otp(email)'); } catch (e) {}

    // Team invites (owner invites by email, invitee sets password via link)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS team_invites (
        id TEXT PRIMARY KEY,
        owner_id TEXT NOT NULL,
        email TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TEXT NOT NULL
      )
    `);
    try { await pool.query('CREATE INDEX IF NOT EXISTS idx_team_invites_token ON team_invites(token)'); } catch (e) {}
    try { await pool.query('CREATE INDEX IF NOT EXISTS idx_team_invites_owner ON team_invites(owner_id)'); } catch (e) {}

    // Team group chat (messages visible to all team members)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS team_chat_messages (
        id TEXT PRIMARY KEY,
        owner_id TEXT NOT NULL,
        from_user_id TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
    try { await pool.query('CREATE INDEX IF NOT EXISTS idx_team_chat_owner ON team_chat_messages(owner_id)'); } catch (e) {}

    // Create default admin if not exists
    const adminCheck = await pool.query("SELECT * FROM users WHERE email = 'admin@admin.com'");
    if (adminCheck.rows.length === 0) {
      await pool.query(`
        INSERT INTO users (id, email, name, password, role, subscription_plan)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, ['admin-1', 'admin@admin.com', 'Admin System', 'passpass', 'ADMIN', 'enterprise']);
      console.log('Default admin created');
    }

    console.log('✅ Database initialized successfully');
  } catch (err) {
    console.error('❌ Failed to initialize database:', err);
    if (err instanceof Error) {
      console.error('Error details:', err.message);
      console.error('Connection string:', CONNECTION_STRING.replace(/:[^:@]+@/, ':****@')); // Hide password in logs
    }
    throw err; // Re-throw to allow app to handle the error
  }
};
