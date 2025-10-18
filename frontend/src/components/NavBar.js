// frontend/src/components/NavBar.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-white shadow">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo / left */}
          <div className="flex items-center">
            <Link to="/" className="font-bold text-lg md:text-xl text-gray-800">
              ScalableDeploy
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/features" className="text-sm hover:underline text-gray-700">Services</Link>
            <Link to="/blog" className="text-sm hover:underline text-gray-700">Blog</Link>
            <Link to="/case-studies" className="text-sm hover:underline text-gray-700">Case Studies</Link>
            <Link to="/home" className="text-sm px-3 py-1 bg-indigo-50 rounded text-gray-800 hover:bg-indigo-100">Sign In</Link>
            <a
              href="https://www.upwork.com/freelancers/~01fc1ccac3e5af5062"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Work With Us
            </a>
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden">
            <button
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label="Toggle navigation"
              className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {open ? (
                // X icon
                <svg className="w-6 h-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                // Hamburger
                <svg className="w-6 h-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu content */}
        <div className={`${open ? 'block' : 'hidden'} md:hidden pb-4`}>
          <div className="space-y-2">
            <Link to="/features" onClick={() => setOpen(false)} className="block px-2 py-2 rounded hover:bg-gray-50">Services</Link>
            <Link to="/blog" onClick={() => setOpen(false)} className="block px-2 py-2 rounded hover:bg-gray-50">Blog</Link>
            <Link to="/case-studies" onClick={() => setOpen(false)} className="block px-2 py-2 rounded hover:bg-gray-50">Case Studies</Link>
            <Link to="/home" onClick={() => setOpen(false)} className="block px-2 py-2 rounded bg-indigo-50">Sign In</Link>
            <a
              href="https://www.upwork.com/freelancers/~01fc1ccac3e5af5062"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="block px-2 py-2 rounded bg-indigo-600 text-white text-center"
            >
              Work With Us
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
