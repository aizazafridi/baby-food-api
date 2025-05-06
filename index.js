const express = require('express');
const mysql = require('mysql2');  
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};
  
// Create a connection pool to MySQL
const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test MySQL connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Connection error: ', err);
  } else {
    console.log('Connected to MySQL database');
    connection.release(); // Release the connection back to the pool
  }
});

// Route to get food data
app.get('/foods', async (req, res) => {
  try {
    pool.query('SELECT * FROM foods', (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).send('Server error');
      } else {
        res.json(results); // Send back the results as JSON
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
