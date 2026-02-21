import express from "express";
import fetch from "node-fetch";

const app = express()

app.get("/fires", async (req, res) => {
    const url = "https://firms.modaps.eosdis.nasa.gov/api/area/csv/d81f9036fb452094023c5230273b066e/VIIRS_SNPP_NRT/world/1/2026-02-21"
    const res = await fetch(url);
    const text = await res.text();
    res.send(text);
});

app.listen(3001, () => console.log("Server running"));