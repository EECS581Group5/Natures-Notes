import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import MusicPlayer from './MusicPlayer';
import './Home.css';

function Home() {
  const [recentSearches, setRecentSearches] = useState([]);
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    // Load recent searches from localStorage
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (err) {
        console.error('Error parsing recent searches:', err);
      }
    }
  }, []);

  const handleRecentSearchesUpdate = (searches) => {
    setRecentSearches(searches);
  };

  return (
    <div className="home-layout">
      <Sidebar recentSearches={recentSearches} />
      <div className="main-content">
        <Dashboard
          onRecentSearchesUpdate={handleRecentSearchesUpdate}
          onWeatherUpdate={setWeather}
        />
      </div>
      <MusicPlayer weather={weather} />
    </div>
  );
}

export default Home;
