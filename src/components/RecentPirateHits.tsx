import React, { useEffect, useState } from 'react';
import { fetchRecentPirateHits } from '../api/hittrackerApi';
import { Hit } from '../types/hittracker';

interface Props {
  gameVersion: string | null;
  user_id: string | null;
}

const RecentPirateHits: React.FC<Props> = ({ gameVersion, user_id }) => {
  const [hits, setHits] = useState<Hit[]>([]);

  useEffect(() => {
    const getRecentPirateHits = async () => {
      const coupling = { user_id: user_id, gameVersion: gameVersion };
      const recentHits = await fetchRecentPirateHits(coupling);
      setHits(recentHits);
    };

    getRecentPirateHits();
  }, [user_id, gameVersion]);

  // Helper to format cargo as a list
  const formatCargo = (cargo: any) => {
    if (Array.isArray(cargo)) {
      return cargo.map((c: any, idx: number) =>
        <div key={idx}>
          {c.scuAmount}x {c.commodity_name}
        </div>
      );
    }
    if (typeof cargo === 'string') {
      try {
        const arr = JSON.parse(cargo);
        if (Array.isArray(arr)) {
          return arr.map((c: any, idx: number) =>
            <div key={idx}>
              {c.scuAmount}x {c.commodity_name}
            </div>
          );
        }
      } catch {
        return cargo;
      }
    }
    return null;
  };

  return (
    <div className="recent-pirate-hits">
      <h3>Recent Pirate Hits {gameVersion && `(v${gameVersion})`}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {hits
          .slice() // create a copy to avoid mutating state
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 5)
          .map(hit => (
            <div
              key={hit.id}
              style={{
                background: '#23272b',
                borderRadius: 8,
                padding: '1rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                border: '1px solid #333'
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: 4 }}>
                {hit.title}
              </div>
              <div>
                <strong>Assists:</strong>{' '}
                {Array.isArray(hit.assists_usernames)
                  ? hit.assists_usernames.join(', ')
                  : ''}
              </div>
              <div style={{ display: 'inline-block', position: 'relative' }}>
                <strong>Total Cargo:</strong>{' '}
                <span
                  style={{
                    color: '#4fa3ff',
                    textDecoration: 'underline',
                    cursor: 'pointer'
                  }}
                  tabIndex={0}
                  onMouseEnter={e => {
                    const tooltip = document.getElementById(`cargo-tooltip-${hit.id}`);
                    if (tooltip) tooltip.style.display = 'block';
                  }}
                  onMouseLeave={e => {
                    const tooltip = document.getElementById(`cargo-tooltip-${hit.id}`);
                    if (tooltip) tooltip.style.display = 'none';
                  }}
                  onFocus={e => {
                    const tooltip = document.getElementById(`cargo-tooltip-${hit.id}`);
                    if (tooltip) tooltip.style.display = 'block';
                  }}
                  onBlur={e => {
                    const tooltip = document.getElementById(`cargo-tooltip-${hit.id}`);
                    if (tooltip) tooltip.style.display = 'none';
                  }}
                >
                  Hover to view
                  <div
                    id={`cargo-tooltip-${hit.id}`}
                    style={{
                      display: 'none',
                      position: 'absolute',
                      left: 0,
                      top: '1.5em',
                      background: '#181a1b',
                      color: '#fff',
                      padding: '0.5em 1em',
                      borderRadius: 6,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                      zIndex: 10,
                      whiteSpace: 'nowrap',      // Make text stay on one line
                      minWidth: 'unset',         // Remove fixed min width
                      maxWidth: '600px',         // Optional: limit max width
                    }}
                  >
                    {formatCargo(hit.cargo)}
                  </div>
                </span>
              </div>
              <div>
                <strong>Total Value:</strong> {hit.total_value}
              </div>
              <div>
                <strong>Air or Ground:</strong> {hit.air_or_ground}
              </div>
              <div>
                <strong>Total Cut Value:</strong> {hit.total_cut_value}
              </div>
              <div>
                <strong>Timestamp:</strong> {new Date(hit.timestamp).toLocaleString()}
              </div>
              <div style={{ marginTop: 8 }}>
                <strong>Story:</strong>
                <div style={{ whiteSpace: 'pre-line', marginTop: 2 }}>{hit.story}</div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default RecentPirateHits;