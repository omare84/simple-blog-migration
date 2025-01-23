Simple Blog Migration
A portfolio project showcasing database migration for a simple blog application using Node.js and PostgreSQL.

Overview
This project demonstrates:

Setting up a backend API with Node.js and Express.
Designing and managing a PostgreSQL database schema.
Implementing API endpoints for basic blog operations (CRUD).
Showcasing database migration as a critical skill, including schema setup and data migration.
Preparing for future scalability by planning frontend integration.
Features
Connects to a PostgreSQL database.
Implements CRUD operations for blog posts.
Designed to demonstrate database migration between different platforms (e.g., PostgreSQL to MySQL).
Provides a strong foundation for further development (e.g., frontend and advanced migrations).
Prerequisites
Before setting up the project, ensure you have the following:

Node.js (v16+)
PostgreSQL (v14+)
Git
Setup Instructions
1. Clone the Repository
bash
git clone <repository-url>
cd simple-blog-migration
2. Install Dependencies
bash
npm install
3. Set Up the Database
Ensure PostgreSQL is installed and running on your system.
Create a new database called simple_blog:
sql
CREATE DATABASE simple_blog;
4. Configure Environment Variables
Create a .env file in the project root and add the following:

plaintext
DB_USER=your_username
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=simple_blog
5. Start the Server
bash
node server.js
The server will start on http://localhost:3000.

API Endpoints
Posts
GET /posts: Fetch all blog posts.
POST /posts: Add a new blog post.
Request Body:
json
{
  "title": "Post Title",
  "content": "Post Content",
  "author": "Author Name"
}
GET /posts/:id: Fetch a blog post by ID.
PUT /posts/:id: Update a blog post by ID.
Request Body:
json
Copy code
{
  "title": "Updated Title",
  "content": "Updated Content",
  "author": "Updated Author"
}
DELETE /posts/:id: Delete a blog post by ID.
Phase 3: Database Migration
Overview
This phase demonstrates the ability to effectively migrate and manage databases, a critical skill in modern application development.

Key Accomplishments
Database Setup: Configured PostgreSQL as the primary database.
Schema Design: Created a posts table with the following structure:
sql
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
Migration Process: Implemented a script to automatically set up the posts table. This ensures the database is ready for operations without manual intervention.
Future Plans
Explore data migration between PostgreSQL and other databases (e.g., MySQL, DynamoDB).
Incorporate advanced migration tools like Flyway or Liquibas
