/**
 * Inverse Distance Weighting (IDW) interpolation for wind grid.
 * Given a grid of {lat, lon, speed, heading} points, returns
 * interpolated {speed, heading} at any query location.
 */

const DEG2RAD = Math.PI / 180;

// Approximate distance in degrees (cheap, good enough for weighting)
function dist2(lat1, lon1, lat2, lon2) {
  const dlat = lat2 - lat1;
  const dlon = lon2 - lon1;
  return dlat * dlat + dlon * dlon; // squared distance — avoids sqrt
}

/**
 * Interpolate wind at (lat, lon) from a grid of wind observations.
 * Uses IDW with p=2. Wind direction is interpolated circularly via sin/cos.
 *
 * @param {number} lat   query latitude
 * @param {number} lon   query longitude
 * @param {Array}  grid  [{lat, lon, speed, heading}, ...]
 * @returns {{speed: number, heading: number}}  speed in km/h, heading in degrees
 */
export function interpolateWind(lat, lon, grid) {
  if (!grid || grid.length === 0) return { speed: 0, heading: 0 };
  if (grid.length === 1) return { speed: grid[0].speed, heading: grid[0].heading };

  let wSum = 0;
  let speedSum = 0;
  let sinSum = 0;
  let cosSum = 0;

  for (let i = 0; i < grid.length; i++) {
    const d2 = dist2(lat, lon, grid[i].lat, grid[i].lon);

    // If nearly on top of a grid point, return it directly
    if (d2 < 0.01) return { speed: grid[i].speed, heading: grid[i].heading };

    const w = 1 / d2; // IDW with p=2 (since d2 is already squared, this is 1/d^2)
    wSum += w;
    speedSum += w * grid[i].speed;

    const rad = grid[i].heading * DEG2RAD;
    sinSum += w * Math.sin(rad);
    cosSum += w * Math.cos(rad);
  }

  const speed = speedSum / wSum;
  let heading = Math.atan2(sinSum / wSum, cosSum / wSum) / DEG2RAD;
  if (heading < 0) heading += 360;

  return { speed, heading };
}

/**
 * Convert a wind grid (km/h, degrees) into the internal unit system
 * used by Particle.jsx (degrees-per-second, radians).
 * Returns a pre-processed grid for fast per-particle lookup.
 */
const KMH_TO_INTERNAL = 1 / (111.32 * 3600);

export function preprocessWindGrid(grid) {
  if (!grid) return null;
  return grid.map(p => ({
    lat: p.lat,
    lon: p.lon,
    speed: p.speed,
    heading: p.heading,
    // Pre-compute internal-unit wind vector components
    internalSpeed: p.speed * KMH_TO_INTERNAL,
  }));
}
