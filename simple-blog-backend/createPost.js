// simple-blog-backend/createPost.js
const { Client } = require("pg");
const AWS = require("aws-sdk");

// helper to fetch the DB password from Secrets Manager
async function getDbPassword() {
  const sm = new AWS.SecretsManager();
  const data = await sm.getSecretValue({ SecretId: process.env.DB_PASS_SECRET_ARN }).promise();
  return JSON.parse(data.SecretString).password;
}

// construct & connect a new PG client
async function connectClient() {
  const password = await getDbPassword();
  const client = new Client({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password,
    port: 5432,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  return client;
}

exports.handler = async (event) => {
  // ←----- DEBUG: log the raw body
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
  const client = await connectClient();
  const res = await client.query(
    "INSERT INTO posts(title, content, author) VALUES($1,$2,$3) RETURNING *",
    [title, content, author]
  );
  await client.end();

  return {
    statusCode: 201,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(res.rows[0]),
  };
};  // ←----- make sure this brace closes the handler
