// Make API_BASE a clean base URL (no trailing slash, no trailing "/posts").
const raw = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' ? '/api' : '');

function stripTrailingSlash(s) {
  return s ? s.replace(/\/+$/, '') : s;
}

function removeTrailingPosts(s) {
  return s ? s.replace(/\/posts$/, '') : s;
}

const cleaned = stripTrailingSlash(removeTrailingPosts(raw));

// DEFAULT to '/api' (not empty) so frontend calls '/api/...' when REACT_APP_API_URL is not set.
export const API_BASE = cleaned || '/api';

// API_URL is the full posts endpoint that the app uses to fetch posts.
export const API_URL = API_BASE
  ? (API_BASE.endsWith('/api') ? `${API_BASE}/posts` : `${API_BASE}/api/posts`)
  : '/api/posts';