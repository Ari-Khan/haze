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
 * Given the full wind forecast data and a sim timestamp (ms),
 * return the appropriate spatial grid, interpolated between the two
 * bracketing hourly snapshots.
 *
 * @param {{ times: string[], grids: Object }} windForecast
 * @param {number} simTimeMs  simulation time in epoch ms
 * @returns {Array|null}  [{lat, lon, speed, heading}, ...] or null
 */
export function getWindGridAtTime(windForecast, simTimeMs) {
  if (!windForecast || !windForecast.times || windForecast.times.length === 0) return null;

  const { times, grids } = windForecast;

  // Convert ISO times to epoch ms (Open-Meteo returns "2026-02-21T18:00" without Z, but we requested UTC)
  // Add 'Z' if missing to ensure UTC parsing
  const epochTimes = times.map(t => new Date(t.endsWith('Z') ? t : t + 'Z').getTime());

  // Clamp to available range
  if (simTimeMs <= epochTimes[0]) return grids[times[0]];
  if (simTimeMs >= epochTimes[epochTimes.length - 1]) return grids[times[times.length - 1]];

  // Find bracketing hours
  let lo = 0;
  for (let i = 1; i < epochTimes.length; i++) {
    if (epochTimes[i] > simTimeMs) { lo = i - 1; break; }
  }
  const hi = lo + 1;
  const t0 = epochTimes[lo];
  const t1 = epochTimes[hi];
  const frac = (simTimeMs - t0) / (t1 - t0); // 0..1 between hours

  const gridA = grids[times[lo]];
  const gridB = grids[times[hi]];

  if (!gridA) return gridB;
  if (!gridB) return gridA;

  // Linearly interpolate speed; circularly interpolate heading
  return gridA.map((a, i) => {
    const b = gridB[i];
    const speed = a.speed + frac * (b.speed - a.speed);

    // Circular interpolation for heading
    const radA = a.heading * DEG2RAD;
    const radB = b.heading * DEG2RAD;
    const sinH = Math.sin(radA) * (1 - frac) + Math.sin(radB) * frac;
    const cosH = Math.cos(radA) * (1 - frac) + Math.cos(radB) * frac;
    let heading = Math.atan2(sinH, cosH) / DEG2RAD;
    if (heading < 0) heading += 360;

    return { lat: a.lat, lon: a.lon, speed, heading: Math.round(heading) };
  });
}
