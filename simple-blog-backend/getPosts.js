// simple-blog-backend/getPosts.js

const { Client } = require("pg");
const Redis = require("ioredis");

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

exports.handler = async (event) => {
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
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: cached,
        };
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: dbConnErr.message }),
    };
  }

  try {
    const res = await client.query(
      "SELECT * FROM posts ORDER BY created_at DESC"
    );
    await client.end();

    const body = JSON.stringify(res.rows);

    // 3) Populate cache if still enabled
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
      headers: { "Content-Type": "application/json" },
      body,
    };
  } catch (queryErr) {
    console.error("🔴 Error running SELECT:", queryErr);
    if (client) await client.end();
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Error fetching posts" }),
    };
  }
};
