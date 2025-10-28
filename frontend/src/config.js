// Make API_BASE a clean base URL (no trailing slash, no trailing "/posts").
const raw = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' ? '/api' : '');

function stripTrailingSlash(s) {
  return s ? s.replace(/\/+$/, '') : s;
}

function removeTrailingPosts(s) {
  return s ? s.replace(/\/posts$/, '') : s;
}

const cleaned = stripTrailingSlash(removeTrailingPosts(raw));

// If cleaned is empty (development), keep it as empty string so we use CRA proxy paths.
export const API_BASE = cleaned || '';

// API_URL is the full posts endpoint that the app uses to fetch posts.
// - If API_BASE is empty (dev) use the proxy /api/posts
// - If API_BASE ends with '/api' (i.e. user set .../prod/api) then append '/posts'
// - If API_BASE does not include '/api', assume SAM used '/prod' base and prepend '/api/posts'
export const API_URL = API_BASE
  ? (API_BASE.endsWith('/api') ? `${API_BASE}/posts` : `${API_BASE}/api/posts`)
  : '/api/posts';
