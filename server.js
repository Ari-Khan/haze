import express from "express";
import cors from "cors";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());

/* ───────── Fire data (local CSV) ───────── */
const csvText = readFileSync(join(__dirname, "src/data/nasaFires.csv"), "utf-8");
const lines = csvText.trim().split("\n");
const headers = lines[0].split(",");
const allRecords = [];
for (let i = 1; i < lines.length; i++) {
  const vals = lines[i].split(",");
  const obj = {};
  for (let j = 0; j < headers.length; j++) {
    obj[headers[j].trim()] = (vals[j] || "").trim();
  }
  allRecords.push(obj);
}

console.log(`Loaded ${allRecords.length} fires`);

app.get("/fires", (_req, res) => res.json(allRecords));

/* ───────── Wind data (Open-Meteo grid, cached) ───────── */
// Grid covering Canadian fire regions: every 5° lat, 10° lon
const WIND_GRID = [];
for (let lat = 45; lat <= 65; lat += 5) {
  for (let lon = -130; lon <= -60; lon += 10) {
    WIND_GRID.push({ lat, lon });
  }
}
// 5 lat × 8 lon = 40 grid points

let windCache = { data: null, fetchedAt: 0 };
const WIND_CACHE_TTL = 10 * 60 * 1000; // refresh every 10 min

async function fetchWindGrid() {
  const lats = WIND_GRID.map(p => p.lat).join(",");
  const lons = WIND_GRID.map(p => p.lon).join(",");

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lats}&longitude=${lons}` +
    `&current=wind_speed_10m,wind_direction_10m` +
    `&timezone=auto`;

  const resp = await fetch(url);
  const json = await resp.json();

  // Open-Meteo returns an array when multiple lat/lon provided
  const results = Array.isArray(json) ? json : [json];

  const grid = results.map((r, i) => {
    const spd = r.current.wind_speed_10m;     // km/h
    const dir = r.current.wind_direction_10m;  // meteorological: where wind comes FROM
    // Convert to "heading toward" for simulation
    const heading = (dir + 180) % 360;
    return {
      lat: WIND_GRID[i].lat,
      lon: WIND_GRID[i].lon,
      speed: Math.round(spd * 10) / 10,   // km/h
      direction: dir,                       // where wind comes FROM
      heading: Math.round(heading),         // where wind blows TOWARD
    };
  });

  return {
    grid,
    fetchedAt: new Date().toISOString(),
  };
}

app.get("/wind", async (_req, res) => {
  const now = Date.now();
  if (windCache.data && now - windCache.fetchedAt < WIND_CACHE_TTL) {
    return res.json(windCache.data);
  }

  try {
    windCache.data = await fetchWindGrid();
    windCache.fetchedAt = now;
    const speeds = windCache.data.grid.map(p => p.speed);
    console.log(
      `Wind grid updated: ${windCache.data.grid.length} points, ` +
      `${Math.min(...speeds)}–${Math.max(...speeds)} km/h`
    );
    res.json(windCache.data);
  } catch (err) {
    console.error("Wind fetch error:", err.message);
    if (windCache.data) return res.json(windCache.data); // serve stale
    res.status(500).json({ error: "Failed to fetch wind data" });
  }
});

/* ───────── Start ───────── */
const PORT = 3001;
app.listen(PORT, () => console.log(`HAZE server running on http://localhost:${PORT}`));
