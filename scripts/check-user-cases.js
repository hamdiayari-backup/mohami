#!/usr/bin/env node
/**
 * Check user cases and AI responses by email
 * Usage: node scripts/check-user-cases.js [email]
 */

import 'dotenv/config';
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

async function check(email) {
  console.log('🔍 Checking cases for:', email, '\n');

  try {
    const userRes = await pool.query(
      'SELECT id, email, name, subscription_plan FROM users WHERE email = $1',
      [email]
    );
    if (userRes.rows.length === 0) {
      console.log('❌ No user found with this email.');
      return;
    }
    const user = userRes.rows[0];
    console.log('👤 User:');
    console.log('   id:', user.id);
    console.log('   email:', user.email);
    console.log('   name:', user.name);
    console.log('   plan:', user.subscription_plan);
    console.log('');

    const casesRes = await pool.query(
      'SELECT id, title, client_name, type, status, date_created, analysis, chat_history, documents FROM cases WHERE user_id = $1 ORDER BY date_created DESC',
      [user.id]
    );

    if (casesRes.rows.length === 0) {
      console.log('📁 No cases created by this user.');
      return;
    }

    console.log('📁 Cases created:', casesRes.rows.length, '\n');
    for (const c of casesRes.rows) {
      console.log('─'.repeat(60));
      console.log('📄 Case:', c.title);
      console.log('   ID:', c.id);
      console.log('   Client:', c.client_name);
      console.log('   Type:', c.type);
      console.log('   Status:', c.status);
      console.log('   Created:', c.date_created);
      console.log('   Documents:', Array.isArray(c.documents) ? c.documents.length : 0);
      console.log('');

      if (c.analysis) {
        console.log('   🤖 AI Analysis (تقرير التحليل):');
        console.log('   ' + '-'.repeat(50));
        const lines = (c.analysis || '').split('\n').slice(0, 30);
        lines.forEach(l => console.log('   ' + l));
        if ((c.analysis || '').split('\n').length > 30) {
          console.log('   ... (truncated)');
        }
        console.log('');
      } else {
        console.log('   🤖 AI Analysis: (none)\n');
      }

      const chat = c.chat_history;
      const history = Array.isArray(chat) ? chat : (typeof chat === 'string' ? JSON.parse(chat || '[]') : []);
      if (history.length > 0) {
        console.log('   💬 AI Chat history:');
        console.log('   ' + '-'.repeat(50));
        history.forEach((msg, i) => {
          const role = msg.role === 'user' ? '👤 User' : '🤖 AI';
          const text = (msg.text || msg.content || '').slice(0, 200);
          console.log(`   [${i + 1}] ${role}: ${text}${(msg.text || msg.content || '').length > 200 ? '...' : ''}`);
        });
        console.log('');
      } else {
        console.log('   💬 AI Chat: (none)\n');
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

const email = process.argv[2] || 'bb9597892@gmail.com';
check(email);
