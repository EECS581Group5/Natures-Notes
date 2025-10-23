import React, { useState, useEffect, useRef } from 'react';
// import './Music.css'; 

// Import the automatically generated library
import MUSIC_LIBRARY from './musicMap'; 

function Music({ weather }) {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null); 

  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
      isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Function to pick a random song from an array of tracks
  const getRandomTrack = (tracks) => {
    if (!tracks || tracks.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * tracks.length);
    return tracks[randomIndex];
  };

  useEffect(() => {
    if (weather && weather.weather && weather.weather.length > 0) {
      const weatherMain = weather.weather[0].main;
      const tracksToPlay = MUSIC_LIBRARY[weatherMain] || MUSIC_LIBRARY['default'];
      const newTrack = getRandomTrack(tracksToPlay);

      if (newTrack) {
        // --- 1. Focus on the core change ---
        if (newTrack !== currentTrack) {
          setCurrentTrack(newTrack);

          // --- 2. Use the Ref to check the status WITHOUT adding dependency ---
          // Access the up-to-date value of 'isPlaying' via the ref
          if (isPlayingRef.current) { 
             // We pause the audio element right before the src changes.
             // The audio element will then trigger onLoadedData, which will call .play() again.
             audioRef.current.pause(); 
          }
        }
      }
    } else {
      setCurrentTrack(null);
    }
  // --- 3. Only keep 'weather' and 'currentTrack' (if necessary) as dependencies ---
  // currentTrack is used in the comparison (newTrack !== currentTrack), so it should be included.
  // The getRandomTrack and MUSIC_LIBRARY should be wrapped in useCallback/useMemo if they are complex, 
  // but for simple variables, keeping them outside the array is fine.
  }, [weather, currentTrack]); // Solves the warning by including currentTrack

  // Handler to play the new song once it's loaded
  const handleLoadedData = () => {
    if (isPlaying) {
      audioRef.current.play().catch(error => {
        console.error("Autoplay prevented:", error);
      });
    }
  }

  // Handler for the Play/Pause button
  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(error => {
        console.error("Play failed:", error);
      });
    }
  };

  if (!currentTrack) {
    return <div className="music-player">Awaiting weather data to select music...</div>;
  }

  return (
    <div className="music-player">
      <h3>🎶 Music Player 🎶</h3>
      <p>Weather: {weather.weather[0].main}</p>
      <p>Now Playing: {currentTrack.split('/').pop().split('.')[0]}</p>
      
      <audio 
        ref={audioRef} 
        id="music-player" 
        src={currentTrack} 
        loop 
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedData={handleLoadedData}
      ></audio>

      <button onClick={togglePlay} disabled={!currentTrack}>
        {isPlaying ? '⏸️ Pause' : '▶️ Play'}
      </button>
    </div>
  );
}

export default Music;