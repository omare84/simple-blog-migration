import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
    const [posts, setPosts] = useState([]);

    // Fetch blog posts from the backend API
    useEffect(() => {
        axios.get('https://scalabledeploy.com/api/posts') // Change to HTTPS + domain
            .then(response => setPosts(response.data))
            .catch(error => console.error('Error fetching posts:', error));
    }, []);

    return (
        <div>
            <h1>Simple Blog</h1>
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