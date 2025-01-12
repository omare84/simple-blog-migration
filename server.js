const express = require('express');
const { Pool } = require('pg');

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
    user: 'postgres',         // Replace with your PostgreSQL username
    host: 'localhost',        // Host of the database
    database: 'simple_blog',  // Replace with your database name
    password: 'lopez321', // Replace with your PostgreSQL password
    port: 5432,               // Default PostgreSQL port
});

// Connect to the database
pool.connect()
    .then(() => console.log('Connected to the database'))
    .catch(err => console.error('Database connection error', err.stack));

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
