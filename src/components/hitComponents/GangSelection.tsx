import React, { useState, useRef } from "react";
import { RecentGang } from "../../types/recent_gangs";

interface GangSelectionProps {
  allGangs: RecentGang[];
  selectedGangs?: RecentGang[];
  onChange?: (selected: RecentGang[]) => void;
}


const GangSelection: React.FC<GangSelectionProps> = ({ allGangs, selectedGangs = [], onChange }) => {
  const [inputValue, setInputValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sort gangs by timestamp descending
  const sortedGangs = [...allGangs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Filter gangs by input value (case-insensitive, match channel_name), and exclude already selected
  const filteredGangs = inputValue.trim() === ""
    ? sortedGangs.filter(gang => !selectedGangs.some(sel => sel.id === gang.id))
    : sortedGangs.filter(gang =>
        gang.channel_name?.toLowerCase().includes(inputValue.toLowerCase()) &&
        !selectedGangs.some(sel => sel.id === gang.id)
      );


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowDropdown(true);
  };

  const handleSelectGang = (gang: RecentGang) => {
    const newSelected = [...selectedGangs, gang];
    if (onChange) onChange(newSelected);
    setInputValue("");
    setShowDropdown(false);
  };

  const handleRemoveGang = (gangId: string) => {
    const newSelected = selectedGangs.filter(g => g.id !== gangId);
    if (onChange) onChange(newSelected);
  };

  const handleFocus = () => {
    setShowDropdown(true);
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    // Delay hiding dropdown to allow click event to register
    setTimeout(() => setShowDropdown(false), 120);
  };

  return (
    <div style={{ position: 'relative', width: 350 }} onBlur={handleBlur} tabIndex={-1}>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder="Select a gang..."
        style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #444', background: '#181a1b', color: '#fff', marginBottom: 0 }}
        autoComplete="off"
      />
      {/* Chips for selected gangs shown below input */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '8px 0 6px 0' }}>
        {selectedGangs.map(gang => (
          <span key={gang.id} style={{ display: 'flex', alignItems: 'center', background: '#33363b', borderRadius: 16, padding: '4px 10px', fontSize: 13, marginRight: 4 }}>
            {gang.channel_name}
            <button
              type="button"
              onClick={() => handleRemoveGang(gang.id)}
              style={{ marginLeft: 6, background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 15 }}
              aria-label="Remove gang"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: '100%',
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
          {filteredGangs.length === 0 ? (
            <div style={{ color: '#aaa', padding: 10 }}>No recent gangs found.</div>
          ) : (
            <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0 }}>
              {filteredGangs.map((gang, idx) => (
                <li
                  key={gang.id || idx}
                  onClick={() => handleSelectGang(gang)}
                  style={{
                    marginBottom: 4,
                    background: 'transparent',
                    borderRadius: 8,
                    padding: 10,
                    cursor: 'pointer',
                  }}
                >
                  <div><b>{gang.channel_name || `Gang #${idx + 1}`}</b></div>
                  <div style={{ fontSize: '0.95em', color: '#aaa' }}>Patch: {gang.patch} | Date: {new Date(gang.timestamp).toLocaleString()}</div>
                  <div style={{ fontSize: '0.95em', color: '#aaa' }}>Ship Kills: {gang.pu_shipkills + gang.ac_shipkills} | FPS Kills: {gang.pu_fpskills + gang.ac_fpskills}</div>
                  <div style={{ fontSize: '0.95em', color: '#aaa' }}>Stolen Cargo: {gang.stolen_cargo} | Value: {gang.stolen_value}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default GangSelection;
