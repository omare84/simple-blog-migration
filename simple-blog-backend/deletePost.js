// simple-blog-backend/deletePost.js

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

// Connect using env vars + fetched password
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
  // Ensure ID is provided
  const id = event.pathParameters?.id;
  if (!id) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Missing post ID in path" }),
    };
  }

  let client;
  try {
    client = await connectClient();
    const res = await client.query(
      "DELETE FROM posts WHERE id = $1 RETURNING id",
      [id]
    );
    await client.end();

    if (res.rows.length === 0) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Post not found" }),
      };
    }

    // Invalidate Redis cache
    try {
      const redis = getRedisClient();
      await redis.del("posts:all");
      console.log("Cache invalidated for posts:all");
    } catch (cacheErr) {
      console.warn("Failed to invalidate cache:", cacheErr);
    }

    // Successful deletion
    return { statusCode: 204, body: "" };
  } catch (err) {
    console.error("Error deleting post:", err);
    if (client) await client.end();
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Error deleting post" }),
    };
  }
};
