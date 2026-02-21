export const gaussianRandom = (mean = 0, stdev = 1) => {
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
};

export const createParticle = (lng = -79.3948, lat = 43.6532) => {
  // Random lifetime between 2–3 weeks (336–504 sim-hours)
  const lifetimeHours = 336 + Math.random() * 168;
  // At 60fps, each frame = 1 sim-hour / 60 frames
  // decay per frame = 1 / (lifetimeHours * 60)
  return {
    id: Math.random(),
    lng,
    lat,
    life: 1.0,
    decay: 1 / (lifetimeHours * 60),
    size: 3,
  };
};

// timeScale factor: minutes simulated per real second
const TIME_SCALE = 60;

export const updateParticles = (prev, windSpeed, variance, fires = [], windHeading = 0, timeScale = TIME_SCALE, density = 0.5) => {
  const headingRad = (windHeading * Math.PI) / 180;
  const vLng = Math.cos(headingRad) * windSpeed * timeScale;
  const vLat = Math.sin(headingRad) * windSpeed * timeScale;
  const varStep = variance * timeScale;

  const next = [];
  for (let i = 0; i < prev.length; i++) {
    const p = prev[i];
    const newLife = p.life - p.decay;
    if (newLife > 0) {
      next.push({
        ...p,
        lng: p.lng + gaussianRandom(vLng, varStep),
        lat: p.lat + gaussianRandom(vLat, varStep),
        life: newLife
      });
    }
  }

  for (let j = 0; j < fires.length; j++) {
    if (fires[j].active) {
      // Scale spawn: 0% = 0, 50% = 2, 100% = 4 particles/fire/frame
      // Use fractional spawning: integer part always spawns, fractional part is a probability
      const rate = 4 * density;
      const whole = Math.floor(rate);
      const frac = rate - whole;
      let spawnCount = whole;
      if (frac > 0 && Math.random() < frac) spawnCount++;
      for (let k = 0; k < spawnCount; k++) {
        next.push(createParticle(fires[j].lng, fires[j].lat));
      }
    }
  }
  return next;
};