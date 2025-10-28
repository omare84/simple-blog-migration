// frontend/src/pages/demo/RagDemo.js
import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../../config';

export default function RagDemo() {
  const [messages, setMessages] = useState([
    { id: 'sys', who: 'system', text: 'Demo RAG chat: ask about products or support (e.g., "refund policy")' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendQuery(q) {
    if (!q) return;
    const userMsg = { id: Date.now().toString(), who: 'you', text: q };
    setMessages(m => [...m, userMsg]);
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/rag/query`, { query: q });
      const { answer, sources } = res.data;
      setMessages(m => [...m, userMsg, { id: Date.now() + '-bot', who: 'bot', text: answer, sources }]);
    } catch (e) {
      setMessages(m => [...m, { id: Date.now() + '-err', who: 'bot', text: 'Error: could not fetch answer' }]);
      console.error('RAG query error', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">RAG Starter — Demo Chat</h1>

      <div className="bg-white border rounded p-4 mb-4" style={{ minHeight: 240 }}>
        {messages.map((m) => (
          <div key={m.id} className={`mb-3 ${m.who === 'you' ? 'text-right' : ''}`}>
            <div className={`inline-block p-2 rounded ${m.who === 'you' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
              <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
              {m.sources && m.sources.length > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  <strong>Sources:</strong>
                  <ul>
                    {m.sources.map(s => (
                      <li key={s.id}>{s.title} — {s.excerpt.slice(0, 120)}{s.excerpt.length > 120 ? '…' : ''}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="border rounded px-3 py-2 flex-grow"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask something (e.g., 'refund policy')"
          onKeyDown={e => { if (e.key === 'Enter') { sendQuery(input); setInput(''); } }}
        />
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          disabled={loading}
          onClick={() => { sendQuery(input); setInput(''); }}
        >
          {loading ? 'Thinking…' : 'Send'}
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <strong>Note:</strong> This is a mock RAG demo. Replace the backend with embeddings + vector search for production.
      </div>
    </div>
  );
}
