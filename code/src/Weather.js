import { useState, useEffect } from "react";
import "./Weather.css";
import Music from "./Music";
import { addLocation, getRecentLocations } from './services/locationService';
// Weather component to fetch and display weather information
function Weather() {
  const [mode, setMode] = useState("city");
  const [city, setCity] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  // On component mount, load weather for most recent location
  useEffect(() => {
    const initWeather = async () => {
      const locations = await getRecentLocations()
      const key = process.env.REACT_APP_WEATHER_KEY;
      let most_recent_loc = [];
      let recent_lat = "";
      let recent_lon = "";
      let url = "";
      if (locations.length > 0) {
        most_recent_loc = locations[0];
        recent_lat = most_recent_loc.latitude;
        recent_lon = most_recent_loc.longitude;
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${recent_lat}&lon=${recent_lon}&appid=${key}&units=metric`;
        await fetchWeather(url, false);
      }
      else {
        console.log('No recent locations found.');
      }
    };
    initWeather();
    console.log('Weather loaded');
  }, []);
  // Fetch weather based on user input
  async function getWeather(e) {
    if (e) e.preventDefault();
    const key = process.env.REACT_APP_WEATHER_KEY;
    let url = "";

    // Decide based on selected mode
    if (mode === "city" && city.trim()) {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${key}&units=metric`;
    } else if (mode === "coords" && lat && lon) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`;
    } else if (mode === "current") {
      await getLocationWeather();
      return;
    } else {
      alert("Please fill in the required fields.");
      return;
    }

    await fetchWeather(url);
  }
  // Core function to fetch weather data
  async function fetchWeather(url, save_loc_flag = true) {
  setLoading(true);
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log("Weather data:", data);

    if (response.ok) {
      setWeather(data);

      // ✅ Save location (only if we have valid coordinates)
      // Also, only save the location if the save_loc_flag is set to true
      if (save_loc_flag && data.coord && data.coord.lat && data.coord.lon) {
        try {
          await addLocation(data.coord.lat, data.coord.lon);
          console.log("Location saved:", data.coord);
        } catch (err) {
          console.error("Error saving location:", err);
        }
      }

    } else {
      setWeather(null);
      alert(`Error: ${data.message}`);
    }
  } catch (error) {
    console.error("Error fetching weather:", error);
    alert("Failed to fetch weather. Please try again.");
  } finally {
    setLoading(false);
  }
}


  // 🌍 Get current location
  async function getLocationWeather() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        console.log("Detected location:", lat, lon);

        const key = process.env.REACT_APP_WEATHER_KEY;
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`;
        await fetchWeather(url);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to retrieve your location.");
        setLoading(false);
      }
    );
  }

  return (
    <div className="weather-app-container"> {/* New wrapping div */}
      <div className="weather-container">
        <h2>🌦️ Weather Finder 🌦️</h2>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={mode === "city" ? "active" : ""}
            onClick={() => setMode("city")}
          >
            By <br></br>City
          </button>
          <button
            className={mode === "coords" ? "active" : ""}
            onClick={() => setMode("coords")}
          >
            By <br></br>Coordinates
          </button>
          <button
            className={mode === "current" ? "active" : ""}
            onClick={() => setMode("current")}
          >
            Use Current Location
          </button>
        </div>

        {/* Form */}
        {mode !== "current" && (
          <form onSubmit={getWeather} className="form">
            {mode === "city" ? (
              <input
                type="text"
                placeholder="Enter city name"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Latitude"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Longitude"
                  value={lon}
                  onChange={(e) => setLon(e.target.value)}
                />
              </>
            )}
            <button type="submit">Get Weather</button>
          </form>
        )}

        {/* “Current Location” Mode Button */}
        {mode === "current" && (
          <div className="form">
            <button onClick={getWeather}>Detect My Location 🌍</button>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && <p>Loading...</p>}

        {/* Result */}
        {weather && weather.main && !loading && (
          <div className="result">
            <p className="Location">{weather.name || "Location"}</p>
            <p className="desc">{(Math.round(weather.main.temp * (9/5) + 32))}° F
            <br />{weather.weather[0].description}</p>
          </div>
        )}
      </div>

      {/* Integration of Music component */}
      <div className="music-container">
        <Music weather={weather} />
      </div>
    </div>
  );
}

export default Weather;
