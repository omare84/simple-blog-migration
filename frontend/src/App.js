// src/App.js
import React, { useEffect, useState } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import axios from 'axios';

const API_URL = 'https://scalabledeploy.com/api/posts';

function AppContent({ signOut, user }) {
  const [posts, setPosts] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get(API_URL);
        setPosts(res.data);
      } catch (err) {
        console.error('Fetch posts error:', err);
      }
    };
    fetchPosts();
  }, []);

  const createPost = async () => {
    try {
      const res = await axios.post(API_URL, {
        title: newTitle,
        content: newContent,
        userId: user.username,
      });
      setPosts([res.data, ...posts]);
      setNewTitle('');
      setNewContent('');
    } catch (err) {
      console.error('Create post error:', err);
    }
  };

  const editPost = async (post) => {
    try {
      const updated = {
        ...post,
        title: prompt('New title', post.title) || post.title,
        content: prompt('New content', post.content) || post.content,
      };
      const res = await axios.put(`${API_URL}/${post.id}`, updated);
      setPosts(posts.map((p) => (p.id === post.id ? res.data : p)));
    } catch (err) {
      console.error('Edit post error:', err);
    }
  };

  const deletePost = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      setPosts(posts.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Delete post error:', err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Welcome, {user.username}!</h1>
      <button onClick={signOut}>Sign Out</button>

      <h2>Create New Post</h2>
      <input
        type="text"
        placeholder="Title"
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
        style={{ width: '100%', marginBottom: 8 }}
      />
      <textarea
        placeholder="Content"
        value={newContent}
        onChange={(e) => setNewContent(e.target.value)}
        style={{ width: '100%', marginBottom: 8 }}
        rows={4}
      />
      <button
        onClick={createPost}
        disabled={!newTitle.trim() || !newContent.trim()}
      >
        New Post
      </button>

      <h2 style={{ marginTop: 32 }}>Blog Posts</h2>
      {posts.length === 0 ? (
        <p>No posts available.</p>
      ) : (
        posts.map((p) => (
          <div
            key={p.id}
            style={{
              marginBottom: 20,
              border: '1px solid #ccc',
              padding: 10,
              borderRadius: 4,
            }}
          >
            <h3>{p.title}</h3>
            <p>{p.content}</p>
            <button onClick={() => editPost(p)} style={{ marginRight: 8 }}>
              Edit
            </button>
            <button onClick={() => deletePost(p.id)}>Delete</button>
          </div>
        ))
      )}
    </div>
  );
}

export default function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <AppContent signOut={signOut} user={user} />
      )}
    </Authenticator>
  );
}
