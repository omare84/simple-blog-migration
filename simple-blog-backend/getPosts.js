// simple-blog-backend/getPosts.js

const { Client } = require("pg");
const Redis = require("ioredis");

let redisClient;
function getRedisClient() {
  if (!redisClient) {
    const [host, port] = process.env.REDIS_ENDPOINT.split(":");
    redisClient = new Redis({ host, port });
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

  // 🔍 Debug: ping Redis first
  try {
    console.log("🟢 pinging Redis at", process.env.REDIS_ENDPOINT);
    await getRedisClient().ping();
    console.log("🟢 Redis ping succeeded");
  } catch (err) {
    console.error("🔴 Redis ping failed:", err);
    // If this fails, we know Redis is the problem—no need to continue
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Cannot reach Redis" }),
    };
  }

  const redis = getRedisClient();
  const cacheKey = "posts:all";

  // 1) Check cache first
  try {
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
  } catch (cacheErr) {
    console.warn("🟡 Redis GET error, proceeding to DB:", cacheErr);
  }

  // 2) Cache miss → fetch from RDS
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

    // 3) Populate cache with a 60s TTL
    redis.set(cacheKey, body, "EX", 60).catch((setErr) => {
      console.warn("🟡 Redis SET failed:", setErr);
    });

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
