// frontend/src/config.js
// Robust API URL builder that accepts REACT_APP_API_URL either as
// "https://host/api" or "https://host/api/posts" and exports stable names.

const raw =
  process.env.NODE_ENV === 'development'
    ? (process.env.REACT_APP_API_URL || '/api')      // dev -> '/api' for CRA proxy
    : (process.env.REACT_APP_API_URL || 'https://scalabledeploy.com/api'); // prod default

// strip trailing slashes
let base = raw.replace(/\/+$/, '');
// if someone provided '/posts' at the end, remove it (handle both forms)
base = base.replace(/\/posts$/i, '');

// Exports:
// - API_BASE (legacy alias for older imports in your repo)
// - API_BASE_URL (clearer name; use in new code)
// - API_URL (canonical posts endpoint)
export const API_BASE = base;
export const API_BASE_URL = base;
export const API_URL = `${base}/posts`;
