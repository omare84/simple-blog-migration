# Simple Blog Migration

**A fully serverless, scalable blog platform with database migration, media upload, search, caching, and notifications.**

---

## 🚀 Project Phases

| Phase | Description                                                     | Status       |
|-------|-----------------------------------------------------------------|--------------|
| 1     | Backend Setup (Node.js, Express, PostgreSQL)                    | ✅ Complete  |
| 2     | Blog API Development (Full CRUD)                                | ✅ Complete  |
| 3     | Database Migration (RDS, Secrets Manager)                       | ✅ Complete  |
| 4     | Frontend Development (React scaffold + UI improvements)         | ✅ Complete  |
| 5     | Deployment to AWS (EC2, RDS, ALB)                               | ✅ Complete  |
| 6     | Deploy Frontend (S3 + CloudFront + HTTPS)                       | ✅ Complete  |
| 7     | Core Features (CRUD on UI)                                      | ✅ Complete  |
| 8     | AWS‑Native Enhancements (Lambda, API Gateway, CI/CD)           | ✅ Complete  |
| 9     | UI/UX & Authentication (Cognito + styling)                     | ✅ Complete  |
| 10    | Advanced Features (Image Upload, Search, Caching, Notifications) | 🚧 In Progress |

---

## 🌐 Live Demo

- **Frontend App:** https://scalabledeploy.com/  
- **API (Get Posts):** https://scalabledeploy.com/api/posts

---

## ⚡ Quick Start

```bash
# 1. Clone and install
git clone https://github.com/omare84/simple-blog-migration.git
cd simple-blog-migration
npm install

# 2. Backend (local dev)
cd simple-blog-backend
npm install
# copy .env.example to .env and fill variables
npm start

# 3. Frontend (local dev)
cd ../frontend
npm install
npm start

# 4. SAM (for serverless stack)
# Requires AWS CLI and SAM CLI configured
sam build && sam local start-api
```

### Environment Variables (`.env`)
```
DB_HOST=...            # RDS endpoint
DB_NAME=simple_blog
DB_USER=postgres
DB_PASS=...            # plain text for local dev
FRONTEND_DOMAIN=scalabledeploy.com
COGNITO_USER_POOL_ID=...
COGNITO_APP_CLIENT_ID=...
```

---

## 🏗️ Architecture

![Architecture Diagram](docs/architecture.png)

**Flow:** CloudFront → S3 (static files) + API Gateway → Lambda → RDS/Redis → Cognito for auth → EventBridge → SES

---

## 💰 Cost Optimization

- **Redis teardown:** Snapshots and delete of ElastiCache when idle to avoid ongoing charges.  
- **STS Endpoint optimization:** Reduced STS VPC endpoint to a single subnet ENI, cutting charges by 50%.  
- **SecretsManager endpoint removal:** Deleted the unneeded SecretsManager interface endpoint after switching to `DB_PASS` env var.  
- **RDS stop/snapshot:** Stop or snapshot and delete non‑prod RDS instances when not in use.  
- **S3 Lifecycle rules:** Archive or expire objects older than 30 days to minimize storage.

---

## ✨ Key Features

- **CRUD:** Create, Read, Update, Delete blog posts via secure Lambda APIs.  
- **Authentication:** AWS Cognito sign‑up, sign‑in, protected routes.  
- **Media Upload:** Presigned S3 URLs for image attachments, served via CloudFront.  
- **Search/Tagging:** Full‑text search (PostgreSQL TSVector) and tag filtering on posts.  
- **Caching:** Redis (ElastiCache) for high‑performance read caching with smart fallback—if Redis is unreachable, functions automatically fall back to RDS.  
- **Notifications:** EventBridge + SES emails on new post creation.  
- **CI/CD:** GitHub Actions automates `sam build` and `sam deploy`.

---

## 🛠️ Prerequisites

- Node.js v16+  
- AWS CLI configured  
- AWS SAM CLI  
- AWS account with proper IAM permissions

---

## 📋 Detailed Setup

1. **Backend Setup**  
   - Install dependencies in `simple-blog-backend/`.  
   - Configure `.env` with your values.  
   - Ensure RDS tables (`posts`, `subscribers`) exist via migrations.
2. **Frontend Setup**  
   - Install dependencies in `frontend/`.  
   - Configure Amplify/Cognito via `src/aws-exports.js`.
3. **Infrastructure Provisioning**  
   - Run `sam build && sam deploy --guided` to deploy:  
     - Lambda functions, API Gateway REST API  
     - RDS PostgreSQL, Secrets Manager (for prod)  
     - ElastiCache Redis cluster, with snapshots automation  
     - S3 buckets & CloudFront distribution  
     - Cognito User Pool and App Client  
     - EventBridge Rule & SES permissions  
4. **Frontend Deployment**  
   - `npm run build` → `aws s3 sync build/ s3://<bucket>`  
   - Invalidate CloudFront: `aws cloudfront create-invalidation …`
5. **Testing**  
   - Sign up and sign in via Cognito.  
   - Create/edit/delete posts, upload images.  
   - Search posts and observe cache miss/hit.  
   - Subscribe and receive notification emails (or review logs).

---

## 📖 Documentation & Further Reading

- [AWS SAM Developer Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/)  
- [Tailwind CSS Docs](https://tailwindcss.com/docs)  
- [PostgreSQL Full‑Text Search](https://www.postgresql.org/docs/current/textsearch.html)

---

*Built with love by Omar E.*
