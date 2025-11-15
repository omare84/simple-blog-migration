// simple-blog-backend/rag-query.js
// Lambda handler: POST /api/rag/query
// Uses OpenAI embeddings -> Pinecone vector search -> OpenAI chat for synthesis.
// Node 20 (global fetch available)

const ALLOWED_ORIGINS = new Set([
  'https://scalabledeploy.com',
  'http://localhost:3000'
]);

function pickOrigin(incomingOrigin) {
  if (!incomingOrigin) return 'https://scalabledeploy.com';
  if (ALLOWED_ORIGINS.has(incomingOrigin)) return incomingOrigin;
  return 'https://scalabledeploy.com';
}

const OPENAI_KEY = process.env.OPENAI_KEY;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_API_HOST = (process.env.PINECONE_API_HOST || '').replace(/\/+$/, ''); // no trailing slash
const PINECONE_INDEX = process.env.PINECONE_INDEX || '';
const EMBEDDING_DIM = parseInt(process.env.EMBEDDING_DIM || '1536', 10);
const TOP_K_DEFAULT = parseInt(process.env.TOP_K_DEFAULT || '5', 10);

if (!globalThis.fetch) {
  throw new Error('Global fetch is required (Node 18+/20+).');
}

/* --- Helpers --- */

async function embedTextOpenAI(text) {
  if (!OPENAI_KEY) throw new Error('OPENAI_KEY not set in env');
  const url = 'https://api.openai.com/v1/embeddings';
  const body = { model: 'text-embedding-3-small', input: text };
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const t = await res.text().catch(()=>'<no-body>');
    throw new Error(`OpenAI embeddings error ${res.status}: ${t}`);
  }
  const j = await res.json();
  return j.data[0].embedding;
}

// Try two Pinecone endpoint shapes for compatibility: /query and /vectors/query
async function pineconeQueryVector(vector, topK = TOP_K_DEFAULT, namespace = '') {
  if (!PINECONE_API_HOST) throw new Error('PINECONE_API_HOST not set in env');
  if (!PINECONE_API_KEY) throw new Error('PINECONE_API_KEY not set in env');

  const headers = {
    'Api-Key': PINECONE_API_KEY,
    'Content-Type': 'application/json'
  };

  // Preferred payload for many Pinecone index endpoints
  const bodyQuery = {
    vector,
    topK,
    includeMetadata: true,
    namespace: namespace || ''
  };

  // Attempt 1: POST {host}/query  (some setups use index-host/query)
  try {
    const hostQuery = `${PINECONE_API_HOST}/query`;
    const res = await fetch(hostQuery, { method: 'POST', headers, body: JSON.stringify(bodyQuery) });
    if (res.ok) {
      const j = await res.json();
      // Pinecone returns matches under j.matches OR j.results[0].matches depending on path
      if (Array.isArray(j.matches)) return j.matches;
      if (Array.isArray(j.results) && j.results[0] && Array.isArray(j.results[0].matches)) return j.results[0].matches;
      // otherwise we'll fallthrough to try next shape
    } else {
      // If not ok, try next shape
    }
  } catch (err) {
    // network/other, try next shape
    console.warn('pinecone /query attempt failed', err && err.message);
  }

  // Attempt 2: POST {host}/vectors/query (another valid shape)
  try {
    const hostVectorsQuery = `${PINECONE_API_HOST}/vectors/query`;
    // Slightly different payload format some Pinecone hosts expect
    const bodyVectorsQuery = {
      topK,
      includeValues: false,
      includeMetadata: true,
      vector,
      namespace: namespace || ''
    };
    const res2 = await fetch(hostVectorsQuery, { method: 'POST', headers, body: JSON.stringify(bodyVectorsQuery) });
    if (!res2.ok) {
      const txt = await res2.text().catch(()=>'<no-body>');
      throw new Error(`Pinecone query failed ${res2.status}: ${txt}`);
    }
    const j2 = await res2.json();
    // j2.matches is typical
    if (Array.isArray(j2.matches)) return j2.matches;
    // some responses put results in j2.results
    if (Array.isArray(j2.results) && j2.results[0] && Array.isArray(j2.results[0].matches)) return j2.results[0].matches;
    return [];
  } catch (err) {
    throw new Error('Pinecone query failed: ' + (err && err.message));
  }
}

