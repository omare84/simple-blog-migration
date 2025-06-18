// simple-blog-backend/deletePost.js

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
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
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
    // Attempt to delete; check how many rows were affected
    const res = await client.query("DELETE FROM posts WHERE id = $1 RETURNING id", [id]);
    await client.end();

    if (res.rows.length === 0) {
      // No post with that ID
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Post not found" }),
      };
    }

    // 204 No Content indicates successful deletion
    return {
      statusCode: 204,
      body: "",
    };
  } catch (queryErr) {
    console.error("Error running DELETE:", queryErr);
    await client.end();
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Error deleting post" }),
    };
  }
};
