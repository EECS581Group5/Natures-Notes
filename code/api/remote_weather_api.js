module.exports = async (req, res) => {
  const { lat, lon } = req.query;
  const key = process.env.REACT_APP_WEATHER_KEY; // only lives on Vercel

  const r = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`
  );
  const data = await r.json();
  res.status(200).json(data);
};
