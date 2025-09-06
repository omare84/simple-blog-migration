// frontend/src/config.js
// Keep API_BASE as the base URL only (no trailing slash)
const raw = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' ? '/api' : '/api');

function normalizeBase(url) {
  if (!url) return url;
  // full URLs: remove trailing slashes only
  if (/^https?:\/\//i.test(url)) return url.replace(/\/+$/,'');
  // relative paths: ensure single leading slash, no trailing slash
  return '/' + url.replace(/^\/+|\/+$/g,'');
}

export const API_BASE = normalizeBase(raw);
// optional convenience if other code expects API_URL:
export const API_URL = `${API_BASE}/posts`;
