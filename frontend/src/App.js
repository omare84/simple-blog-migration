// src/App.js
import React, { useEffect, useState, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import awsConfig from './aws-exports';
import HomePage from './pages/HomePage';
import FeaturesPage from './pages/FeaturesPage';
import ComingSoon from './pages/ComingSoon';
import './index.css';

Amplify.configure(awsConfig);

// ─── AppContent (reusable home content) ─────────────────────────────────────
export function AppContent({ signOut, user }) {
  const [posts, setPosts] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [imageKey, setImageKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getAuthToken = async () => {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString();
  };

  const authAxios = useMemo(() => {
    const instance = axios.create();
    instance.interceptors.request.use(async (config) => {
      const token = await getAuthToken();
      config.headers.Authorization = token;
      return config;
    });
    return instance;
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await authAxios.get('https://scalabledeploy.com/api/posts');
        setPosts(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load posts.');
      } finally {
        setLoading(false);
      }
    })();
  }, [authAxios]);

  // eslint-disable-next-line no-unused-vars
  const createPost = async () => {
    setError('');
    try {
      let imageUrl = '';
      if (imageKey) {
        imageUrl = `https://${window.location.host}/uploads/${imageKey}`;
      }

      const payload = {
        title: newTitle,
        content: newContent,
        author: user.username,
        ...(imageUrl && { image_url: imageUrl }),
      };

      const res = await authAxios.post('https://scalabledeploy.com/api/posts', payload);
      setPosts([res.data, ...posts]);
      setNewTitle('');
      setNewContent('');
      setImageKey('');
    } catch (err) {
      console.error(err);
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
      const res = await authAxios.put(`https://scalabledeploy.com/api/posts/${post.id}`, updated);
      setPosts(posts.map((p) => (p.id === post.id ? res.data : p)));
    } catch (err) {
      console.error(err);
      setError('Failed to edit post.');
    }
  };

  const deletePost = async (id) => {
    setError('');
    try {
      await authAxios.delete(`https://scalabledeploy.com/api/posts/${id}`);
      setPosts(posts.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      setError('Failed to delete post.');
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading posts…</div>;
  }
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
        {/* file input and fields... */}
      </section>

      {/* Blog Posts List */}
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
                />
              )}
              <h3 className="text-xl font-medium mb-2">{p.title}</h3>
              <p className="text-gray-700 mb-3">{p.content}</p>
              <div className="text-sm text-gray-500 mb-4">By {p.author}</div>
              <div className="flex">
                <button onClick={() => editPost(p)} className="text-yellow-600 hover:underline mr-4">
                  Edit
                </button>
                <button onClick={() => deletePost(p.id)} className="text-red-600 hover:underline">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

// ─── NavBar Component ───────────────────────────────────────────────────────────
export function NavBar() {
  return (
    <nav className="p-4 bg-white shadow flex items-center">
      <Link to="/" className="mr-6 font-medium hover:underline">Home</Link>
      <Link to="/features" className="mr-6 font-medium hover:underline">Features</Link>
      <a href="https://scalabledeploy.com/blog" target="_blank" rel="noopener noreferrer" className="mr-6 font-medium hover:underline">
        Blog
      </a>
      <a href="https://www.upwork.com/…" target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
        Hire Me
      </a>
    </nav>
  );
}

export default function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <BrowserRouter>
          <div className="min-h-screen flex flex-col">
            <NavBar />
            <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
              <h1 className="text-xl font-semibold">Simple Blog</h1>
              <button onClick={signOut} className="bg-red-600 px-3 py-1 rounded hover:bg-red-700">
                Sign Out
              </button>
            </header>
            <main className="flex-grow bg-gray-50 p-6">
              <Routes>
                <Route path="/" element={<HomePage user={user} signOut={signOut} />} />
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/blog/cache" element={<ComingSoon title="Caching Deep Dive" />} />
                <Route path="/blog/image-upload" element={<ComingSoon title="Image Upload Walkthrough" />} />
              </Routes>
            </main>
            <footer className="bg-gray-800 text-gray-300 p-4 text-center">
              © 2025 Omar —{' '}
              <a href="https://github.com/omare84" target="_blank" rel="noopener noreferrer" className="underline">
                GitHub
              </a>
            </footer>
          </div>
        </BrowserRouter>
      )}
    </Authenticator>
  );
}