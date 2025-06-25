// src/App.js
import React, { useEffect, useState, useMemo } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';   // <-- v6 functional import

const API_URL = 'https://scalabledeploy.com/api/posts';

function AppContent({ signOut, user }) {
  const [posts, setPosts]         = useState([]);
  const [newTitle, setNewTitle]   = useState('');
  const [newContent, setNewContent] = useState('');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  // Grab Cognito JWT via v6 API
  const getAuthToken = async () => {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString();
  };

  // Axios instance that attaches the JWT
  const authAxios = useMemo(() => {
    const instance = axios.create();
    instance.interceptors.request.use(async (config) => {
      const token = await getAuthToken();
      config.headers.Authorization = token;
      return config;
    });
    return instance;
  }, []);

  // Fetch posts on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await authAxios.get(API_URL);
        setPosts(res.data);
      } catch (err) {
        console.error('Fetch posts error:', err);
        setError('Failed to load posts.');
      } finally {
        setLoading(false);
      }
    })();
  }, [authAxios]);

  const createPost = async () => {
    setError('');
    try {
      const res = await authAxios.post(API_URL, {
        title: newTitle,
        content: newContent,
        author: user.username,
      });
      setPosts([res.data, ...posts]);
      setNewTitle('');
      setNewContent('');
    } catch (err) {
      console.error('Create post error:', err);
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
      const res = await authAxios.put(`${API_URL}/${post.id}`, updated);
      setPosts(posts.map((p) => (p.id === post.id ? res.data : p)));
    } catch (err) {
      console.error('Edit post error:', err);
      setError('Failed to edit post.');
    }
  };

  const deletePost = async (id) => {
    setError('');
    try {
      await authAxios.delete(`${API_URL}/${id}`);
      setPosts(posts.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Delete post error:', err);
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
              <h3 className="text-xl font-medium mb-2">{p.title}</h3>
              <p className="text-gray-700 mb-3">{p.content}</p>
              <div className="text-sm text-gray-500 mb-4">By {p.author}</div>
              <div className="flex">
                <button
                  onClick={() => editPost(p)}
                  className="text-yellow-600 hover:underline mr-4"
                >
                  Edit
                </button>
                <button
                  onClick={() => deletePost(p.id)}
                  className="text-red-600 hover:underline"
                >
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

export default function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
            <h1 className="text-xl font-semibold">Simple Blog</h1>
            <button
              onClick={signOut}
              className="bg-red-600 px-3 py-1 rounded hover:bg-red-700"
            >
              Sign Out
            </button>
          </header>

          {/* Main Content */}
          <main className="flex-grow bg-gray-50 p-6">
            <AppContent signOut={signOut} user={user} />
          </main>

          {/* Footer */}
          <footer className="bg-gray-800 text-gray-300 p-4 text-center">
            © 2025 Omar —{' '}
            <a
              href="https://github.com/omare84"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              GitHub
            </a>
          </footer>
        </div>
      )}
    </Authenticator>
  );
}

