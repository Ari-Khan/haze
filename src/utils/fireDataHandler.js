import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

app.get("/fires", async (req, res) => {
    try {
        const url = "https://firms.modaps.eosdis.nasa.gov/api/area/csv/d81f9036fb452094023c5230273b066e/VIIRS_SNPP_NRT/world/1";
        const response = await fetch(url);
        const text = await response.text();

        const lines = text.trim().split("\n");
        if (lines.length < 2) return res.json([]);
        const headers = lines[0].split(",");
        const records = [];
        for (let i = 1; i < lines.length; i++) {
            const vals = lines[i].split(",");
            const obj = {};
            for (let j = 0; j < headers.length; j++) {
                obj[headers[j].trim()] = (vals[j] || "").trim();
            }
            records.push(obj);
        }
        console.log(`Fetched ${records.length} fire records`);
        res.json(records);
    } catch (err) {
        console.error("FIRMS fetch error:", err);
        res.status(500).json({ error: "Error fetching fire data" });
    }
});

app.listen(3001, () => console.log("Fire data server running on http://localhost:3001"));