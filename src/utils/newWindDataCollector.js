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

function dateStr(d) {
  return d.toISOString().split("T")[0];
}

function buildUrl(batch, start, end) {
  const base = "https://api.open-meteo.com/v1/forecast";
  const p = new URLSearchParams({
    hourly: "windspeed_10m,winddirection_10m",
    start_date: start,
    end_date: end,
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

  const today = new Date();
  const future = new Date(Date.now() + 16 * 24 * 60 * 60 * 1000);
  const start = dateStr(today);
  const end = dateStr(future);

  for (let i = 0; i < batches.length; i++) {
    const url = buildUrl(batches[i], start, end);
    const r = await fetch(url);
    const d = await r.json();

    batches[i].forEach((pt, idx) => {
      const hours = d.hourly.time.map((t, hIdx) => ({
        time: t,
        ws: d.hourly.windspeed_10m[idx][hIdx],
        wd: d.hourly.winddirection_10m[idx][hIdx]
      }));

      out.push({
        lat: pt.lat,
        lon: pt.lon,
        hours
      });
    });
  }

  fs.writeFileSync("newWindData.json", JSON.stringify(out));
}

generate();