function float32BufferFromArray(arr) {
  const f32 = new Float32Array(arr);
  return Buffer.from(f32.buffer);
}

/* Synthesize answer with OpenAI Chat Completion */
async function synthesizeAnswerWithChat(query, hits) {
  // Build context docs for the prompt
  const docsForPrompt = hits.map((h, i) => {
    const idx = i + 1;
    const meta = h.metadata || {};
    const title = meta.title || meta.name || h.id || 'Untitled';
    const url = meta.url || meta.link || '';
    const snippet = (meta.snippet || meta.excerpt || meta.text || '').replace(/\n+/g, ' ').trim().slice(0, 1200);
    return `[${idx}] Title: ${title}\nURL: ${url}\nSnippet: ${snippet}\n`;
  }).join('\n');

  const userPrompt = `
You are an assistant that answers user questions using the provided source documents.
Use only the information in the documents below to answer the question. Cite sources inline using bracket numbers like [1], [2], etc.
If the answer is not present in the documents, say "I don't know" or "I couldn't find that in the documents."

Question: ${query}

Documents:
${docsForPrompt}

Answer concisely, and include citations for specific facts where possible.
`;

  if (!OPENAI_KEY) {
    throw new Error('OPENAI_KEY not set for synthesis');
  }

  const chatRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that cites sources from provided documents.' },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 400,
      temperature: 0.0
    })
  });

  if (!chatRes.ok) {
    const text = await chatRes.text().catch(()=>'<no-body>');
    throw new Error(`OpenAI chat failed: ${chatRes.status} ${text}`);
  }
  const chatJson = await chatRes.json();
  const modelText = chatJson.choices?.[0]?.message?.content || chatJson.choices?.[0]?.text || '';
  return modelText.trim();
}

/* --- Lambda handler --- */
exports.handler = async (event) => {
  const incomingOrigin = (event.headers && (event.headers.origin || event.headers.Origin)) || null;
  const allowedOrigin = pickOrigin(incomingOrigin);

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
    const body = event.body ? JSON.parse(event.body) : (event || {});
    const query = (body.query || '').toString();
    const top_k = parseInt(body.top_k || TOP_K_DEFAULT, 10);
    const namespace = body.namespace || '';

    if (!query) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': allowedOrigin },
        body: JSON.stringify({ error: 'query required' })
      };
    }

    // 1) embed the query
    const qVec = await embedTextOpenAI(query);
    if (!qVec || !Array.isArray(qVec)) throw new Error('embedding failed');

    // 2) Query Pinecone
    const matches = await pineconeQueryVector(qVec, top_k, namespace); // array of {id, score, metadata}
    // Normalize hits: ensure each has metadata
    const hits = (matches || []).map(m => ({
      id: m.id,
      score: m.score,
      metadata: m.metadata || m?.payload || {}
    }));

    // 3) Synthesize with LLM using top hits, fallback to a simple titles list
    let answer = '';
    try {
      if (hits.length === 0) {
        answer = "I don't know — no matching documents found.";
      } else {
        answer = await synthesizeAnswerWithChat(query, hits);
      }
    } catch (err) {
      console.warn('LLM synthesis error; falling back to list', err && err.message);
      answer = hits.map((h, i) => `[${i + 1}] ${h.metadata?.title || h.metadata?.name || h.id} — ${(h.metadata?.snippet || '').slice(0, 300)}`).join('\n\n');
    }

    const sources = hits.map((h) => ({
      id: h.id,
      title: h.metadata?.title || h.metadata?.name || h.id,
      url: h.metadata?.url || h.metadata?.link || '',
      snippet: h.metadata?.snippet || h.metadata?.excerpt || h.metadata?.text || ''
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin
      },
      body: JSON.stringify({ query, answer, sources, meta: { top_k, returned: sources.length } })
    };

  } catch (err) {
    console.error('rag query error', err && (err.stack || err.message || err));
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': pickOrigin(incomingOrigin) },
      body: JSON.stringify({ error: err.message || 'server error' })
    };
  }
};
