import React, { useState, useEffect, useRef } from 'react';
import { useSpotify } from '../contexts/SpotifyContext';
import spotifyService from '../services/spotifyService';
import PlaylistMapper from './PlaylistMapper';
import SpotifyPreviewPlayer from './SpotifyPreviewPlayer';
import MUSIC_LIBRARY from '../musicMap';
import './MusicPlayer.css';

function MusicPlayerEnhanced({ weather, onSongEnd, checkInterval = 30*60*1000 }) {
  // Mode: 'local' or 'spotify'
  const [mode, setMode] = useState('local');
  const [showMapper, setShowMapper] = useState(false);
  const [spotifyPlaylistMapping, setSpotifyPlaylistMapping] = useState(null);
  const [currentSpotifyPlaylist, setCurrentSpotifyPlaylist] = useState(null);

  // Local player state
  const [currentPlaylist, setCurrentPlaylist] = useState([]);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const isAttemptingPlayRef = useRef(false);
  const audioRef = useRef(null);
  const lastWeatherMainRef = useRef(null);
  const lastFetchTimeRef = useRef(Date.now());
  const isPlayingRef = useRef(isPlaying);
  const hasInteractedRef = useRef(hasInteracted);

  // Spotify context
  const spotify = useSpotify();

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    hasInteractedRef.current = hasInteracted;
  });

  // Load Spotify mappings on mount
  useEffect(() => {
    loadSpotifyMappings();
  }, []);

  // Load Spotify playlist mappings
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

  // Handle weather changes for Spotify mode
  useEffect(() => {
    if (mode === 'spotify' && spotify.isConnected && weather && weather.weather && weather.weather.length > 0) {
      const weatherMain = weather.weather[0].main;

      if (weatherMain !== lastWeatherMainRef.current) {
        const playlist = spotifyPlaylistMapping?.[weatherMain];
        if (playlist && playlist.id) {
          setCurrentSpotifyPlaylist(playlist);
          lastWeatherMainRef.current = weatherMain;

          // Auto-play if user has interacted
          if (hasInteracted && spotify.deviceId) {
            spotify.play(`spotify:playlist:${playlist.id}`).catch(err => {
              console.error('Failed to play Spotify playlist:', err);
            });
          }
        } else {
          setCurrentSpotifyPlaylist(null);
        }
      }
    }
  }, [mode, spotify.isConnected, weather, spotifyPlaylistMapping, hasInteracted, spotify]);

  const currentTrack = currentPlaylist.length > 0 ? currentPlaylist[trackIndex] : null;

  const shuffleTracks = (tracks) => {
    let shuffled = [...tracks];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Local player effects
  useEffect(() => {
    if (mode === 'local' && weather && weather.weather && weather.weather.length > 0) {
      const weatherMain = weather.weather[0].main;
      const tracksFromLibrary = MUSIC_LIBRARY[weatherMain] || MUSIC_LIBRARY['default'];

      if (weatherMain !== lastWeatherMainRef.current) {
        isAttemptingPlayRef.current = true;

        if (tracksFromLibrary.length > 0) {
          const newPlaylist = shuffleTracks(tracksFromLibrary);
          setCurrentPlaylist(newPlaylist);
          setTrackIndex(0);
          lastWeatherMainRef.current = weatherMain;
        } else {
          setCurrentPlaylist([]);
          lastWeatherMainRef.current = weatherMain;
        }
      }
    } else if (mode === 'local' && currentPlaylist.length > 0) {
      setCurrentPlaylist([]);
      setTrackIndex(0);
      lastWeatherMainRef.current = null;
    }
  }, [mode, weather, currentPlaylist.length]);

  useEffect(() => {
    if (mode !== 'local') return;
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [mode]);

  const playNextTrack = () => {
    if (mode === 'spotify') {
      spotify.nextTrack();
    } else {
      isAttemptingPlayRef.current = true;

      const now = Date.now();
      if (onSongEnd && (now - lastFetchTimeRef.current > checkInterval)) {
        onSongEnd();
        lastFetchTimeRef.current = now;
      }

      setTimeout(() => {
        setTrackIndex(prevIndex => {
          const playlistLength = currentPlaylist.length;
          if (playlistLength === 0) return 0;
          return (prevIndex + 1) % playlistLength;
        });
      }, 0);
    }
  };

  const playPreviousTrack = () => {
    if (mode === 'spotify') {
      spotify.previousTrack();
    } else {
      isAttemptingPlayRef.current = true;
      setTimeout(() => {
        setTrackIndex(prevIndex => {
          const playlistLength = currentPlaylist.length;
          if (playlistLength === 0) return 0;
          return prevIndex === 0 ? playlistLength - 1 : prevIndex - 1;
        });
      }, 0);
    }
  };

  const handleLoadedData = () => {
    if (!isPlayingRef.current || !hasInteractedRef.current || !audioRef.current) {
      isAttemptingPlayRef.current = false;
      return;
    }

    const attemptPlay = () => {
      audioRef.current.play()
        .then(() => {
          // Success handled by onPlay
        })
        .catch(error => {
          console.warn('Play failed, retrying...', error.message);
          if (isAttemptingPlayRef.current && isPlayingRef.current) {
            setTimeout(attemptPlay, 200);
          } else {
            isAttemptingPlayRef.current = false;
          }
        });
    };

    attemptPlay();
  };

  const togglePlay = () => {
    if (mode === 'spotify') {
      if (!spotify.deviceId) {
        alert('Spotify player not ready. Please wait or refresh the page.');
        return;
      }

      setHasInteracted(true);

      if (spotify.isPlaying) {
        spotify.pause();
      } else {
        if (currentSpotifyPlaylist) {
          spotify.play(`spotify:playlist:${currentSpotifyPlaylist.id}`);
        } else {
          spotify.resume();
        }
      }
    } else {
      if (!audioRef.current) return;

      if (audioRef.current.paused) {
        audioRef.current.play()
          .then(() => {
            setHasInteracted(true);
          })
          .catch(error => {
            console.error('Play failed:', error);
          });
      } else {
        isAttemptingPlayRef.current = false;
        audioRef.current.pause();
      }
    }
  };

  const handlePause = () => {
    if (isAttemptingPlayRef.current) return;

    if (audioRef.current) {
      const { currentTime, duration } = audioRef.current;
      if (duration > 0 && duration - currentTime < 0.1) return;
    }

    setIsPlaying(false);
  };

  const handlePlay = () => {
    isAttemptingPlayRef.current = false;
    setIsPlaying(true);
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

  const getTrackName = (url) => {
    if (!url) return 'Unknown Track';
    return url.split('/').pop().split('.')[0].replace(/-/g, ' ');
  };

  const getWeatherCategory = () => {
    if (!weather || !weather.weather || !weather.weather[0]) return 'Ambient';
    return weather.weather[0].main;
  };

  const handleModeToggle = () => {
    if (mode === 'local') {
      if (!spotify.isConnected) {
        if (window.confirm('You need to connect Spotify first. Connect now?')) {
          spotify.connect();
        }
        return;
      }

      // Pause local player
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }

      setMode('spotify');
    } else {
      // Pause Spotify player
      if (spotify.isPlaying) {
        spotify.pause();
      }

      setMode('local');
    }
  };

  const handleConnectSpotify = () => {
    spotify.connect();
  };

  const handleMapPlaylists = () => {
    setShowMapper(true);
  };

  const activeIsPlaying = mode === 'spotify' ? spotify.isPlaying : isPlaying;
  const canPlay = mode === 'spotify'
    ? (spotify.isConnected && spotify.deviceId && currentSpotifyPlaylist)
    : currentTrack;

  // Render Spotify mode with preview player
  if (mode === 'spotify') {
    return (
      <>
        <SpotifyPreviewPlayer weather={weather} />
        <div style={{ position: 'absolute', bottom: '100px', right: '20px', zIndex: 1000 }}>
          <button onClick={handleModeToggle} className="mode-toggle-btn" title="Switch to local music">
            Switch to Local Music
          </button>
        </div>
      </>
    );
  }

  // OLD CODE BELOW - keeping for reference but not used
  if (false && mode === 'spotify') {
    return (
      <>
        <div className="music-player-bar">
          <div className="player-left">
            <div className="album-art">
              {spotify.currentTrack?.album?.images?.[0] ? (
                <img src={spotify.currentTrack.album.images[0].url} alt="Album art" />
              ) : currentSpotifyPlaylist?.image ? (
                <img src={currentSpotifyPlaylist.image} alt="Playlist art" />
              ) : (
                <span className="music-icon spotify-icon">🎵</span>
              )}
            </div>
            <div className="track-info">
              <div className="track-name">
                {spotify.currentTrack?.name || currentSpotifyPlaylist?.name || 'No track playing'}
              </div>
              <div className="track-artist">
                {spotify.currentTrack?.artists?.[0]?.name || getWeatherCategory() + ' Weather'}
              </div>
            </div>
          </div>

          <div className="player-center">
            <div className="player-controls">
              <button
                className="control-btn prev-btn"
                onClick={playPreviousTrack}
                disabled={!spotify.deviceId}
              >
                <span className="icon-prev"></span>
              </button>
              <button
                className={`control-btn play-btn ${activeIsPlaying ? 'playing' : ''}`}
                onClick={togglePlay}
                disabled={!canPlay}
              >
                <span className={activeIsPlaying ? 'icon-pause' : 'icon-play'}></span>
              </button>
              <button
                className="control-btn next-btn"
                onClick={playNextTrack}
                disabled={!spotify.deviceId}
              >
                <span className="icon-next"></span>
              </button>
            </div>
          </div>

          <div className="player-right">
            <button onClick={handleModeToggle} className="mode-toggle-btn" title="Switch to local music">
              <span className="spotify-logo">🎵</span> Spotify Mode
            </button>
            <button onClick={handleMapPlaylists} className="map-btn" title="Map playlists to weather">
              ⚙️ Settings
            </button>
          </div>
        </div>

        {showMapper && <PlaylistMapper onClose={() => { setShowMapper(false); loadSpotifyMappings(); }} />}
      </>
    );
  }

  // Render Local mode
  if (!currentTrack) {
    return (
      <div className="music-player-bar">
        <div className="player-left">
          <div className="album-art">
            <span className="music-icon"></span>
          </div>
          <div className="track-info">
            <div className="track-name">No track playing</div>
            <div className="track-artist">Nature Sounds Collection</div>
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
          {spotify.isConnected && (
            <button onClick={handleModeToggle} className="mode-toggle-btn" title="Switch to Spotify">
              <span className="spotify-logo">🎵</span> Try Spotify
            </button>
          )}
          {!spotify.isConnected && (
            <button onClick={handleConnectSpotify} className="connect-spotify-btn" title="Connect Spotify account">
              <span className="spotify-logo">🎵</span> Connect Spotify
            </button>
          )}
          <span className="playlist-info">Waiting for weather data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="music-player-bar">
      <audio
        ref={audioRef}
        src={currentTrack}
        onPlay={handlePlay}
        onPause={handlePause}
        onLoadedData={handleLoadedData}
        onEnded={playNextTrack}
      />

      <div className="player-left">
        <div className="album-art">
          <span className="music-icon"></span>
        </div>
        <div className="track-info">
          <div className="track-name">{getTrackName(currentTrack)}</div>
          <div className="track-artist">{getWeatherCategory()} • Nature Sounds Collection</div>
        </div>
      </div>

      <div className="player-center">
        <div className="player-controls">
          <button
            className="control-btn prev-btn"
            onClick={playPreviousTrack}
            disabled={currentPlaylist.length < 2}
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
            disabled={currentPlaylist.length < 2}
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
        {spotify.isConnected && (
          <button onClick={handleModeToggle} className="mode-toggle-btn" title="Switch to Spotify">
            <span className="spotify-logo">🎵</span> Try Spotify
          </button>
        )}
        {!spotify.isConnected && (
          <button onClick={handleConnectSpotify} className="connect-spotify-btn" title="Connect Spotify account">
            <span className="spotify-logo">🎵</span> Connect Spotify
          </button>
        )}
        <span className="weather-badge">{getWeatherCategory()} Weather</span>
        <span className="playlist-info">🎵 {currentPlaylist.length} tracks</span>
      </div>
    </div>
  );
}

export default MusicPlayerEnhanced;
