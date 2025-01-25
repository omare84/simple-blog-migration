const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// CORS Configuration
// Allows requests from the frontend (http://localhost:3001)
app.use(cors({
    origin: 'http://localhost:3001'
}));

// Middleware to parse JSON request bodies
app.use(express.json());

// Database Configuration
const pool = new Pool({
  user: 'postgres',                   // Replace with your PostgreSQL username
  host: 'simple-blog.chq0uccsu4k7.us-east-2.rds.amazonaws.com', // RDS endpoint
  database: 'simple_blog',            // Replace with your database name
  password: 'lopez321',               // Replace with your RDS password
  port: 5432,                         // Default PostgreSQL port
  ssl: {
    rejectUnauthorized: false,        // Disable for development; enable proper verification in production
  },
});

// Test database connection
pool.connect()
  .then(() => console.log('Connected to the RDS database'))
  .catch(err => console.error('Database connection error:', err.stack));

// Make the pool available to routes
app.locals.pool = pool;

// Import the post routes
const postRoutes = require('./routes/posts'); // Adjust the path if necessary

// Use the post routes at /api/posts
app.use('/api/posts', postRoutes); // Routes accessible at /api/posts

// Health check route
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


