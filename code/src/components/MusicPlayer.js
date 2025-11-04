import React, { useState, useEffect, useRef } from 'react';
import MUSIC_LIBRARY from '../musicMap';
import './MusicPlayer.css';

function MusicPlayer({ weather }) {
  const [currentPlaylist, setCurrentPlaylist] = useState([]);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const isAttemptingPlayRef = useRef(false);
  const audioRef = useRef(null);
  const lastWeatherMainRef = useRef(null);

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

  useEffect(() => {
    if (weather && weather.weather && weather.weather.length > 0) {
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
    } else if (currentPlaylist.length > 0) {
      setCurrentPlaylist([]);
      setTrackIndex(0);
      lastWeatherMainRef.current = null;
    }
  }, [weather, currentPlaylist.length]);

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

  const playNextTrack = () => {
    isAttemptingPlayRef.current = true;
    setTimeout(() => {
      setTrackIndex(prevIndex => {
        const playlistLength = currentPlaylist.length;
        if (playlistLength === 0) return 0;
        return (prevIndex + 1) % playlistLength;
      });
    }, 0);
  };

  const playPreviousTrack = () => {
    isAttemptingPlayRef.current = true;
    setTimeout(() => {
      setTrackIndex(prevIndex => {
        const playlistLength = currentPlaylist.length;
        if (playlistLength === 0) return 0;
        return prevIndex === 0 ? playlistLength - 1 : prevIndex - 1;
      });
    }, 0);
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
          <div className="track-artist">Nature Sounds Collection</div>
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
        <button className="help-btn">?</button>
      </div>
    </div>
  );
}

export default MusicPlayer;
