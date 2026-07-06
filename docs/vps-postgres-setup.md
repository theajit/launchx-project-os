# VPS Postgres Setup for LaunchX Project OS

## 1. Install Postgres

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib -y
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

## 2. Create database and user

```bash
sudo -u postgres psql
```

```sql
create database launchx_project_os;
create user launchx_user with encrypted password 'REPLACE_WITH_STRONG_PASSWORD';
grant all privileges on database launchx_project_os to launchx_user;
\c launchx_project_os
create extension if not exists pgcrypto;
grant all on schema public to launchx_user;
\q
```

## 3. Add environment variables

```env
PORT=8080
DATABASE_URL=postgresql://launchx_user:REPLACE_WITH_STRONG_PASSWORD@127.0.0.1:5432/launchx_project_os
DATABASE_SSL=false
JWT_SECRET=REPLACE_WITH_LONG_RANDOM_SECRET
CORS_ORIGIN=https://your-frontend-domain.com
```

For local development:

```env
CORS_ORIGIN=http://localhost:5173
```

## 4. Apply schema

From repo root:

```bash
psql "$DATABASE_URL" -f api/schema.sql
```

## 5. Run API locally

```bash
npm install
npm run api:dev
```

Health checks:

```bash
curl http://localhost:8080/health
curl http://localhost:8080/db/health
```

## 6. First organization bootstrap

```bash
curl -X POST http://localhost:8080/auth/bootstrap \
  -H "Content-Type: application/json" \
  -d '{
    "organizationName":"LaunchX",
    "name":"Ajit Satpathy",
    "email":"ajit@theajit.in",
    "password":"CHANGE_THIS_PASSWORD",
    "role":"CEO"
  }'
```

This returns a JWT token. Use it as:

```bash
Authorization: Bearer <token>
```
