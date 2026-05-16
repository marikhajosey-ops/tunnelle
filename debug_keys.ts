import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const url = "postgresql://neondb_owner:npg_SN2akjed3frF@ep-noisy-king-apqn65v9-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = neon(url);

async function debugKeys() {
  try {
    console.log('Fetching provider keys (masked)...');
    const result = await sql`SELECT id, name, tunelle_key FROM providers`;
    result.forEach(p => {
      const key = p.tunelle_key || 'NULL';
      console.log(`Provider: ${p.name} | Key: ${key.substring(0, 15)}... (Length: ${key.length})`);
    });
  } catch (e) {
    console.error('Debug failed:', e);
  } finally {
    process.exit(0);
  }
}

debugKeys();
