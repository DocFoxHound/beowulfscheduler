import React from 'react';

const OverviewPanel: React.FC = () => {
  // Replace these with real data from your API or context
  const totalPirateHits = 42;
  const totalCargoStolen = 128;
  const totalMonetaryAmount = 950000;

  return (
    <div className="overview-panel">
      <h2>Overview</h2>
      <div className="statistics">
        <div><strong>Total Pirate Hits:</strong> {totalPirateHits}</div>
        <div><strong>Total Cargo Stolen:</strong> {totalCargoStolen}</div>
        <div><strong>Total Monetary Amount Stolen:</strong> {totalMonetaryAmount.toLocaleString()} aUEC</div>
      </div>
      <div className="hits-graph" style={{ marginTop: '2rem' }}>
        <h3>Hits Over Time</h3>
        {/* Replace this with a real chart component, e.g. recharts or chart.js */}
        <div style={{
          width: '100%',
          height: '150px',
          background: '#222',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#888'
        }}>
          [Graph Placeholder]
        </div>
      </div>
    </div>
  );
};

export default OverviewPanel;