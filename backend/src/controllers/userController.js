const db = require('../models/db');
const authMiddleware = require('../middleware/authMiddleware');

exports.getProfile = [authMiddleware, (req, res) => {
  db.get('SELECT id, email FROM users WHERE id = ?', [req.user.id], (err, row) => {
    if (err) return res.status(500).json({ msg: 'Database error' });
    res.json(row);
  });
}];

exports.getUsers = [(req, res) => {
  db.all('SELECT id, email FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ msg: 'Database error' });
    res.json(rows);
  });
}];