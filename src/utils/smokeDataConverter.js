import fs from 'fs';
import {DOMParser} from "xmldom";
import {kml} from "@tmcw/togeojson";

const xml = new DOMParser().parseFromString(fs.readFileSync("hms_smoke20260221.kml", "utf8"));
const geojson = kml(xml);
fs.writeFileSync("smoke.geojson", JSON.stringify(geojson, null, 2));
