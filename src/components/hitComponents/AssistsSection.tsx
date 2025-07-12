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
}) => {
  return (
    <div>
      {assistsUsers.length > 0 && (
        <div style={{ overflowX: "auto", margin: "12px 0" }}>
          <table style={{ width: "100%", background: "#23272e", borderRadius: 6, borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ color: "#ccc", padding: 6, textAlign: "left" }}>Assistance</th><th style={{ color: "#ccc", padding: 6 }}>Dogfighter</th><th style={{ color: "#ccc", padding: 6 }}>Marine</th><th style={{ color: "#ccc", padding: 6 }}>Snare</th><th style={{ color: "#ccc", padding: 6 }}>Cargo</th><th style={{ color: "#ccc", padding: 6 }}>Multicrew</th><th style={{ color: "#ccc", padding: 6 }}>Salvage</th><th style={{ color: "#ccc", padding: 6 }}>Air Leadership</th><th style={{ color: "#ccc", padding: 6 }}>Ground Leadership</th><th style={{ color: "#ccc", padding: 6 }}>Commander</th><th></th>
              </tr>
            </thead>
            <tbody>
              {assistsUsers.map((user, idx) => (
                <tr key={user.id} style={{ background: idx % 2 ? "#202226" : "#23272e" }}>
                  <td style={{ color: "#fff", padding: 6 }}>{user.nickname || user.username}</td>
                  {([
                    "dogfighter",
                    "marine",
                    "snare",
                    "cargo",
                    "multicrew",
                    "salvage",
                    "air_leadership",
                    "ground_leadership",
                    "commander"
                  ] as Array<keyof typeof user>).map(field => (
                    <td key={String(field)} style={{ textAlign: "center", padding: 6 }}>
                      <input
                        type="checkbox"
                        className="large-checkbox"
                        checked={Boolean(user[field])}
                        onChange={e => {
                          setAssistsUsers(list =>
                            list.map(u =>
                              u.id === user.id
                                ? { ...u, [field]: e.target.checked }
                                : u
                            )
                          );
                        }}
                      />
                    </td>
                  ))}
                  <td style={{ textAlign: "center", padding: 6 }}>
                    <button
                      type="button"
                      onClick={() => setAssistsUsers(list => list.filter(u => u.id !== user.id))}
                      style={{
                        color: "#ff6b6b",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 16,
                        lineHeight: 1,
                      }}
                      aria-label={`Remove ${user.nickname || user.username}`}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Assist Button and Input with Autocomplete */}
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
            aria-label="Add Assist"
            onClick={() => setForm((f: any) => ({ ...f, _showAssistInput: true }))}
          >
            + Add Assist
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
            />
            {/* Recent Gatherings dropdown, styled like Fleet Involved */}
            {showGatheringsMenu && recentGatherings.length > 0 && assistsUsers.length === 0 && (
              <div
                ref={gatheringsMenuRef}
                style={{
                  background: "#23272e",
                  border: "1px solid #353a40",
                  borderRadius: 4,
                  marginTop: 2,
                  position: "absolute",
                  zIndex: 10,
                  width: 320,
                  maxHeight: 220,
                  overflowY: "auto"
                }}
              >
                {recentGatherings.map((g: any) => (
                  <div
                    key={g.id}
                    style={{
                      padding: "6px 8px",
                      cursor: "pointer",
                      color: "#fff",
                      borderBottom: "1px solid #353a40",
                      position: "relative"
                    }}
                    title={g.usernames.join(", ")}
                    onMouseDown={async () => {
                      (g.user_ids as string[])
                        .map((id: string, i: number) => allUsersState.find((u: User) => String(u.id) === String(id)))
                        .filter((u: User | undefined): u is User => !!u)
                        .forEach(addAssistUser);
                      setShowGatheringsMenu(false);

                      // --- New: Fetch BlackBox kills and extract victims ---
                      const gatheringTime = new Date(g.timestamp).getTime();
                      const oneHourMs = 60 * 60 * 1000;
                      let allVictims: string[] = [];

                      for (const userId of g.user_ids as string[]) {
                        try {
                          // Fetch all kills for this user
                          const kills = await fetchBlackBoxsByUserId(String(userId));
                          // Filter kills within ±1 hour of gathering
                          const relevantKills = kills.filter((kill: any) => {
                            const killTime = new Date(kill.timestamp).getTime();
                            return Math.abs(killTime - gatheringTime) <= oneHourMs;
                          });
                          // Collect all victim names from these kills
                          relevantKills.forEach((kill: any) => {
                            if (Array.isArray(kill.victims)) {
                              allVictims.push(...kill.victims.filter(Boolean));
                            }
                          });
                        } catch (err) {
                          // Handle error if needed
                        }
                      }
                      // Remove duplicates and add to victimsArray
                      setVictimsArray((prev: string[]) =>
                        Array.from(new Set([...prev, ...allVictims]))
                      );
                      // Hide input after selection
                      setForm((f: any) => ({ ...f, _showAssistInput: false, assists: "" }));
                    }}
                  >
                    <div style={{ fontWeight: 500 }}>
                      {g.channel_name} &mdash; {new Date(g.timestamp).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 13, color: "#bbb" }}>
                      {g.usernames.slice(0, 5).join(", ")}
                      {g.usernames.length > 5 && " ..."}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Assist suggestions dropdown (unchanged) */}
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
