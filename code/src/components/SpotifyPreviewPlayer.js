import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSpotify } from '../contexts/SpotifyContext';
import spotifyService from '../services/spotifyService';
import PlaylistMapper from './PlaylistMapper';
import './MusicPlayer.css';

function SpotifyPreviewPlayer({ weather }) {
  const [showMapper, setShowMapper] = useState(false);
  const [spotifyPlaylistMapping, setSpotifyPlaylistMapping] = useState(null);
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  const lastWeatherMainRef = useRef(null);

  const spotify = useSpotify();

  // Load Spotify mappings on mount
  useEffect(() => {
    loadSpotifyMappings();
  }, []);

  const loadSpotifyMappings = async () => {
    try {
      const mappings = await spotifyService.getWeatherPlaylistMappings();
      const mappingsObj = {};
      mappings.forEach(mapping => {
        if (mapping.spotify_playlist_id) {
          mappingsObj[mapping.weather_condition] = {
            id: mapping.spotify_playlist_id,
            name: mapping.playlist_name,
            image: mapping.playlist_image
          };
        }
      });
      setSpotifyPlaylistMapping(mappingsObj);
    } catch (error) {
      console.error('Error loading Spotify mappings:', error);
    }
  };

  // Handle weather changes
  useEffect(() => {
    if (spotify.isConnected && weather && weather.weather && weather.weather.length > 0) {
      const weatherMain = weather.weather[0].main;

      if (weatherMain !== lastWeatherMainRef.current) {
        const playlist = spotifyPlaylistMapping?.[weatherMain];
        if (playlist && playlist.id) {
          setCurrentPlaylist(playlist);
          lastWeatherMainRef.current = weatherMain;
          loadPlaylistTracks(playlist.id);
        } else {
          setCurrentPlaylist(null);
          setTracks([]);
        }
      }
    }
  }, [spotify.isConnected, weather, spotifyPlaylistMapping]);

  // Load tracks from playlist and extract preview URLs
  const loadPlaylistTracks = async (playlistId) => {
    try {
      const accessToken = await spotifyService.getAccessToken();
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Filter tracks that have preview URLs
        const tracksWithPreviews = data.items
          .filter(item => item.track && item.track.preview_url)
          .map(item => ({
            id: item.track.id,
            name: item.track.name,
            artist: item.track.artists[0]?.name || 'Unknown Artist',
            album: item.track.album?.name || '',
            albumArt: item.track.album?.images?.[0]?.url || null,
            previewUrl: item.track.preview_url,
            duration: 30 // Preview is always 30 seconds
          }));

        setTracks(tracksWithPreviews);
        setCurrentTrackIndex(0);

        if (tracksWithPreviews.length === 0) {
          console.warn('No tracks with previews found in this playlist');
        }
      }
    } catch (error) {
      console.error('Error loading playlist tracks:', error);
    }
  };

  // Audio element setup
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => playNextTrack();

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Auto-play when track changes
  useEffect(() => {
    if (hasInteracted && isPlaying && audioRef.current) {
      audioRef.current.play().catch(err => {
        console.error('Auto-play failed:', err);
      });
    }
  }, [currentTrackIndex, hasInteracted, isPlaying]);

  const currentTrack = tracks.length > 0 ? tracks[currentTrackIndex] : null;

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;

    if (audioRef.current.paused) {
      audioRef.current.play()
        .then(() => {
          setHasInteracted(true);
          setIsPlaying(true);
        })
        .catch(error => {
          console.error('Play failed:', error);
        });
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const playNextTrack = () => {
    if (tracks.length === 0) return;
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
  };

  const playPreviousTrack = () => {
    if (tracks.length === 0) return;
    setCurrentTrackIndex((prev) => (prev === 0 ? tracks.length - 1 : prev - 1));
  };

  const handleSeek = (e) => {
    if (!audioRef.current || !duration) return;
    const seekBar = e.currentTarget;
    const clickX = e.nativeEvent.offsetX;
    const width = seekBar.offsetWidth;
    const seekTime = (clickX / width) * duration;
    audioRef.current.currentTime = seekTime;
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getWeatherCategory = () => {
    if (!weather || !weather.weather || !weather.weather[0]) return 'Ambient';
    return weather.weather[0].main;
  };

  if (!currentTrack) {
    return (
      <div className="music-player-bar">
        <audio ref={audioRef} />
        <div className="player-left">
          <div className="album-art">
            <span className="music-icon spotify-icon">🎵</span>
          </div>
          <div className="track-info">
            <div className="track-name">
              {currentPlaylist ? 'No preview available' : 'No playlist mapped'}
            </div>
            <div className="track-artist">
              {currentPlaylist ? 'Try another playlist' : 'Map a playlist in settings'}
            </div>
          </div>
        </div>
        <div className="player-center">
          <div className="player-controls">
            <button className="control-btn prev-btn" disabled>
              <span className="icon-prev"></span>
            </button>
            <button className="control-btn play-btn" disabled>
              <span className="icon-play"></span>
            </button>
            <button className="control-btn next-btn" disabled>
              <span className="icon-next"></span>
            </button>
          </div>
        </div>
        <div className="player-right">
          <button onClick={() => setShowMapper(true)} className="map-btn" title="Map playlists to weather">
            ⚙️ Settings
          </button>
        </div>
        {showMapper && <PlaylistMapper onClose={() => { setShowMapper(false); loadSpotifyMappings(); }} />}
      </div>
    );
  }

  return (
    <>
      <div className="music-player-bar">
        <audio
          ref={audioRef}
          src={currentTrack.previewUrl}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        <div className="player-left">
          <div className="album-art">
            {currentTrack.albumArt ? (
              <img src={currentTrack.albumArt} alt="Album art" />
            ) : (
              <span className="music-icon spotify-icon">🎵</span>
            )}
          </div>
          <div className="track-info">
            <div className="track-name">
              {currentTrack.name} <span style={{fontSize: '11px', color: '#1DB954'}}>• 30s Preview</span>
            </div>
            <div className="track-artist">{currentTrack.artist}</div>
          </div>
        </div>

        <div className="player-center">
          <div className="player-controls">
            <button
              className="control-btn prev-btn"
              onClick={playPreviousTrack}
              disabled={tracks.length < 2}
            >
              <span className="icon-prev"></span>
            </button>
            <button
              className={`control-btn play-btn ${isPlaying ? 'playing' : ''}`}
              onClick={togglePlay}
            >
              <span className={isPlaying ? 'icon-pause' : 'icon-play'}></span>
            </button>
            <button
              className="control-btn next-btn"
              onClick={playNextTrack}
              disabled={tracks.length < 2}
            >
              <span className="icon-next"></span>
            </button>
          </div>
          <div className="progress-container">
            <span className="time-display">{formatTime(currentTime)}</span>
            <div className="progress-bar" onClick={handleSeek}>
              <div
                className="progress-fill"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
            <span className="time-display">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="player-right">
          <span className="weather-badge">{getWeatherCategory()} Weather</span>
          <span className="playlist-info">🎵 {tracks.length} previews</span>
          <button onClick={() => setShowMapper(true)} className="map-btn" title="Map playlists to weather">
            ⚙️ Settings
          </button>
        </div>
      </div>

      {showMapper && <PlaylistMapper onClose={() => { setShowMapper(false); loadSpotifyMappings(); }} />}
    </>
  );
}

export default SpotifyPreviewPlayer;
