// src/components/NavBar.js
import React from 'react';
import { Link } from 'react-router-dom';

export default function NavBar() {
  return (
    <nav className="bg-white shadow p-4">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link to="/" className="font-bold text-lg text-gray-800">ScalableDeploy</Link>
          <div className="hidden sm:flex items-center space-x-3 text-sm">
            <Link to="/features" className="hover:underline text-gray-700">Services</Link>
            <Link to="/blog" className="hover:underline text-gray-700">Blog</Link>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-3 text-sm">
            <Link to="/case-studies" className="hover:underline text-gray-700">Case Studies</Link>
            <Link to="/home" className="px-3 py-1 bg-indigo-50 rounded text-indigo-700 hover:underline">Sign In</Link>
          </div>

          <a
            href="https://www.upwork.com/freelancers/~01fc1ccac3e5af5062"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
          >
            Work With Us
          </a>
        </div>
      </div>
    </nav>
  );
}