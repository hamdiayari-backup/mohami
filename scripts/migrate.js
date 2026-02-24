// Database Migration Script
// Run with: npm run migrate

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import db module
const dbModule = await import(join(__dirname, '../services/db.ts') + '?t=' + Date.now()).catch(() => 
  import(join(__dirname, '../services/db.js'))
);

const { initDB, pool } = dbModule;

async function migrate() {
  console.log('🚀 Starting database migration...\n');
  
  try {
    // Run the initialization/migration
    await initDB();
    
    // Verify all tables exist
    console.log('\n📊 Verifying tables...');
    const tables = ['users', 'cases', 'contracts', 'events', 'invoices'];
    
    for (const table of tables) {
      try {
        const result = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `, [table]);
        
        if (result.rows[0].exists) {
          console.log(`  ✅ Table '${table}' exists`);
        } else {
          console.log(`  ❌ Table '${table}' is missing`);
        }
      } catch (e) {
        console.log(`  ⚠️  Could not check table '${table}':`, e.message);
      }
    }
    
    // Check table row counts
    console.log('\n📈 Table statistics:');
    for (const table of tables) {
      try {
        const count = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`  ${table}: ${count.rows[0].count} rows`);
      } catch (e) {
        console.log(`  ${table}: Error counting rows`);
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    try {
      await pool.end();
    } catch (e) {
      // Ignore errors when closing pool
    }
  }
}

migrate();

