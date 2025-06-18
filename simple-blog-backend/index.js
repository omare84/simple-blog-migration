const { Client } = require("pg");

exports.handler = async (event) => {
    const client = new Client({
        user: "postgres",
        host: "simple-blog.chq0uccsu4k7.us-east-2.rds.amazonaws.com",
        database: "simple_blog",
        password: "lopez321",
        port: 5432,
        ssl: { rejectUnauthorized: false } // Needed for RDS
    });

    try {
        await client.connect();
        const res = await client.query("SELECT * FROM posts ORDER BY created_at DESC");
        await client.end();

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(res.rows),
        };
    } catch (error) {
        console.error("Database query error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" }),
        };
    }
};
