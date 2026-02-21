import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const csvText = readFileSync(join(__dirname, "..", "src", "data", "nasaFires.csv"), "utf-8");
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

export default function handler(_req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json(allRecords);
}
