// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { Amplify } from 'aws-amplify';
import awsConfig from './aws-exports';
import HomePage from './pages/HomePage';
import FeaturesPage from './pages/FeaturesPage';
import ComingSoon from './pages/ComingSoon';
import './index.css';

Amplify.configure(awsConfig);

export function NavBar() {
  return (
    <nav className="p-4 bg-white shadow flex items-center">
      <Link to="/" className="mr-6 font-medium hover:underline">Home</Link>
      <Link to="/features" className="mr-6 font-medium hover:underline">Features</Link>
      <a
        href="https://scalabledeploy.com/blog"
        target="_blank"
        rel="noopener noreferrer"
        className="mr-6 font-medium hover:underline"
      >
        Blog
      </a>
      <a
        href="https://www.upwork.com/…"
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium hover:underline"
      >
        Hire Me
      </a>
    </nav>
  );
}

export default function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <BrowserRouter>
          <div className="min-h-screen flex flex-col">
            <NavBar />

            {/* Optional: put a site header here, if you like */}
            <header className="bg-gray-800 text-white p-4">
              <div className="container mx-auto flex justify-between">
                <h1 className="text-xl font-semibold">Simple Blog</h1>
                <button
                  onClick={signOut}
                  className="bg-red-600 px-3 py-1 rounded hover:bg-red-700"
                >
                  Sign Out
                </button>
              </div>
            </header>

            <main className="flex-grow bg-gray-50 p-6">
              <Routes>
                <Route path="/" element={<HomePage user={user} />} />
                <Route path="/features" element={<FeaturesPage />} />
                <Route
                  path="/blog/cache"
                  element={<ComingSoon title="Caching Deep Dive" />}
                />
                <Route
                  path="/blog/image-upload"
                  element={<ComingSoon title="Image Upload Walkthrough" />}
                />
                {/* add more <Route> as you build real pages */}
              </Routes>
            </main>

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
        </BrowserRouter>
      )}
    </Authenticator>
  );
}
