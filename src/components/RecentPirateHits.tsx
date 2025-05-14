import React, { useEffect, useState } from 'react';
import { fetchRecentPirateHits } from '../api/hittrackerApi';
import { Hit } from '../types/hittracker';

const RecentPirateHits: React.FC = () => {
  const [hits, setHits] = useState<Hit[]>([]);
  
  useEffect(() => {
    const getRecentPirateHits = async () => {
      const recentHits = await fetchRecentPirateHits();
      setHits(recentHits);
    };

    getRecentPirateHits();
  }, []);

  return (
    <div className="recent-pirate-hits">
      <h3>Recent Pirate Hits</h3>
      <ul>
        {hits.map(hit => (
          <li key={hit.id}>
            <span>{hit.description}</span>
            <button>Edit</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentPirateHits;