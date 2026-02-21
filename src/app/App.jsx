import React, { useState, useEffect, useRef, useMemo } from 'react';
import { updateParticles } from '../components/Particle';
import MapDisplay from '../components/Map';
import '../index.css';

const App = () => {
  const [particles, setParticles] = useState([]);
  const [windSpeed, setWindSpeed] = useState(0.0005);
  const [variance, setVariance] = useState(0.0002);
  const requestRef = useRef();

  const animate = () => {
    setParticles(prev => updateParticles(prev, windSpeed, variance));
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
    <div className="haze-container">
      <div className="sidebar">
        <h2>HAZE</h2>
        <div className="control-group">
          <div className="control-label">
            <span>Wind Velocity</span>
            <span>{windSpeed.toFixed(4)}</span>
          </div>
          <input className="slider" type="range" min="0" max="0.003" step="0.00001" value={windSpeed} onChange={e => setWindSpeed(parseFloat(e.target.value))} />
        </div>
        <div className="control-group">
          <div className="control-label">
            <span>Turbulence</span>
            <span>{variance.toFixed(4)}</span>
          </div>
          <input className="slider" type="range" min="0" max="0.001" step="0.00001" value={variance} onChange={e => setVariance(parseFloat(e.target.value))} />
        </div>
      </div>
      <MapDisplay geojsonData={geojsonData} />
    </div>
  );
};

export default App;