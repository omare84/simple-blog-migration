// frontend/src/pages/BlogPage.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

// helper to join base + path without double slashes
function joinUrl(base, path) {
  if (!base) return path || null;
  const b = base.replace(/\/+$/, '');
  const p = (path || '').replace(/^\/+/, '');
  return `${b}/${p}`;
}

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  async function fetchPosts() {
    try {
      setLoading(true);
      const res = await axios.get(`/api/posts?q=${encodeURIComponent(q)}&page=${page}`);
      const data = res.data.value || res.data.posts || res.data;
      // Ensure each post has image_url if we can build one from image_key
      const UPLOADS_BASE = process.env.REACT_APP_UPLOADS_BASE || `https://${window.location.host}`;
      const normalized = Array.isArray(data)
        ? data.map(p => {
            const copy = { ...p };
            if (!copy.image_url && copy.image_key) {
              copy.image_url = joinUrl(UPLOADS_BASE, copy.image_key);
            }
            return copy;
          })
        : data;
      setPosts(normalized);
    } catch (err) {
      console.error('fetchPosts error', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line
  }, [q, page]);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search posts"
          className="border p-2 w-full"
        />
      </div>

      {loading ? <p>Loading…</p> : posts.length === 0 ? <p>No posts found.</p> : null}

      {posts.map((p) => (
        <article key={p.id} className="p-4 border rounded mb-4">
          {/* COVER IMAGE */}
          {p.image_url ? (
            <img
              src={p.image_url}
              alt="cover"
              className="mb-4 w-full h-48 object-cover rounded"
              onError={(e) => {
                // hide broken images; don't crash the layout
                e.currentTarget.style.display = 'none';
                console.warn('img load error', p.image_url);
              }}
            />
          ) : null}

          <h3 className="font-bold">{p.title}</h3>
          <div className="text-gray-700 whitespace-pre-wrap">{p.content}</div>
          <small className="text-gray-500">By {p.author}</small>
        </article>
      ))}

      <div className="flex justify-between mt-4">
        <button onClick={() => setPage((n) => Math.max(1, n - 1))} disabled={page === 1}>
          Previous
        </button>
        <div>Page {page}</div>
        <button onClick={() => setPage((n) => n + 1)}>Next</button>
      </div>
    </div>
  );
}
