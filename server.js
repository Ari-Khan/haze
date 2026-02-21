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
app.get("/api/fires", (_req, res) => res.json(allRecords));

/* ───────── Wind data (Open-Meteo hourly forecast grid, cached) ───────── */
// Grid covering Canadian fire regions: every 5° lat, 10° lon
const WIND_GRID = [];
for (let lat = 45; lat <= 65; lat += 5) {
  for (let lon = -130; lon <= -60; lon += 10) {
    WIND_GRID.push({ lat, lon });
  }
}
// 5 lat × 8 lon = 40 grid points

let windCache = { data: null, fetchedAt: 0 };
const WIND_CACHE_TTL = 60 * 60 * 1000; // refresh hourly

async function fetchWindForecast() {
  const lats = WIND_GRID.map(p => p.lat).join(",");
  const lons = WIND_GRID.map(p => p.lon).join(",");

  // Fetch hourly forecast for next 7 days
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lats}&longitude=${lons}` +
    `&hourly=wind_speed_10m,wind_direction_10m` +
    `&timezone=UTC` +
    `&forecast_days=7`;

  const resp = await fetch(url);
  const json = await resp.json();

  const results = Array.isArray(json) ? json : [json];

  // Build time-indexed grids: { times: [isoString...], grids: { [isoTime]: [{lat,lon,speed,heading}...] } }
  const times = results[0].hourly.time; // all stations share same time array
  const grids = {};

  for (let t = 0; t < times.length; t++) {
    const timeKey = times[t]; // e.g. "2026-02-21T18:00"
    const grid = [];
    for (let i = 0; i < results.length; i++) {
      const spd = results[i].hourly.wind_speed_10m[t];     // km/h
      const dir = results[i].hourly.wind_direction_10m[t];  // meteorological
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

app.get("/wind", windHandler);
app.get("/api/wind", windHandler);

async function windHandler(_req, res) {
  const now = Date.now();
  if (windCache.data && now - windCache.fetchedAt < WIND_CACHE_TTL) {
    return res.json(windCache.data);
  }

  try {
    windCache.data = await fetchWindForecast();
    windCache.fetchedAt = now;
    console.log(
      `Wind forecast updated: ${WIND_GRID.length} points × ${windCache.data.times.length} hours`
    );
    res.json(windCache.data);
  } catch (err) {
    console.error("Wind fetch error:", err.message);
    if (windCache.data) return res.json(windCache.data);
    res.status(500).json({ error: "Failed to fetch wind data" });
  }
}

/* ───────── Start ───────── */
const PORT = 3001;
app.listen(PORT, () => console.log(`HAZE server running on http://localhost:${PORT}`));
