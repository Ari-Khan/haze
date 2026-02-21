import React from 'react';

const ViewSwitcher = ({ view, setView }) => (
  <div className="view-switcher">
    <div className="pill-switch">
      <button
        className={view === 'Sim' ? 'pill active' : 'pill'}
        onClick={() => setView('Sim')}
      >
        Sim
      </button>
      <button
        className={view === 'Life' ? 'pill active' : 'pill'}
        onClick={() => setView('Life')}
      >
        Life
      </button>
    </div>
  </div>
);

export default ViewSwitcher;
