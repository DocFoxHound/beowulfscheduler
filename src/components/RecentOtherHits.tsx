import React, { useEffect, useState } from 'react';
import { fetchRecentOtherHits } from '../api/hittrackerApi';
import { Hit } from '../types/hittracker';

const RecentOtherHits: React.FC = () => {
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getRecentOtherHits = async () => {
      try {
        const data = await fetchRecentOtherHits();
        setHits(data);
      } catch (err) {
        setError('Failed to fetch recent hits');
      } finally {
        setLoading(false);
      }
    };

    getRecentOtherHits();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="recent-other-hits">
      <h3>Recent Hits by Others</h3>
      <ul>
        {hits.map((hit) => (
          <li key={hit.id}>
            <p>{hit.description}</p>
            <span>{hit.date}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentOtherHits;