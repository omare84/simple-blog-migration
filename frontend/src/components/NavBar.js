// src/components/NavBar.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-white shadow">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <div className="flex-shrink-0">
            <Link to="/" className="font-bold text-lg text-gray-900">ScalableDeploy</Link>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            <Link to="/features" className="text-sm text-gray-700 hover:underline">Features</Link>
            <Link to="/blog" className="text-sm text-gray-700 hover:underline">Blog</Link>
            <Link to="/case-studies" className="text-sm text-gray-700 hover:underline">Case Studies</Link>
            <Link to="/home" className="text-sm text-gray-700 px-3 py-1 rounded hover:bg-gray-100">Sign In</Link>
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
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setOpen(!open)}
              aria-controls="mobile-menu"
              aria-expanded={open}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon: hamburger / X */}
              {!open ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu (collapsible) */}
      {open && (
        <div id="mobile-menu" className="md:hidden border-t">
          <div className="px-4 py-3 space-y-2 bg-white">
            <Link onClick={() => setOpen(false)} to="/features" className="block text-gray-700">Features</Link>
            <Link onClick={() => setOpen(false)} to="/blog" className="block text-gray-700">Blog</Link>
            <Link onClick={() => setOpen(false)} to="/case-studies" className="block text-gray-700">Case Studies</Link>
            <Link onClick={() => setOpen(false)} to="/home" className="block text-gray-700">Sign In</Link>

            <a
              href="https://www.upwork.com/freelancers/~01fc1ccac3e5af5062"
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-2 px-4 py-2 bg-indigo-600 text-white rounded text-center"
            >
              Work With Us
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
