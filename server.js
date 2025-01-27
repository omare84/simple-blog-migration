const express = require('express');
const { Pool } = require('pg');
require('dotenv').config(); // Load environment variables from .env

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check route
app.get('/', (req, res) => {
    res.send('Server is running!');
});

// Database configuration
const pool = new Pool({
    user: process.env.DB_USER,         // PostgreSQL username from .env
    host: process.env.DB_HOST,         // Database host (localhost or RDS endpoint)
    database: process.env.DB_NAME,     // Database name
    password: process.env.DB_PASSWORD, // PostgreSQL password from .env
    port: process.env.DB_PORT || 5432, // Default PostgreSQL port
});

// Test database connection
pool.connect()
    .then(() => console.log('Connected to the database'))
    .catch(err => console.error('Database connection error', err.stack));

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

