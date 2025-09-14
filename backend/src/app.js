const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

let db;
try {
  db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
      console.error('Database connection error (expected on Vercel):', err);
      // Continue without crashing
    } else {
      console.log('Connected to SQLite database');
    }
  });
} catch (err) {
  console.error('Failed to initialize database (expected on Vercel):', err);
  db = null; // Set db to null to skip database operations
}

// Database initialization (skipped if db is null)
if (db) {
  db.serialize(() => {
    db.run(
      'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE, password TEXT, verified INTEGER DEFAULT 0, resetToken TEXT, resetTokenExpiry INTEGER)',
      (err) => {
        if (err) console.error('Error creating users table:', err);
        else console.log('Users table created or already exists');
      }
    );

    db.get('SELECT email FROM users WHERE email = ?', ['test@example.com'], (err, row) => {
      if (err) console.error('Error checking default user:', err);
      if (!row) {
        const hashedPassword = bcrypt.hashSync('test123', 10);
        db.run(
          'INSERT INTO users (email, password, verified) VALUES (?, ?, ?)',
          ['test@example.com', hashedPassword, 1],
          (err) => {
            if (err) console.error('Error inserting default user:', err);
            else console.log('Default user created: test@example.com');
          }
        );
      }
    });

    db.run(
      `CREATE TABLE IF NOT EXISTS properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        title TEXT,
        city TEXT,
        type TEXT,
        price REAL,
        latitude REAL,
        longitude REAL,
        FOREIGN KEY (userId) REFERENCES users(id)
      )`,
      (err) => {
        if (err) console.error('Error creating properties table:', err);
        else console.log('Properties table created or already exists');
      }
    );

    db.run(
      `CREATE TABLE IF NOT EXISTS interests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        propertyId INTEGER,
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (propertyId) REFERENCES properties(id)
      )`,
      (err) => {
        if (err) console.error('Error creating interests table:', err);
        else console.log('Interests table created or already exists');
      }
    );

    db.run(
      `CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fromUserId INTEGER,
        toUserId INTEGER,
        content TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (fromUserId) REFERENCES users(id),
        FOREIGN KEY (toUserId) REFERENCES users(id)
      )`,
      (err) => {
        if (err) console.error('Error creating messages table:', err);
        else console.log('Messages table created or already exists');
      }
    );

    db.run(
      `CREATE TABLE IF NOT EXISTS meetings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        propertyId INTEGER,
        date TEXT,
        notes TEXT,
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (propertyId) REFERENCES properties(id)
      )`,
      (err) => {
        if (err) console.error('Error creating meetings table:', err);
        else console.log('Meetings table created or already exists');
      }
    );
  });
} else {
  console.warn('Skipping database initialization due to Vercel filesystem limitations');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(401).json({ msg: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// OTP Signup Routes
app.post('/auth/send-signup-otp', async (req, res) => {
  const { email } = req.body;
  if (!db) {
    return res.status(503).json({ msg: 'Database unavailable on Vercel (use MySQL for production)' });
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  db.run('INSERT OR REPLACE INTO users (email, verified, password) VALUES (?, 0, ?)', [email, otp], (err) => {
    if (err) return res.status(500).json({ msg: 'Error storing OTP' });
    transporter.sendMail(
      {
        from: process.env.GMAIL_USER,
        to: email,
        subject: 'Your Signup OTP',
        text: `Your OTP is ${otp}`,
      },
      (err) => {
        if (err) {
          console.error('Error sending OTP email:', err);
          return res.status(500).json({ msg: 'Error sending OTP' });
        }
        res.json({ msg: 'OTP sent' });
      }
    );
  });
});

app.post('/auth/verify-otp', (req, res) => {
  if (!db) {
    return res.status(503).json({ msg: 'Database unavailable on Vercel (use MySQL for production)' });
  }
  const { email, otp } = req.body;
  db.get('SELECT password FROM users WHERE email = ?', [email], (err, row) => {
    if (err || !row || row.password !== otp) return res.status(400).json({ msg: 'Invalid OTP' });
    db.run('UPDATE users SET verified = 1 WHERE email = ?', [email], (err) => {
      if (err) return res.status(500).json({ msg: 'Error verifying OTP' });
      res.json({ msg: 'OTP verified' });
    });
  });
});

app.post('/auth/set-password', async (req, res) => {
  if (!db) {
    return res.status(503).json({ msg: 'Database unavailable on Vercel (use MySQL for production)' });
  }
  const { email, password } = req.body;
  db.get('SELECT verified FROM users WHERE email = ?', [email], async (err, row) => {
    if (err || !row || !row.verified) return res.status(400).json({ msg: 'User not verified' });
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email], (err) => {
      if (err) return res.status(500).json({ msg: 'Error setting password' });
      res.json({ msg: 'Password set' });
    });
  });
});

// Login Route
app.post('/auth/login', async (req, res) => {
  if (!db) {
    return res.status(503).json({ msg: 'Database unavailable on Vercel (use MySQL for production)' });
  }
  const { email, password } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ msg: 'Server error' });
    if (!user || !user.verified) return res.status(400).json({ msg: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  });
});

