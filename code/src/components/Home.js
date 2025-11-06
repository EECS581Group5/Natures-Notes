import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import MusicPlayer from './MusicPlayerEnhanced';
import { getRecentLocations, addLocation } from '../services/locationService';
import './Home.css';

// Weather check interval: 15 minutes in milliseconds
const WEATHER_CHECK_INTERVAL = 15 * 60 * 1000;

function Home() {
  const [recentSearches, setRecentSearches] = useState([]);
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null); // e.g., { lat: 12.34, lon: 56.78 }

  // --- Fetching Logic (Moved from Dashboard) ---
  // We use useCallback to ensure the function reference is stable
  const fetchWeatherByCoords = useCallback(async (lat, lon, saveLocation = true) => {
    const key = process.env.REACT_APP_WEATHER_KEY;
    if (!key) {
      console.error("Weather API key not found!");
      alert("Weather API key is not configured.");
      return;
    }
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${key}&units=metric`;

    setLoading(true);
    try {
      const [weatherRes, forecastRes] = await Promise.all([
        fetch(weatherUrl),
        fetch(forecastUrl)
      ]);

      const weatherData = await weatherRes.json();
      const forecastData = await forecastRes.json();

      if (weatherRes.ok && forecastRes.ok) {
        setWeather(weatherData); // Update weather
        setForecast(forecastData); // Update forecast
        // Save the last successful location
        setCurrentLocation({ lat: weatherData.coord.lat, lon: weatherData.coord.lon });

        if (saveLocation && weatherData.coord) {
          try {
            await addLocation(
              weatherData.coord.lat,
              weatherData.coord.lon,
              weatherData.name,
              weatherData.sys?.country
            );
            // We can call fetchRecentSearches directly now
            fetchRecentSearches();
          } catch (err) {
            console.error('Error saving location:', err);
          }
        }
      } else {
        alert(`Error: ${weatherData.message || forecastData.message}`);
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
      alert('Failed to fetch weather. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array is safe, it doesn't use state variables

  const fetchRecentSearches = async () => {
    try {
      const locations = await getRecentLocations();
      setRecentSearches(locations);
    } catch (err) {
      console.error('Error fetching recent searches:', err);
    }
  };

  // This useEffect now handles both recent searches and initial weather
  useEffect(() => {
    // Fetch recent searches on load
    fetchRecentSearches();

    // Fetch weather for most recent location on load
    const initWeather = async () => {
      const locations = await getRecentLocations(); // Re-fetch to ensure it's fresh
      if (locations.length > 0) {
        const mostRecent = locations[0];
        // Fetch but don't re-save the location
        await fetchWeatherByCoords(mostRecent.latitude, mostRecent.longitude, false);
      }
    };
    initWeather();
  }, [fetchWeatherByCoords]); // Run once on load

  // --- Callbacks for Children ---

  // This function will be passed to MusicPlayer
  const handleSongEndFetch = useCallback(() => {
    if (currentLocation) {
      console.log("Periodic re-fetch triggered for:", currentLocation);
      // Re-fetch weather for the *last known location*
      // Don't save it again (pass false)
      fetchWeatherByCoords(currentLocation.lat, currentLocation.lon, false);
    } else {
      console.log("Skipping periodic re-fetch, no location set.");
    }
  }, [currentLocation, fetchWeatherByCoords]); // Re-create if location or fetcher changes

  return (
    <div className="home-layout">
      <Sidebar recentSearches={recentSearches} />
      <div className="main-content">
        <Dashboard
          // Pass the fetcher function down
          onFetchWeather={fetchWeatherByCoords}
          // Pass the data Dashboard needs to display
          weather={weather}
          forecast={forecast}
          loading={loading}
          setLoading={setLoading} // Allow Dashboard to set loading state
        />
      </div>
      <MusicPlayer
        weather={weather}
        // Pass the new callback and interval
        onSongEnd={handleSongEndFetch}
        checkInterval={WEATHER_CHECK_INTERVAL}
      />
    </div>
  );
}

export default Home;
