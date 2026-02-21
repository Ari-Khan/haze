import { interpolateWind } from '../utils/windInterpolation';

const KMH_TO_INTERNAL = 1 / (111.32 * 3600);

const getColor = (drift, expectedSpread) => {
  if (expectedSpread <= 0.000001) return '#ff0000';
  
  const sigma = drift / expectedSpread;
  
  if (sigma < 0.8) return '#ff0000';
  if (sigma < 1.4) return '#ff4d00';
  if (sigma < 2.0) return '#ff7400';
  if (sigma < 2.6) return '#ff9a00';
  return '#ffc100';               
};

export const createParticle = (lng = -79.3948, lat = 43.6532) => {
  const lifetimeFrames = (336 + Math.random() * 168) * 60;
  return {
    id: Math.random(),
    lng,
    lat,
    idealLng: lng,
    idealLat: lat,
    life: 1.0,
    decay: 1 / lifetimeFrames,
    size: 3,
    color: '#ff0000'
  };
};

export const updateParticles = (prev, windSpeed, variance, fires = [], windHeading = 0, timeScale = 60, density = 0.5, windGrid = null) => {
  const headingRad = (windHeading * Math.PI) / 180;
  const gVLng = Math.cos(headingRad) * windSpeed * timeScale;
  const gVLat = Math.sin(headingRad) * windSpeed * timeScale;
  const varStep = variance * timeScale;
  
  const next = [];
  const len = prev.length;

  for (let i = 0; i < len; i++) {
    const p = prev[i];
    const nextLife = p.life - p.decay;
    if (nextLife <= 0) continue;

    let vLng = gVLng;
    let vLat = gVLat;

    if (windGrid) {
      const w = interpolateWind(p.lat, p.lng, windGrid);
      const spd = w.speed * KMH_TO_INTERNAL * timeScale;
      const hRad = (w.heading * Math.PI) / 180;
      vLng = Math.cos(hRad) * spd;
      vLat = Math.sin(hRad) * spd;
    }

    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(1 - u1));
    const noiseLng = z0 * Math.cos(2.0 * Math.PI * u2) * varStep;
    const noiseLat = z0 * Math.sin(2.0 * Math.PI * u2) * varStep;

    const newLng = p.lng + vLng + noiseLng;
    const newLat = p.lat + vLat + noiseLat;
    
    const newIdealLng = p.idealLng + vLng;
    const newIdealLat = p.idealLat + vLat;

    const dx = newLng - newIdealLng;
    const dy = newLat - newIdealLat;
    const drift = Math.sqrt(dx * dx + dy * dy);
    
    const framesAlive = (1.0 - nextLife) / p.decay;
    const expectedSpread = varStep * Math.sqrt(framesAlive);

    next.push({
      id: p.id,
      lng: newLng,
      lat: newLat,
      idealLng: newIdealLng,
      idealLat: newIdealLat,
      life: nextLife,
      decay: p.decay,
      size: p.size,
      color: getColor(drift, expectedSpread)
    });
  }

  const fireLen = fires.length;
  const spawnRate = 4 * density;
  const whole = Math.floor(spawnRate);
  const frac = spawnRate - whole;

  for (let j = 0; j < fireLen; j++) {
    const f = fires[j];
    if (f.active) {
      let count = whole + (Math.random() < frac ? 1 : 0);
      while (count--) next.push(createParticle(f.lng, f.lat));
    }
  }
  return next;
};