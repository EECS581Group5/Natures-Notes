import React, { useState, useEffect, useRef } from 'react';
// import './Music.css'; 

// Import the automatically generated library
import MUSIC_LIBRARY from './musicMap'; 

function Music({ weather }) {
  const [currentPlaylist, setCurrentPlaylist] = useState([]);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const isAttemptingPlayRef = useRef(false);
  const audioRef = useRef(null);
  const lastWeatherMainRef = useRef(null);

  // REFS TO READ THE LATEST STATE
  const isPlayingRef = useRef(isPlaying);
  const hasInteractedRef = useRef(hasInteracted);

  // EFFECT TO KEEP REFS UP-TO-DATE
  useEffect(() => {
    isPlayingRef.current = isPlaying;
    hasInteractedRef.current = hasInteracted;
  }); 

  // --- DERIVED STATE ---
  const currentTrack = currentPlaylist.length > 0 ? currentPlaylist[trackIndex] : null;

  // Function to shuffle the playlist (unchanged)
  const shuffleTracks = (tracks) => {
    let shuffled = [...tracks]; 
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // --- CORE LOGIC: Update Playlist when Weather Changes ---
  useEffect(() => {
    if (weather && weather.weather && weather.weather.length > 0) {
      const weatherMain = weather.weather[0].main;
      const tracksFromLibrary = MUSIC_LIBRARY[weatherMain] || MUSIC_LIBRARY['default'];

      if (weatherMain !== lastWeatherMainRef.current) { 
        // CRUCIAL FIX #1: Set the flag *before* changing the src.
        console.log(`%cWEATHER CHANGE: Setting isAttemptingPlayRef = true`, 'color: blue; font-weight: bold;');
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

  const playNextTrack = () => {
    // CRUCIAL FIX #2: Set the flag *immediately* (synchronously).
    console.log(`%conEnded/Skip: Setting isAttemptingPlayRef = true`, 'color: orange; font-weight: bold;');
    isAttemptingPlayRef.current = true; 

    // Schedule the state update to change the src
    setTimeout(() => {
      setTrackIndex(prevIndex => {
        const playlistLength = currentPlaylist.length; 
        if (playlistLength === 0) return 0; 
        const nextIndex = (prevIndex + 1) % playlistLength;
        console.log(`playNextTrack: Setting track index to ${nextIndex}`);
        return nextIndex;
    });
    }, 0); 
  };

  const handleLoadedData = () => {
    console.log(`onLoadedData: Fired. Checking refs...`, { 
      shouldPlay: isPlayingRef.current, 
      hasInteracted: hasInteractedRef.current 
    });

    // We only auto-play if the state *should* be "playing"
    if (!isPlayingRef.current || !hasInteractedRef.current || !audioRef.current) {
      console.log('onLoadedData: Bailing (shouldPlay is false or no interaction).');
      // We are NOT attempting to play, so clear the flag.
      isAttemptingPlayRef.current = false;
      return;
    }

    // Note: We don't set the flag here anymore, it was set by the *initiator*
    // (playNextTrack or useEffect)

    const attemptPlay = () => {
      console.log('%conLoadedData: Calling .play()', 'color: green;');
      audioRef.current.play()
        .then(() => {
          // Success! onPlay will handle resetting the flag.
        })
        .catch(error => {
          console.warn(`onLoadedData: .play() FAILED. Retrying...`, error.message);

          if (isAttemptingPlayRef.current && isPlayingRef.current) { 
            setTimeout(attemptPlay, 200);
          } else {
            console.log('onLoadedData: Stop retrying (user paused or flag cleared).');
            isAttemptingPlayRef.current = false;
          }
        });
    };

    attemptPlay();
  }

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (audioRef.current.paused) { 
      console.log('togglePlay: User clicked PLAY');
      audioRef.current.play()
        .then(() => {
          setHasInteracted(true); 
        })
        .catch(error => {
          console.error("Play failed (browser block):", error);
        });
    } else {
      // User is manually pausing, so stop any play attempts.
      console.log('%ctogglePlay: User clicked PAUSE. Setting isAttemptingPlayRef = false.', 'color: red;');
      isAttemptingPlayRef.current = false; 
      audioRef.current.pause();
    }
  };

const handlePause = () => {
    console.log(`onPause: Fired. isAttemptingPlayRef is ${isAttemptingPlayRef.current}`);

    // 1. Check for programmatic changes (Weather/Skip)
    // This flag is set by playNextTrack or the weather useEffect.
    if (isAttemptingPlayRef.current) {
      console.log('onPause: IGNORING (isAttemptingPlayRef is true).');
      return; 
    }
    
    // 2. Check for end-of-track pause (the onPause/onEnded race condition)
    if (audioRef.current) {
      const { currentTime, duration } = audioRef.current;
      // If duration is valid AND we are within 0.1s of the end,
      // this is an "onEnded" pause.
      if (duration > 0 && duration - currentTime < 0.1) {
        console.log('onPause: IGNORING (Track has finished).', { currentTime, duration });
        return;
      }
    }
    
    // 3. If neither of the above, it's a "real" user pause.
    console.log('%conPause: REAL pause. Setting isPlaying = false.', 'color: red;');
    setIsPlaying(false);
  };

  const handlePlay = () => {
    // We successfully started playing, so we are no longer "attempting".
    console.log('%conPlay: SUCCESS. Setting isAttemptingPlayRef = false, isPlaying = true.', 'color: green; font-weight: bold;');
    isAttemptingPlayRef.current = false;
    setIsPlaying(true);
  };

  if (!currentTrack) {
    return <div className="music-player">Awaiting weather data or music files...</div>;
  }

// A helper function to extract a cleaner name for display
  const getTrackName = (url) => {
    return url.split('/').pop().split('.')[0].replace(/-/g, ' ');
  };

  return (
    <div className="music-player">
      <h3>🎶 Weather Music Player 🎶</h3>
      <p>Weather: {weather.weather[0].main}</p>
      <p>Now Playing: {getTrackName(currentTrack)}</p>

      <audio 
        ref={audioRef} 
        id="music-player" 
        src={currentTrack}
        onPlay={handlePlay} 
        onPause={handlePause}
        onLoadedData={handleLoadedData}
        onEnded={playNextTrack} 
      ></audio>

      <button onClick={togglePlay} disabled={!currentTrack}>
        {isPlaying ? '⏸️ Pause' : '▶️ Play'}
      </button>
      <button 
        onClick={playNextTrack} 
        disabled={currentPlaylist.length < 2 || !isPlaying}
      >
        ⏭️ Skip
      </button>
      <p style={{fontSize: '0.8em', marginTop: '10px'}}>Playlist length: {currentPlaylist.length} songs</p>
    </div>
  );
}

export default Music;