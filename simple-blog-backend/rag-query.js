// simple-blog-backend/rag-query.js
// Lambda handler: POST /api/rag/query
// Combines existing origin/CORS helper and the RAG query logic (OpenAI embeddings + Redis/RediSearch).

const ALLOWED_ORIGINS = new Set([
  'https://scalabledeploy.com',
  'http://localhost:3000'
]);

function pickOrigin(incomingOrigin) {
  if (!incomingOrigin) return 'https://scalabledeploy.com';
  if (ALLOWED_ORIGINS.has(incomingOrigin)) return incomingOrigin;
  // fallback to production host (safe default)
  return 'https://scalabledeploy.com';
}

const Redis = require('ioredis');
const fetch = require('node-fetch');

const REDIS = process.env.REDIS_ENDPOINT; // e.g. my-redis.xxxxxx.ng.0001.use2.cache.amazonaws.com:6379
const OPENAI_KEY = process.env.OPENAI_KEY;
const EMBEDDING_DIM = parseInt(process.env.EMBEDDING_DIM || '1536', 10);
const REDIS_INDEX = process.env.REDIS_INDEX || 'idx:rag';
const REDIS_PREFIX = process.env.REDIS_PREFIX || 'rag:meta:';

const redis = new Redis(REDIS);

// embed a single text using OpenAI embeddings
async function embedText(text) {
  if (!OPENAI_KEY) throw new Error('OPENAI_KEY not set in env');
  const url = 'https://api.openai.com/v1/embeddings';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error('embeddings error ' + t);
  }
  const j = await res.json();
  return j.data[0].embedding;
}

// Convert float[] to Buffer with Float32 LE (for RediSearch FLAT/HNSW)
function float32BufferFromArray(arr) {
  const f32 = new Float32Array(arr);
  return Buffer.from(f32.buffer);
}

// Parse FT.SEARCH raw response into structured hits
function parseFtSearchResponse(raw) {
  // FT.SEARCH format: [total, id1, [field1, val1, ...], id2, ...]
  const res = [];
  if (!raw || raw.length < 1) return res;
  for (let i = 1; i < raw.length; i += 2) {
    const id = raw[i];
    const fieldsArray = raw[i + 1] || [];
    const obj = { id };
    for (let j = 0; j < fieldsArray.length; j += 2) {
      const k = fieldsArray[j];
      const v = fieldsArray[j + 1];
      obj[k] = v;
    }
    res.push(obj);
  }
  return res;
}

exports.handler = async (event) => {
  const incomingOrigin = (event.headers && (event.headers.origin || event.headers.Origin)) || null;
  const allowedOrigin = pickOrigin(incomingOrigin);

  // Basic CORS preflight handling
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,Cache-Control,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
      },
      body: ''
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const query = body.query || '';
    const top_k = body.top_k || 5;

    if (!query) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': allowedOrigin },
        body: JSON.stringify({ error: 'query required' })
      };
    }

    // embed the query
    const qVec = await embedText(query);
    if (!qVec || !Array.isArray(qVec)) throw new Error('embedding failed');

    const vecBuf = float32BufferFromArray(qVec);

    // Build FT.SEARCH KNN expression
    // assumes index REDIS_INDEX and vector field named 'vector'
    const knn = `*=>[KNN ${top_k} @vector $vec AS score]`;
    const args = [
      REDIS_INDEX,
      knn,
      'PARAMS', '2', 'vec', vecBuf,
      'RETURN', '3', 'title', 'url', 'snippet',
      'SORTBY', 'score',
      'LIMIT', '0', `${top_k}`
    ];

    const raw = await redis.send_command('FT.SEARCH', args);
    const hits = parseFtSearchResponse(raw);

    let answer;
    if (!hits.length) {
      answer = "I don't know — no matching documents found.";
    } else {
      answer = hits.map((h, i) => `[${i + 1}] ${h.title} — ${h.snippet || ''}`).join('\n\n');
    }

    const sources = hits.map(h => ({ id: h.id, title: h.title, url: h.url || '', snippet: h.snippet || '' }));
    const meta = { top_k, returned: sources.length };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin
      },
      body: JSON.stringify({ query, answer, sources, meta })
    };
  } catch (err) {
    console.error('rag query error', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': pickOrigin(incomingOrigin) },
      body: JSON.stringify({ error: err.message || 'server error' })
    };
  }
};
