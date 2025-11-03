// simple-blog-backend/rag-ingest.js
// Lambda handler: POST /api/rag/ingest
// Accepts JSON body: { csv: "<full CSV text>" } or { rows: [ {id,title,description,url} ] }
// For small CSVs we accept direct upload from the admin page.
// Uses OpenAI embeddings and Redis (RediSearch) to store vectors + metadata.

const { parse } = require('csv-parse/sync');
const Redis = require('ioredis');
const { nanoid } = require('nanoid');
const fetch = require('node-fetch');

const REDIS = process.env.REDIS_ENDPOINT;
const OPENAI_KEY = process.env.OPENAI_KEY;
const EMBEDDING_DIM = parseInt(process.env.EMBEDDING_DIM || '1536', 10);
const REDIS_INDEX = process.env.REDIS_INDEX || 'idx:rag';
const REDIS_PREFIX = process.env.REDIS_PREFIX || 'rag:meta:';

const redis = new Redis(REDIS);

async function embedTexts(texts = []) {
  if (!OPENAI_KEY) throw new Error('OPENAI_KEY not set in env');
  // OpenAI embeddings endpoint (change model if needed)
  const url = 'https://api.openai.com/v1/embeddings';
  const body = {
    model: 'text-embedding-3-small',
    input: texts
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Embeddings API error: ${res.status} ${t}`);
  }
  const j = await res.json();
  return j.data.map(d => d.embedding);
}

// convert float array -> Buffer (Float32 LE)
function float32BufferFromArray(arr) {
  const f32 = new Float32Array(arr);
  return Buffer.from(f32.buffer);
}

function makeKey(id) {
  return `${REDIS_PREFIX}${id}`;
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
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'csv or rows required' })
      };
    }

    // prepare texts
    const texts = rows.map(r => {
      const title = r.title || r.name || '';
      const desc = r.description || r.body || r.text || '';
      const url = r.url || '';
      return `${title}\n\n${desc}\n\n${url}`;
    });

    // call embeddings in batches (to avoid huge requests)
    const batchSize = 16;
    const embeddings = [];
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const emb = await embedTexts(batch);
      embeddings.push(...emb);
      // small pause if you hit rate limits (optional)
      await new Promise(r => setTimeout(r, 50));
    }

    // store each as a Redis HASH with vector blob
    let count = 0;
    for (let i = 0; i < rows.length; i++) {
      const id = rows[i].id || nanoid();
      const key = makeKey(id);
      const meta = {
        id,
        title: rows[i].title || rows[i].name || '',
        url: rows[i].url || '',
        snippet: (rows[i].description || rows[i].body || '').slice(0, 600)
      };

      // vector buffer
      const vec = embeddings[i];
      if (!vec || vec.length !== EMBEDDING_DIM) {
        console.warn('embedding length mismatch', id, (vec || []).length);
      }
      const vecBuf = float32BufferFromArray(vec);

      // HSET fields (store vector as raw blob)
      // Note: RediSearch expects the vector field to be raw bytes in Float32 LE when index was created.
      const hm = [
        'title', meta.title,
        'url', meta.url,
        'snippet', meta.snippet,
        'vector', vecBuf
      ];
      // ioredis will convert Buffer as a binary field correctly
      await redis.hsetBuffer ? redis.hsetBuffer(key, ...hm) : redis.call('HSET', key, ...hm);

      count++;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ingested: count })
    };
  } catch (err) {
    console.error('ingest error', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
