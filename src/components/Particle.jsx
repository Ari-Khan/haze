export const gaussianRandom = (mean = 0, stdev = 1) => {
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
};

export const createParticle = (lng = -79.3948, lat = 43.6532) => ({
  id: Math.random(),
  lng,
  lat,
  life: 1.0,
  size: 3,
});

// timeScale factor: minutes simulated per real second
const TIME_SCALE = 60;

// Random uniform distribution between -range and range
const randomUniform = (range) => (Math.random() - 0.5) * 2 * range;

export const updateParticles = (prev, windSpeed, variance, fires = [], windHeading = 0, timeScale = TIME_SCALE) => {
  // Convert wind heading and speed to u,v components (Navier-Stokes)
  const headingRad = (windHeading * Math.PI) / 180;
  const dt = timeScale; // time step scaling
  
  // Wind velocity components (wind_u, wind_v)
  const wind_u = Math.cos(headingRad) * windSpeed * dt;
  const wind_v = Math.sin(headingRad) * windSpeed * dt;
  
  // Diffusion/turbulence variance
  const varStep = variance * dt;

  const next = [];
  for (let i = 0; i < prev.length; i++) {
    const p = prev[i];
    const newLife = p.life - 0.005;
    if (newLife > 0) {
      // Navier-Stokes particle update:
      // position += wind_velocity * dt + random_diffusion
      next.push({
        ...p,
        lng: p.lng + wind_u + randomUniform(varStep),
        lat: p.lat + wind_v + randomUniform(varStep),
        life: newLife
      });
    }
  }

  for (let j = 0; j < fires.length; j++) {
    if (fires[j].active) {
      for (let k = 0; k < 3; k++) {
        next.push(createParticle(fires[j].lng, fires[j].lat));
      }
    }
  }
  return next;
};