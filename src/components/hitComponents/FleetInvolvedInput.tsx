import React from "react";
import { UserFleet } from "../../types/fleet";
import { User } from "../../types/user";

interface FleetInvolvedInputProps {
  fleetSearch: string;
  setFleetSearch: React.Dispatch<React.SetStateAction<string>>;
  fleetSuggestions: UserFleet[];
  setFleetSuggestions: React.Dispatch<React.SetStateAction<UserFleet[]>>;
  allFleets: UserFleet[];
  assistsUsers: any[];
  setFormError: React.Dispatch<React.SetStateAction<string | null>>;
  selectedFleet: UserFleet | null;
  setSelectedFleet: React.Dispatch<React.SetStateAction<UserFleet | null>>;
  selectedFleets: UserFleet[];
  setSelectedFleets: React.Dispatch<React.SetStateAction<UserFleet[]>>;
  isSubmitting: boolean;
  allUsers: User[];
  handleFleetSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FleetInvolvedInput: React.FC<FleetInvolvedInputProps> = ({
  fleetSearch,
  setFleetSearch,
  fleetSuggestions,
  setFleetSuggestions,
  allFleets,
  assistsUsers,
  setFormError,
  selectedFleet,
  setSelectedFleet,
  selectedFleets,
  setSelectedFleets,
  isSubmitting,
  allUsers,
  handleFleetSearchChange,
}) => {
  return (
    <>

      <label>
        Gang Involved:
        <span style={{ display: "block", fontSize: 12, color: "#bbb", marginBottom: 4 }}>
          Gangs of 3+ people are automatically tracked! Select here to see if your most recent gang was listed.
        </span>
        <input
          type="text"
          value={fleetSearch}
          onChange={handleFleetSearchChange}
          onFocus={() => {
            if (!fleetSearch.trim()) {
              setFleetSuggestions(
                [...allFleets]
                  .sort((a, b) => Number(b.last_active || 0) - Number(a.last_active || 0))
                  .slice(0, 10)
              );
            }
          }}
          onBlur={() => {
            setTimeout(() => setFleetSuggestions([]), 100);
          }}
          disabled={isSubmitting}
          autoComplete="off"
          placeholder="Search fleet..."
        />
        {fleetSuggestions.length > 0 && (
          <div style={{
            background: "#23272e",
            border: "1px solid #353a40",
            borderRadius: 4,
            marginTop: 2,
            position: "absolute",
            zIndex: 10,
            width: 200
          }}>
            {fleetSuggestions.map(fleet => (
              <div
                key={fleet.id}
                style={{
                  padding: "4px 8px",
                  cursor: "pointer",
                  color: "#fff"
                }}
                onMouseDown={() => {
                  const assistsIds = assistsUsers.map(u => String(u.id));
                  const fleetMemberIds = (fleet.members_ids ?? []).map(String);
                  const assistsInFleet = assistsIds.filter(id => fleetMemberIds.includes(id));
                  const minRequired = 3;

                  if (assistsUsers.length <= 7) {
                    setFormError("8 people total required to associate a fleet.");
                    return;
                  }
                  if (assistsInFleet.length < minRequired) {
                    setFormError(
                      `3 people from the fleet's crew are required to be present to associate.`
                    );
                    return;
                  }

                  setFormError(null);
                  if (!selectedFleets.some(f => f.id === fleet.id)) {
                    setSelectedFleets(prev => [...prev, fleet]);
                  }
                  setFleetSearch("");
                  setFleetSuggestions([]);
                }}
              >
                {fleet.name}
                <span style={{ color: "#aaa", fontSize: 12, marginLeft: 8 }}>
                  {
                    (() => {
                      const commander = allUsers.find(u => String(u.id) === String(fleet.commander_id));
                      return commander ? commander.username : "Unknown";
                    })()
                  }
                </span>
              </div>
            ))}
          </div>
        )}
      </label>
      {selectedFleet && (
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          background: "#181a1b",
          color: "#fff",
          borderRadius: 16,
          padding: "4px 12px",
          fontSize: 14,
          margin: "8px 0"
        }}>
          {selectedFleet.name}
          <button
            type="button"
            onClick={() => {
              setSelectedFleet(null);
              setFleetSearch("");
            }}
            style={{
              marginLeft: 8,
              color: "#ff6b6b",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 16,
              lineHeight: 1,
            }}
            aria-label={`Remove ${selectedFleet.name}`}
          >
            ✕
          </button>
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "8px 0" }}>
        {selectedFleets.map(fleet => (
          <span
            key={fleet.id}
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "#181a1b",
              color: "#fff",
              borderRadius: 16,
              padding: "4px 12px",
              fontSize: 14,
              marginRight: 4,
              marginBottom: 4,
            }}
          >
            {fleet.name}
            <button
              type="button"
              onClick={() => setSelectedFleets(list => list.filter(f => f.id !== fleet.id))}
              style={{
                marginLeft: 8,
                color: "#ff6b6b",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 16,
                lineHeight: 1,
              }}
              aria-label={`Remove ${fleet.name}`}
            >
              ✕
            </button>
          </span>
        ))}
      </div>
    </>
  );
};

export default FleetInvolvedInput;
