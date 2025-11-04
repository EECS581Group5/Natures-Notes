import React, { useState, useEffect } from 'react';
import { addLocation, getRecentLocations } from '../services/locationService';
import './Dashboard.css';

function Dashboard({ onRecentSearchesUpdate, onWeatherUpdate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initWeather = async () => {
      const locations = await getRecentLocations();
      if (locations.length > 0) {
        const mostRecent = locations[0];
        await fetchWeatherByCoords(mostRecent.latitude, mostRecent.longitude, false);
      }
    };
    initWeather();
  }, []);

  const fetchWeatherByCoords = async (lat, lon, saveLocation = true) => {
    const key = process.env.REACT_APP_WEATHER_KEY;
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
        setWeather(weatherData);
        setForecast(forecastData);

        // Pass weather data to parent component
        if (onWeatherUpdate) {
          onWeatherUpdate(weatherData);
        }

        if (saveLocation && weatherData.coord) {
          try {
            await addLocation(weatherData.coord.lat, weatherData.coord.lon);
            updateRecentSearches(weatherData);
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
  };

  const updateRecentSearches = (weatherData) => {
    if (!onRecentSearchesUpdate) return;

    const search = {
      name: weatherData.name,
      temp: Math.round(weatherData.main.temp * (9/5) + 32),
      timestamp: new Date().toISOString()
    };

    const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    const filtered = recentSearches.filter(s => s.name !== search.name);
    const updated = [search, ...filtered].slice(0, 10);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
    onRecentSearchesUpdate(updated);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const key = process.env.REACT_APP_WEATHER_KEY;

    // Check if it's coordinates (format: lat, lon)
    const coordsMatch = searchQuery.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);

    if (coordsMatch) {
      const lat = parseFloat(coordsMatch[1]);
      const lon = parseFloat(coordsMatch[2]);
      await fetchWeatherByCoords(lat, lon);
    } else {
      // Search by city
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${searchQuery}&appid=${key}&units=metric`;
      setLoading(true);
      try {
        const response = await fetch(url);
        const data = await response.json();

        if (response.ok && data.coord) {
          await fetchWeatherByCoords(data.coord.lat, data.coord.lon);
        } else {
          alert(`Error: ${data.message}`);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Failed to search location.');
        setLoading(false);
      }
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to retrieve your location.');
        setLoading(false);
      }
    );
  };

  const celsiusToFahrenheit = (celsius) => Math.round(celsius * (9/5) + 32);

  const getWeatherIcon = (main) => {
    const icons = {
      Clear: '☀️',
      Clouds: '☁️',
      Rain: '🌧️',
      Snow: '❄️',
      Thunderstorm: '⛈️',
      Drizzle: '🌦️',
      Mist: '🌫️',
      Fog: '🌫️'
    };
    return icons[main] || '🌤️';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours} ${ampm}`;
  };

  const getHourlyForecast = () => {
    if (!forecast || !forecast.list) return [];
    return forecast.list.slice(0, 8);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="search-container">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              className="search-input"
              placeholder="Search for a city or enter coordinates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
          <button className="location-btn" onClick={handleUseMyLocation}>
            <span className="location-icon">📍</span>
            Use My Location
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading">Loading weather data...</div>
      )}

      {weather && !loading && (
        <>
          <div className="weather-card">
            <div className="weather-main">
              <div className="weather-location">
                <h2 className="city-name">{weather.name}</h2>
                <p className="country-name">{weather.sys?.country || 'Unknown'}</p>
                <p className="coordinates">
                  {weather.coord.lat.toFixed(2)}°N, {Math.abs(weather.coord.lon).toFixed(2)}°W
                </p>
              </div>
              <div className="weather-temp">
                <div className="temp-main">{celsiusToFahrenheit(weather.main.temp)}°</div>
                <div className="temp-feels">
                  Feels like {celsiusToFahrenheit(weather.main.feels_like)}°
                </div>
              </div>
            </div>

            <div className="weather-condition">
              <span className="condition-icon">
                {getWeatherIcon(weather.weather[0].main)}
              </span>
              <div className="condition-text">
                <div className="condition-main">{weather.weather[0].main}</div>
                <div className="condition-desc">{weather.weather[0].description}</div>
              </div>
            </div>

            <div className="weather-metrics">
              <div className="metric">
                <div className="metric-icon">💧</div>
                <div className="metric-label">Humidity</div>
                <div className="metric-value">{weather.main.humidity}%</div>
              </div>
              <div className="metric">
                <div className="metric-icon">💨</div>
                <div className="metric-label">Wind</div>
                <div className="metric-value">{Math.round(weather.wind.speed * 2.237)} mph</div>
              </div>
              <div className="metric">
                <div className="metric-icon">👁️</div>
                <div className="metric-label">Visibility</div>
                <div className="metric-value">{Math.round(weather.visibility / 1609)} mi</div>
              </div>
              <div className="metric">
                <div className="metric-icon">🌡️</div>
                <div className="metric-label">Pressure</div>
                <div className="metric-value">{weather.main.pressure} mb</div>
              </div>
            </div>
          </div>

          <div className="forecast-section">
            <h3 className="forecast-title">Hourly Forecast</h3>
            <div className="forecast-grid">
              {getHourlyForecast().map((hour, index) => (
                <div key={index} className="forecast-item">
                  <div className="forecast-time">
                    {index === 0 ? 'Now' : formatTime(hour.dt)}
                  </div>
                  <div className="forecast-icon">
                    {getWeatherIcon(hour.weather[0].main)}
                  </div>
                  <div className="forecast-temp">
                    {celsiusToFahrenheit(hour.main.temp)}°
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!weather && !loading && (
        <div className="empty-state">
          <div className="empty-icon">🌤️</div>
          <h3>Search for a location</h3>
          <p>Enter a city name or coordinates to get started</p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
