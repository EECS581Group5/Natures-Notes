# Local Backend Testing Guide

This guide explains how to test backend changes locally before deploying to Vercel.

## Overview

You have two options for local backend testing:
1. **Express Backend** (Recommended for development) - Run a standalone Node.js server
2. **Vercel CLI** (Best for production simulation) - Simulates the exact Vercel environment

---

## Option 1: Express Backend (Recommended for Development)

This approach runs a full Express server locally, giving you complete control and easy debugging.

### Setup

The Express backend is already configured in the `backend/` directory with all your API routes.

### Prerequisites

Make sure you have the backend dependencies installed:

```bash
cd backend
npm install
```

### Running the Express Backend

#### Step 1: Start the Backend Server

Open a terminal and run:

```bash
cd backend
npm run dev
```

This will:
- Start the Express server on `http://localhost:3001`
- Use nodemon for auto-reload when you change files
- Connect to your Neon PostgreSQL database
- Load environment variables from `backend/.env`

You should see:
```
Server is running on port 3001
Connected to Neon PostgreSQL database
```

#### Step 2: Configure Frontend to Use Local Backend

In another terminal, update your React app's environment:

```bash
cd code
```

Edit `code/.env` and change:
```bash
# Comment out the production URL
# REACT_APP_API_URL=https://natures-notes.vercel.app

# Use local backend
REACT_APP_API_URL=http://localhost:3001
```

#### Step 3: Start the React App

```bash
npm start
```

Your React app will run on `http://localhost:3000` and make API calls to `http://localhost:3001`.

### Testing Your Changes

Now you can:
- Modify backend files in `backend/server.js` or create new routes
- Changes auto-reload thanks to nodemon
- Use `console.log()` for debugging
- Test authentication, database queries, etc.

### Example: Testing a New API Endpoint

1. Add a new route in `backend/server.js`:

```javascript
app.get('/api/test', (req, res) => {
  console.log('Test endpoint hit!');
  res.json({ message: 'Hello from local backend!' });
});
```

2. Save the file (nodemon will auto-restart)

3. Test in browser or with curl:
```bash
curl http://localhost:3001/api/test
```

4. Or call from your React app:
```javascript
fetch('http://localhost:3001/api/test')
  .then(res => res.json())
  .then(data => console.log(data));
```

### Switching Back to Production

When you're done testing locally:

1. Stop the backend server (Ctrl+C)
2. Edit `code/.env` and restore:
```bash
REACT_APP_API_URL=https://natures-notes.vercel.app
```
3. Restart your React app

---

## Option 2: Vercel CLI (Production Simulation)

The Vercel CLI runs your serverless functions exactly as they run on Vercel.

### Setup

#### Install Vercel CLI globally:

```bash
npm install -g vercel
```

#### Login to Vercel:

```bash
vercel login
```

### Running with Vercel Dev

From your project root directory:

```bash
vercel dev
```

This will:
- Start a local server (usually on `http://localhost:3000`)
- Run serverless functions from `code/api/`
- Load environment variables from Vercel or `.env`
- Serve both frontend and backend on the same domain

### Advantages of Vercel CLI

- Exact production environment simulation
- No CORS issues (same domain)
- Tests serverless function behavior
- Automatic environment variable sync from Vercel

### Disadvantages

- Slower startup time
- Less debugging visibility
- Functions restart on each request (cold starts)

---

## Comparison Table

| Feature | Express Backend | Vercel CLI |
|---------|----------------|------------|
| **Best For** | Active development and debugging | Production simulation |
| **Hot Reload** | Yes (nodemon) | Slower |
| **Debugging** | Easy console.logs | Limited |
| **Production Accuracy** | Different environment | Exact match |
| **Setup Time** | Two terminals | Single command |
| **CORS Issues** | Need to configure | None |

---

## Recommended Workflow

### During Development:
1. Use **Express Backend** for iterating on backend code
2. Run backend in one terminal, frontend in another
3. Debug with console.logs and breakpoints

### Before Deploying:
1. Test with **Vercel CLI** to ensure production compatibility
2. Run `vercel dev` and test critical flows
3. Fix any environment-specific issues

### After Testing:
1. Commit your changes
2. Push to GitHub
3. Vercel automatically deploys

---

## Troubleshooting

### Backend won't start
- Check that `backend/.env` has correct `DATABASE_URL` and `JWT_SECRET`
- Ensure port 3001 isn't already in use
- Run `npm install` in backend directory

### Frontend can't connect to backend
- Verify `REACT_APP_API_URL=http://localhost:3001` in `code/.env`
- Check that backend server is running
- Restart React app after changing `.env`

### Database connection errors
- Verify `DATABASE_URL` is correct in `backend/.env`
- Check that database tables exist (run `backend/init-db.sql`)
- Ensure your Neon database is accessible

### JWT token errors
- Make sure `JWT_SECRET` matches in both environments
- Check that it is set in `backend/.env`

---

## Environment Variables Reference

### Backend (`backend/.env`)
```bash
DATABASE_URL=postgresql://...
PORT=3001
JWT_SECRET=your_secret_here
```

### Frontend (`code/.env`)
```bash
REACT_APP_WEATHER_KEY=your_weather_api_key
REACT_APP_API_URL=http://localhost:3001  # Local testing
# REACT_APP_API_URL=https://natures-notes.vercel.app  # Production
```

---

## Quick Commands Reference

```bash
# Start Express backend
cd backend && npm run dev

# Start React frontend (in new terminal)
cd code && npm start

# Run with Vercel CLI
vercel dev

# Test API endpoint
curl http://localhost:3001/api/health

# Check backend logs
# They appear in the terminal where you ran `npm run dev`
```

---

## Tips for Productive Local Development

1. **Use nodemon**: Already configured in backend for auto-reload
2. **Console.log liberally**: View output in backend terminal
3. **Test with curl**: Quick API testing without frontend
4. **Use Postman/Insomnia**: For complex API testing
5. **Keep terminals organized**:
   - Terminal 1: Backend
   - Terminal 2: Frontend
   - Terminal 3: Git commands, database queries, etc.

---

## Next Steps

After testing locally and you're satisfied with your changes:

1. **Update serverless functions**: Copy logic from `backend/` to `code/api/` if needed
2. **Commit changes**: `git add .` and `git commit -m "Your message"`
3. **Push to deploy**: `git push` (Vercel auto-deploys)
4. **Verify production**: Test on https://natures-notes.vercel.app
