// frontend/src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter as Router } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import awsConfig from './aws-exports';
import App from './App';
import './index.css';

Amplify.configure(awsConfig);

// Workaround: make sure history.state isn't `undefined` (prevents safeParseJson error)
try {
  // On some hosts/history states, history.state === undefined causes an internal JSON.parse on undefined.
  // Replace with null so React Router / history has something safe to read.
  if (typeof window !== 'undefined' && window.history && window.history.state === undefined) {
    // use replaceState to avoid adding a new history entry
    window.history.replaceState(null, document.title, window.location.href);
  }
} catch (err) {
  // Non-fatal: if this fails, just warn and continue — we'll see the original error in console.
  // eslint-disable-next-line no-console
  console.warn('history state guard failed', err);
}

const root = createRoot(document.getElementById('root'));
root.render(
  <Router>
    <App />
  </Router>
);