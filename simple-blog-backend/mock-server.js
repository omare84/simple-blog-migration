// simple-blog-backend/mock-server.js
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 5000;

// Load sample response (you already saved response-full.json or response.json)
const samplePath = path.join(__dirname, 'response-full.json');
let sample = [];
try {
  sample = require(samplePath);
} catch (e) {
  // fallback sample
  sample = [
    { id: 7, title: 'test', content: 'my content', author: 'omare', created_at: '2025-07-21T21:45:57.062Z' },
    { id: 6, title: 'new 2', content: 'test', author: 'omare', created_at: '2025-07-19T18:33:27.156Z' }
  ];
}

app.use(express.json());

app.get('/api/posts', (req, res) => {
  res.json(sample);
});

// stub other CRUD endpoints if you like
app.post('/api/posts', (req, res) => {
  const newPost = { id: Date.now(), ...req.body, created_at: new Date().toISOString() };
  res.status(201).json(newPost);
});

app.listen(port, () => {
  console.log(`Mock server listening on http://localhost:${port}`);
});
