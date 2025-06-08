import React, { useState } from 'react';
import { Hit } from '../types/hittracker';
import PiracyHitCard from "./PiracyHitCard";
import { User } from '../types/user';
import Select, { components, InputActionMeta } from 'react-select';

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
  dbUser, // <-- add dbUser to props
}) => {
  const [page, setPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string>("");

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

  // Filter hits by selected user if one is chosen
  const filteredHits = React.useMemo(() => {
    if (!selectedUser) return combinedHits;
    return combinedHits.filter(hit =>
      hit.user_id === selectedUser ||
      (Array.isArray(hit.assists) && hit.assists.includes(selectedUser))
    );
  }, [combinedHits, selectedUser]);

  const totalPages = Math.ceil(filteredHits.length / PAGE_SIZE);
  const paginatedHits = filteredHits.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // User selector options for react-select
  const userOptions = allUsers.map(u => ({
    value: u.id,
    label: u.nickname || u.username || u.id,
    nickname: u.nickname || "",
    username: u.username || "",
  }));

  // Custom filter for react-select to match username or nickname
  const filterOption = (option: any, input: string) => {
    const search = input.toLowerCase();
    return (
      option.data.label.toLowerCase().includes(search) ||
      (option.data.username && option.data.username.toLowerCase().includes(search)) ||
      (option.data.nickname && option.data.nickname.toLowerCase().includes(search))
    );
  };

  // Find the selected option object for react-select
  const selectedOption = userOptions.find(opt => opt.value === selectedUser) || null;

  return (
    <div className="recent-pirate-hits">
      <h3>Recent Pirate Hits {gameVersion && `(v${gameVersion})`}</h3>
      <div style={{ marginBottom: '1rem', maxWidth: 320 }}>
        <label htmlFor="user-select" style={{ color: "#fff", marginRight: 8 }}>Filter by user:</label>
        <Select
          inputId="user-select"
          options={userOptions}
          value={selectedOption}
          onChange={opt => {
            setSelectedUser(opt ? opt.value : null);
            setPage(0);
          }}
          onInputChange={(val, _meta: InputActionMeta) => setInputValue(val)}
          inputValue={inputValue}
          isClearable
          placeholder="Type to search..."
          filterOption={filterOption}
          styles={{
            control: (base) => ({
              ...base,
              background: "#23272a",
              color: "#fff",
              borderColor: "#444",
              minWidth: 120,
            }),
            singleValue: (base) => ({
              ...base,
              color: "#fff",
            }),
            menu: (base) => ({
              ...base,
              background: "#23272a",
              color: "#fff",
            }),
            option: (base, state) => ({
              ...base,
              background: state.isFocused ? "#2d7aee" : "#23272a",
              color: "#fff",
            }),
            input: (base) => ({
              ...base,
              color: "#fff",
            }),
          }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {paginatedHits.map(hit => (
          <PiracyHitCard 
            key={hit.id} 
            hit={hit} 
            userId={user_id ?? ''}
            allUsers={allUsers}
            dbUser={dbUser} // <-- pass dbUser here
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