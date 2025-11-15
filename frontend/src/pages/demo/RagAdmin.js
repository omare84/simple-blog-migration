// frontend/src/pages/demo/RagAdmin.js
import React, { useState } from 'react';
import { API_BASE } from '../../config';

export default function RagAdmin() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');

  async function uploadCsvAsText(csvText, filename) {
    setStatus('Uploading...');
    try {
      const res = await fetch(`${API_BASE}/rag/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: csvText })
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Ingest failed: ${res.status} ${text}`);
      }
      const j = await res.json();
      setStatus(`Ingested: ${j.ingested || 'unknown'}`);
    } catch (err) {
      console.error('ingest error', err);
      setStatus('Error: ' + (err.message || 'ingest failed'));
    }
  }

  function onFile(e) {
    setFile(e.target.files[0]);
  }

  function onSubmit(e) {
    e.preventDefault();
    if (!file) return setStatus('Pick a CSV first');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const csv = ev.target.result;
      uploadCsvAsText(csv, file.name);
    };
    reader.readAsText(file);
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl mb-4">RAG Admin — Ingest CSV</h1>
      <p className="mb-4 text-gray-700">Upload a CSV of products (columns: id,title,description,url). The CSV will be embedded and indexed in the vector store.</p>

      <form onSubmit={onSubmit}>
        <input type="file" accept=".csv" onChange={onFile} />
        <div className="mt-3">
          <button className="px-4 py-2 bg-indigo-600 text-white rounded" type="submit">Ingest CSV</button>
        </div>
      </form>

      <div className="mt-4 text-sm text-gray-600">
        <div>Status: {status}</div>
      </div>
    </div>
  );
}
