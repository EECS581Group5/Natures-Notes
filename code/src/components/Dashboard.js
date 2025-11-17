import React, { useState } from 'react';
import './Dashboard.css';
import {WiDaySunny, WiCloud, WiRain, WiSnow, WiFog, WiStrongWind, WiHumidity, WiBarometer} from 'react-icons/wi';
import {FaLocationArrow, FaSearch, FaGlobe} from 'react-icons/fa';
import GlobeComponent from './Globe';

function Dashboard({
  onFetchWeather, // This is our new fetcher
  weather,        // Data now comes from props
  forecast,     // Data now comes from props
  loading,        // Data now comes from props
  setLoading,    // Get setLoading from Home
  onSetWeather,
  setForecast,
  recentLocations // Pass recent locations for globe markers
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showGlobe, setShowGlobe] = useState(false);

  // All state related to weather/forecast/loading is REMOVED
  // All fetching logic (useEffect, fetchWeatherByCoords) is REMOVED

  // 4. Update handleSearch to call the prop
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // --- EASTER EGG CHECK ---
    if (searchQuery.toLowerCase().trim() === 'minesweeper') {
      console.log("Easter Egg Activated!");
      
      // 1. Create a fake weather object that MusicPlayer will understand
      const fakeWeather = {
        weather: [{ main: 'Minesweeper' }],
        name: 'Minesweeper',
        main: { temp: -17.778, feels_like: -17.778, humidity: 0, pressure: 0 }, // Fake data
        sys: { country: 'Team 5' },
        coord: { lat: 0, lon: 0 },
        wind: { speed: 0 },
        visibility: 0
      };
      
      // 2. Set the fake weather in the parent (Home.js)
      onSetWeather(fakeWeather);
      
      // 3. Clear other states
      setForecast(null); // Clear any existing forecast
      setLoading(false); // Ensure loading is off
      setSearchQuery(''); // Clear the search bar
      
      // 4. Stop the function here
      return; 
    }
    // --- END OF EASTER EGG ---

    const key = process.env.REACT_APP_WEATHER_KEY;
    if (!key) {
      alert("Weather API key is not configured.");
      return;
    }

    const coordsMatch = searchQuery.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);

    if (coordsMatch) {
      const lat = parseFloat(coordsMatch[1]);
      const lon = parseFloat(coordsMatch[2]);
      // Call the prop function from Home, save this new location
      await onFetchWeather(lat, lon, true);
    } else {
      // Search by city (needs geocoding first)
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${searchQuery}&appid=${key}&units=metric`;
      setLoading(true); // Set loading state from parent
      try {
        const response = await fetch(url);
        const data = await response.json();

        if (response.ok && data.coord) {
          // Call the prop function from Home, save this new location
          await onFetchWeather(data.coord.lat, data.coord.lon, true);
        } else {
          alert(`Error: ${data.message}`);
          setLoading(false); // Reset loading on error
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Failed to search location.');
        setLoading(false); // Reset loading on error
      }
    }
    setSearchQuery(''); // Clear search bar
  };

  // 5. Update handleUseMyLocation to call the prop
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true); // Set loading state from parent
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        // Call the prop function from Home, save this new location
        await onFetchWeather(position.coords.latitude, position.coords.longitude, true);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to retrieve your location.');
        setLoading(false); // Reset loading on error
      }
    );
  };

  // Handle globe location selection
  const handleGlobeLocationSelect = async (lat, lon) => {
    setShowGlobe(false); // Close globe view after selection
    await onFetchWeather(lat, lon, true);
  };

  const celsiusToFahrenheit = (celsius) => Math.round(celsius * (9/5) + 32);

  const getWeatherReactIcon = (main) => {
    switch(main){
      case 'Clear': return <WiDaySunny />;
      case 'Clouds': return <WiCloud />;
      case 'Rain': return <WiRain />;
      case 'Snow': return <WiSnow />;
      case 'Mist':
      case 'Fog': return <WiFog />;
      case 'Thunderstorm':
      case 'Drizzle': return <WiRain />;
      default: return <WiCloud />;
    };
  };
  /*
  const getWeatherIcon = (main) => {
    // Return class name instead of emoji
    const iconMap = {
      Clear: 'clear', 
      Clouds: 'clouds',
      Rain: 'rain',
      Snow: 'snow',
      Thunderstorm: 'thunderstorm',
      Drizzle: 'drizzle',
      Mist: 'mist',
      Fog: 'mist'
    };
    return iconMap[main] || 'clouds';
  };*/

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
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              className="search-input"
              placeholder="Search for a city or enter coordinates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="search-btn">
              {/*<span className="search-icon"></span>*/}
              <FaSearch />
            </button>
          </form>
          <button className="location-btn" onClick={handleUseMyLocation}>
            {/*<span className="location-icon"></span>*/}
            <FaLocationArrow />
            Use My Location
          </button>
          <button
            className={`globe-toggle-btn ${showGlobe ? 'active' : ''}`}
            onClick={() => setShowGlobe(!showGlobe)}
          >
            <FaGlobe />
            {showGlobe ? 'Hide Globe' : 'Show Globe'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading">Loading weather data...</div>
      )}

      {showGlobe && (
        <div className="globe-section">
          <GlobeComponent
            onLocationSelect={handleGlobeLocationSelect}
            recentLocations={recentLocations || []}
          />
        </div>
      )}

      {weather && !loading && !showGlobe && (
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
              {/*<span className={`condition-icon weather-icon-${getWeatherIcon(weather.weather[0].main)}`}></span>*/}
              <div>
                {getWeatherReactIcon(weather.weather[0].main)}
              </div>
              <div className="condition-text">
                <div className="condition-main">{weather.weather[0].main}</div>
                <div className="condition-desc">{weather.weather[0].description}</div>
              </div>
            </div>

            <div className="weather-metrics">
              <div className="metric">
                {/*<div className="metric-icon icon-humidity"></div>*/}
                <div className="metric-icon"><WiHumidity /></div>
                <div className="metric-label">Humidity</div>
                <div className="metric-value">{weather.main.humidity}%</div>
              </div>
              <div className="metric">
                {/*<div className="metric-icon icon-wind"></div>*/}
                <div className="metric-icon"><WiStrongWind /></div>
                <div className="metric-label">Wind</div>
                <div className="metric-value">{Math.round(weather.wind.speed * 2.237)} mph</div>
              </div>
              <div className="metric">
                {/*<div className="metric-icon icon-visibility"></div>*/}
                <div className="metric-icon"><WiFog /></div>
                <div className="metric-label">Visibility</div>
                <div className="metric-value">{Math.round(weather.visibility / 1609)} mi</div>
              </div>
              <div className="metric">
                {/*<div className="metric-icon icon-pressure"></div>*/}
                <div className="metric-icon"><WiBarometer /></div>
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
                  {/*<div className={`forecast-icon weather-icon-${getWeatherIcon(hour.weather[0].main)}`}></div>*/}
                  <div className='forcast-icon'>
                    {getWeatherReactIcon(hour.weather[0].main)}
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

      {!weather && !loading && !showGlobe && (
        <div className="empty-state">
          {/*<div className="empty-icon weather-icon-clouds"></div>*/}
          <div className="empty-icon"><WiCloud /></div>
          <h3>Search for a location</h3>
          <p>Enter a city name or coordinates to get started</p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
