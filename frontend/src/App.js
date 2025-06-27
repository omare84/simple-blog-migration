// src/App.js
import React, { useEffect, useState, useMemo } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

const API_URL = 'https://scalabledeploy.com/api/posts';

function AppContent({ signOut, user }) {
  const [posts, setPosts]           = useState([]);
  const [newTitle, setNewTitle]     = useState('');
  const [newContent, setNewContent] = useState('');
  const [imageKey, setImageKey]     = useState('');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  // 1) Get Cognito JWT
  const getAuthToken = async () => {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString();
  };

  // 2) Axios instance with JWT header
  const authAxios = useMemo(() => {
    const instance = axios.create();
    instance.interceptors.request.use(async (config) => {
      const token = await getAuthToken();
      config.headers.Authorization = token;
      return config;
    });
    return instance;
  }, []);

  // 3) Fetch posts
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await authAxios.get(API_URL);
        setPosts(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load posts.');
      } finally {
        setLoading(false);
      }
    })();
  }, [authAxios]);

  // 4) Create new post (with optional image)
  const createPost = async () => {
    setError('');
    try {
      let imageUrl = '';
      if (imageKey) {
        // Construct your public URL: this assumes your CloudFront domain matches window hostname
        imageUrl = `https://${window.location.host}/uploads/${imageKey}`;
      }

      const payload = {
        title:   newTitle,
        content: newContent,
        author:  user.username,
        ...(imageUrl && { image_url: imageUrl }),
      };

      const res = await authAxios.post(API_URL, payload);
      setPosts([res.data, ...posts]);
      setNewTitle('');
      setNewContent('');
      setImageKey('');
    } catch (err) {
      console.error(err);
      setError('Failed to create post.');
    }
  };

  // 5) Edit/delete unchanged
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
      console.error(err);
      setError('Failed to edit post.');
    }
  };
  const deletePost = async (id) => {
    setError('');
    try {
      await authAxios.delete(`${API_URL}/${id}`);
      setPosts(posts.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      setError('Failed to delete post.');
    }
  };

  // Loading/Error states
  if (loading) return <div className="text-center p-8">Loading posts…</div>;
  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-red-100 text-red-800 p-3 rounded">{error}</div>
      </div>
    );
  }

  // UI
  return (
    <div className="max-w-2xl mx-auto p-5">
      {/* Create New Post */}
      <section className="mb-8 bg-white shadow rounded p-6">
        <h2 className="text-lg font-semibold mb-4">Create New Post</h2>

        {/* File input */}
        <label className="block mb-4">
          <span className="text-sm font-medium">Cover Image (optional)</span>
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;

              // 1. Get presigned URL + key
              const { uploadUrl, key } = await authAxios.get(
                `${API_URL}/${user.username}/upload-url`,
                {
                  params: {
                    ext: file.name.split('.').pop(),
                    contentType: file.type,
                  },
                }
              ).then(r => r.data);

              // 2. Upload file to S3
              await fetch(uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file,
              });

              // 3. Store key for later inclusion
              setImageKey(key);
            }}
            className="mt-1 block w-full text-sm text-gray-700"
          />
          {imageKey && (
            <p className="text-xs text-green-600 mt-1">Image ready to attach</p>
          )}
        </label>

        {/* Title + Content */}
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

        {/* Submit */}
        <button
          onClick={createPost}
          disabled={
            !newTitle.trim() || !newContent.trim()
          }
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
              {/* Show image if present */}
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
