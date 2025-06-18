// simple-blog-backend/getPosts.js
const { Client } = require("pg");
const AWS = require("aws-sdk");

// Fetch _only_ the password field from Secrets Manager
async function getDbPassword() {
  const sm = new AWS.SecretsManager();
  const secretArn = process.env.DB_PASS_SECRET_ARN;

  try {
    const data = await sm.getSecretValue({ SecretId: secretArn }).promise();

    if (!data.SecretString) {
      throw new Error(`SecretString is empty for ARN: ${secretArn}`);
    }

    // We expect the secret to be a JSON like { "password": "mypassword" }
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

// Build and connect a new PostgreSQL client inside the VPC
async function connectClient() {
  let password;
  try {
    password = await getDbPassword();
  } catch (e) {
    // Propagate as a higher‐level error
    throw e;
  }

  const client = new Client({
    host: process.env.DB_HOST,         // e.g. simple-blog.chq0uccsu4k7.us-east-2.rds.amazonaws.com
    database: process.env.DB_NAME,     // e.g. simple_blog
    user: process.env.DB_USER,         // e.g. postgres
    password,                          // pulled from Secrets Manager
    port: 5432,
    ssl: { rejectUnauthorized: false }, // allow VPC TLS
    // (timeout settings can be added here if desired)
  });

  try {
    await client.connect();
    return client;
  } catch (connErr) {
    console.error("Database connection failed:", connErr);
    throw new Error("Database connection failed");
  }
}

exports.handler = async () => {
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
      "SELECT * FROM posts ORDER BY created_at DESC"
    );
    await client.end();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(res.rows),
    };
  } catch (queryErr) {
    console.error("Error running SELECT:", queryErr);
    await client.end();
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Error fetching posts" }),
    };
  }
};
