#!/usr/bin/env node
/**
 * Nouvelles migrations - IP security, Enterprise team, OTP
 * Exécuter : npm run migrate:new
 * ou : node scripts/migrate-new.js
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

async function migrateNew() {
  console.log('🚀 Exécution des nouvelles migrations...\n');

  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Connexion à la base de données OK\n');

    // 1. users.allowed_ip - sécurité par IP
    console.log('1. Migration: users.allowed_ip');
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS allowed_ip TEXT`);
    console.log('   ✅ allowed_ip ajouté\n');

    // 2. users.organization_owner_id - plan Enterprise / équipe
    console.log('2. Migration: users.organization_owner_id');
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_owner_id TEXT`);
    console.log('   ✅ organization_owner_id ajouté\n');

    // 3. Table internal_messages - chat entre membres d'équipe
    console.log('3. Migration: table internal_messages');
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
    try {
      await pool.query('CREATE INDEX IF NOT EXISTS idx_internal_messages_conversation ON internal_messages(from_user_id, to_user_id)');
    } catch (e) {}
    console.log('   ✅ internal_messages créée\n');

    // 4. Table team_invites - invitations équipe
    console.log('4. Migration: table team_invites');
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
    console.log('   ✅ team_invites créée\n');

    // 5. Table team_chat_messages - messages groupe équipe
    console.log('5. Migration: table team_chat_messages');
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
    console.log('   ✅ team_chat_messages créée\n');

    // 6. Table ip_verification_otp - OTP pour vérification IP
    console.log('6. Migration: table ip_verification_otp');
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
    try {
      await pool.query('CREATE INDEX IF NOT EXISTS idx_ip_otp_user ON ip_verification_otp(user_id)');
    } catch (e) {}
    console.log('   ✅ ip_verification_otp créée\n');

    // 7. cases.assigned_to_user_id - affectation affaires pour plan المكتب
    console.log('7. Migration: cases.assigned_to_user_id');
    await pool.query(`ALTER TABLE cases ADD COLUMN IF NOT EXISTS assigned_to_user_id TEXT`);
    console.log('   ✅ assigned_to_user_id ajouté\n');

    // 8. users.created_at, platform_visitors.country - KPIs
    console.log('8. Migration: users.created_at, platform_visitors.country');
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TEXT`);
    await pool.query(`ALTER TABLE platform_visitors ADD COLUMN IF NOT EXISTS country TEXT`);
    console.log('   ✅ created_at, country ajoutés\n');

    console.log('✅ Toutes les migrations ont été appliquées avec succès !');
  } catch (error) {
    console.error('\n❌ Erreur de migration:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
    }
    process.exit(1);
  } finally {
    try {
      await pool.end();
    } catch (e) {}
  }
}

migrateNew();
