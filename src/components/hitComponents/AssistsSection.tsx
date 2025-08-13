import React from "react";
import { User } from "../../types/user";

interface AssistsSectionProps {
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  isSubmitting: boolean;
  handleAssistsFocus: () => void;
  handleAssistsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showGatheringsMenu: boolean;
  recentGatherings: any[];
  assistsUsers: any[];
  gatheringsMenuRef: React.RefObject<HTMLDivElement | null>;
  allUsersState: User[];
  addAssistUser: (user: User) => void;
  setShowGatheringsMenu: React.Dispatch<React.SetStateAction<boolean>>;
  setVictimsArray: React.Dispatch<React.SetStateAction<string[]>>;
  fetchBlackBoxsByUserId: (userId: string) => Promise<any[]>;
  assistSuggestions: User[];
  setAssistSuggestions: React.Dispatch<React.SetStateAction<User[]>>;
  setAssistsUsers: React.Dispatch<React.SetStateAction<any[]>>;
  setGuestNames: React.Dispatch<React.SetStateAction<string[]>>;
}

const AssistsSection: React.FC<AssistsSectionProps> = ({
  form,
  setForm,
  isSubmitting,
  handleAssistsFocus,
  handleAssistsChange,
  showGatheringsMenu,
  recentGatherings,
  assistsUsers,
  gatheringsMenuRef,
  allUsersState,
  addAssistUser,
  setShowGatheringsMenu,
  setVictimsArray,
  fetchBlackBoxsByUserId,
  assistSuggestions,
  setAssistSuggestions,
  setAssistsUsers,
  setGuestNames,
}) => {
  // Helper to add a guest
  const addGuest = (guestName: string) => {
    if (!guestName.trim()) return;
    setAssistsUsers(list => [
      ...list,
      {
        id: `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        nickname: guestName,
        guest: true,
      },
    ]);
    setGuestNames(prev => [...prev, guestName]);
    setForm((f: any) => ({ ...f, assists: "", _showAssistInput: false }));
  };

  return (
    <div>
      {/* User cards */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, margin: '12px 0' }}>
        {assistsUsers.map((user) => (
          <div
            key={user.id}
            style={{
              background: '#23272e',
              borderRadius: 8,
              padding: '14px 20px',
              color: '#fff',
              minWidth: 220,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              position: 'relative',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
              <span style={{ fontWeight: 600, fontSize: 17 }}>
                {user.nickname || user.username}
              </span>
              {user.guest && <span style={{ color: '#bbb', fontSize: 13, marginLeft: 6 }}>(guest)</span>}
              <button
                type="button"
                onClick={() => {
                  setAssistsUsers(list => list.filter(u => u.id !== user.id));
                  if (user.guest && user.nickname) {
                    setGuestNames(prev => prev.filter(name => name !== user.nickname));
                  }
                }}
                style={{
                  color: '#ff6b6b',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 18,
                  marginLeft: 12
                }}
                aria-label={`Remove ${user.nickname || user.username}`}
              >
                ✕
              </button>
            </div>
            <div style={{ fontSize: 14, color: '#b3b3b3' }}>
              Total time in gang: <span style={{ color: '#fff' }}>--:--:--</span>
            </div>
            <div style={{ fontSize: 14, color: '#b3b3b3' }}>
              Contribution: <span style={{ color: '#fff' }}>--%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Pirate Button and Input with Autocomplete */}
      <div style={{ marginTop: 12 }}>
        {/* Show Add button if input is not visible */}
        {!form._showAssistInput && (
          <button
            type="button"
            style={{
              background: "#2d7aee",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              padding: "2px 10px",
              fontSize: 16,
              cursor: "pointer"
            }}
            aria-label="Add Pirate"
            onClick={() => setForm((f: any) => ({ ...f, _showAssistInput: true }))}
          >
            + Add Pirate
          </button>
        )}
        {/* Show input and autocomplete if visible */}
        {form._showAssistInput && (
          <div style={{ position: "relative", marginTop: 8 }}>
            <input
              type="text"
              value={form.assists}
              onFocus={handleAssistsFocus}
              onChange={handleAssistsChange}
              disabled={isSubmitting}
              autoComplete="off"
              style={{ width: 240 }}
              autoFocus
              placeholder="Type username or guest name"
              onKeyDown={e => {
                if (e.key === "Enter" && form.assists && assistSuggestions.length === 0) {
                  addGuest(form.assists);
                }
              }}
            />
            {/* Assist suggestions dropdown */}
            {assistSuggestions.length > 0 && (
              <div style={{
                background: "#23272e",
                border: "1px solid #353a40",
                borderRadius: 4,
                marginTop: 2,
                position: "absolute",
                zIndex: 10,
                width: 200
              }}>
                {assistSuggestions.map((user: User) => (
                  <div
                    key={user.id}
                    style={{
                      padding: "4px 8px",
                      cursor: "pointer",
                      color: "#fff"
                    }}
                    onMouseDown={() => {
                      addAssistUser(user);
                      setForm((f: any) => ({ ...f, assists: "", _showAssistInput: false }));
                      setAssistSuggestions([]);
                    }}
                  >
                    {user.username}
                  </div>
                ))}
              </div>
            )}
            {/* Add Guest button if no suggestions and input is not empty */}
            {assistSuggestions.length === 0 && form.assists && (
              <button
                type="button"
                style={{
                  marginLeft: 8,
                  background: "#2d7aee",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  padding: "6px 12px",
                  cursor: "pointer"
                }}
                onClick={() => addGuest(form.assists)}
              >
                Add Guest
              </button>
            )}
            {/* Cancel button */}
            <button
              type="button"
              style={{
                marginLeft: 8,
                background: "#444",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "6px 12px",
                cursor: "pointer"
              }}
              onClick={() => setForm((f: any) => ({ ...f, _showAssistInput: false, assists: "" }))}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssistsSection;
