const { Client } = require("pg");
const Redis = require("ioredis");

// CORS headers configuration
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'OPTIONS,POST'
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
      // if any error occurs on the client, disable caching permanently
      redisClient.on("error", (err) => {
        console.warn("Redis error, disabling cache:", err.message);
        cacheDisabled = true;
        redisClient.disconnect();
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

// Construct & connect a new PG client
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
  // Handle OPTIONS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  console.log("RAW event.body:", event.body);

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (e) {
    console.error("Invalid JSON:", event.body);
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: "Invalid JSON in request body" }),
    };
  }

  const { title, content, author } = payload;
  let client;

  try {
    client = await connectClient();
    const res = await client.query(
      "INSERT INTO posts(title, content, author) VALUES($1,$2,$3) RETURNING *",
      [title, content, author]
    );
    const created = res.rows[0];

    // Invalidate the cache so next GET /posts is fresh
    const redis = getRedisClient();
    if (redis) {
      try {
        await redis.del("posts:all");
        console.log("Cache invalidated for posts:all");
      } catch (cacheErr) {
        console.warn("Failed to invalidate cache:", cacheErr.message);
        cacheDisabled = true;
      }
    }

    return {
      statusCode: 201,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(created),
    };
  } catch (err) {
    console.error("Error inserting post:", err);
    return {
      statusCode: 500,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: "Error creating post" }),
    };
  } finally {
    if (client) {
      try { await client.end(); } catch {}
    }
  }
};