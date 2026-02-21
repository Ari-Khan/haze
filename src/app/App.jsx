import React, { useState, useEffect, useRef, useMemo } from 'react';
import Map, { Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const App = () => {
  const [particles, setParticles] = useState([]);
  const [windSpeed, setWindSpeed] = useState(0.0005);
  const [variance, setVariance] = useState(0.0002);
  const requestRef = useRef();

  const gaussianRandom = (mean = 0, stdev = 1) => {
    const u = 1 - Math.random();
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdev + mean;
  };

  const createParticle = () => ({
    id: Math.random(),
    lng: -79.3948, 
    lat: 43.6532,
    life: 1.0,
    size: Math.random() * 20 + 10
  });

  const animate = () => {
    setParticles(prev => {
      const moved = prev.map(p => ({
        ...p,
        lng: p.lng + gaussianRandom(windSpeed, variance),
        lat: p.lat + gaussianRandom(0, variance),
        life: p.life - 0.0025
      })).filter(p => p.life > 0);

      if (moved.length < 800) moved.push(createParticle());
      return moved;
    });
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [windSpeed, variance]);

  const geojsonData = useMemo(() => ({
    type: 'FeatureCollection',
    features: particles.map(p => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      properties: { opacity: p.life, size: p.size }
    }))
  }), [particles]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div style={{
        position: 'absolute', top: 20, left: 20, zIndex: 10, width: '240px',
        background: 'rgba(15, 15, 15, 0.9)', color: 'white', padding: '20px', 
        borderRadius: '12px', fontFamily: 'system-ui', border: '1px solid #333'
      }}>
        <h2 style={{ marginTop: 0, fontSize: '20px', letterSpacing: '-0.5px' }}>HAZE</h2>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontSize: '10px', color: '#666', marginBottom: '5px' }}>WIND VELOCITY</label>
          <input style={{ width: '100%' }} type="range" min="0" max="0.003" step="0.00001" value={windSpeed} onChange={e => setWindSpeed(parseFloat(e.target.value))} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '10px', color: '#666', marginBottom: '5px' }}>TURBULENCE (STDEV)</label>
          <input style={{ width: '100%' }} type="range" min="0" max="0.001" step="0.00001" value={variance} onChange={e => setVariance(parseFloat(e.target.value))} />
        </div>
      </div>

      <Map
        initialViewState={{ longitude: -79.39, latitude: 43.65, zoom: 13 }}
        mapStyle="https://api.maptiler.com/maps/darkmatter/style.json?key=duEjNzjCJQeKVVLF9cJC"
      >
        <Source type="geojson" data={geojsonData}>
          <Layer
            id="haze-layer"
            type="circle"
            paint={{
              'circle-radius': ['get', 'size'],
              'circle-color': '#90a4ae',
              'circle-opacity': ['get', 'opacity'],
              'circle-blur': 2.5
            }}
          />
        </Source>
      </Map>
    </div>
  );
};

export default App;