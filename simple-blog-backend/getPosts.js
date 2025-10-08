// simple-blog-backend/getPosts.js
const { Client } = require("pg");
const Redis = require("ioredis");

// CORS headers configuration
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
  "Access-Control-Allow-Methods": "OPTIONS,GET",
};

let redisClient = null;
let cacheDisabled = false;

function getRedisClient() {
  if (cacheDisabled) return null;
  if (redisClient) return redisClient;

  const ep = process.env.REDIS_ENDPOINT;
  if (!ep) {
    cacheDisabled = true;
    return null;
  }

  const [host, portStr] = ep.split(":");
  const port = portStr ? Number(portStr) : 6379;

  try {
    redisClient = new Redis({ host, port });
    // If redis emits an error at any point, disable caching to avoid unhandled errors.
    redisClient.on("error", (err) => {
      console.warn("Redis error, disabling cache:", err && err.message ? err.message : err);
      cacheDisabled = true;
      try {
        // best-effort cleanup
        redisClient.disconnect();
      } catch (e) {}
      redisClient = null;
    });
    return redisClient;
  } catch (e) {
    console.warn("Failed to init Redis client, disabling cache:", e && e.message ? e.message : e);
    cacheDisabled = true;
    redisClient = null;
    return null;
  }
}

// Read DB password from env (set by SAM/CFN dynamic reference or plain-text env for local dev)
async function getDbPassword() {
  return process.env.DB_PASS;
}

async function connectClient() {
  const password = await getDbPassword();
  const client = new Client({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password,
    port: 5432,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  return client;
}

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: "",
    };
  }

  console.info("🟢 getPosts invoked");

  const redis = getRedisClient();
  const cacheKey = "posts:all";

  // 1) Try returning cached response if present
  if (redis && !cacheDisabled) {
    try {
      console.info("🟢 pinging Redis at", process.env.REDIS_ENDPOINT);
      await redis.ping();
      console.info("🟢 Redis ping succeeded");

      const cached = await redis.get(cacheKey);
      if (cached) {
        console.info("🟢 Cache hit - returning cached posts");
        return {
          statusCode: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          body: cached, // already stringified
        };
      }
      console.info("🟢 Cache miss");
    } catch (err) {
      // disable cache after first sign of trouble (prevents repeated timeouts)
      console.warn("🟡 Redis unavailable or error, disabling cache:", err && err.message ? err.message : err);
      cacheDisabled = true;
      try { redis.disconnect(); } catch (e) {}
    }
  }

  // 2) Cache miss or cache disabled => fetch from RDS
  let client = null;
  try {
    client = await connectClient();
  } catch (dbConnErr) {
    console.error("🔴 DB connect failed:", dbConnErr && dbConnErr.message ? dbConnErr.message : dbConnErr);
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ message: "DB connection failed" }),
    };
  }

  try {
    const res = await client.query("SELECT * FROM posts ORDER BY created_at DESC");
    // ensure image_url exists for every row that has image_key
    const uploadsBase = (process.env.UPLOADS_BASE || "").replace(/\/+$/, "");

    const rowsWithUrls = res.rows.map((r) => {
      const p = { ...r };
      // if DB already stores image_url, keep it. Otherwise build from image_key if present.
      if (!p.image_url && p.image_key) {
        p.image_url = uploadsBase ? `${uploadsBase}/${p.image_key.replace(/^\/+/, "")}` : null;
      }
      return p;
    });

    const body = JSON.stringify(rowsWithUrls);

    // 3) Populate cache if available
    if (!cacheDisabled && redis) {
      try {
        // short TTL to keep cache reasonably fresh
        await redis.set(cacheKey, body, "EX", 60);
      } catch (setErr) {
        console.warn("🟡 Redis SET failed - disabling cache:", setErr && setErr.message ? setErr.message : setErr);
        cacheDisabled = true;
        try { redis.disconnect(); } catch (e) {}
      }
    }

    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body,
    };
  } catch (queryErr) {
    console.error("🔴 Error running SELECT:", queryErr && queryErr.message ? queryErr.message : queryErr);
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Error fetching posts" }),
    };
  } finally {
    if (client) {
      try {
        await client.end();
      } catch (e) {
        console.warn("Failed to close DB client:", e && e.message ? e.message : e);
      }
    }
  }
};
