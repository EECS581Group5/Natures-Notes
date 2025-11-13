import React, { useState, useEffect, useRef, useCallback } from 'react';
import MUSIC_LIBRARY from '../musicMap';
import './MusicPlayer.css';

function MusicPlayer({ weather, onSongEnd, checkInterval = 30*60*1000 }) {
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
  const fadeIntervalRef = useRef(null);
  const isPlayingRef = useRef(isPlaying);
  const hasInteractedRef = useRef(hasInteracted);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    hasInteractedRef.current = hasInteracted;
  });

  const currentTrack = currentPlaylist.length > 0 ? currentPlaylist[trackIndex] : null;

  const shuffleTracks = (tracks) => {
    let shuffled = [...tracks];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // --- New Fade Helper Function ---
  const fadeAudio = useCallback((direction, onComplete) => {
    const audio = audioRef.current;
    if (!audio) return;

    // Clear any existing fade
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }

    const fadeDuration = 1000; // 1 second
    const intervalSteps = 50; // 50ms per step
    const stepAmount = 1 / (fadeDuration / intervalSteps);

    if (direction === 'in') {
      audio.volume = 0;
      // Start playing (will trigger onPlay handler)
      audio.play().catch(error => {
        console.warn("Audio play interrupted by fade-in:", error.message);
      });

      fadeIntervalRef.current = setInterval(() => {
        if (audio.volume < 1.0) {
          audio.volume = Math.min(1.0, audio.volume + stepAmount);
        } else {
          clearInterval(fadeIntervalRef.current);
          if (onComplete) onComplete();
        }
      }, intervalSteps);

    } else if (direction === 'out') {
      // Start at current volume if fading out
      fadeIntervalRef.current = setInterval(() => {
        if (audio.volume > 0.0) {
          audio.volume = Math.max(0.0, audio.volume - stepAmount);
        } else {
          clearInterval(fadeIntervalRef.current);
          if (onComplete) onComplete();
        }
      }, intervalSteps);
    }
  }, []); // audioRef and fadeIntervalRef are stable refs

  // --- Updated useEffect[weather] ---
  useEffect(() => {
    if (weather && weather.weather && weather.weather.length > 0) {
      const weatherMain = weather.weather[0].main;
      if (weatherMain === lastWeatherMainRef.current) return; // No change

      const tracksFromLibrary = MUSIC_LIBRARY[weatherMain] || MUSIC_LIBRARY['default'];

      // Function to set the new playlist
      const changePlaylist = () => {
        isAttemptingPlayRef.current = true;
        lastWeatherMainRef.current = weatherMain;

        if (tracksFromLibrary.length > 0) {
          const newPlaylist = shuffleTracks(tracksFromLibrary);
          setCurrentPlaylist(newPlaylist);
          setTrackIndex(0);
        } else {
          setCurrentPlaylist([]);
        }
      };

      // If a track is playing, fade it out *before* changing the playlist
      if (isPlayingRef.current && audioRef.current && !audioRef.current.paused) {
        fadeAudio('out', () => {
          // Pause the audio element *after* fade-out, before changing src
          if (audioRef.current) audioRef.current.pause(); 
          changePlaylist();
        });
      } else {
        // Otherwise, change immediately
        changePlaylist();
      }

    } else if (currentPlaylist.length > 0) {
      setCurrentPlaylist([]);
      setTrackIndex(0);
      lastWeatherMainRef.current = null;
    }
  }, [weather, currentPlaylist.length, fadeAudio]); // Add fadeAudio dependency

  useEffect(() => {
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
  }, []);

  // --- Updated playNextTrack ---
  const playNextTrack = () => {
    isAttemptingPlayRef.current = true;
    
    // Fade out the current track, *then* change the index
    fadeAudio('out', () => {
      // --- Logic to call parent for weather update ---
      const now = Date.now();
      if (onSongEnd && (now - lastFetchTimeRef.current > checkInterval)) {
        console.log(`Periodic check: Time to fetch new weather (interval: ${checkInterval}ms).`);
        onSongEnd(); // Call the parent's function (Home.js)
        lastFetchTimeRef.current = now; // Reset the timer
      }
      // --- End of new logic ---

      setTimeout(() => {
        setTrackIndex(prevIndex => {
          const playlistLength = currentPlaylist.length;
          if (playlistLength === 0) return 0;
          return (prevIndex + 1) % playlistLength;
        });
      }, 0);
    });
  };

  // --- Updated playPreviousTrack ---
  const playPreviousTrack = () => {
    isAttemptingPlayRef.current = true;
    
    // Fade out the current track, *then* change the index
    fadeAudio('out', () => {
      setTimeout(() => {
        setTrackIndex(prevIndex => {
          const playlistLength = currentPlaylist.length;
          if (playlistLength === 0) return 0;
          return prevIndex === 0 ? playlistLength - 1 : prevIndex - 1;
        });
      }, 0);
    });
  };

  // --- Updated handleLoadedData ---
  const handleLoadedData = () => {
    // This now handles the "fade in"
    if (!isPlayingRef.current || !hasInteractedRef.current || !audioRef.current) {
      isAttemptingPlayRef.current = false;
      return;
    }
    
    // Fade in the new track
    fadeAudio('in');
  };

  // --- Updated togglePlay ---
  const togglePlay = () => {
    if (!audioRef.current) return;

    if (audioRef.current.paused) {
      // Fade In
      setHasInteracted(true);
      fadeAudio('in');
    } else {
      // Fade Out
      isAttemptingPlayRef.current = false; // User is pausing, stop attempts
      fadeAudio('out', () => {
        if (audioRef.current) audioRef.current.pause();
      });
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
        <span className="weather-badge">{getWeatherCategory()} Weather</span>
        <span className="playlist-info">🎵 {currentPlaylist.length} tracks</span>
      </div>
    </div>
  );
}

export default MusicPlayer;
