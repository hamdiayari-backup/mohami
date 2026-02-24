// Update user password
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';

if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = ws;
}

const CONNECTION_STRING = process.env.DATABASE_URL || 
  'postgresql://neondb_owner:npg_KEsP4OGUo9DB@ep-royal-term-adwe3fhj-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({ 
  connectionString: CONNECTION_STRING,
  ssl: { rejectUnauthorized: false }
});

async function updatePassword() {
  try {
    const email = 'raed@live.fr';
    const newPassword = 'passpass90';
    
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE email = $2',
      [newPassword, email]
    );
    
    console.log(`✅ Password updated for ${email}`);
    
    // Verify
    const verify = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (verify.rows.length > 0) {
      console.log(`✅ Verified: Password is now "${verify.rows[0].password}"`);
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

updatePassword();