// Password Reset Routes
app.post('/auth/forgot-password', async (req, res) => {
  if (!db) {
    return res.status(503).json({ msg: 'Database unavailable on Vercel (use MySQL for production)' });
  }
  const { email } = req.body;
  db.get('SELECT id FROM users WHERE email = ?', [email], async (err, user) => {
    if (err || !user) return res.status(400).json({ msg: 'User not found' });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    db.run('UPDATE users SET password = ? WHERE email = ?', [otp, email], (err) => {
      if (err) return res.status(500).json({ msg: 'Error storing OTP' });
      transporter.sendMail(
        {
          from: process.env.GMAIL_USER,
          to: email,
          subject: 'Password Reset OTP',
          text: `Your OTP is ${otp}`,
        },
        (err) => {
          if (err) {
            console.error('Error sending OTP email:', err);
            return res.status(500).json({ msg: 'Error sending OTP' });
          }
          res.json({ msg: 'OTP sent' });
        }
      );
    });
  });
});

app.post('/auth/reset-password', async (req, res) => {
  if (!db) {
    return res.status(503).json({ msg: 'Database unavailable on Vercel (use MySQL for production)' });
  }
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  db.run('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email], (err) => {
    if (err) return res.status(400).json({ msg: 'Error resetting password' });
    res.json({ msg: 'Password reset successful' });
  });
});

// Profile Routes
app.get('/users/profile', authenticateToken, (req, res) => {
  if (!db) {
    return res.status(503).json({ msg: 'Database unavailable on Vercel (use MySQL for production)' });
  }
  db.get('SELECT email FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err || !user) return res.status(400).json({ msg: 'User not found' });
    res.json(user);
  });
});

app.post('/profile/send-details', authenticateToken, (req, res) => {
  const { interest, meetingDate } = req.body;
  if (!interest || !meetingDate) {
    return res.status(400).json({ msg: 'Interest and meeting date are required' });
  }
  transporter.sendMail(
    {
      from: process.env.GMAIL_USER,
      to: req.user.email,
      subject: 'Your Profile Details',
      text: `Interest: ${interest}\nMeeting Date: ${meetingDate}`,
    },
    (err) => {
      if (err) {
        console.error('Error sending email:', err);
        return res.status(500).json({ msg: 'Failed to send email' });
      }
      res.json({ msg: 'Details sent successfully' });
    }
  );
});

// Properties Routes
app.get('/properties', (req, res) => {
  if (!db) {
    return res.status(503).json({ msg: 'Database unavailable on Vercel (use MySQL for production)' });
  }
  db.all('SELECT * FROM properties', [], (err, properties) => {
    if (err) {
      console.error('Error fetching properties:', err);
      return res.status(500).json({ msg: 'Error fetching properties' });
    }
    console.log('Fetched properties:', properties.length);
    res.json(properties);
  });
});

app.get('/properties/search', (req, res) => {
  if (!db) {
    return res.status(503).json({ msg: 'Database unavailable on Vercel (use MySQL for production)' });
  }
  const { city, type, minPrice, maxPrice } = req.query;
  let query = 'SELECT * FROM properties WHERE 1=1';
  const params = [];
  if (city) {
    query += ' AND city LIKE ?';
    params.push(`%${city}%`);
  }
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  if (minPrice) {
    query += ' AND price >= ?';
    params.push(minPrice);
  }
  if (maxPrice) {
    query += ' AND price <= ?';
    params.push(maxPrice);
  }
  db.all(query, params, (err, properties) => {
    if (err) {
      console.error('Error searching properties:', err);
      return res.status(500).json({ msg: 'Error searching properties' });
    }
    console.log('Searched properties:', properties.length);
    res.json(properties);
  });
});

app.post('/properties', authenticateToken, (req, res) => {
  if (!db) {
    return res.status(503).json({ msg: 'Database unavailable on Vercel (use MySQL for production)' });
  }
  const { title, city, type, price, latitude, longitude } = req.body;
  db.run(
    'INSERT INTO properties (userId, title, city, type, price, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, title, city, type, price, latitude, longitude],
    function (err) {
      if (err) {
        console.error('Error adding property:', err);
        return res.status(500).json({ msg: 'Error adding property' });
      }
      res.json({ id: this.lastID });
    }
  );
});

