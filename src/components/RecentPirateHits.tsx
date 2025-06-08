import React, { useState } from 'react';
import { Hit } from '../types/hittracker';
import PiracyHitCard from "./PiracyHitCard";
import { User } from '../types/user';

interface Props {
  gameVersion: string | null;
  user_id: string | null;
  recentHits: Hit[];
  pirateHits: Hit[];
  assistHits: Hit[];
  allUsers: User[];
}

const PAGE_SIZE = 5;

const RecentPirateHits: React.FC<Props & { dbUser?: User }> = ({
  gameVersion,
  user_id,
  recentHits,
  pirateHits,
  assistHits,
  allUsers,
  dbUser,
}) => {
  const [page, setPage] = useState(0);

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

  const combinedHits = React.useMemo(() => {
    const all = [...(pirateHits || []), ...(assistHits || [])];
    const unique = Array.from(new Map(all.map(hit => [hit.id, hit])).values());
    return unique.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [pirateHits, assistHits]);

  // Use combinedHits directly for pagination
  const totalPages = Math.ceil(combinedHits.length / PAGE_SIZE);
  const paginatedHits = combinedHits.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="recent-pirate-hits">
      <h3>Pirate Hits {gameVersion && `(v${gameVersion})`}</h3>
      {/* Remove the filter/search box */}
      {/* <div style={{ marginBottom: '1rem', maxWidth: 320 }}>
        <label htmlFor="user-select" style={{ color: "#fff", marginRight: 8 }}>Filter by user:</label>
        <Select ... />
      </div> */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {paginatedHits.map(hit => (
          <PiracyHitCard 
            key={hit.id} 
            hit={hit} 
            userId={user_id ?? ''}
            allUsers={allUsers}
            dbUser={dbUser}
          />
        ))}
      </div>
      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
          Previous
        </button>
        <span>Page {page + 1} of {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
          Next
        </button>
      </div>
    </div>
  );
};

export default RecentPirateHits;