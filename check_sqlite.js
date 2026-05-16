const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.resolve(__dirname, 'sqlite.db');

try {
  console.log(`Checking ${dbPath}...`);
  const db = new DatabaseSync(dbPath);

  // Check tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables found in SQLite:', tables.map(t => t.name).join(', '));

  if (tables.some(t => t.name === 'providers')) {
    const providers = db.prepare("SELECT * FROM providers").all();
    console.log(`Found ${providers.length} providers in SQLite:`);
    console.table(providers.map(p => ({ id: p.id, name: p.name, url: p.base_url || p.baseUrl })));
  } else {
    console.log('No "providers" table found in SQLite.');
  }

  if (tables.some(t => t.name === 'users')) {
    const usersCount = db.prepare("SELECT COUNT(*) as count FROM users").all()[0].count;
    console.log(`Found ${usersCount} users in SQLite.`);
  }

} catch (error) {
  console.error('Error reading SQLite database:', error.message);
  if (error.message.includes('DatabaseSync is not a constructor')) {
    console.log('Note: Built-in node:sqlite requires Node 22.5+. Your version is ' + process.version);
  }
}
