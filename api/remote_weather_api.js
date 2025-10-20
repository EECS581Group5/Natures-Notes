module.exports = async (req, res) => {
  // CORS — allow your local dev and production
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ message: 'Latitude and longitude are required' });
  }

  const key = process.env.REACT_APP_WEATHER_KEY;

  if (!key) {
    return res.status(500).json({ message: 'Weather API key not configured' });
  }

  try {
    const r = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`
    );
    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json(data);
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching weather:', error);
    res.status(500).json({ message: 'Failed to fetch weather data' });
  }
};
