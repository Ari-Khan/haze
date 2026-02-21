import React from 'react';

const ControlPanel = ({ windSpeed, setWindSpeed, variance, setVariance, windHeading, setWindHeading, onClose, fires, stopFire, simPaused, setSimPaused, resetSim, particleDensity, setParticleDensity, view, windGrid }) => {
  const isLive = view === 'Live';

  // Compute wind summary for Live view
  let windSummary = null;
  if (isLive && windGrid && windGrid.length > 0) {
    const speeds = windGrid.map(p => p.speed);
    const minSpd = Math.round(Math.min(...speeds));
    const maxSpd = Math.round(Math.max(...speeds));
    windSummary = { min: minSpd, max: maxSpd };
  }

  return (
    <div>
      <div className="sidebar-header">
        <h2>HAZE</h2>
        <button className="close-btn" onClick={onClose}>&times;</button>
      </div>
      {isLive ? (
        <div className="control-group">
          <div className="control-label">
            <span>Wind</span>
            <span>{windSummary ? `${windSummary.min}–${windSummary.max} km/h` : 'Loading...'}</span>
          </div>
          <div className="wind-live-note">Spatially varying · {windGrid ? windGrid.length : 0} grid points</div>
        </div>
      ) : (
        <>
          <div className="control-group">
            <div className="control-label">
              <span>Wind Velocity</span>
              <span>{windSpeed} km/h</span>
            </div>
            <input className="slider" type="range" min="0" max="200" step="1" value={windSpeed} onChange={(e) => setWindSpeed(parseInt(e.target.value))} />
          </div>
          <div className="control-group">
            <div className="control-label">
              <span>Wind Heading</span>
              <span>{windHeading}&deg;</span>
            </div>
            <input className="slider" type="range" min="0" max="360" step="1" value={windHeading} onChange={(e) => setWindHeading(parseInt(e.target.value))} />
          </div>
        </>
      )}
      <div className="control-group">
        <div className="control-label">
          <span>Particle Density</span>
          <span>{particleDensity}%</span>
        </div>
        <input className="slider" type="range" min="0" max="100" step="1" value={particleDensity} onChange={(e) => setParticleDensity(parseInt(e.target.value))} />
      </div>
      <div className="fire-list">
        <div className="control-label" style={{marginBottom: 8}}><span>Simulation</span></div>
        <div style={{display: 'flex', gap: '8px', marginBottom: '12px'}}>
          <button className="pause-btn" onClick={() => setSimPaused(!simPaused)}>{simPaused ? 'Resume' : 'Pause'}</button>
          <button className="reset-btn" onClick={resetSim}>Reset</button>
        </div>
        {fires.map((fire, idx) => fire.active && (
          <div key={idx} className="fire-list-item">
            <span>Fire ({fire.lng.toFixed(2)}, {fire.lat.toFixed(2)})</span>
            <button className="stop-fire-btn" onClick={() => stopFire(idx)}>Stop</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ControlPanel;