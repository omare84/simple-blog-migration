// simple-blog-backend/createPost.js

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
  console.log("RAW event.body:", event.body);

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (e) {
    console.error("Invalid JSON:", event.body);
    return {
      statusCode: 400,
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
    try {
      const redis = getRedisClient();
      await redis.del("posts:all");
      console.log("Cache invalidated for posts:all");
    } catch (cacheErr) {
      console.warn("Failed to invalidate cache:", cacheErr);
    }

    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(created),
    };
  } catch (err) {
    console.error("Error inserting post:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Error creating post" }),
    };
  } finally {
    if (client) await client.end();
  }
};
