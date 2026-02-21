import fs from "fs";
import fetch from "node-fetch";

const minLat = 42;
const maxLat = 83;
const minLon = -141;
const maxLon = -52;

const stepKm = 20;
const kmPerDeg = 111;
const stepDeg = stepKm / kmPerDeg;

function buildGrid() {
  const pts = [];
  for (let lat = minLat; lat <= maxLat; lat += stepDeg) {
    for (let lon = minLon; lon <= maxLon; lon += stepDeg) {
      pts.push({ lat: +lat.toFixed(3), lon: +lon.toFixed(3) });
    }
  }
  return pts;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function buildUrl(batch) {
  const base = "https://api.open-meteo.com/v1/forecast";
  const p = new URLSearchParams({
    hourly: "windspeed_10m,winddirection_10m",
    start_date: "2026-02-21",
    end_date: "2026-02-21",
    timeformat: "unixtime"
  });
  batch.forEach(pt => {
    p.append("latitude[]", pt.lat);
    p.append("longitude[]", pt.lon);
  });
  return `${base}?${p.toString()}`;
}

async function generate() {
  const grid = buildGrid();
  const batches = chunk(grid, 1000);
  const out = [];

  for (let i = 0; i < batches.length; i++) {
    const url = buildUrl(batches[i]);
    const r = await fetch(url);
    const d = await r.json();
    batches[i].forEach((pt, idx) => {
      out.push({
        lat: pt.lat,
        lon: pt.lon,
        windspeed10m: d.hourly.windspeed_10m[idx][0],
        winddirection10m: d.hourly.winddirection_10m[idx][0]
      });
    });
  }

  fs.writeFileSync("windData.json", JSON.stringify(out));
}

generate();