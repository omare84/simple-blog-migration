# Simple Blog Migration
A portfolio project showcasing database migration for a simple blog application using Node.js and PostgreSQL.

## Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [PostgreSQL](https://www.postgresql.org/) (v14+)
- [Git](https://git-scm.com/)

## Setup Instructions

### 1. Clone the Repository
git clone <repository-url>
cd simple-blog-migration

### 2. Install Dependencies
npm install

### 3. Set Up the Database
Ensure PostgreSQL is installed and running on your machine.
Create a new database called simple_blog

### 4. Configure Environment Variables
Create a .env file in the project root with the following information:
DB_USER=your_username
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=simple_blog

### 5. Start the Server
node server.js

## API Endpoints

### Posts
- **GET /posts**: Fetch all blog posts.
- **POST /posts**: Add a new blog post.
  - Request Body:
    ```json
    {
      "title": "Post Title",
      "content": "Post Content",
      "author": "Author Name"
    }
    ```
- **GET /posts/:id**: Fetch a blog post by ID.
- **PUT /posts/:id**: Update a blog post by ID.
  - Request Body:
    ```json
    {
      "title": "Updated Title",
      "content": "Updated Content",
      "author": "Updated Author"
    }
    ```
- **DELETE /posts/:id**: Delete a blog post by ID.


