import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import spotifyService from '../services/spotifyService';

const SpotifyContext = createContext();

export function useSpotify() {
  const context = useContext(SpotifyContext);
  if (!context) {
    throw new Error('useSpotify must be used within SpotifyProvider');
  }
  return context;
}

export function SpotifyProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [spotifyUserId, setSpotifyUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [accessToken, setAccessToken] = useState(null);

  // Check connection status on mount
  useEffect(() => {
    checkStatus();
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const spotifyConnected = params.get('spotify_connected');
    const spotifyError = params.get('spotify_error');

    if (spotifyConnected === 'true') {
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      checkStatus();
    } else if (spotifyError) {
      console.error('Spotify connection error:', spotifyError);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Initialize Spotify Web Playback SDK
  useEffect(() => {
    if (!isConnected || !accessToken) return;

    // Load Spotify SDK
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'Natures Notes Web Player',
        getOAuthToken: cb => { cb(accessToken); },
        volume: 0.5
      });

      // Error handling
      player.addListener('initialization_error', ({ message }) => {
        console.error('Spotify initialization error:', message);
      });

      player.addListener('authentication_error', ({ message }) => {
        console.error('Spotify authentication error:', message);
        setIsConnected(false);
      });

      player.addListener('account_error', ({ message }) => {
        console.error('Spotify account error:', message);
      });

      player.addListener('playback_error', ({ message }) => {
        console.error('Spotify playback error:', message);
      });

      // Ready
      player.addListener('ready', ({ device_id }) => {
        console.log('Spotify player ready with Device ID', device_id);
        setDeviceId(device_id);
      });

      // Not ready
      player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
        setDeviceId(null);
      });

      // Player state changed
      player.addListener('player_state_changed', state => {
        if (!state) return;

        setCurrentTrack(state.track_window.current_track);
        setIsPlaying(!state.paused);
      });

      player.connect();
      setPlayer(player);
    };

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, [isConnected, accessToken]);

  const checkStatus = async () => {
    try {
      setLoading(true);
      const status = await spotifyService.checkConnectionStatus();
      setIsConnected(status.connected);
      setSpotifyUserId(status.spotifyUserId);

      if (status.connected) {
        // Get access token
        const token = await spotifyService.getAccessToken();
        setAccessToken(token);
      }
    } catch (error) {
      console.error('Error checking Spotify status:', error);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const connect = async () => {
    try {
      await spotifyService.initiateSpotifyLogin();
    } catch (error) {
      console.error('Error connecting Spotify:', error);
      throw error;
    }
  };

  const disconnect = async () => {
    try {
      await spotifyService.disconnectSpotify();
      setIsConnected(false);
      setSpotifyUserId(null);
      setAccessToken(null);
      setPlayer(null);
      setDeviceId(null);
      setCurrentTrack(null);
      setIsPlaying(false);
    } catch (error) {
      console.error('Error disconnecting Spotify:', error);
      throw error;
    }
  };

  const play = useCallback(async (playlistUri) => {
    if (!player || !deviceId) {
      console.error('Spotify player not ready');
      return;
    }

    try {
      const token = await spotifyService.getAccessToken();

      const response = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            context_uri: playlistUri
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to start playback');
      }
    } catch (error) {
      console.error('Error playing:', error);
      throw error;
    }
  }, [player, deviceId]);

  const pause = useCallback(async () => {
    if (!player) {
      console.error('Spotify player not ready');
      return;
    }

    try {
      await player.pause();
    } catch (error) {
      console.error('Error pausing:', error);
      throw error;
    }
  }, [player]);

  const resume = useCallback(async () => {
    if (!player) {
      console.error('Spotify player not ready');
      return;
    }

    try {
      await player.resume();
    } catch (error) {
      console.error('Error resuming:', error);
      throw error;
    }
  }, [player]);

  const togglePlayPause = useCallback(async () => {
    if (!player) {
      console.error('Spotify player not ready');
      return;
    }

    try {
      await player.togglePlay();
    } catch (error) {
      console.error('Error toggling play/pause:', error);
      throw error;
    }
  }, [player]);

  const nextTrack = useCallback(async () => {
    if (!player) {
      console.error('Spotify player not ready');
      return;
    }

    try {
      await player.nextTrack();
    } catch (error) {
      console.error('Error skipping to next track:', error);
      throw error;
    }
  }, [player]);

  const previousTrack = useCallback(async () => {
    if (!player) {
      console.error('Spotify player not ready');
      return;
    }

    try {
      await player.previousTrack();
    } catch (error) {
      console.error('Error skipping to previous track:', error);
      throw error;
    }
  }, [player]);

  const value = {
    isConnected,
    spotifyUserId,
    loading,
    player,
    deviceId,
    currentTrack,
    isPlaying,
    accessToken,
    connect,
    disconnect,
    checkStatus,
    play,
    pause,
    resume,
    togglePlayPause,
    nextTrack,
    previousTrack
  };

  return (
    <SpotifyContext.Provider value={value}>
      {children}
    </SpotifyContext.Provider>
  );
}
