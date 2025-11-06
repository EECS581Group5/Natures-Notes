# Spotify Integration Setup Guide

This guide will help you complete the Spotify integration for Natures Notes.

## ✅ What's Been Done

1. ✅ Environment variables configured
2. ✅ Backend Spotify service created (`backend/spotifyService.js`)
3. ✅ Backend API endpoints added (`backend/server.js`)
4. ✅ Frontend Spotify service created (`code/src/services/spotifyService.js`)
5. ✅ Spotify Context created (`code/src/contexts/SpotifyContext.js`)
6. ✅ Playlist mapper UI created (`code/src/components/PlaylistMapper.js`)
7. ✅ Enhanced music player created (`code/src/components/MusicPlayerEnhanced.js`)
8. ✅ App.js updated to include SpotifyProvider

## 🔧 Required Setup Steps

### Step 1: Update Spotify Developer Dashboard

You need to add the redirect URIs to your Spotify app:

1. Go to https://developer.spotify.com/dashboard
2. Click on your app ("Natures Notes" or whatever you named it)
3. Click "Settings"
4. In "Redirect URIs", add:
   - `http://localhost:3001/api/spotify/callback` (for local development)
   - `https://natures-notes.vercel.app/api/spotify/callback` (for production)
5. Click "Add"
6. Click "Save" at the bottom

### Step 2: Run Database Migration

You need to add the new tables to your database:

**Option A: Using psql (if you have PostgreSQL client)**
```bash
cd backend
psql "postgresql://neondb_owner:npg_2KqrPCek7DJl@ep-floral-salad-aeok6d2y-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require" < spotify-migration.sql
```

**Option B: Using Neon Console (Web Interface)**
1. Go to https://console.neon.tech
2. Open your project
3. Go to "SQL Editor"
4. Copy and paste the contents of `backend/spotify-migration.sql`
5. Click "Run"

**Option C: Using Node.js script**
I can create a migration script for you if you prefer.

### Step 3: Update Home.js to Use Enhanced Music Player

Replace the existing MusicPlayer import in `code/src/components/Home.js`:

**Find:**
```javascript
import MusicPlayer from './MusicPlayer';
```

**Replace with:**
```javascript
import MusicPlayer from './MusicPlayerEnhanced';
```

That's it! The component interface is the same.

### Step 4: Install Dependencies

Make sure you have all required dependencies:

```bash
# Backend (if not already installed)
cd backend
npm install

# Frontend (if not already installed)
cd ../code
npm install
```

### Step 5: Set Environment Variables in Vercel

When deploying to production, add these environment variables in Vercel:

1. Go to your Vercel project dashboard
2. Go to Settings → Environment Variables
3. Add:
   - `SPOTIFY_CLIENT_ID` = `a6cb5e9389ff480eb03f600cdb3badbd`
   - `SPOTIFY_CLIENT_SECRET` = `d9115b1141ee415fa01954debab7c87e`
   - `SPOTIFY_REDIRECT_URI` = `https://natures-notes.vercel.app/api/spotify/callback`
   - `FRONTEND_URL` = `https://natures-notes.vercel.app`
   - `REACT_APP_SPOTIFY_CLIENT_ID` = `a6cb5e9389ff480eb03f600cdb3badbd`
   - `REACT_APP_SPOTIFY_REDIRECT_URI` = `https://natures-notes.vercel.app/spotify/callback`

### Step 6: Test Locally

1. Start the backend:
```bash
cd backend
npm start
```

2. In a new terminal, start the frontend:
```bash
cd code
npm start
```

3. Open http://localhost:3000 in your browser
4. Log in to your account
5. Click "Connect Spotify" button in the music player
6. Authorize the app in Spotify
7. You should be redirected back and see "Spotify Connected"

## 🎵 How to Use

### For Users:

1. **Connect Spotify**: Click the "Connect Spotify" button in the music player
2. **Map Playlists**: Click the "⚙️ Settings" button to map Spotify playlists to weather conditions
3. **Toggle Mode**: Click "Try Spotify" to switch from local music to Spotify
4. **Play Music**: The app will automatically play the appropriate Spotify playlist based on the weather

### For Admins (Playlist Mapping):

1. Click "⚙️ Settings" in Spotify mode
2. Select a weather condition (e.g., "Clear/Sunny")
3. Search for a playlist (e.g., "sunny day vibes")
4. Click "Select" on the playlist you want
5. Repeat for other weather conditions
6. Click "Save Mappings"

## 📁 File Structure

```
Natures-Notes/
├── backend/
│   ├── server.js                    # Updated with Spotify endpoints
│   ├── spotifyService.js            # NEW - Spotify API wrapper
│   ├── spotify-migration.sql        # NEW - Database migration
│   └── .env                         # Updated with Spotify credentials
│
├── code/
│   ├── src/
│   │   ├── App.js                   # Updated with SpotifyProvider
│   │   ├── contexts/
│   │   │   └── SpotifyContext.js    # NEW - Spotify state management
│   │   ├── services/
│   │   │   └── spotifyService.js    # NEW - Frontend Spotify API
│   │   └── components/
│   │       ├── MusicPlayerEnhanced.js  # NEW - Enhanced player
│   │       ├── PlaylistMapper.js       # NEW - Playlist mapping UI
│   │       ├── PlaylistMapper.css      # NEW - Playlist mapper styles
│   │       └── MusicPlayer.css         # Updated with new button styles
│   └── .env                         # Updated with Spotify client ID
│
└── SPOTIFY_SETUP.md                 # This file
```

## 🔐 Security Notes

- ✅ Client Secret is stored only in backend `.env` (never exposed to frontend)
- ✅ OAuth flow uses state parameter for CSRF protection
- ✅ Refresh tokens are stored in database (not access tokens)
- ✅ Access tokens are refreshed automatically when needed
- ✅ All Spotify endpoints require JWT authentication

## 🐛 Troubleshooting

### "Spotify not connected" error
- Make sure you completed Step 1 (Redirect URIs)
- Check that environment variables are set correctly
- Try disconnecting and reconnecting Spotify

### "Player not ready" error
- Wait a few seconds after connecting Spotify
- Refresh the page
- Make sure you have Spotify Premium (required for Web Playback SDK)

### Database errors
- Make sure you ran the migration (Step 2)
- Check database connection string in `backend/.env`

### OAuth callback fails
- Verify redirect URIs match exactly in Spotify Dashboard
- Check that backend server is running on the correct port
- Look at browser console for error messages

## 🚀 Next Steps

After completing the setup:

1. Create some weather-themed Spotify playlists (or find existing ones)
2. Map playlists to weather conditions using the Settings interface
3. Test with different weather conditions
4. Deploy to Vercel with the environment variables set

## 📝 Notes

- Users need **Spotify Premium** to use the playback features
- The app uses Spotify's Web Playback SDK for in-browser playback
- Local music will still work for users who don't connect Spotify
- Users can toggle between local and Spotify modes at any time

## ✨ Features

- ✅ OAuth 2.0 authentication with Spotify
- ✅ Automatic token refresh
- ✅ Weather-based playlist mapping
- ✅ Search and select playlists
- ✅ Toggle between local and Spotify modes
- ✅ Web Playback SDK integration
- ✅ Play/pause/skip controls
- ✅ Display current track info with album art
- ✅ Admin interface for playlist management

Enjoy your Spotify-powered weather music experience! 🎵🌤️
