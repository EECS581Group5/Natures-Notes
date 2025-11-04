import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import MusicPlayer from './MusicPlayer';
import { getRecentLocations } from '../services/locationService';
import './Home.css';

function Home() {
  const [recentSearches, setRecentSearches] = useState([]);
  const [weather, setWeather] = useState(null);

  const fetchRecentSearches = async () => {
    try {
      const locations = await getRecentLocations();
      setRecentSearches(locations);
    } catch (err) {
      console.error('Error fetching recent searches:', err);
    }
  };

  useEffect(() => {
    fetchRecentSearches();
  }, []);

  const handleRecentSearchesUpdate = () => {
    // Refresh recent searches from database
    fetchRecentSearches();
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
