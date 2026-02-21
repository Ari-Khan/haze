import express from "express";
import fetch from "node-fetch";
import csvParse from "csv-parse/lib/sync";

const app = express();

app.get("/fires", async (req, res) => {
    try {
        const url = "https://firms.modaps.eosdis.nasa.gov/api/area/csv/YOUR_KEY/VIIRS_SNPP_NRT/world/1/2026-02-21";
        const response = await fetch(url);
        const text = await response.text();

        // Parse CSV into JSON
        const records = csvParse(text, { columns: true, skip_empty_lines: true });
        res.json(records); // Send JSON to frontend
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching fire data");
    }
});

app.listen(3001, () => console.log("Server running on port 3001"));