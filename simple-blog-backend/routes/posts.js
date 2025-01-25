const express = require('express');
const router = express.Router();
const pool = require('../db'); // Ensure the path points to the db.js file where the pool is exported

// Get all posts
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM posts ORDER BY created_at DESC');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching posts:', err.message);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Add a new post
router.post('/', async (req, res) => {
  const { title, content, author } = req.body;
  if (!title || !content || !author) {
    return res.status(400).json({ error: 'All fields (title, content, author) are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO posts (title, content, author) VALUES ($1, $2, $3) RETURNING *',
      [title, content, author]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding post:', err.message);
    res.status(500).json({ error: 'Failed to add post' });
  }
});

// Get a post by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM posts WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching post:', err.message);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Update a post
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content, author } = req.body;
  if (!title || !content || !author) {
    return res.status(400).json({ error: 'All fields (title, content, author) are required' });
  }

  try {
    const result = await pool.query(
      'UPDATE posts SET title = $1, content = $2, author = $3 WHERE id = $4 RETURNING *',
      [title, content, author, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error updating post:', err.message);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete a post
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM posts WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error('Error deleting post:', err.message);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

module.exports = router;
