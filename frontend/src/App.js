import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'https://scalabledeploy.com/api/posts';

function App() {
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState({ title: '', content: '', author: '' });
    const [editingPost, setEditingPost] = useState(null);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const response = await axios.get(API_URL);
            setPosts(response.data);
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const method = editingPost ? 'put' : 'post';
        const url = editingPost ? `${API_URL}/${editingPost.id}` : API_URL;

        try {
            const response = await axios({
                method,
                url,
                data: newPost,
            });

            if (response.status === 200 || response.status === 201) {
                fetchPosts();
                setNewPost({ title: '', content: '', author: '' });
                setEditingPost(null);
            }
        } catch (error) {
            console.error(`Error ${editingPost ? 'updating' : 'creating'} post:`, error);
        }
    };

    const handleEdit = (post) => {
        setNewPost(post);
        setEditingPost(post);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${API_URL}/${id}`);
            fetchPosts();
        } catch (error) {
            console.error('Error deleting post:', error);
        }
    };

    return (
        <div>
            <h1>Simple Blog</h1>

            {/* Form to create/update a post */}
            <form onSubmit={handleSubmit}>
                <input 
                    type="text" 
                    placeholder="Title" 
                    value={newPost.title} 
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })} 
                    required 
                />
                <textarea 
                    placeholder="Content" 
                    value={newPost.content} 
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })} 
                    required 
                />
                <input 
                    type="text" 
                    placeholder="Author" 
                    value={newPost.author} 
                    onChange={(e) => setNewPost({ ...newPost, author: e.target.value })} 
                    required 
                />
                <button type="submit">{editingPost ? 'Update Post' : 'Create Post'}</button>
            </form>

            {/* Display posts */}
            {posts.length > 0 ? (
                <ul>
                    {posts.map((post) => (
                        <li key={post.id}>
                            <h2>{post.title}</h2>
                            <p>{post.content}</p>
                            <small>By {post.author}</small>
                            <button onClick={() => handleEdit(post)}>Edit</button>
                            <button onClick={() => handleDelete(post.id)}>Delete</button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No posts available</p>
            )}
        </div>
    );
}

export default App;