import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
  console.warn('DATABASE_URL is missing! Database features will not work.');
}

const sql = neon(process.env.DATABASE_URL || 'postgres://localhost/placeholder');
export const db = drizzle(sql, { schema });
