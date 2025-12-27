// Script to verify schema has been created
// Run: node scripts/verify-schema.js

require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function verifySchema() {
  console.log('🔍 Verifying database schema...\n');
  
  try {
    // Check enum type
    console.log('1. Checking enum type...');
    const enumCheck = await sql`
      SELECT EXISTS (
        SELECT FROM pg_type 
        WHERE typname = 'insurance_type_enum'
      );
    `;
    
    if (enumCheck.rows[0].exists) {
      console.log('   ✅ Enum type "insurance_type_enum" exists');
      
      // Show enum values
      const enumValues = await sql`
        SELECT enumlabel 
        FROM pg_enum 
        WHERE enumtypid = (
          SELECT oid FROM pg_type WHERE typname = 'insurance_type_enum'
        )
        ORDER BY enumsortorder;
      `;
      console.log(`   Values: ${enumValues.rows.map(r => r.enumlabel).join(', ')}\n`);
    } else {
      console.log('   ❌ Enum type "insurance_type_enum" does NOT exist\n');
    }
    
    // Check table
    console.log('2. Checking table...');
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'insurances'
      );
    `;
    
    if (tableCheck.rows[0].exists) {
      console.log('   ✅ Table "insurances" exists');
      
      // Check columns
      const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'insurances'
        ORDER BY ordinal_position;
      `;
      console.log('   Columns:');
      columns.rows.forEach(col => {
        console.log(`     - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
      console.log('');
    } else {
      console.log('   ❌ Table "insurances" does NOT exist\n');
    }
    
    // Check indexes
    console.log('3. Checking indexes...');
    const indexes = await sql`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'insurances';
    `;
    
    if (indexes.rows.length > 0) {
      console.log('   ✅ Found indexes:');
      indexes.rows.forEach(idx => {
        console.log(`     - ${idx.indexname}`);
      });
      console.log('');
    } else {
      console.log('   ⚠️  No indexes found\n');
    }
    
    // Count records
    console.log('4. Checking records...');
    try {
      const count = await sql`SELECT COUNT(*) as count FROM insurances`;
      console.log(`   ✅ Current records: ${count.rows[0].count}\n`);
    } catch (e) {
      console.log('   ❌ Cannot count records (table might not exist)\n');
    }
    
    // Final summary
    if (enumCheck.rows[0].exists && tableCheck.rows[0].exists) {
      console.log('✅ Schema is properly set up! You can now create insurances.\n');
    } else {
      console.log('❌ Schema is NOT complete. Please run schema.sql again.\n');
      console.log('📝 Steps:');
      console.log('   1. Go to Neon Console: https://console.neon.tech');
      console.log('   2. Open SQL Editor');
      console.log('   3. Copy and paste content from schema.sql');
      console.log('   4. Run the query\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n📝 Make sure:');
    console.error('   1. POSTGRES_URL is set in .env.local');
    console.error('   2. Database is accessible');
    console.error('   3. Network connection is stable\n');
    process.exit(1);
  }
}

verifySchema();

