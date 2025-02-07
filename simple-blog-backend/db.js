const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',         // Replace with your PostgreSQL username
    host: 'simple-blog.chq0uccsu4k7.us-east-2.rds.amazonaws.com',        // Host of the database
    database: 'simple_blog',  // Replace with your database name
    password: 'lopez321',     // Replace with your PostgreSQL password
    port: 5432,               // Default PostgreSQL port
});

module.exports = pool;
