// simple-blog-backend/updatePost.js

const { Client } = require("pg");
const AWS = require("aws-sdk");

// Fetch only the password field from Secrets Manager
async function getDbPassword() {
  const sm = new AWS.SecretsManager();
  const secretArn = process.env.DB_PASS_SECRET_ARN;

  try {
    const data = await sm.getSecretValue({ SecretId: secretArn }).promise();
    if (!data.SecretString) {
      throw new Error(`SecretString is empty for ARN: ${secretArn}`);
    }
    const parsed = JSON.parse(data.SecretString);
    if (typeof parsed.password !== "string") {
      throw new Error("Secret JSON does not contain a string 'password' field");
    }
    return parsed.password;
  } catch (err) {
    console.error("Error retrieving or parsing secret:", err);
    throw new Error("Unable to retrieve database password");
  }
}

// Connect using env vars + fetched password
async function connectClient() {
  const password = await getDbPassword();
  const client = new Client({
    host: process.env.DB_HOST,     // e.g. simple-blog.chq0uccsu4k7.us-east-2.rds.amazonaws.com
    database: process.env.DB_NAME, // e.g. simple_blog
    user: process.env.DB_USER,     // e.g. postgres
    password,
    port: 5432,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    return client;
  } catch (connErr) {
    console.error("Database connection failed:", connErr);
    throw new Error("Database connection failed");
  }
}

exports.handler = async (event) => {
  // Ensure ID is provided in pathParameters
  const id = event.pathParameters && event.pathParameters.id;
  if (!id) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Missing post ID in path" }),
    };
  }

  // Parse request body
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Invalid JSON in request body" }),
    };
  }

  const { title, content, author } = body;
  if (!title || !content || !author) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Missing title, content, or author" }),
    };
  }

  let client;
  try {
    client = await connectClient();
  } catch (e) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: e.message }),
    };
  }

  try {
    const res = await client.query(
      "UPDATE posts SET title=$1, content=$2, author=$3 WHERE id=$4 RETURNING *",
      [title, content, author, id]
    );
    await client.end();

    if (res.rows.length === 0) {
      // No post with that ID
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Post not found" }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(res.rows[0]),
    };
  } catch (queryErr) {
    console.error("Error running UPDATE:", queryErr);
    await client.end();
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Error updating post" }),
    };
  }
};
