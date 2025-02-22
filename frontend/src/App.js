import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
    const [posts, setPosts] = useState([]);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [author, setAuthor] = useState("");

    // Fetch blog posts from the backend API
    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const response = await axios.get('https://scalabledeploy.com/api/posts');
            setPosts(response.data);
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('https://scalabledeploy.com/api/posts', {
                title,
                content,
                author
            });

            if (response.status === 201) {
                fetchPosts(); // Refresh posts after adding new one
                setTitle("");
                setContent("");
                setAuthor("");
            }
        } catch (error) {
            console.error("Error creating post:", error);
        }
    };

    return (
        <div>
            <h1>Simple Blog</h1>

            {/* Form to create a new post */}
            <form onSubmit={handleSubmit}>
                <input 
                    type="text" 
                    placeholder="Title" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    required 
                />
                <textarea 
                    placeholder="Content" 
                    value={content} 
                    onChange={(e) => setContent(e.target.value)} 
                    required 
                />
                <input 
                    type="text" 
                    placeholder="Author" 
                    value={author} 
                    onChange={(e) => setAuthor(e.target.value)} 
                    required 
                />
                <button type="submit">Create Post</button>
            </form>

            {/* Display posts */}
            {posts.length > 0 ? (
                <ul>
                    {posts.map(post => (
                        <li key={post.id}>
                            <h2>{post.title}</h2>
                            <p>{post.content}</p>
                            <small>By {post.author}</small>
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
