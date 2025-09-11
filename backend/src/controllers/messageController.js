const db = require('../models/db');
const authMiddleware = require('../middleware/authMiddleware');

exports.sendMessage = [authMiddleware, (req, res) => {
  const { toUserId, content } = req.body;
  db.run('INSERT INTO messages (fromUserId, toUserId, content) VALUES (?, ?, ?)', [req.user.id, toUserId, content], (err) => {
    if (err) return res.status(500).json({ msg: 'Database error' });
    res.json({ msg: 'Message sent' });
  });
}];

exports.getMessages = [authMiddleware, (req, res) => {
  const { withUserId } = req.params;
  db.all(
    'SELECT * FROM messages WHERE (fromUserId = ? AND toUserId = ?) OR (fromUserId = ? AND toUserId = ?) ORDER BY timestamp',
    [req.user.id, withUserId, withUserId, req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ msg: 'Database error' });
      res.json(rows);
    }
  );
}];

exports.scheduleMeeting = [authMiddleware, (req, res) => {
  const { userId2, date, notes } = req.body;
  db.run('INSERT INTO meetings (userId1, userId2, date, notes) VALUES (?, ?, ?, ?)', [req.user.id, userId2, date, notes], (err) => {
    if (err) return res.status(500).json({ msg: 'Database error' });
    res.json({ msg: 'Meeting scheduled' });
  });
}];

exports.getMeetings = [authMiddleware, (req, res) => {
  db.all('SELECT * FROM meetings WHERE userId1 = ? OR userId2 = ?', [req.user.id, req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ msg: 'Database error' });
    res.json(rows);
  });
}];