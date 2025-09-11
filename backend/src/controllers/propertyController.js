const db = require('../models/db');
const authMiddleware = require('../middleware/authMiddleware');

exports.addProperty = [authMiddleware, (req, res) => {
  const { name, buildingNumber, city, country, latitude, longitude, price, type, image } = req.body;
  db.run(
    'INSERT INTO properties (name, buildingNumber, city, country, latitude, longitude, price, type, ownerId, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name, buildingNumber, city, country, latitude, longitude, price, type, req.user.id, image],
    (err) => {
      if (err) return res.status(500).json({ msg: 'Database error' });
      res.json({ msg: 'Property added, awaiting approval' });
    }
  );
}];

exports.getProperties = (req, res) => {
  db.all('SELECT * FROM properties WHERE approved = TRUE', [], (err, rows) => {
    if (err) return res.status(500).json({ msg: 'Database error' });
    res.json(rows);
  });
};

exports.searchProperties = (req, res) => {
  const { city, type, minPrice, maxPrice } = req.query;
  let query = 'SELECT * FROM properties WHERE approved = TRUE';
  const params = [];
  if (city) { query += ' AND city LIKE ?'; params.push(`%${city}%`); }
  if (type) { query += ' AND type = ?'; params.push(type); }
  if (minPrice) { query += ' AND price >= ?'; params.push(minPrice); }
  if (maxPrice) { query += ' AND price <= ?'; params.push(maxPrice); }
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ msg: 'Database error' });
    res.json(rows);
  });
};

exports.approveProperty = [authMiddleware, (req, res) => {
  const { id } = req.params;
  db.run('UPDATE properties SET approved = TRUE WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ msg: 'Database error' });
    res.json({ msg: 'Approved' });
  });
}];

exports.addInterest = [authMiddleware, (req, res) => {
  const { propertyId } = req.body;
  db.run('INSERT INTO interests (userId, propertyId) VALUES (?, ?)', [req.user.id, propertyId], (err) => {
    if (err) return res.status(500).json({ msg: 'Database error' });
    res.json({ msg: 'Interest added' });
  });
}];

exports.getInterests = [authMiddleware, (req, res) => {
  db.all('SELECT * FROM properties WHERE id IN (SELECT propertyId FROM interests WHERE userId = ?)', [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ msg: 'Database error' });
    res.json(rows);
  });
}];