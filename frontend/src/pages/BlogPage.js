// src/pages/BlogPage.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  async function fetchPosts() {
    try {
      setLoading(true);
      const res = await axios.get(`/api/posts?q=${encodeURIComponent(q)}&page=${page}`);
      // adapt if your API returns { value: [] }
      setPosts(res.data.value || res.data.posts || res.data);
    } catch (err) {
      console.error(err);
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
