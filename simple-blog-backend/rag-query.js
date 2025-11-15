// simple-blog-backend/rag-query.js
// Lambda handler: POST /api/rag/query

const EMBEDDING_DIM = parseInt(process.env.EMBEDDING_DIM || '1536', 10);
const REDIS_ENDPOINT = process.env.REDIS_ENDPOINT;
const REDIS_INDEX = process.env.REDIS_INDEX || 'idx:rag';
const REDIS_PREFIX = process.env.REDIS_PREFIX || 'rag:meta:';

const PINECONE_BASE_URL = process.env.PINECONE_BASE_URL || null;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY || null;
const PINECONE_INDEX = process.env.PINECONE_INDEX || process.env.PineconeIndex || null;

const OPENAI_KEY = process.env.OPENAI_KEY;
const MOCK_EMBEDDINGS = process.env.MOCK_EMBEDDINGS === 'true';

const Redis = require('ioredis');
const redis = (REDIS_ENDPOINT && !PINECONE_BASE_URL) ? new Redis(REDIS_ENDPOINT) : null;
const fetch = globalThis.fetch;
if (!fetch) throw new Error('Global fetch is not available in this runtime.');

const ALLOWED_ORIGINS = new Set(['https://scalabledeploy.com','http://localhost:3000']);
function pickOrigin(o){ if(!o) return 'https://scalabledeploy.com'; if(ALLOWED_ORIGINS.has(o)) return o; return 'https://scalabledeploy.com'; }

function float32BufferFromArray(arr) { const f32 = new Float32Array(arr); return Buffer.from(f32.buffer); }

async function embedText(text) {
  if (MOCK_EMBEDDINGS) {
    // deterministic small vector (not real semantic)
    const dim = EMBEDDING_DIM || 1536;
    const vec = new Array(dim);
    let h = 2166136261 >>> 0;
    for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619) >>> 0;
    let x = h;
    for (let i = 0; i < dim; i++) { x = (x * 1664525 + 1013904223) >>> 0; vec[i] = ((x % 1000)/500)-1; }
    return vec;
  }
  if (!OPENAI_KEY) throw new Error('OPENAI_KEY not set in env');
  const url = 'https://api.openai.com/v1/embeddings';
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text })
  });
  if (!res.ok) {
    const t = await res.text().catch(()=>'<no-body>');
    throw new Error('embeddings error ' + t);
  }
  const j = await res.json();
  return j.data[0].embedding;
}

async function pineconeQuery(vec, topK = 5) {
  if (!PINECONE_BASE_URL || !PINECONE_API_KEY) throw new Error('Pinecone not configured');
  const url = `${PINECONE_BASE_URL}/query`;
  const body = {
    vector: vec,
    topK: topK,
    includeMetadata: true
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Api-Key': PINECONE_API_KEY },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const t = await res.text().catch(()=>'<no-body>');
    throw new Error(`Pinecone query error ${res.status} ${t}`);
  }
  return await res.json();
}

function parseFtSearchResponse(raw) {
  const res = [];
  if (!raw || raw.length < 1) return res;
  for (let i=1;i<raw.length;i+=2) {
    const id = raw[i];
    const fieldsArray = raw[i+1]||[];
    const obj={id};
    for (let j=0;j<fieldsArray.length;j+=2){ obj[fieldsArray[j]] = fieldsArray[j+1]; }
    res.push(obj);
  }
  return res;
}

exports.handler = async (event) => {
  const incomingOrigin = (event.headers && (event.headers.origin || event.headers.Origin)) || null;
  const allowedOrigin = pickOrigin(incomingOrigin);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': allowedOrigin, 'Access-Control-Allow-Headers': 'Content-Type,Authorization,Cache-Control,X-Amz-Date,X-Api-Key,X-Amz-Security-Token', 'Access-Control-Allow-Methods':'OPTIONS,GET,POST' }, body: '' };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const query = body.query || '';
    const top_k = body.top_k || 5;
    if (!query) return { statusCode: 400, headers: {'Access-Control-Allow-Origin': allowedOrigin}, body: JSON.stringify({ error: 'query required' }) };

    const qVec = await embedText(query);

    if (PINECONE_BASE_URL && PINECONE_API_KEY) {
      const pine = await pineconeQuery(qVec, top_k);
      // pinecone response format: { matches: [ {id, score, metadata:{...}} ], namespace? }
      const matches = (pine.matches || []).slice(0, top_k);
      const sources = matches.map(m => ({ id: m.id, title: (m.metadata && m.metadata.title) || '', url: (m.metadata && m.metadata.url) || '', snippet: (m.metadata && m.metadata.snippet) || '' }));
      let answer;
      if (!sources.length) answer = "I don't know — no matching documents found.";
      else answer = sources.map((s,i)=>`[${i+1}] ${s.title} — ${s.snippet||''}`).join('\n\n');
      const meta = { top_k, returned: sources.length };
      return { statusCode: 200, headers: {'Content-Type':'application/json','Access-Control-Allow-Origin': allowedOrigin}, body: JSON.stringify({ query, answer, sources, meta }) };
    }

    // fallback to Redis FT.SEARCH
    if (!redis) throw new Error('no vector store configured');

    const vecBuf = float32BufferFromArray(qVec);
    const knn = `*=>[KNN ${top_k} @vector $vec AS score]`;
    const args = [ REDIS_INDEX, knn, 'PARAMS', '2', 'vec', vecBuf, 'RETURN', '3', 'title', 'url', 'snippet', 'SORTBY', 'score', 'LIMIT', '0', `${top_k}` ];
    const raw = await redis.send_command('FT.SEARCH', args);
    const hits = parseFtSearchResponse(raw);
    const sources = hits.map(h => ({ id: h.id, title: h.title, url: h.url||'', snippet: h.snippet||'' }));
    const answer = (!sources.length) ? "I don't know — no matching documents found." : sources.map((s,i)=>`[${i+1}] ${s.title} — ${s.snippet||''}`).join('\n\n');
    return { statusCode: 200, headers: {'Content-Type':'application/json','Access-Control-Allow-Origin': allowedOrigin}, body: JSON.stringify({ query, answer, sources, meta: {top_k, returned: sources.length} }) };

  } catch (err) {
    console.error('rag query error', err && err.stack || err);
    return { statusCode: 500, headers: {'Access-Control-Allow-Origin': pickOrigin(incomingOrigin)}, body: JSON.stringify({ error: err.message || 'server error' }) };
  }
};
