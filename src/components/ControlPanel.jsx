const ControlPanel = ({ windSpeed, setWindSpeed, variance, setVariance, onClose }) => {
  return (
    <div>
      <div className="sidebar-header">
        <h2>HAZE</h2>
        <button className="close-btn" onClick={onClose}>&times;</button>
      </div>
      <div className="control-group">
        <div className="control-label">
          <span>Wind Velocity</span>
          <span>{windSpeed.toFixed(4)}</span>
        </div>
        <input 
          className="slider" 
          type="range" 
          min="0" 
          max="0.003" 
          step="0.00001" 
          value={windSpeed} 
          onChange={(e) => setWindSpeed(parseFloat(e.target.value))} 
        />
      </div>
      <div className="control-group">
        <div className="control-label">
          <span>Turbulence</span>
          <span>{variance.toFixed(4)}</span>
        </div>
        <input 
          className="slider" 
          type="range" 
          min="0" 
          max="0.001" 
          step="0.00001" 
          value={variance} 
          onChange={(e) => setVariance(parseFloat(e.target.value))} 
        />
      </div>
    </div>
  );
};

export default ControlPanel;