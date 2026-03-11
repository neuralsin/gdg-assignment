const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "notes.db");

const db = new sqlite3.Database(dbPath, function (err) {
  if (err) {
    console.error("Could not open database:", err.message);
    process.exit(1);
  }
  console.log("Connected to SQLite database.");
});

db.serialize(function () {
  db.run("PRAGMA journal_mode = WAL;");

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
});

function dbGet(sql, params) {
  return new Promise(function (resolve, reject) {
    db.get(sql, params || [], function (err, row) {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function dbAll(sql, params) {
  return new Promise(function (resolve, reject) {
    db.all(sql, params || [], function (err, rows) {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function dbRun(sql, params) {
  return new Promise(function (resolve, reject) {
    db.run(sql, params || [], function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

module.exports = { dbGet, dbAll, dbRun };
