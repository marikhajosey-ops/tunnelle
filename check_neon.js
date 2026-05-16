const { neon } = require('@neondatabase/serverless');

const url = "postgresql://neondb_owner:npg_2udzYD8xKeXR@ep-calm-art-amez82zx-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = neon(url);

async function check() {
  try {
    console.log('Checking database at hardcoded URL...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('Tables found:', tables.map(t => t.table_name).join(', '));

    if (tables.some(t => t.table_name === 'providers')) {
      const providers = await sql`SELECT * FROM providers`;
      console.log(`Found ${providers.length} providers:`);
      console.table(providers.map(p => ({ id: p.id, name: p.name, url: p.base_url || p.baseUrl })));
    }

    if (tables.some(t => t.table_name === 'users')) {
      const users = await sql`SELECT COUNT(*) as count FROM users`;
      console.log(`Found ${users[0].count} users.`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

check();