app.post('/properties/interest', authenticateToken, (req, res) => {
  if (!db) {
    return res.status(503).json({ msg: 'Database unavailable on Vercel (use MySQL for production)' });
  }
  const { propertyId } = req.body;
  db.get('SELECT * FROM properties WHERE id = ?', [propertyId], (err, property) => {
    if (err) return res.status(500).json({ msg: 'Server error' });
    if (!property) return res.status(404).json({ msg: 'Property not found' });
    db.run(
      'INSERT INTO interests (userId, propertyId) VALUES (?, ?)',
      [req.user.id, propertyId],
      (err) => {
        if (err) return res.status(500).json({ msg: 'Error adding interest' });
        transporter.sendMail(
          {
            from: process.env.GMAIL_USER,
            to: req.user.email,
            subject: 'Interest Expressed in Property',
            text: `You have expressed interest in property: ${property.title}`,
          },
          (err) => {
            if (err) console.error('Error sending email:', err);
            res.json({ msg: 'Interest recorded, email sent' });
          }
        );
      }
    );
  });
});

app.get('/properties/interests', authenticateToken, (req, res) => {
  if (!db) {
    return res.status(503).json({ msg: 'Database unavailable on Vercel (use MySQL for production)' });
  }
  db.all(
    'SELECT p.* FROM interests i JOIN properties p ON i.propertyId = p.id WHERE i.userId = ?',
    [req.user.id],
    (err, properties) => {
      if (err) return res.status(500).json({ msg: 'Error fetching interests' });
      res.json(properties);
    }
  );
});

// Messages Routes
app.post('/messages', authenticateToken, (req, res) => {
  if (!db) {
    return res.status(503).json({ msg: 'Database unavailable on Vercel (use MySQL for production)' });
  }
  const { toUserId, content } = req.body;
  db.run(
    'INSERT INTO messages (fromUserId, toUserId, content) VALUES (?, ?, ?)',
    [req.user.id, toUserId, content],
    function (err) {
      if (err) return res.status(500).json({ msg: 'Error sending message' });
      res.json({ msg: 'Message sent' });
    }
  );
});

app.get('/messages/:withUserId', authenticateToken, (req, res) => {
  if (!db) {
    return res.status(503).json({ msg: 'Database unavailable on Vercel (use MySQL for production)' });
  }
  const { withUserId } = req.params;
  db.all(
    'SELECT * FROM messages WHERE (fromUserId = ? AND toUserId = ?) OR (fromUserId = ? AND toUserId = ?) ORDER BY timestamp',
    [req.user.id, withUserId, withUserId, req.user.id],
    (err, messages) => {
      if (err) return res.status(500).json({ msg: 'Error fetching messages' });
      res.json(messages);
    }
  );
});

// Meetings Routes
app.post('/messages/meeting', authenticateToken, (req, res) => {
  if (!db) {
    return res.status(503).json({ msg: 'Database unavailable on Vercel (use MySQL for production)' });
  }
  const { propertyId, date, notes } = req.body;
  db.run(
    'INSERT INTO meetings (userId, propertyId, date, notes) VALUES (?, ?, ?, ?)',
    [req.user.id, propertyId, date, notes],
    function (err) {
      if (err) return res.status(500).json({ msg: 'Error scheduling meeting' });
      res.json({ msg: 'Meeting scheduled' });
    }
  );
});

app.get('/messages/meetings', authenticateToken, (req, res) => {
  if (!db) {
    return res.status(503).json({ msg: 'Database unavailable on Vercel (use MySQL for production)' });
  }
  db.all(
    'SELECT m.*, p.title FROM meetings m JOIN properties p ON m.propertyId = p.id WHERE m.userId = ?',
    [req.user.id],
    (err, meetings) => {
      if (err) return res.status(500).json({ msg: 'Error fetching meetings' });
      res.json(meetings);
    }
  );
});

// Users Route
app.get('/users', (req, res) => {
  if (!db) {
    return res.status(503).json({ msg: 'Database unavailable on Vercel (use MySQL for production)' });
  }
  db.all('SELECT id, email FROM users', [], (err, users) => {
    if (err) return res.status(500).json({ msg: 'Error fetching users' });
    res.json(users);
  });
});

// Health check route to verify server is running
app.get('/health', (req, res) => {
  res.json({ status: 'Server running', database: db ? 'SQLite connected' : 'No database (Vercel limitation)' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
