import React, { useState, useEffect, useRef, useMemo } from 'react';
import { updateParticles } from '../components/Particle';
import MapDisplay from '../components/Map';
import ControlPanel from '../components/ControlPanel';
import ViewSwitcher from '../components/View';
import { getWindGridAtTime } from '../utils/windInterpolation';
import firesCsv from '../data/nasaFires.csv?raw';
import '../index.css';

// Map bright_ti4 → fire spawn duration in milliseconds
// ~298 K → 12 hours, ~340+ K → 4 days (linear interpolation clamped)
function fireDurationMs(bright) {
  const MIN_BRIGHT = 298;
  const MAX_BRIGHT = 340;
  const MIN_HOURS = 12;
  const MAX_HOURS = 4 * 24; // 96 hours
  const t = Math.max(0, Math.min(1, (bright - MIN_BRIGHT) / (MAX_BRIGHT - MIN_BRIGHT)));
  const hours = MIN_HOURS + t * (MAX_HOURS - MIN_HOURS);
  return hours * 3600 * 1000; // ms
}

function parseFires(csv) {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    const obj = headers.reduce((o, header, i) => {
      o[header.trim()] = (vals[i] || '').trim();
      return o;
    }, {});
    // Compute fire start time and duration from brightness
    const timeStr = obj.acq_time.padStart(4, '0');
    const hh = timeStr.slice(0, 2);
    const mm = timeStr.slice(2, 4);
    obj._startMs = new Date(`${obj.acq_date}T${hh}:${mm}:00Z`).getTime();
    obj._durationMs = fireDurationMs(parseFloat(obj.bright_ti4) || 298);
    return obj;
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
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 4000);
    return () => clearTimeout(timer);
  }, []);
  const [fireLocation, setFireLocation] = useState(null);
  const [fireScreenPos, setFireScreenPos] = useState(null);
  const [displayFireButton, setDisplayFireButton] = useState(false);
  const [windSpeed, setWindSpeed] = useState(15 / (111.32 * 3600));
  const [targetWindSpeed, setTargetWindSpeed] = useState(15 / (111.32 * 3600));
  const [simPaused, setSimPaused] = useState(false);
  const [nasaFires, setNasaFires] = useState([]);
  const [particleDensity, setParticleDensity] = useState(50);
  const [windForecast, setWindForecast] = useState(null); // { times, grids } from server
  // Start sim at 6 PM UTC
  const START_DATE = new Date('2026-02-21T18:00:00Z').getTime();
  const [simTime, setSimTime] = useState(START_DATE);
  
  const requestRef = useRef();
  const stateRef = useRef({ windSpeed, variance, windHeading, fires, simPaused, view, nasaFires, particleDensity, windForecast, _simTime: simTime });

  useEffect(() => {
    stateRef.current = { windSpeed, variance, windHeading, fires, simPaused, view, nasaFires, particleDensity, windForecast, _simTime: simTime };
  }, [windSpeed, variance, windHeading, fires, simPaused, view, nasaFires, particleDensity, windForecast, simTime]);

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
      setSimTime(t => {
        stateRef.current._simTime = t + 60000;
        return t + 60000;
      });
      const s = stateRef.current;
      const currentSimTime = s._simTime;
      const activeFires = s.view === 'Live'
        ? s.nasaFires
            .filter(f => currentSimTime >= f._startMs && currentSimTime < f._startMs + f._durationMs)
            .map(f => ({ lng: parseFloat(f.longitude), lat: parseFloat(f.latitude), active: true }))
        : s.fires;
      
      setParticles(prev => updateParticles(
        prev, 
        s.windSpeed, 
        s.variance, 
        activeFires, 
        s.windHeading,
        60,
        s.particleDensity / 100,
        s.view === 'Live' ? getWindGridAtTime(s.windForecast, currentSimTime) : null,
      ));
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (view === 'Live') setNasaFires(parseFires(firesCsv));
  }, [view]);

  useEffect(() => {
    if (view !== 'Live') { setWindForecast(null); return; }
    const fetchWind = () => {
      fetch('/api/wind')
        .then(r => r.json())
        .then(data => setWindForecast(data))
        .catch(() => {});
    };
    fetchWind();
    const interval = setInterval(fetchWind, 3600000); // re-fetch every hour
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
        if (v === 'Live') {
          setSimPaused(true);
        } else {
          setSimPaused(false);
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
            resetSim={() => { setParticles([]); setFires([]); setSimTime(START_DATE); }}
            particleDensity={particleDensity}
            setParticleDensity={setParticleDensity}
            view={view}
            windGrid={windForecast && windForecast.times ? getWindGridAtTime(windForecast, simTime) : null}
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
      {view === 'Sim' && (
        <div className={`map-hint ${showHint ? 'map-hint-visible' : 'map-hint-hidden'}`}>
          Click the map to simulate a fire
        </div>
      )}
    </div>
  );
};

export default App;