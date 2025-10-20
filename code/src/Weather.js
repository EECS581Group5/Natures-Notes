import { useState } from "react";

function Weather() {
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [weather, setWeather] = useState(null);



  async function getWeather(e) {
    e.preventDefault();

    if (!lat || !lon) {
      alert("Please enter both latitude and longitude");
      return;
    }

    try {
      const response = await fetch(`https://natures-notes.vercel.app/api/weather?lat=${lat}&lon=${lon}`);

      const data = await response.json();

      if (response.ok) {
        setWeather(data);
      } else {
        setWeather(null);
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Error fetching weather:", error);
      alert("Failed to fetch weather. Please try again.");
    }
  }

  return (
    <div>
      <form onSubmit={getWeather}>
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
        <button type="submit">Get Weather</button>
      </form>

      {weather && weather.main ? (
        <div>
          <h2>{weather.name || "Location"}</h2>
          <p>{weather.main.temp} °C</p>
          <p>{weather.weather[0].description}</p>
        </div>
      ) : null}
    </div>
  );
}

export default Weather;
