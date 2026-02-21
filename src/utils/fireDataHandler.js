import express from "express";
import cors from "cors";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());

const csvText = readFileSync(join(__dirname, "../data/nasaFires.csv"), "utf-8");
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

app.get("/fires", (req, res) => {
  res.json(allRecords);
});
