// src/components/NavBar.js
import React from 'react';
import { Link } from 'react-router-dom';

export default function NavBar() {
  return (
    <nav className="bg-white shadow p-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link to="/" className="font-bold text-lg">Simple Blog</Link>
          <Link to="/features" className="text-sm hover:underline">Features</Link>
          <Link to="/blog" className="text-sm hover:underline">Blog</Link>
          <Link to="/case-studies/caching" className="text-sm hover:underline">Caching Deep Dive</Link>
        </div>

        <div className="flex items-center space-x-6">
          <Link to="/case-studies" className="text-sm hover:underline">Case Studies</Link>
          <Link to="/home" className="text-sm px-3 py-1 bg-indigo-50 rounded hover:underline">Sign In</Link>
          <a
            href="https://www.upwork.com/freelancers/~01fc1ccac3e5af5062"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-indigo-600 text-white rounded"
          >
            Hire Me
          </a>
        </div>
      </div>
    </nav>
  );
}