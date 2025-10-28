# Backend Setup

This directory contains a standalone Node.js/Express backend for local development.

## Local Development

 Set up environment variables:
   - Copy `.env` and update with your database credentials



 Install dependencies:
   ```bash
   cd backend
   npm install
   npm run dev

The backend will run on `http://localhost:3001`

## Deployment

For Vercel deployment, the serverless API functions in `/code/api/` are used instead.
The backend folder is mainly for local development and testing.
