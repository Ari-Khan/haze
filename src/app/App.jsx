import React, { useState, useEffect, useRef, useMemo } from 'react';
import { updateParticles } from '../components/Particle';
import MapDisplay from '../components/Map';
import ControlPanel from '../components/ControlPanel';
import ViewSwitcher from '../components/View';
import '../index.css';

const App = () => {
  const [view, setView] = useState('Sim');
  const [particles, setParticles] = useState([]);
  const [fires, setFires] = useState([]);
  const [variance, setVariance] = useState(0.00003);
  const [windHeading, setWindHeading] = useState(0);
  const [targetVariance, setTargetVariance] = useState(0.00003);
  const [targetWindHeading, setTargetWindHeading] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [fireLocation, setFireLocation] = useState(null);
  const [fireScreenPos, setFireScreenPos] = useState(null);
  const [displayFireButton, setDisplayFireButton] = useState(false);
  const [windSpeed, setWindSpeed] = useState(10 / (111.32 * 3600));
  const [targetWindSpeed, setTargetWindSpeed] = useState(10 / (111.32 * 3600));
  const [simPaused, setSimPaused] = useState(false);
  const [nasaFires, setNasaFires] = useState([]);
  
  const requestRef = useRef();
  const stateRef = useRef({ windSpeed, variance, windHeading, fires, simPaused, view, nasaFires });

  useEffect(() => {
    stateRef.current = { windSpeed, variance, windHeading, fires, simPaused, view, nasaFires };
  }, [windSpeed, variance, windHeading, fires, simPaused, view, nasaFires]);

  const animate = () => {
    setWindSpeed(ws => {
      const diff = targetWindSpeed - ws;
      return Math.abs(diff) < 0.000001 ? targetWindSpeed : ws + diff * 0.08;
    });
    setVariance(v => {
      const diff = targetVariance - v;
      return Math.abs(diff) < 0.000001 ? targetVariance : v + diff * 0.08;
    });
    setWindHeading(wh => {
      let diff = targetWindHeading - wh;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      return Math.abs(diff) < 0.1 ? targetWindHeading : wh + diff * 0.08;
    });

    if (!stateRef.current.simPaused) {
      const s = stateRef.current;
      const activeFires = s.view === 'Live'
        ? s.nasaFires.map(f => ({ lng: parseFloat(f.longitude), lat: parseFloat(f.latitude), active: true }))
        : s.fires;
      setParticles(prev => updateParticles(
        prev, 
        s.windSpeed, 
        s.variance, 
        activeFires, 
        s.windHeading, 
      ));
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  // Fetch NASA fires only when switching to Live view
  useEffect(() => {
    if (view !== 'Live') return;
    const fetchFires = async () => {
      try {
        const res = await fetch("http://localhost:3001/fires");
        const data = await res.json();
        setNasaFires(data);
      } catch (err) {
        console.error("Error fetching NASA fire data:", err);
      }
    };
    fetchFires();
  }, [view]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [targetWindSpeed, targetVariance, targetWindHeading]);

  const geojsonData = useMemo(() => ({
    type: 'FeatureCollection',
    features: particles.map(p => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      properties: { opacity: p.life, size: p.size }
    }))
  }), [particles]);

  const nasaFireGeoJSON = useMemo(() => ({
    type: "FeatureCollection",
    features: nasaFires.map(fire => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [parseFloat(fire.longitude), parseFloat(fire.latitude)]
      },
      properties: {
        brightness: fire.brightness,
        confidence: fire.confidence
      }
    }))
  }), [nasaFires]);

  return (
    <div className="haze-container">
      <ViewSwitcher view={view} setView={(v) => {
        setParticles([]);
        if (v === 'Live') {
          setSimPaused(true);
        }
        setView(v);
      }} />
      {sidebarOpen ? (
        <div className="right-sidebar">
          <ControlPanel 
            windSpeed={Math.round(targetWindSpeed * 111.32 * 3600)}
            setWindSpeed={kmh => setTargetWindSpeed(kmh / (111.32 * 3600))} 
            variance={Math.round(targetVariance / 0.00006 * 100)} 
            setVariance={pct => setTargetVariance(pct / 100 * 0.00006)} 
            windHeading={targetWindHeading}
            setWindHeading={setTargetWindHeading}
            onClose={() => setSidebarOpen(false)}
            fires={view === 'Sim' ? fires : []}
            stopFire={idx => setFires(f => f.map((item, i) => i === idx ? { ...item, active: false } : item))}
            simPaused={simPaused}
            setSimPaused={setSimPaused}
            resetSim={() => { setParticles([]); setFires([]); }}
          />
        </div>
      ) : (
        <button className="sidebar-reopen-btn" onClick={() => setSidebarOpen(true)}>&#9776;</button>
      )}
      <MapDisplay 
        geojsonData={geojsonData}
        view={view}
        onMapClick={(lngLat, screenPos) => {
          if (view === 'Sim') {
            setFireLocation(lngLat);
            setFireScreenPos(screenPos);
            setDisplayFireButton(true);
          }
        }}
      />
      {displayFireButton && fireLocation && fireScreenPos && view === 'Sim' && (
        <div className="fire-popup" style={{position: 'absolute', left: fireScreenPos.x, top: fireScreenPos.y, transform: 'translate(-50%, -50%)', zIndex: 50}}>
          <button className="fire-btn" onClick={() => {
            setFires(f => [...f, { lng: fireLocation.lng, lat: fireLocation.lat, active: true }]);
            setDisplayFireButton(false);
          }}>Simulate Fire</button>
        </div>
      )}
    </div>
  );
};

export default App;