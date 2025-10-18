// frontend/src/App.js
import React, { useEffect, useState, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import axios from 'axios';
import { Auth } from 'aws-amplify';

// pages
import HomePage from './pages/HomePage';
import FeaturesPage from './pages/FeaturesPage';
import ComingSoon from './pages/ComingSoon';
import BlogPage from './pages/BlogPage';
import CaseStudiesIndex from './pages/CaseStudiesIndex';
import LandingPage from './pages/LandingPage';
import CaseStudyCaching from './pages/case-studies/CaseStudyCaching';

// components
import NavBar from './components/NavBar';

// config
import { API_BASE } from './config';
import './index.css';

console.info('[DEBUG] API_BASE =', API_BASE);

// ─── URL Helper ──────────────────────────────────────────────────────────────
function joinUrl(base, path) {
  if (!base) return path || '';
  const b = base.replace(/\/+$/, '');        // remove trailing slashes
  const p = (path || '').replace(/^\/+/, ''); // remove leading slashes
  return `${b}/${p}`;
}

// ─── AppContent (reusable admin/CMS interface used by HomePage) ────────────
export function AppContent({ signOut, user }) {
  const [posts, setPosts] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [imageKey, setImageKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const getAuthToken = async () => {
    try {
      const session = await Auth.currentSession();
      return session.getIdToken().getJwtToken();
    } catch (err) {
      console.warn('No auth session:', err);
      return null;
    }
  };

  const authAxios = useMemo(() => {
    const instance = axios.create();
    instance.interceptors.request.use(async (config) => {
      const token = await getAuthToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
    return instance;
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await authAxios.get(`${API_BASE}/posts`);
        const safePosts = Array.isArray(res.data) ? res.data.slice(0, 50) : res.data;
        setPosts(safePosts);
      } catch (err) {
        console.error('[DEBUG] fetch posts error', err);
        setError('Failed to load posts.');
      } finally {
        setLoading(false);
      }
    })();
  }, [authAxios]);

  const createPost = async () => {
    setError('');
    try {
      // Best: prefer an explicit env var, fallback to current host
      const UPLOADS_BASE = process.env.REACT_APP_UPLOADS_BASE || `https://${window.location.host}`;

      const payload = {
        title: newTitle,
        content: newContent,
        author: (user && user.username) || 'unknown',
        ...(imageKey && { image_key: imageKey }),
      };

      const res = await authAxios.post(`${API_BASE}/posts`, payload);
      const created = res.data;

      console.debug('[DEBUG] created post', created);

      // If backend returned full image_url already, use it. Otherwise build safely from image_key.
      if (!created.image_url && created.image_key) {
        created.image_url = joinUrl(UPLOADS_BASE, created.image_key);
      }

      setPosts([created, ...posts]);
      setNewTitle('');
      setNewContent('');
      setImageKey('');
    } catch (err) {
      console.error('[DEBUG] create post error', err);
      setError('Failed to create post.');
    }
  };

  const editPost = async (post) => {
    setError('');
    try {
      const updated = {
        ...post,
        title: prompt('New title', post.title) || post.title,
        content: prompt('New content', post.content) || post.content,
      };
      const res = await authAxios.put(`${API_BASE}/posts/${post.id}`, updated);
      setPosts(posts.map((p) => (p.id === post.id ? res.data : p)));
    } catch (err) {
      console.error('[DEBUG] edit post error', err);
      setError('Failed to edit post.');
    }
  };

  const deletePost = async (id) => {
    setError('');
    try {
      await authAxios.delete(`${API_BASE}/posts/${id}`);
      setPosts(posts.filter((p) => p.id !== id));
    } catch (err) {
      console.error('[DEBUG] delete post error', err);
      setError('Failed to delete post.');
    }
  };

  if (loading) return <div className="text-center p-8">Loading posts…</div>;
  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-red-100 text-red-800 p-3 rounded">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-5">
      {/* Create New Post */}
      <section className="mb-8 bg-white shadow rounded p-6">
        <h2 className="text-lg font-semibold mb-4">Create New Post</h2>

        <label className="block mb-4">
          <span className="text-sm font-medium">Cover Image (optional)</span>
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;

              setError('');
              setUploading(true);

              try {
                const res = await authAxios.get(
                  `${API_BASE}/posts/${(user && user.username) || 'unknown'}/upload-url`,
                  {
                    params: {
                      ext: file.name.split('.').pop(),
                      contentType: file.type,
                    },
                  }
                );

                const { uploadUrl, key } = res.data;

                // Important: include Cache-Control header in the PUT exactly as the presign expects
                const cacheControlValue = 'public, max-age=31536000, immutable';

                const putRes = await fetch(uploadUrl, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': file.type,
                    'Cache-Control': cacheControlValue,
                  },
                  body: file,
                });

                if (!putRes.ok) {
                  // Read body as text (S3 returns XML on error) to make debugging easier
                  const bodyText = await putRes.text();
                  console.error('S3 PUT failed:', putRes.status, bodyText);
                  throw new Error(`Upload failed: ${putRes.status}`);
                }

                // upload succeeded — set key so user can attach it to post
                setImageKey(key);
              } catch (uErr) {
                console.error('[DEBUG] upload error', uErr);
                setError('Image upload failed. See console for details.');
              } finally {
                setUploading(false);
              }
            }}
            className="mt-1 block w-full text-sm text-gray-700"
            disabled={uploading}
          />
          {uploading && <p className="text-xs text-gray-600 mt-1">Uploading image…</p>}
          {imageKey && <p className="text-xs text-green-600 mt-1">Image ready to attach</p>}
        </label>

        <input
          type="text"
          placeholder="Title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="border rounded px-3 py-2 w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <textarea
          rows={4}
          placeholder="Content"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          className="border rounded px-3 py-2 w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={createPost}
          disabled={!newTitle.trim() || !newContent.trim()}
          className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Post
        </button>
      </section>

      {/* Blog Posts */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Blog Posts</h2>
        {posts.length === 0 ? (
          <p className="text-gray-600">No posts available.</p>
        ) : (
          posts.map((p) => (
            <div key={p.id} className="bg-white shadow rounded p-5 mb-4">
              {p.image_url && (
                <img
                  src={p.image_url}
                  alt="cover"
                  className="mb-4 w-full h-48 object-cover rounded"
                  onError={(e) => { e.currentTarget.style.display = 'none'; console.warn('img load error', p.image_url); }}
                />
              )}
              <h3 className="text-xl font-medium mb-2">{p.title}</h3>
              <div className="text-gray-700 mb-3" style={{ whiteSpace: 'pre-wrap' }}>{p.content}</div>
              <div className="text-sm text-gray-500 mb-4">By {p.author}</div>
              <div className="flex">
                <button onClick={() => editPost(p)} className="text-yellow-600 hover:underline mr-4">Edit</button>
                <button onClick={() => deletePost(p.id)} className="text-red-600 hover:underline">Delete</button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

// ─── Root App ────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">ScalableDeploy</h1>
      </header>

      <main className="flex-grow bg-gray-50 p-6">
        <Routes>
          <Route path="/" element={<LandingPage />} />

          {/* Protect only /home with Amplify Authenticator */}
          <Route
            path="/home"
            element={
              <Authenticator>
                {({ signOut, user }) => <HomePage user={user} signOut={signOut} />}
              </Authenticator>
            }
          />

          {/* Public pages */}
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/case-studies" element={<CaseStudiesIndex />} />
          <Route path="/case-studies/caching" element={<CaseStudyCaching />} />
          <Route path="/blog/image-upload" element={<ComingSoon title="Image Upload Walkthrough" />} />

          <Route path="*" element={<LandingPage />} />
        </Routes>
      </main>

      <footer className="bg-gray-800 text-gray-300 p-4 text-center">
        © {new Date().getFullYear()} Omar —{' '}
        <a href="https://github.com/omare84" target="_blank" rel="noopener noreferrer" className="underline">
          GitHub
        </a>
      </footer>
    </div>
  );
}
