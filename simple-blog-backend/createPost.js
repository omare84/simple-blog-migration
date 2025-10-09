// simple-blog-backend/createPost.js
const { Client } = require("pg");
const Redis = require("ioredis");

// CORS headers configuration
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
  "Access-Control-Allow-Methods": "OPTIONS,POST",
};

let redisClient;
let cacheDisabled = false;

function createRedis(ep) {
  if (!ep) return null;
  const [host, port] = ep.includes(":") ? ep.split(":") : [ep, undefined];
  const opts = port ? { host, port: parseInt(port, 10) } : { host };
  const client = new Redis(opts);
  client.on("error", (err) => {
    console.warn("Redis error event:", err && err.message ? err.message : err);
    cacheDisabled = true;
    try {
      client.disconnect();
    } catch (e) {}
  });
  return client;
}

function getRedisClient() {
  if (cacheDisabled) return null;
  if (!redisClient) {
    const ep = process.env.REDIS_ENDPOINT;
    if (!ep) {
      cacheDisabled = true;
      return null;
    }
    try {
      redisClient = createRedis(ep);
    } catch (e) {
      console.warn("Failed to init Redis, disabling cache:", e && e.message ? e.message : e);
      cacheDisabled = true;
      return null;
    }
  }
  return redisClient;
}

// Fetch DB password from env
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

function buildUploadsBase() {
  const b = process.env.UPLOADS_BASE || "";
  if (b) return b.replace(/\/+$/, "");
  if (process.env.UPLOADS_BUCKET) return `https://${process.env.UPLOADS_BUCKET}.s3.amazonaws.com`.replace(/\/+$/, "");
  return "";
}

exports.handler = async (event) => {
  // OPTIONS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: "",
    };
  }

  console.log("RAW event.body:", event.body);

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    console.error("Invalid JSON:", event.body);
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: "Invalid JSON in request body" }),
    };
  }

  const { title, content, author } = payload;
  const image_key = payload.image_key || payload.imageKey || null;

  // simple validation
  if (!title || !content || !author) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: "Missing title, content, or author" }),
    };
  }

  const uploadsBase = buildUploadsBase();

  let client;
  try {
    client = await connectClient();

    // Insert including image_key column (DB must have this column)
    const res = await client.query(
      "INSERT INTO posts(title, content, author, image_key) VALUES($1,$2,$3,$4) RETURNING *",
      [title, content, author, image_key]
    );
    const created = res.rows[0];

    // Attach canonical image_url if image_key present
    if (created && created.image_key) {
      const key = `${created.image_key}`.replace(/^\/+/, "");
      created.image_url = uploadsBase ? `${uploadsBase}/${key}` : null;
    }

    // Invalidate cache (best-effort)
    const redis = getRedisClient();
    if (redis && !cacheDisabled) {
      try {
        await redis.del("posts:all");
        console.log("Cache invalidated for posts:all");
      } catch (cacheErr) {
        console.warn("Failed to invalidate cache:", cacheErr && cacheErr.message ? cacheErr.message : cacheErr);
        cacheDisabled = true;
      }
    }

    return {
      statusCode: 201,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify(created),
    };
  } catch (err) {
    console.error("Error inserting post:", err && err.message ? err.message : err);
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Error creating post" }),
    };
  } finally {
    if (client) {
      try {
        await client.end();
      } catch {}
    }
  }
};
