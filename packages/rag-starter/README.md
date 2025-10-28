# RAG Starter — Mock Demo

This is a minimal runnable skeleton for a RAG demo (no external AI keys).

## Run the mock backend

```bash
cd packages/rag-starter
npm install

# Start server on port 5001 (to avoid conflict with main backend on port 5000)
npm start
The server exposes:

GET /api/rag/docs — list docs

POST /api/rag/ingest {title, text} — add doc

POST /api/rag/query {query} — mock query that returns answer + sources

Run frontend (from repo root)
Make sure your frontend dev server proxies:

/api → http://localhost:5000 (main blog backend)

/rag → http://localhost:5001 (RAG demo backend)

bash
cd frontend
npm start
Then open http://localhost:3000/demo/rag.

Development workflow
Terminal 1 - Main backend (port 5000):

bash
cd simple-blog-backend
node mock-server.js
Terminal 2 - RAG backend (port 5001):

bash
cd packages/rag-starter
npm start
Terminal 3 - Frontend (port 3000):

bash
cd frontend  
npm start
Sample queries to test:
"refund policy"

"product specifications"

"api rate limits"

"warranty information"

Next steps to production
Replace mock search with real embedding + vector DB (pgvector / Milvus / Pinecone / Supabase)

Add reranker / prompt templates and connect a model provider (OpenAI / Anthropic / SageMaker)

Add telemetry for tokens and latency, and usage-metering

Deploy as Lambda functions with API Gateway endpoints

text

**Key fixes made:**
- ✅ **Proper code blocks** with triple backticks and language specification
- ✅ **Consistent markdown formatting** (bullets, code blocks, headers)
- ✅ **Removed the extra "text" and "Key sections included"** at the end
- ✅ **Clean, professional documentation**
