const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// CORS Configuration
app.use(cors({
    origin: 'https://d19s599jz0z1u5.cloudfront.net', // Replace with your actual CloudFront domain
    methods: ['GET', 'POST', 'PUT', 'DELETE'],       
    allowedHeaders: ['Content-Type']                 
}));

// Middleware to parse JSON request bodies
app.use(express.json());

// Database Configuration
const pool = new Pool({
  user: 'postgres',
  host: 'simple-blog.chq0uccsu4k7.us-east-2.rds.amazonaws.com',
  database: 'simple_blog',
  password: 'lopez321',
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Test database connection
pool.connect()
  .then(() => console.log('Connected to the RDS database'))
  .catch(err => console.error('Database connection error:', err.stack));

// Make the pool available to routes
app.locals.pool = pool;

// Import the post routes
const postRoutes = require('./routes/posts'); 

// Use the post routes at /api/posts
app.use('/api/posts', postRoutes); 

// Health check route
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Create a new post
app.post("/api/posts", async (req, res) => {
    const { title, content, author } = req.body;
    if (!title || !content || !author) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const result = await pool.query(
            "INSERT INTO posts (title, content, author) VALUES ($1, $2, $3) RETURNING id",
            [title, content, author]
        );
        res.status(201).json({ message: "Post created successfully!", id: result.rows[0].id });
    } catch (error) {
        console.error("Error inserting post:", error);
        res.status(500).json({ error: "Database error" });
    }
});

// Update a post
app.put('/api/posts/:id', async (req, res) => {
    const { title, content, author } = req.body;
    const { id } = req.params;

    try {
        const result = await pool.query(
            'UPDATE posts SET title=$1, content=$2, author=$3 WHERE id=$4 RETURNING *',
            [title, content, author, id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Post not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// Delete a post
app.delete('/api/posts/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM posts WHERE id=$1 RETURNING *', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Post not found" });
        }
        res.json({ message: "Post deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
