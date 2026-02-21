const WIND_GRID = [];
for (let lat = 45; lat <= 65; lat += 5) {
  for (let lon = -130; lon <= -60; lon += 10) {
    WIND_GRID.push({ lat, lon });
  }
}

// In-memory cache (persists within a warm serverless instance)
let windCache = { data: null, fetchedAt: 0 };
const WIND_CACHE_TTL = 60 * 60 * 1000;

async function fetchWindForecast() {
  const lats = WIND_GRID.map(p => p.lat).join(",");
  const lons = WIND_GRID.map(p => p.lon).join(",");

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lats}&longitude=${lons}` +
    `&hourly=wind_speed_10m,wind_direction_10m` +
    `&timezone=UTC` +
    `&forecast_days=7`;

  const resp = await fetch(url);
  const json = await resp.json();

  const results = Array.isArray(json) ? json : [json];
  const times = results[0].hourly.time;
  const grids = {};

  for (let t = 0; t < times.length; t++) {
    const timeKey = times[t];
    const grid = [];
    for (let i = 0; i < results.length; i++) {
      const spd = results[i].hourly.wind_speed_10m[t];
      const dir = results[i].hourly.wind_direction_10m[t];
      const heading = (dir + 180) % 360;
      grid.push({
        lat: WIND_GRID[i].lat,
        lon: WIND_GRID[i].lon,
        speed: Math.round(spd * 10) / 10,
        direction: dir,
        heading: Math.round(heading),
      });
    }
    grids[timeKey] = grid;
  }

  return { times, grids, fetchedAt: new Date().toISOString() };
}

export default async function handler(_req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const now = Date.now();
  if (windCache.data && now - windCache.fetchedAt < WIND_CACHE_TTL) {
    return res.json(windCache.data);
  }

  try {
    windCache.data = await fetchWindForecast();
    windCache.fetchedAt = now;
    res.json(windCache.data);
  } catch (err) {
    console.error("Wind fetch error:", err.message);
    if (windCache.data) return res.json(windCache.data);
    res.status(500).json({ error: "Failed to fetch wind data" });
  }
}
