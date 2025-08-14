import React, { useState, useRef, useEffect } from "react";
import { User } from "../../types/user";
import { RecentGang } from "../../types/recent_gangs";

interface PirateSelectionProps {
  allUsers: User[];
  selectedGangs: RecentGang[];
  selectedPirates: User[];
  setSelectedPirates: React.Dispatch<React.SetStateAction<User[]>>;
}

const PirateSelection: React.FC<PirateSelectionProps> = ({ allUsers, selectedGangs, selectedPirates, setSelectedPirates }) => {
  const [inputValue, setInputValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync selectedPirates with users from selectedGangs
  useEffect(() => {
    // Collect all users from all selectedGangs' .users arrays
    const gangUsers: User[] = [];
    selectedGangs.forEach(gang => {
      if (Array.isArray(gang.users)) {
        gang.users.forEach((userJson: any) => {
          try {
            const userObj = typeof userJson === 'string' ? JSON.parse(userJson) : userJson;
            if (userObj && userObj.id) {
              gangUsers.push(userObj);
            }
          } catch (e) {}
        });
      }
    });
    // Only keep users who are present in at least one selected gang
    const gangUserMap: { [id: string]: User } = {};
    gangUsers.forEach(u => { if (u && u.id) gangUserMap[u.id] = u; });
    setSelectedPirates(Object.values(gangUserMap));
    // eslint-disable-next-line
  }, [selectedGangs, setSelectedPirates]);


  // Filter users by input value, exclude already selected
  const filteredUsers = inputValue.trim() === ""
    ? allUsers.filter(user => !selectedPirates.some(sel => sel.id === user.id))
    : allUsers.filter(user => {
        const name = user.nickname || user.username || "";
        return (
          name.toLowerCase().includes(inputValue.toLowerCase()) &&
          !selectedPirates.some(sel => sel.id === user.id)
        );
      });

  // Add a guest pirate (custom name)
  const addGuestPirate = (guestName: string) => {
    if (!guestName.trim()) return;
    setSelectedPirates(prev => [
      ...prev,
      {
        id: `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        username: guestName,
        nickname: guestName,
        corsair_level: 0,
        raptor_level: 0,
        raider_level: 0,
        rank: 0,
        roles: [],
        fleet: '',
        rsi_handle: '',
      } as User
    ]);
    setInputValue("");
    setShowDropdown(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowDropdown(true);
  };

  const handleSelectPirate = (user: User) => {
    setSelectedPirates([...selectedPirates, user]);
    setInputValue("");
    setShowDropdown(false);
  };

  const handleRemovePirate = (userId: string) => {
    setSelectedPirates(selectedPirates.filter(u => u.id !== userId));
  };

  const handleFocus = () => {
    setShowDropdown(true);
  };

  const handleBlur = () => {
    setTimeout(() => setShowDropdown(false), 120);
  };

  return (
    <div style={{ width: 350, minWidth: 220, marginLeft: 16, position: 'relative' }} onBlur={handleBlur} tabIndex={-1}>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder="Select a pirate or enter a custom name..."
        style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #444', background: '#181a1b', color: '#fff', marginBottom: 0 }}
        autoComplete="off"
        onKeyDown={e => {
          if (e.key === "Enter" && inputValue && filteredUsers.length === 0) {
            addGuestPirate(inputValue);
          }
        }}
      />
      {/* Chips for selected pirates shown below input */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '8px 0 6px 0' }}>
        {selectedPirates.map(user => (
          <span key={user.id} style={{ display: 'flex', alignItems: 'center', background: '#33363b', borderRadius: 16, padding: '4px 10px', fontSize: 13, marginRight: 4 }}>
            {(user.nickname || user.username) || 'Unknown'}
            <button
              type="button"
              onClick={() => handleRemovePirate(user.id)}
              style={{ marginLeft: 6, background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 15 }}
              aria-label="Remove pirate"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: 60,
          left: 0,
          width: '100%',
          maxHeight: 300,
          overflowY: 'auto',
          background: '#25282c',
          border: '1px solid #444',
          borderRadius: 8,
          zIndex: 10,
          marginTop: 2
        }}>
          {filteredUsers.length === 0 ? (
            <div style={{ color: '#aaa', padding: 10 }}>
              No users found. <button type="button" style={{ marginLeft: 8, background: '#2d7aee', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }} onClick={() => addGuestPirate(inputValue)}>Add Guest</button>
            </div>
          ) : (
            <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0 }}>
              {filteredUsers.map((user, idx) => (
                <li
                  key={user.id || idx}
                  onClick={() => handleSelectPirate(user)}
                  style={{
                    marginBottom: 4,
                    background: 'transparent',
                    borderRadius: 8,
                    padding: 10,
                    cursor: 'pointer',
                  }}
                >
                  {(user.nickname || user.username) || 'Unknown'}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default PirateSelection;
