# Laptop Tracker Express Backend

## Features
- Express.js backend
- PostgreSQL for storage
- JWT authentication (login/logout)
- Admin endpoints to view tracked laptops

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a PostgreSQL database and user, then update `.env` (copy from `.env.example`).

3. Create tables (see `db/schema.sql`) or run the provided SQL manually.

4. Start server:
```bash
npm run dev
# or
npm start
```

API endpoints:
- POST /auth/register  { username, password }
- POST /auth/login     { username, password } -> { token }
- POST /laptops/track  (auth header) { deviceId, latitude, longitude, ip, city, region, country, isp, timestamp }
- GET  /admin/laptops  (admin only)
