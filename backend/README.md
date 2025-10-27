# Backend Setup

This directory contains a standalone Node.js/Express backend for local development.

## Local Development

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Set up environment variables:
   - Copy `.env` and update with your database credentials

3. Initialize the database:
   - Connect to your Neon PostgreSQL database
   - Run the SQL commands in `init-db.sql`

4. Start the server:
   ```bash
   npm run dev
   ```

The backend will run on `http://localhost:3001`

## Deployment

For Vercel deployment, the serverless API functions in `/code/api/` are used instead.
The backend folder is mainly for local development and testing.
