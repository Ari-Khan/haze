import random from "@turf/random";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import bbox from "@turf/bbox";

export function generateParticles(geojson, countPerPoly = 300) {
  let all = [];

  for (const feature of geojson.features) {
    if (feature.geometry.type !== "Polygon") continue;

    const [minX, minY, maxX, maxY] = bbox(feature);

    const particles = [];

    while (particles.length < countPerPoly) {
      const pt = random.point(1, {
        bbox: [minX, minY, maxX, maxY]
      }).features[0];

      if (booleanPointInPolygon(pt, feature)) {
        particles.push({
          lat: pt.geometry.coordinates[1],
          lon: pt.geometry.coordinates[0],
          density: feature.properties.name 
        });
      }
    }

    all = all.concat(particles);
  }

  return all;
}