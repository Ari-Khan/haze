import React, { useState, useEffect, useRef, useMemo } from 'react';
import { updateParticles } from '../components/Particle';
import MapDisplay from '../components/Map';
import ControlPanel from '../components/ControlPanel';
import ViewSwitcher from '../components/View';
import firesCsv from '../data/nasaFires.csv?raw';
import '../index.css';

function parseFires(csv) {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    return headers.reduce((obj, header, i) => {
      obj[header.trim()] = (vals[i] || '').trim();
      return obj;
    }, {});
  });
}

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
  const [windSpeed, setWindSpeed] = useState(15 / (111.32 * 3600));
  const [targetWindSpeed, setTargetWindSpeed] = useState(15 / (111.32 * 3600));
  const [simPaused, setSimPaused] = useState(false);
  const [nasaFires, setNasaFires] = useState([]);
  const [particleDensity, setParticleDensity] = useState(50);
  const [windGrid, setWindGrid] = useState(null);
  const START_DATE = new Date('2026-02-21T18:00:00').getTime();
  const [simTime, setSimTime] = useState(START_DATE);
  
  const requestRef = useRef();
  const stateRef = useRef({ windSpeed, variance, windHeading, fires, simPaused, view, nasaFires, particleDensity, windGrid });

  useEffect(() => {
    stateRef.current = { windSpeed, variance, windHeading, fires, simPaused, view, nasaFires, particleDensity, windGrid };
  }, [windSpeed, variance, windHeading, fires, simPaused, view, nasaFires, particleDensity, windGrid]);

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
      setSimTime(t => t + 60000);
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
        60,
        s.particleDensity / 100,
        s.view === 'Live' ? s.windGrid : null,
      ));
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (view === 'Live') setNasaFires(parseFires(firesCsv));
  }, [view]);

  useEffect(() => {
    if (view !== 'Live') { setWindGrid(null); return; }
    const fetchWind = () => {
      fetch('http://localhost:3001/wind')
        .then(r => r.json())
        .then(data => setWindGrid(data.grid || null))
        .catch(() => {});
    };
    fetchWind();
    const interval = setInterval(fetchWind, 600000);
    return () => clearInterval(interval);
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
      properties: { 
        opacity: p.life, 
        size: p.size,
        color: p.color // Fixed: Particles will now render their probability color
      }
    }))
  }), [particles]);

  return (
    <div className="haze-container">
      <ViewSwitcher view={view} setView={(v) => {
        setParticles([]);
        setSimTime(START_DATE);
        if (v === 'Live') setSimPaused(true);
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
            resetSim={() => { setParticles([]); setFires([]); setSimTime(START_DATE); }}
            particleDensity={particleDensity}
            setParticleDensity={setParticleDensity}
            view={view}
            windGrid={windGrid}
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
      <div className="sim-clock">
        {new Date(simTime).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
        {' '}
        {new Date(simTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
};

export default App;