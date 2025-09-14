const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db', (err) => {
  if (err) console.error('Database connection error:', err);
  else console.log('Connected to SQLite database');
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password_hash TEXT,
      verified BOOLEAN DEFAULT FALSE
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      buildingNumber TEXT,
      city TEXT,
      country TEXT,
      latitude REAL,
      longitude REAL,
      price REAL,
      type TEXT,
      ownerId INTEGER,
      image TEXT,
      approved BOOLEAN DEFAULT FALSE
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS interests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      propertyId INTEGER
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fromUserId INTEGER,
      toUserId INTEGER,
      content TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS meetings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId1 INTEGER,
      userId2 INTEGER,
      date DATETIME,
      notes TEXT
    )
  `);

  // Seed mock properties if empty
  db.get('SELECT COUNT(*) as count FROM properties', (err, row) => {
    if (err) console.error('Seed error:', err);
    if (row.count === 0) {
      const stmt = db.prepare('INSERT INTO properties (name, buildingNumber, city, country, latitude, longitude, price, type, ownerId, image, approved) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      for (let i = 1; i <= 10; i++) {
        stmt.run(`Property ${i}`, `Num ${i}`, `City ${i}`, 'USA', 40 + i/10, -74 + i/10, Math.random() * 1000000, i % 2 === 0 ? 'rent' : 'sale', 1, `https://picsum.photos/seed/${i}/1736/389`, true);
      }
      stmt.finalize();
    }
  });
});

module.exports = db;
