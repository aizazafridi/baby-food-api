const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  pool.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', 
    [username, hashed, role || 'user'], 
    (err) => {
      if (err) return res.status(500).send(err);
      res.send('User registered');
    });
});

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  pool.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err || results.length === 0) return res.status(400).send('Invalid credentials');
    const valid = await bcrypt.compare(password, results[0].password);
    if (!valid) return res.status(400).send('Invalid credentials');
    
    const token = jwt.sign({ id: results[0].id, role: results[0].role }, 'secretkey', { expiresIn: '1h' });
    res.json({ token });
  });
});

// Role middleware
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, 'secretkey', (err, user) => {
      if (err) return res.sendStatus(403);
      if (!allowedRoles.includes(user.role)) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };
}

// Protected route: for testing
router.get('/admin-data', authorizeRoles('admin'), (req, res) => {
  res.send('This is admin-only data');
});

// Protected route: Only admin can access food data
router.get('/foods', authorizeRoles('admin'), (req, res) => {
    pool.query('SELECT * FROM foods', (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Server error');
      }
      res.json(results);
    });
});

module.exports = router;
