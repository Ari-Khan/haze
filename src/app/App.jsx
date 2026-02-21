import React, { useState, useEffect, useRef, useMemo } from 'react';
import { updateParticles } from '../components/Particle';
import MapDisplay from '../components/Map';
import ControlPanel from '../components/ControlPanel';
import '../index.css';

const App = () => {
  const [particles, setParticles] = useState([]);
  const [windSpeed, setWindSpeed] = useState(0.0005);
  const [variance, setVariance] = useState(0.0002);
  const requestRef = useRef();

  const animate = () => {
    setParticles((prev) => updateParticles(prev, windSpeed, variance));
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [windSpeed, variance]);

  const geojsonData = useMemo(() => ({
    type: 'FeatureCollection',
    features: particles.map((p) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      properties: { opacity: p.life, size: p.size }
    }))
  }), [particles]);

  return (
    <div className="haze-container">
      <ControlPanel 
        windSpeed={windSpeed} 
        setWindSpeed={setWindSpeed} 
        variance={variance} 
        setVariance={setVariance} 
      />
      <MapDisplay geojsonData={geojsonData} />
    </div>
  );
};

export default App;