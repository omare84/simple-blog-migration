// packages/rag-starter/mock-server.js
// Tiny Express mock that simulates a RAG query endpoint with explicit CORS handling.
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const shortid = require('shortid');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 5001;
const DATA_PATH = path.join(__dirname, 'data', 'docs.json');

function loadDocs() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveDocs(docs) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(docs, null, 2), 'utf8');
}

// very small scoring: count matched query words
function scoreDoc(query, doc) {
  const qWords = query.toLowerCase().split(/\W+/).filter(Boolean);
  const text = ((doc.title || '') + ' ' + (doc.text || '')).toLowerCase();
  let score = 0;
  for (const w of qWords) {
    if (text.includes(w)) score += 1;
  }
  return score;
}

function excerptFor(doc, query) {
  const q = (query || '').split(/\W+/).filter(Boolean)[0] || null;
  const fullText = doc.text || '';
  if (!q) return fullText.slice(0, 200);
  const idx = fullText.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return fullText.slice(0, 200);
  const start = Math.max(0, idx - 60);
  return fullText.slice(start, Math.min(fullText.length, start + 200)).replace(/\n/g, ' ');
}

// ---- CORS middleware (explicit) ----
// In local dev this allows any origin. For production restrict to your domain.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // change to 'https://scalabledeploy.com' in prod
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,Cache-Control');
  // If you want cookies/auth in dev, add: res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// GET docs (for quick debugging)
app.get('/api/rag/docs', (req, res) => {
  res.json(loadDocs());
});

// POST /api/rag/ingest { title, text }
app.post('/api/rag/ingest', (req, res) => {
  const { title, text } = req.body || {};
  if (!title || !text) return res.status(400).json({ error: 'title and text required' });
  const docs = loadDocs();
  const newDoc = { id: shortid.generate(), title, text };
  docs.push(newDoc);
  saveDocs(docs);
  res.json(newDoc);
});

// POST /api/rag/query { query, top_k }
app.post('/api/rag/query', (req, res) => {
  const { query, top_k = 3 } = req.body || {};
  if (!query) return res.status(400).json({ error: 'query required' });

  const docs = loadDocs();
  const scored = docs
    .map(d => ({ ...d, score: scoreDoc(query, d) }))
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, top_k);

  // simple "answer" generation: join the top docs excerpts into a single response with sources
  const answer = scored.length
    ? scored.map((d, i) => `[${i + 1}] ${d.title}: ${excerptFor(d, query)}`).join('\n\n')
    : "I don't know — no matching documents found.";

  const sources = scored.map(d => ({
    id: d.id,
    title: d.title,
    score: d.score,
    excerpt: excerptFor(d, query)
  }));

  // approximate token estimate (mock)
  const tokens = Math.max(1, Math.round((answer.length || 0) / 4));

  res.json({
    query,
    answer,
    sources,
    meta: {
      top_k: top_k,
      returned: sources.length,
      mock_tokens_used: tokens
    }
  });
});

// health
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`RAG mock server listening on http://localhost:${PORT}`);
  console.log('Endpoints: /api/rag/query  /api/rag/ingest  /api/rag/docs');
});
