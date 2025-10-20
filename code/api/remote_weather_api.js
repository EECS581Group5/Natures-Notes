module.exports = async (req, res) => {

    // CORS — allow your local dev and (optionally) others
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000'); // or '*' for wide-open
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  const { lat, lon } = req.query;
  const key = process.env.REACT_APP_WEATHER_KEY; // only lives on Vercel

  const r = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`
  );
  const data = await r.json();
  res.status(200).json(data);
};
