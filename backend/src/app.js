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

// Initialize SQLite database
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
    return;
  }
  console.log('Connected to SQLite database');
});

// Initialize database tables
const initDatabase = () => {
  db.serialize(() => {
    try {
      // Users table
      db.run(
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE,
          password TEXT,
          verified INTEGER DEFAULT 0,
          resetToken TEXT,
          resetTokenExpiry INTEGER
        )`,
        (err) => {
          if (err) console.error('Error creating users table:', err.message);
          else console.log('Users table created or already exists');
        }
      );

      // Insert default user (email: test@example.com, password: test123)
      db.get('SELECT email FROM users WHERE email = ?', ['test@example.com'], (err, row) => {
        if (err) {
          console.error('Error checking default user:', err.message);
          return;
        }
        if (!row) {
          const hashedPassword = bcrypt.hashSync('test123', 10);
          db.run(
            'INSERT INTO users (email, password, verified) VALUES (?, ?, ?)',
            ['test@example.com', hashedPassword, 1],
            (err) => {
              if (err) console.error('Error inserting default user:', err.message);
              else console.log('Default user created: test@example.com');
            }
          );
        }
      });

      // Properties table
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
          if (err) console.error('Error creating properties table:', err.message);
          else console.log('Properties table created or already exists');
        }
      );

      // Interests table
      db.run(
        `CREATE TABLE IF NOT EXISTS interests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER,
          propertyId INTEGER,
          FOREIGN KEY (userId) REFERENCES users(id),
          FOREIGN KEY (propertyId) REFERENCES properties(id)
        )`,
        (err) => {
          if (err) console.error('Error creating interests table:', err.message);
          else console.log('Interests table created or already exists');
        }
      );

      // Messages table
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
          if (err) console.error('Error creating messages table:', err.message);
          else console.log('Messages table created or already exists');
        }
      );

      // Meetings table
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
          if (err) console.error('Error creating meetings table:', err.message);
          else console.log('Meetings table created or already exists');
        }
      );
    } catch (error) {
      console.error('Error initializing database:', error.message);
    }
  });
};

// Initialize database on startup
initDatabase();

// Nodemailer setup
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
  if (!token) {
    console.log('No token provided for request:', req.url);
    return res.status(401).json({ msg: 'No token provided' });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Token verification failed:', err.message);
      return res.status(401).json({ msg: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running' });
});

// OTP Signup Routes
app.post('/auth/send-signup-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: 'Email is required' });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    db.run('INSERT OR REPLACE INTO users (email, verified, password) VALUES (?, 0, ?)', [email, otp], (err) => {
      if (err) {
        console.error('Error storing OTP:', err.message);
        return res.status(500).json({ msg: 'Error storing OTP' });
      }
      transporter.sendMail(
        {
          from: process.env.GMAIL_USER,
          to: email,
          subject: 'Your Signup OTP',
          text: `Your OTP is ${otp}`,
        },
        (err) => {
          if (err) {
            console.error('Error sending OTP email:', err.message);
            return res.status(500).json({ msg: 'Error sending OTP' });
          }
          res.json({ msg: 'OTP sent' });
        }
      );
    });
  } catch (error) {
    console.error('Error in /auth/send-signup-otp:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

app.post('/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ msg: 'Email and OTP are required' });
    db.get('SELECT password FROM users WHERE email = ?', [email], (err, row) => {
      if (err || !row || row.password !== otp) {
        console.log('Invalid OTP for email:', email);
        return res.status(400).json({ msg: 'Invalid OTP' });
      }
      db.run('UPDATE users SET verified = 1 WHERE email = ?', [email], (err) => {
        if (err) {
          console.error('Error verifying OTP:', err.message);
          return res.status(500).json({ msg: 'Error verifying OTP' });
        }
        res.json({ msg: 'OTP verified' });
      });
    });
  } catch (error) {
    console.error('Error in /auth/verify-otp:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

app.post('/auth/set-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ msg: 'Email and password are required' });
    db.get('SELECT verified FROM users WHERE email = ?', [email], async (err, row) => {
      if (err || !row || !row.verified) {
        console.log('User not verified or not found:', email);
        return res.status(400).json({ msg: 'User not verified' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      db.run('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email], (err) => {
        if (err) {
          console.error('Error setting password:', err.message);
          return res.status(500).json({ msg: 'Error setting password' });
        }
        res.json({ msg: 'Password set' });
      });
    });
  } catch (error) {
    console.error('Error in /auth/set-password:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Login Route
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ msg: 'Email and password are required' });
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        console.error('Database error during login:', err.message);
        return res.status(500).json({ msg: 'Server error' });
      }
      if (!user || !user.verified) return res.status(400).json({ msg: 'Invalid credentials' });
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });
      const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ token });
    });
  } catch (error) {
    console.error('Error in /auth/login:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Password Reset Routes
app.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: 'Email is required' });
    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, user) => {
      if (err || !user) return res.status(400).json({ msg: 'User not found' });
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      db.run('UPDATE users SET password = ? WHERE email = ?', [otp, email], (err) => {
        if (err) {
          console.error('Error storing OTP:', err.message);
          return res.status(500).json({ msg: 'Error storing OTP' });
        }
        transporter.sendMail(
          {
            from: process.env.GMAIL_USER,
            to: email,
            subject: 'Password Reset OTP',
            text: `Your OTP is ${otp}`,
          },
          (err) => {
            if (err) {
              console.error('Error sending OTP email:', err.message);
              return res.status(500).json({ msg: 'Error sending OTP' });
            }
            res.json({ msg: 'OTP sent' });
          }
        );
      });
    });
  } catch (error) {
    console.error('Error in /auth/forgot-password:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

app.post('/auth/reset-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ msg: 'Email and password are required' });
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email], (err) => {
      if (err) {
        console.error('Error resetting password:', err.message);
        return res.status(400).json({ msg: 'Error resetting password' });
      }
      res.json({ msg: 'Password reset successful' });
    });
  } catch (error) {
    console.error('Error in /auth/reset-password:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Profile Routes
app.get('/users/profile', authenticateToken, (req, res) => {
  try {
    db.get('SELECT email FROM users WHERE id = ?', [req.user.id], (err, user) => {
      if (err || !user) {
        console.error('User not found:', err ? err.message : 'No user');
        return res.status(400).json({ msg: 'User not found' });
      }
      res.json(user);
    });
  } catch (error) {
    console.error('Error in /users/profile:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

app.post('/profile/send-details', authenticateToken, async (req, res) => {
  try {
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
          console.error('Error sending email:', err.message);
          return res.status(500).json({ msg: 'Failed to send email' });
        }
        res.json({ msg: 'Details sent successfully' });
      }
    );
  } catch (error) {
    console.error('Error in /profile/send-details:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Properties Routes
app.get('/properties', (req, res) => {
  try {
    db.all('SELECT * FROM properties', [], (err, properties) => {
      if (err) {
        console.error('Error fetching properties:', err.message);
        return res.status(500).json({ msg: 'Error fetching properties' });
      }
      console.log('Fetched properties:', properties.length);
      res.json(properties);
    });
  } catch (error) {
    console.error('Error in /properties:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

app.get('/properties/search', (req, res) => {
  try {
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
        console.error('Error searching properties:', err.message);
        return res.status(500).json({ msg: 'Error searching properties' });
      }
      console.log('Searched properties:', properties.length);
      res.json(properties);
    });
  } catch (error) {
    console.error('Error in /properties/search:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

app.post('/properties', authenticateToken, async (req, res) => {
  try {
    const { title, city, type, price, latitude, longitude } = req.body;
    if (!title || !city || !type || !price || !latitude || !longitude) {
      return res.status(400).json({ msg: 'All fields are required' });
    }
    db.run(
      'INSERT INTO properties (userId, title, city, type, price, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, title, city, type, price, latitude, longitude],
      function (err) {
        if (err) {
          console.error('Error adding property:', err.message);
          return res.status(500).json({ msg: 'Error adding property' });
        }
        res.json({ id: this.lastID });
      }
    );
  } catch (error) {
    console.error('Error in /properties:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

app.post('/properties/interest', authenticateToken, async (req, res) => {
  try {
    const { propertyId } = req.body;
    if (!propertyId) return res.status(400).json({ msg: 'Property ID is required' });
    db.get('SELECT * FROM properties WHERE id = ?', [propertyId], (err, property) => {
      if (err) {
        console.error('Server error:', err.message);
        return res.status(500).json({ msg: 'Server error' });
      }
      if (!property) return res.status(404).json({ msg: 'Property not found' });
      db.run(
        'INSERT INTO interests (userId, propertyId) VALUES (?, ?)',
        [req.user.id, propertyId],
        (err) => {
          if (err) {
            console.error('Error adding interest:', err.message);
            return res.status(500).json({ msg: 'Error adding interest' });
          }
          transporter.sendMail(
            {
              from: process.env.GMAIL_USER,
              to: req.user.email,
              subject: 'Interest Expressed in Property',
              text: `You have expressed interest in property: ${property.title}`,
            },
            (err) => {
              if (err) console.error('Error sending email:', err.message);
              res.json({ msg: 'Interest recorded, email sent' });
            }
          );
        }
      );
    });
  } catch (error) {
    console.error('Error in /properties/interest:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

app.get('/properties/interests', authenticateToken, (req, res) => {
  try {
    db.all(
      'SELECT p.* FROM interests i JOIN properties p ON i.propertyId = p.id WHERE i.userId = ?',
      [req.user.id],
      (err, properties) => {
        if (err) {
          console.error('Error fetching interests:', err.message);
          return res.status(500).json({ msg: 'Error fetching interests' });
        }
        res.json(properties);
      }
    );
  } catch (error) {
    console.error('Error in /properties/interests:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Messages Routes
app.post('/messages', authenticateToken, async (req, res) => {
  try {
    const { toUserId, content } = req.body;
    if (!toUserId || !content) return res.status(400).json({ msg: 'To user ID and content are required' });
    db.run(
      'INSERT INTO messages (fromUserId, toUserId, content) VALUES (?, ?, ?)',
      [req.user.id, toUserId, content],
      function (err) {
        if (err) {
          console.error('Error sending message:', err.message);
          return res.status(500).json({ msg: 'Error sending message' });
        }
        res.json({ msg: 'Message sent' });
      }
    );
  } catch (error) {
    console.error('Error in /messages:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

app.get('/messages/:withUserId', authenticateToken, (req, res) => {
  try {
    const { withUserId } = req.params;
    db.all(
      'SELECT * FROM messages WHERE (fromUserId = ? AND toUserId = ?) OR (fromUserId = ? AND toUserId = ?) ORDER BY timestamp',
      [req.user.id, withUserId, withUserId, req.user.id],
      (err, messages) => {
        if (err) {
          console.error('Error fetching messages:', err.message);
          return res.status(500).json({ msg: 'Error fetching messages' });
        }
        res.json(messages);
      }
    );
  } catch (error) {
    console.error('Error in /messages/:withUserId:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Meetings Routes
app.post('/messages/meeting', authenticateToken, async (req, res) => {
  try {
    const { propertyId, date, notes } = req.body;
    if (!propertyId || !date) return res.status(400).json({ msg: 'Property ID and date are required' });
    db.run(
      'INSERT INTO meetings (userId, propertyId, date, notes) VALUES (?, ?, ?, ?)',
      [req.user.id, propertyId, date, notes || ''],
      function (err) {
        if (err) {
          console.error('Error scheduling meeting:', err.message);
          return res.status(500).json({ msg: 'Error scheduling meeting' });
        }
        res.json({ msg: 'Meeting scheduled' });
      }
    );
  } catch (error) {
    console.error('Error in /messages/meeting:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

app.get('/messages/meetings', authenticateToken, (req, res) => {
  try {
    db.all(
      'SELECT m.*, p.title FROM meetings m JOIN properties p ON m.propertyId = p.id WHERE m.userId = ?',
      [req.user.id],
      (err, meetings) => {
        if (err) {
          console.error('Error fetching meetings:', err.message);
          return res.status(500).json({ msg: 'Error fetching meetings' });
        }
        res.json(meetings);
      }
    );
  } catch (error) {
    console.error('Error in /messages/meetings:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Users Route
app.get('/users', (req, res) => {
  try {
    db.all('SELECT id, email FROM users', [], (err, users) => {
      if (err) {
        console.error('Error fetching users:', err.message);
        return res.status(500).json({ msg: 'Error fetching users' });
      }
      res.json(users);
    });
  } catch (error) {
    console.error('Error in /users:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Export the app for Vercel
module.exports = app;
