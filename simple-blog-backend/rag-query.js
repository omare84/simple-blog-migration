// simple-blog-backend/rag-query.js
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

exports.handler = async (event) => {
  // Normalize header name casing
  const incomingOrigin = (event.headers && (event.headers.origin || event.headers.Origin)) || '';

  // Choose origin to return
  const acao = pickOrigin(incomingOrigin);

  // Shared CORS headers (no credentials)
  const CORS = {
    'Access-Control-Allow-Origin': acao,
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,Cache-Control,X-Amz-Date,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
    // optionally 'Access-Control-Expose-Headers': 'ETag,X-Cache' if you need clients to read them
  };

  // Handle preflight if ever forwarded here
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS,
      body: ''
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const query = body.query || '';

    // Mock/demo logic — replace with real RAG invocation
    let answer;
    if (!query) {
      answer = "I don't know — please provide a query";
    } else if (query.toLowerCase().includes('refund')) {
      answer = 'Refunds are processed within 5 business days. Provide order number and reason; photos required for damaged items.';
    } else {
      answer = `Mock answer for: ${query}`;
    }

    const response = {
      query,
      answer,
      meta: { mock: true, tokens_estimate: Math.max(1, Math.round((answer.length || 0) / 4)) }
    };

    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify(response)
    };
  } catch (err) {
    console.error('RAG handler error', err);
    return {
      statusCode: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'server error' })
    };
  }
};