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
  size: Math.random() * 20 + 10
});

export const updateParticles = (prev, windSpeed, variance) => {
  const moved = prev.map(p => ({
    ...p,
    lng: p.lng + gaussianRandom(windSpeed, variance),
    lat: p.lat + gaussianRandom(0, variance),
    life: p.life - 0.0025
  })).filter(p => p.life > 0);

  if (moved.length < 800) moved.push(createParticle());
  return moved;
};