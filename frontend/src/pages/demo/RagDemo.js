// frontend/src/pages/demo/RagDemo.js
import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../../config';

export default function RagDemo() {
  const [messages, setMessages] = useState([
    { id: 'sys', who: 'system', text: 'RAG demo connected — ask about products or support (e.g., "refund policy")' }
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
      const { answer, sources } = res.data || {};

      // normalize sources (support different backends)
      const normSources = (sources || []).map(s => ({
        id: s.id,
        title: s.title || s.name || 'Untitled',
        url: s.url || s.link || '',
        snippet: s.snippet || s.excerpt || ''
      }));

      const botMsg = {
        id: Date.now() + '-bot',
        who: 'bot',
        text: answer || "I don't know — no matching documents found.",
        sources: normSources
      };

      setMessages(m => [...m, botMsg]);
      // optionally scroll into view here
    } catch (e) {
      console.error('RAG query error', e);
      setMessages(m => [...m, { id: Date.now() + '-err', who: 'bot', text: 'Error: could not fetch answer' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">RAG Starter — Demo Chat (Live)</h1>

      <div className="bg-white border rounded p-4 mb-4" style={{ minHeight: 240 }}>
        {messages.map((m) => (
          <div key={m.id} className={`mb-3 ${m.who === 'you' ? 'text-right' : ''}`}>
            <div className={`inline-block p-2 rounded ${m.who === 'you' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`} style={{ maxWidth: '85%' }}>
              <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>

              {m.sources && m.sources.length > 0 && (
                <div className="mt-2 text-sm text-gray-700">
                  <details>
                    <summary className="cursor-pointer text-xs text-gray-600">Sources ({m.sources.length}) ▾</summary>
                    <ul className="mt-2">
                      {m.sources.map(s => (
                        <li key={s.id} className="mb-2">
                          <div className="font-medium">{s.title}</div>
                          {s.url ? <div><a href={s.url} target="_blank" rel="noreferrer" className="text-indigo-600 underline text-xs">{s.url}</a></div> : null}
                          <div className="text-xs text-gray-600">{(s.snippet || '').slice(0, 250)}{(s.snippet || '').length > 250 ? '…' : ''}</div>
                        </li>
                      ))}
                    </ul>
                  </details>
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
        Connected to the live RAG backend. If results look empty, check ingest status in RAG Admin and try a query that matches an ingested title.
      </div>
    </div>
  );
}
