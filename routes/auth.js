const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

// Register
router.post('/register', async (req, res) => {
  const { username, password, role, email } = req.body;
  if (!email || !username || !password) {
    return res.status(400).send('Missing required fields');
  }
  try {
    const hashed = await bcrypt.hash(password, 10);
    pool.query('INSERT INTO users (username, password, role, email) VALUES (?, ?, ?, ?)', 
      [username, hashed, role || 'user', email], 
      (err) => {
        if (err) {
          console.error('Database insert error:', err); 
          return res.status(500).send('Database error: ' + err.message); 
        }
        res.send('User registered');
      });
  } catch (err) {
      console.error('Error:', err); 
      return res.status(500).send('Error: ' + err.message); 
  }
});

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  pool.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err || results.length === 0) return res.status(400).send('Invalid credentials, please check username and password');
    const valid = await bcrypt.compare(password, results[0].password);
    if (!valid) return res.status(400).send('Invalid credentials, Please check username and password');
    
    const token = jwt.sign({ id: results[0].id, role: results[0].role, username: results[0].username }, 'secretkey', { expiresIn: '1h' });
    res.json({ token });
  });
});

// Protected route: for testing
router.get('/admin-data', authorizeRoles('admin'), (req, res) => {
  res.send('This is admin-only data');
});

// Route to get foods
router.get('/foods', authenticateToken, (req, res) => {
  pool.query('SELECT * FROM foods', (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Server error');
    }
    res.json(results);
  });
});

module.exports = router;
