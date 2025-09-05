// frontend/src/setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      logLevel: 'debug',

      /**
       * CRA mounts the middleware at '/api', so the path passed to
       * the proxy middleware will be like '/posts' (the mount gets stripped).
       * Backend expects '/api/posts', so prepend '/api' back.
       */
      pathRewrite: (path, req) => {
        // path will be '/posts' (or '/posts/...' etc)
        // ensure upstream sees '/api/posts...'
        return `/api${path}`;
      },

      onProxyReq: (proxyReq, req, res) => {
        // optional: useful for debugging if you uncomment
        // console.debug('[proxy:onProxyReq] outgoing path:', proxyReq.path);
      },

      onProxyRes: (proxyRes, req, res) => {
        // optional debug
        // console.debug('[proxy:onProxyRes] upstream status:', proxyRes.statusCode);
      },

      onError: (err, req, res) => {
        console.error('[proxy] error:', err && err.message);
        if (!res.headersSent) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Proxy error', message: err && err.message }));
        }
      },
    })
  );
};
