// simple-blog-backend/getPosts.js
const { Client } = require("pg");
const Redis = require("ioredis");

// CORS headers configuration
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'OPTIONS,GET'
};

let redisClient;
let cacheDisabled = false;

function getRedisClient() {
  if (cacheDisabled) return null;
  if (!redisClient) {
    const ep = process.env.REDIS_ENDPOINT;
    if (!ep) {
      cacheDisabled = true;
      return null;
    }
    const [host, port] = ep.split(":");
    try {
      redisClient = new Redis({ host, port });
      redisClient.on("error", (err) => {
        console.warn("Redis error, disabling cache:", err.message);
        cacheDisabled = true;
        try { redisClient.disconnect(); } catch {}
      });
    } catch (e) {
      console.warn("Failed to init Redis, disabling cache:", e.message);
      cacheDisabled = true;
      return null;
    }
  }
  return redisClient;
}

// Fetch the plain-text password from environment variable
async function getDbPassword() {
  return process.env.DB_PASS;
}

// Connect to PostgreSQL inside your VPC
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

function attachImageUrlToRows(rows) {
  const uploadsBase = (process.env.UPLOADS_BASE || '').replace(/\/+$/, '');
  return rows.map(r => {
    const p = { ...r };
    if (p.image_key) {
      p.image_url = uploadsBase ? `${uploadsBase.replace(/\/+$/, '')}/${p.image_key.replace(/^\/+/, '')}` : null;
    }
    return p;
  });
}

exports.handler = async (event) => {
  // OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  console.log("🟢 getPosts invoked");

  const redis = getRedisClient();
  const cacheKey = "posts:all";

  // 1) Try cache if available
  if (redis) {
    try {
      console.log("🟢 pinging Redis at", process.env.REDIS_ENDPOINT);
      await redis.ping();
      console.log("🟢 Redis ping succeeded");

      console.log("🟢 checking cache for key", cacheKey);
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log("🟢 Cache hit");
        // attach image_url only if needed (cache may already contain image_url)
        try {
          const parsed = JSON.parse(cached);
          const body = JSON.stringify(attachImageUrlToRows(parsed));
          return {
            statusCode: 200,
            headers: {
              ...CORS_HEADERS,
              "Content-Type": "application/json",
              "Cache-Control": "no-cache, no-store, must-revalidate"
            },
            body,
          };
        } catch (e) {
          // if cached value can't be parsed, fall through and refresh from DB
          console.warn("Failed to parse cached payload, refreshing DB", e.message);
        }
      }
      console.log("🟢 Cache miss");
    } catch (err) {
      console.warn("🟡 Redis unavailable or error, disabling cache:", err.message);
      cacheDisabled = true;
    }
  }

  // 2) Cache miss or cache disabled → fetch from RDS
  let client;
  try {
    client = await connectClient();
  } catch (dbConnErr) {
    console.error("🔴 DB connect failed:", dbConnErr);
    return {
      statusCode: 500,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      },
      body: JSON.stringify({ message: dbConnErr.message }),
    };
  }

  try {
    const res = await client.query(
      "SELECT * FROM posts ORDER BY created_at DESC"
    );
    await client.end();

    const rowsWithUrl = attachImageUrlToRows(res.rows);
    const body = JSON.stringify(rowsWithUrl);

    // 3) Populate cache if still enabled (store the rows as-is)
    if (!cacheDisabled && redis) {
      redis
        .set(cacheKey, body, "EX", 60)
        .catch((setErr) => {
          console.warn("🟡 Redis SET failed, disabling cache:", setErr.message);
          cacheDisabled = true;
        });
    }

    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
        // prevent CloudFront / browsers from caching the list response
        "Cache-Control": "no-cache, no-store, must-revalidate"
      },
      body,
    };
  } catch (queryErr) {
    console.error("🔴 Error running SELECT:", queryErr);
    if (client) await client.end();
    return {
      statusCode: 500,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      },
      body: JSON.stringify({ message: "Error fetching posts" }),
    };
  }
};
