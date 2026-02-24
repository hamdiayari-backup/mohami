import { initDB, pool } from '../services/db.js';

async function migrate() {
  console.log('🚀 Starting database migration...\n');
  
  try {
    // Run the initialization/migration
    await initDB();
    
    // Verify all tables exist
    console.log('\n📊 Verifying tables...');
    const tables = ['users', 'cases', 'contracts', 'events', 'invoices'];
    
    for (const table of tables) {
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
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();


