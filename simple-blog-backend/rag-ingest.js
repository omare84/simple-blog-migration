// simple-blog-backend/rag-ingest.js
// Lambda handler: POST /api/rag/ingest
// Accepts JSON body: { csv: "<full CSV text>" } or { rows: [ {id,title,description,url} ] }

const { parse } = require('csv-parse/sync');
const Redis = require('ioredis');
const crypto = require('crypto');

const fetch = globalThis.fetch;
if (!fetch) throw new Error('Global fetch is not available in this runtime. Use Node 18+/20+.');

const REDIS_ENDPOINT = process.env.REDIS_ENDPOINT;
const OPENAI_KEY = process.env.OPENAI_KEY;
const EMBEDDING_DIM = parseInt(process.env.EMBEDDING_DIM || '1536', 10);
const REDIS_INDEX = process.env.REDIS_INDEX || 'idx:rag';
const REDIS_PREFIX = process.env.REDIS_PREFIX || 'rag:meta:';

const PINECONE_BASE_URL = process.env.PINECONE_BASE_URL || null;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY || null;
const PINECONE_INDEX = process.env.PINECONE_INDEX || process.env.PineconeIndex || null;

const MOCK_EMBEDDINGS = process.env.MOCK_EMBEDDINGS === 'true';
const MOCK_REDIS = process.env.MOCK_REDIS === 'true';

const redis = (REDIS_ENDPOINT && !PINECONE_BASE_URL && !MOCK_REDIS) ? new Redis(REDIS_ENDPOINT) : null;

// helpers
function makeId() { return crypto.randomUUID(); }

function float32BufferFromArray(arr) {
  const f32 = new Float32Array(arr);
  return Buffer.from(f32.buffer);
}

async function embedTexts(texts = []) {
  if (MOCK_EMBEDDINGS) {
    // deterministic pseudo-embeddings
    return texts.map((t) => {
      let h = 2166136261 >>> 0;
      for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619) >>> 0;
      const dim = EMBEDDING_DIM || 1536;
      const vec = new Array(dim);
      let x = h;
      for (let i = 0; i < dim; i++) {
        x = (x * 1664525 + 1013904223) >>> 0;
        vec[i] = ((x % 1000) / 500) - 1;
      }
      return vec;
    });
  }

  if (!OPENAI_KEY) throw new Error('OPENAI_KEY not set in env');
  const url = 'https://api.openai.com/v1/embeddings';
  const body = { model: 'text-embedding-3-small', input: texts };

  // basic retry loop for transient errors
  const maxRetries = 3;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        const j = await res.json();
        return j.data.map(d => d.embedding);
      }
      const txt = await res.text().catch(()=>'<no-body>');
      // retry on 429/5xx
      if (res.status === 429 || res.status >= 500) {
        const delay = 500 * Math.pow(2, attempt);
        console.warn('embed transient error', res.status, txt, 'retry in', delay);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw new Error(`Embeddings API error: ${res.status} ${txt}`);
    } catch (err) {
      if (attempt < maxRetries) {
        const delay = 500 * Math.pow(2, attempt);
        console.warn('embed fetch error, retry', attempt, err.message, 'delay', delay);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Embeddings failed after retries');
}

async function pineconeUpsert(vectors = []) {
  if (!PINECONE_BASE_URL || !PINECONE_API_KEY) throw new Error('Pinecone not configured');
  const url = `${PINECONE_BASE_URL}/vectors/upsert`;
  const body = { vectors };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Api-Key': PINECONE_API_KEY },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const t = await res.text().catch(()=>'<no-body>');
    throw new Error(`Pinecone upsert error ${res.status} ${t}`);
  }
  return await res.json();
}

exports.handler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : (event || {});
    let rows = [];
    if (body.csv) {
      rows = parse(body.csv, { columns: true, skip_empty_lines: true });
    } else if (body.rows && Array.isArray(body.rows)) {
      rows = body.rows;
    } else {
      return { statusCode: 400, body: JSON.stringify({ error: 'csv or rows required' }) };
    }

    // prepare text payloads
    const texts = rows.map(r => {
      const title = r.title || r.name || '';
      const desc = r.description || r.body || r.text || '';
      const url = r.url || '';
      return `${title}\n\n${desc}\n\n${url}`;
    });

    // embed in batches
    const batchSize = 16;
    const embeddings = [];
    for (let i=0;i<texts.length;i+=batchSize) {
      const batch = texts.slice(i,i+batchSize);
      const emb = await embedTexts(batch);
      embeddings.push(...emb);
      await new Promise(r => setTimeout(r, 30));
    }

    // If Pinecone configured -> upsert vectors
    if (PINECONE_BASE_URL && PINECONE_API_KEY) {
      // Pinecone expects vectors: [{id, values, metadata}]
      const vectors = rows.map((r, i) => {
        const id = r.id || makeId();
        const metadata = {
          id,
          title: r.title || r.name || '',
          url: r.url || '',
          snippet: (r.description || r.body || '').slice(0, 600)
        };
        return { id, values: embeddings[i], metadata };
      });
      // Upsert in batches (Pinecone accepts many per request, but keep moderate)
      const upsertBatch = 50;
      for (let i=0;i<vectors.length;i+=upsertBatch) {
        const slice = vectors.slice(i, i+upsertBatch);
        await pineconeUpsert(slice);
      }
      return { statusCode: 200, body: JSON.stringify({ ingested: vectors.length }) };
    }

    // Otherwise store to Redis (fallback)
    if (!redis || MOCK_REDIS) {
      // pretend we stored them
      return { statusCode: 200, body: JSON.stringify({ ingested: rows.length }) };
    }

    // store each row as Redis HSET with vector blob
    let count = 0;
    for (let i=0;i<rows.length;i++) {
      const id = rows[i].id || makeId();
      const key = `${REDIS_PREFIX}${id}`;
      const meta = {
        id,
        title: rows[i].title || rows[i].name || '',
        url: rows[i].url || '',
        snippet: (rows[i].description || rows[i].body || '').slice(0, 600)
      };
      const vec = embeddings[i] || new Array(EMBEDDING_DIM).fill(0);
      const vecBuf = float32BufferFromArray(vec);
      const hm = ['title', meta.title, 'url', meta.url, 'snippet', meta.snippet, 'vector', vecBuf];
      if (typeof redis.hsetBuffer === 'function') {
        await redis.hsetBuffer(key, ...hm);
      } else {
        await redis.call('HSET', key, ...hm);
      }
      count++;
    }
    return { statusCode: 200, body: JSON.stringify({ ingested: count }) };

  } catch (err) {
    console.error('ingest error', err && err.stack || err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'server error' }) };
  }
};
