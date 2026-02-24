#!/usr/bin/env node
/**
 * Vérifier les utilisateurs associés à un email (owner المكتب)
 * Usage: node scripts/check-team.js
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

async function check() {
  const email = 'hamdi-ayari.ext@prestashop.com';
  console.log('🔍 Recherche utilisateurs associés à:', email, '\n');

  try {
    const owner = await pool.query(
      'SELECT id, email, name, subscription_plan, organization_owner_id FROM users WHERE email = $1',
      [email]
    );
    if (owner.rows.length === 0) {
      console.log('❌ Aucun utilisateur trouvé avec cet email.');
      return;
    }
    const o = owner.rows[0];
    console.log('📌 Propriétaire (hamdi):');
    console.log('   id:', o.id);
    console.log('   email:', o.email);
    console.log('   name:', o.name);
    console.log('   plan:', o.subscription_plan);
    console.log('   organization_owner_id:', o.organization_owner_id);
    console.log('');

    const ownerId = o.id;

    const members = await pool.query(
      'SELECT id, email, name, subscription_plan, organization_owner_id FROM users WHERE organization_owner_id = $1',
      [ownerId]
    );
    console.log('👥 Membres d\'équipe (organization_owner_id =', ownerId + '):');
    if (members.rows.length === 0) {
      console.log('   Aucun membre trouvé.');
    } else {
      members.rows.forEach((r, i) => {
        console.log('   ', i + 1, '-', r.email, '|', r.name, '| id:', r.id);
      });
    }
    console.log('');

    const invites = await pool.query(
      'SELECT id, email, status, created_at, expires_at FROM team_invites WHERE owner_id = $1',
      [ownerId]
    );
    console.log('📧 Invitations (team_invites où owner_id =', ownerId + '):');
    if (invites.rows.length === 0) {
      console.log('   Aucune invitation trouvée.');
    } else {
      invites.rows.forEach((r) => {
        console.log('   -', r.email, '| status:', r.status, '| créée:', r.created_at);
      });
    }
    console.log('');

    const byOwnerId = await pool.query(
      'SELECT id, email, name FROM users WHERE id = $1 OR organization_owner_id = $1',
      [ownerId, ownerId]
    );
    console.log('📊 Requête getTeamMembers (id OU organization_owner_id =', ownerId + '):', byOwnerId.rows.length, 'résultats');
    byOwnerId.rows.forEach((r) => console.log('   -', r.email, r.name));

    const amine = await pool.query(
      'SELECT id, email, name, organization_owner_id, subscription_plan FROM users WHERE email ILIKE $1',
      ['%amine%']
    );
    console.log('\n🔎 Utilisateurs avec "amine" dans l\'email:');
    if (amine.rows.length === 0) {
      console.log('   Aucun.');
    } else {
      amine.rows.forEach((r) => {
        console.log('   -', r.email, '| org_owner:', r.organization_owner_id, '| plan:', r.subscription_plan);
      });
    }
  } catch (err) {
    console.error('Erreur:', err.message);
  } finally {
    await pool.end();
  }
}

check();
