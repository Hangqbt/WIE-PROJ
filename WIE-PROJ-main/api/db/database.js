const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// The SQLite file lives inside api/db/ so it stays with the backend,
// per the project structure in README.md (api/ <- Backend & Database files)
const DB_PATH = path.join(__dirname, 'app.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Run schema.sql on every boot. All statements use CREATE TABLE IF NOT EXISTS,
// so this is safe to re-run and requires no separate migration step.
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
db.exec(schema);

module.exports = db;
