import React, { useEffect, useState, useRef } from "react";
import Modal from "./Modal";
import { FleetLog } from "../types/fleet_log";
import { createShipLog } from "../api/fleetLogApi";
import { getAllUsers } from "../api/userService";
import { User } from "../types/user";
import { UserFleet } from "../types/fleet"; // Add this import
import { fetchLatest100Hits } from "../api/hittrackerApi";
import { Hit } from "../types/hittracker";

const initialForm: Partial<FleetLog> = {
  title: "",
  notes: "",
  commander_id: undefined,
  commander_username: "",
  patch: "",
  crew_usernames: [],
  air_sub_usernames: [],
  fps_sub_usernames: [],
  link: "",
  start_time: "",
  end_time: "",
  total_kills: 0,
  value_stolen: 0,
  damages_value: 0,
  fleet_id: undefined,
  fleet_name: "",
  associated_hits: [], // Added property
  video_link: "", // Optional, if used
  media_links: [], // Optional, if used
};

const parseArray = (str: string) =>
  str.split(",").map(s => s.trim()).filter(Boolean);

interface LogFleetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (fleetLog: FleetLog) => Promise<void>;
  fleets: UserFleet[]; // Use UserFleet[]
  userId: string;
  username: string;
  patch: string;
}

const LogFleetModal: React.FC<LogFleetModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  fleets,
  patch,
}) => {
  const [form, setForm] = useState<Partial<FleetLog>>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [crewInput, setCrewInput] = useState("");
  const [crewSuggestions, setCrewSuggestions] = useState<User[]>([]);
  const [commanderInput, setCommanderInput] = useState("");
  const [commanderSuggestions, setCommanderSuggestions] = useState<User[]>([]);
  const [fleetInput, setFleetInput] = useState("");
  const [fleetSuggestions, setFleetSuggestions] = useState<typeof fleets>([]);
  const [fleetDropdownOpen, setFleetDropdownOpen] = useState(false);
  const [hitInput, setHitInput] = useState("");
  const [hitSuggestions, setHitSuggestions] = useState<Hit[]>([]);
  const [hitDropdownOpen, setHitDropdownOpen] = useState(false);
  const [recentHits, setRecentHits] = useState<Hit[]>([]);
  const fleetInputRef = useRef<HTMLInputElement>(null);
  const hitInputRef = useRef<HTMLInputElement>(null);

  // Sort fleets by last_active (most recent first)
  const sortedFleets = [...fleets].sort((a: any, b: any) => {
    if (!a.last_active && !b.last_active) return 0;
    if (!a.last_active) return 1;
    if (!b.last_active) return -1;
    return new Date(b.last_active).getTime() - new Date(a.last_active).getTime();
  });

  useEffect(() => {
    if (isOpen) {
      setForm(f => ({
        ...initialForm,
        patch: patch || "",
      }));
      setFormError(null);
      getAllUsers().then(users => setAllUsers(Array.isArray(users) ? users : users ? [users] : []));
      setCommanderInput(""); // Reset commander input
      setCommanderSuggestions([]);
      setFleetInput(""); // Reset fleet input
      setFleetSuggestions(sortedFleets); // Show all fleets by default
      fetchLatest100Hits().then(setRecentHits);
      setHitSuggestions([]);
      setHitInput("");
    }
  }, [isOpen, patch]);

  useEffect(() => {
    setFleetSuggestions(sortedFleets);
  }, [fleets]);

  // Handle input changes for fleet search
  const handleFleetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFleetInput(value);
    setFleetDropdownOpen(true);
    if (value.trim() === "") {
      setFleetSuggestions(sortedFleets); // Show all fleets if input is empty
    } else {
      const filtered = sortedFleets.filter(f =>
        f.name?.toLowerCase().includes(value.toLowerCase())
      );
      setFleetSuggestions(filtered);
    }
  };

  // Handle fleet selection
  const handleFleetSelect = (fleet: UserFleet) => {
    setFleetInput(fleet.name || "");
    handleChange("fleet_id", fleet.id);
    handleChange("fleet_name", fleet.name || "");
    setFleetDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        fleetInputRef.current &&
        !fleetInputRef.current.contains(event.target as Node)
      ) {
        setFleetDropdownOpen(false);
      }
    }
    if (fleetDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [fleetDropdownOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        hitInputRef.current &&
        !hitInputRef.current.contains(event.target as Node)
      ) {
        setHitDropdownOpen(false);
      }
    }
    if (hitDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [hitDropdownOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof FleetLog, value: any) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const handleCrewChange = (userId: number, checked: boolean) => {
    setForm(f => ({
      ...f,
      crew_ids: checked
        ? [...(f.crew_ids || []), userId]
        : (f.crew_ids || []).filter(id => id !== userId),
      crew_usernames: checked
        ? [...(f.crew_usernames || []), allUsers.find(u => Number(u.id) === userId)?.username || ""]
        : (f.crew_usernames || []).filter((_, idx) => (f.crew_ids || []).map(id => Number(id))[idx] !== userId),
    }));
  };

  // Crew input change handler
  const handleCrewInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCrewInput(value);

    if (value.trim() === "") {
      setCrewSuggestions([]);
      return;
    }
    const suggestions = allUsers.filter(user => {
      const username = user.username?.toLowerCase() || "";
      const nickname = user.nickname?.toLowerCase() || "";
      const search = value.toLowerCase();
      return username.includes(search) || nickname.includes(search);
    });
    setCrewSuggestions(suggestions.slice(0, 5));
  };

  // Crew suggestion select handler
  const addCrewUser = (user: User) => {
    setForm(f => ({
      ...f,
      crew_ids: [...(f.crew_ids || []), Number(user.id)],
      crew_usernames: [...(f.crew_usernames || []), user.username || ""],
    }));
    setCrewInput("");
    setCrewSuggestions([]);
  };

  // Remove crew member handler
  const removeCrewUser = (userId: number) => {
    setForm(f => ({
      ...f,
      crew_ids: (f.crew_ids || []).filter(id => id !== userId),
      crew_usernames: (f.crew_usernames || []).filter((_, idx) => (f.crew_ids || [])[idx] !== userId),
    }));
  };

  const handleCommanderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCommanderInput(value);

    if (value.trim() === "") {
      setCommanderSuggestions([]);
      return;
    }
    const suggestions = allUsers.filter(user => {
      const username = user.username?.toLowerCase() || "";
      const nickname = user.nickname?.toLowerCase() || "";
      const search = value.toLowerCase();
      return username.includes(search) || nickname.includes(search);
    });
    setCommanderSuggestions(suggestions.slice(0, 5));
  };

  const selectCommander = (user: User) => {
    handleChange("commander_id", user.id);
    handleChange("commander_username", user.username || "");
    setCommanderInput(user.username || "");
    setCommanderSuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.title) {
      setFormError("Title is required.");
      return;
    }
    if (!form.commander_id) {
      setFormError("Commander is required.");
      return;
    }
    if (!form.fleet_id) {
      setFormError("Fleet is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const fleetLog: FleetLog = {
        ...form,
        id: Date.now(), // or let backend assign
      } as FleetLog;
      await createShipLog(fleetLog);
      await onSubmit(fleetLog);
      setForm(initialForm);
      onClose();
    } catch (err) {
      setFormError("Failed to submit fleet log.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // New handlers for hit input
  const handleHitInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHitInput(value);
    setHitDropdownOpen(true);
    if (value.trim() === "") {
      setHitSuggestions(recentHits);
    } else {
      setHitSuggestions(
        recentHits.filter(hit =>
          hit.title?.toLowerCase().includes(value.toLowerCase()) ||
          hit.username?.toLowerCase().includes(value.toLowerCase())
        )
      );
    }
  };

  const handleHitSelect = (hit: Hit) => {
    // Add hit.id to associated_hits if not already present
    if (!Array.isArray(form.associated_hits)) {
      handleChange("associated_hits", [hit.id]);
    } else if (!form.associated_hits.includes(hit.id)) {
      handleChange("associated_hits", [...form.associated_hits, hit.id]);
    }
    setHitInput("");
    setHitDropdownOpen(false);
  };

  const removeAssociatedHit = (id: string) => {
    handleChange(
      "associated_hits",
      (form.associated_hits || []).filter((hitId: string) => hitId !== id)
    );
  };

  return (
    <Modal onClose={onClose}>
      <h2>Log Fleet Activity</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Title:
          <input
            type="text"
            value={form.title || ""}
            onChange={e => handleChange("title", e.target.value)}
            disabled={isSubmitting}
          />
        </label>
        {/* Flex row for Fleet and Commander */}
        <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
          {/* Fleet Autocomplete */}
          <label style={{ flex: 1, minWidth: 0, position: "relative" }}>
            <input
              ref={fleetInputRef}
              type="text"
              value={fleetInput}
              onChange={handleFleetInputChange}
              onFocus={() => {
                setFleetDropdownOpen(true);
                setFleetSuggestions(sortedFleets);
              }}
              disabled={isSubmitting}
              autoComplete="off"
              style={{ width: "100%" }}
              placeholder="Select Fleet"
            />
            {fleetDropdownOpen && fleetSuggestions.length > 0 && (
              <div style={{
                background: "#23272e",
                border: "1px solid #353a40",
                borderRadius: 4,
                marginTop: 2,
                position: "absolute",
                zIndex: 20,
                width: "100%",
                maxHeight: 200,
                overflowY: "auto"
              }}>
                {fleetSuggestions.map(fleet => (
                  <div
                    key={fleet.id}
                    style={{
                      padding: "6px 10px",
                      cursor: "pointer",
                      color: "#fff",
                      borderBottom: "1px solid #353a40",
                      background: fleet.id === Number(form.fleet_id) ? "#2d7aee" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                    onMouseDown={() => handleFleetSelect(fleet)}
                  >
                    {/* Fleet image */}
                    {fleet.avatar && (
                      <img
                        src={fleet.avatar}
                        alt={fleet.name}
                        style={{
                          width: 32,
                          height: 32,
                          objectFit: "cover",
                          borderRadius: 4,
                          marginRight: 8,
                          background: "#181a1b",
                          border: "1px solid #353a40"
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "bold" }}>{fleet.name}</div>
                      {fleet.commander_username && (
                        <div style={{ fontSize: 12, color: "#aaa" }}>
                          Commander: {fleet.commander_username}
                        </div>
                      )}
                      {fleet.last_active && (
                        <div style={{ fontSize: 12, color: "#aaa" }}>
                          Last Active: {new Date(fleet.last_active).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </label>
          {/* Commander Autocomplete */}
          <label style={{ flex: 1, minWidth: 0, position: "relative" }}>
            <input
              type="text"
              value={commanderInput}
              onChange={handleCommanderInputChange}
              disabled={isSubmitting}
              autoComplete="off"
              style={{ width: "100%" }}
              placeholder="Select Commander"
            />
            {commanderSuggestions.length > 0 && (
              <div style={{
                background: "#23272e",
                border: "1px solid #353a40",
                borderRadius: 4,
                marginTop: 2,
                position: "absolute",
                zIndex: 10,
                width: "100%"
              }}>
                {commanderSuggestions.map(user => (
                  <div
                    key={user.id}
                    style={{
                      padding: "4px 8px",
                      cursor: "pointer",
                      color: "#fff"
                    }}
                    onMouseDown={() => selectCommander(user)}
                  >
                    {user.username}
                  </div>
                ))}
              </div>
            )}
          </label>
          {/* Associated Hits */}
          <label style={{ flex: 1, minWidth: 0, position: "relative" }}>
            <input
              ref={hitInputRef}
              type="text"
              value={hitInput}
              onChange={handleHitInputChange}
              onFocus={() => {
                setHitDropdownOpen(true);
                setHitSuggestions(recentHits);
              }}
              disabled={isSubmitting}
              autoComplete="off"
              style={{ width: "100%" }}
              placeholder="Associated Hits"
            />
            {hitDropdownOpen && hitSuggestions.length > 0 && (
              <div style={{
                background: "#23272e",
                border: "1px solid #353a40",
                borderRadius: 4,
                marginTop: 2,
                position: "absolute",
                zIndex: 20,
                width: "100%",
                maxHeight: 200,
                overflowY: "auto"
              }}>
                {hitSuggestions.map(hit => (
                  <div
                    key={hit.id}
                    style={{
                      padding: "6px 10px",
                      cursor: "pointer",
                      color: "#fff",
                      borderBottom: "1px solid #353a40",
                      background: (form.associated_hits || []).includes(hit.id) ? "#2d7aee" : "transparent",
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                    onMouseDown={() => handleHitSelect(hit)}
                  >
                    <span style={{ fontWeight: "bold" }}>{hit.title}</span>
                    <span style={{ fontSize: 12, color: "#aaa" }}>
                      By: {hit.username} | {new Date(hit.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {/* Show selected hits as chips */}
            {(form.associated_hits || []).length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                {(form.associated_hits || []).map((id: string) => {
                  const hit = recentHits.find(h => h.id === id);
                  return (
                    <span
                      key={id}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        background: "#181a1b",
                        color: "#fff",
                        borderRadius: 16,
                        padding: "2px 10px",
                        fontSize: 13,
                        marginRight: 2,
                        marginBottom: 2,
                      }}
                    >
                      {hit?.title || id}
                      <button
                        type="button"
                        onClick={() => removeAssociatedHit(id)}
                        style={{
                          marginLeft: 6,
                          color: "#ff6b6b",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 14,
                          lineHeight: 1,
                        }}
                        aria-label={`Remove ${hit?.title || id}`}
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </label>
        </div>
        {/* Start Time and End Time on the same line */}
        <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
          <label style={{ flex: 1, minWidth: 0 }}>
            Start Time:
            <input
              type="datetime-local"
              value={form.start_time || ""}
              onChange={e => handleChange("start_time", e.target.value)}
              disabled={isSubmitting}
              style={{ width: "100%" }}
            />
          </label>
          <label style={{ flex: 1, minWidth: 0 }}>
            End Time:
            <input
              type="datetime-local"
              value={form.end_time || ""}
              onChange={e => handleChange("end_time", e.target.value)}
              disabled={isSubmitting}
              style={{ width: "100%" }}
            />
          </label>
        </div>
        {/* Crew field moved here */}
        <label style={{ position: "relative", display: "block" }}>
          Crew:
          <input
            type="text"
            value={crewInput}
            onChange={handleCrewInputChange}
            disabled={isSubmitting}
            autoComplete="off"
            style={{ width: "100%" }}
            placeholder="Type to search and add crew members"
          />
          {crewSuggestions.length > 0 && (
            <div style={{
              background: "#23272e",
              border: "1px solid #353a40",
              borderRadius: 4,
              marginTop: 2,
              position: "absolute",
              zIndex: 10,
              width: 200
            }}>
              {crewSuggestions.map(user => (
                <div
                  key={user.id}
                  style={{
                    padding: "4px 8px",
                    cursor: "pointer",
                    color: "#fff"
                  }}
                  onMouseDown={() => addCrewUser(user)}
                >
                  {user.username}
                </div>
              ))}
            </div>
          )}
        </label>
        {(form.crew_ids || []).length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "8px 0" }}>
            {(form.crew_ids || []).map((id, idx) => {
              const user = allUsers.find(u => Number(u.id) === id);
              return (
                <span
                  key={id}
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
                  {user?.username || id}
                  <button
                    type="button"
                    onClick={() => removeCrewUser(id)}
                    style={{
                      marginLeft: 8,
                      color: "#ff6b6b",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 16,
                      lineHeight: 1,
                    }}
                    aria-label={`Remove ${user?.username || id}`}
                  >
                    ✕
                  </button>
                </span>
              );
            })}
          </div>
        )}
        {/* Story as a large textarea */}
        <label style={{ width: "100%", display: "block" }}>
          Story:
          <textarea
            value={form.notes || ""}
            onChange={e => handleChange("notes", e.target.value)}
            disabled={isSubmitting}
            style={{
              width: "100%",
              minHeight: 120,
              resize: "vertical",
              marginBottom: 16,
              fontSize: 16,
              boxSizing: "border-box"
            }}
          />
        </label>
        {/* Totals row: Total Kills, Value Stolen, Damages Value */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 12,
            justifyContent: "space-between",
            alignItems: "stretch",
          }}
        >
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <label style={{ width: "100%", textAlign: "center" }}>
              Total Kills:
            </label>
            <input
              type="number"
              min={0}
              value={form.total_kills ?? 0}
              onChange={e => handleChange("total_kills", Number(e.target.value))}
              disabled={isSubmitting}
              style={{
                width: "100%",
                background: "#23272b",
                borderRadius: 4,
                padding: "8px 12px",
                marginTop: 4,
                color: "#fff",
                border: "1px solid #353a40",
                textAlign: "center",
                fontSize: 16,
              }}
            />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <label style={{ width: "100%", textAlign: "center" }}>
              Value Stolen:
            </label>
            <input
              type="number"
              min={0}
              value={form.value_stolen ?? 0}
              onChange={e => handleChange("value_stolen", Number(e.target.value))}
              disabled={isSubmitting}
              style={{
                width: "100%",
                background: "#23272b",
                borderRadius: 4,
                padding: "8px 12px",
                marginTop: 4,
                color: "#fff",
                border: "1px solid #353a40",
                textAlign: "center",
                fontSize: 16,
              }}
            />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <label style={{ width: "100%", textAlign: "center" }}>
              Damages Value:
            </label>
            <input
              type="number"
              min={0}
              value={form.damages_value ?? 0}
              onChange={e => handleChange("damages_value", Number(e.target.value))}
              disabled={isSubmitting}
              style={{
                width: "100%",
                background: "#23272b",
                borderRadius: 4,
                padding: "8px 12px",
                marginTop: 4,
                color: "#fff",
                border: "1px solid #353a40",
                textAlign: "center",
                fontSize: 16,
              }}
            />
          </div>
        </div>
        {/* Video Link field */}
        <label>
          Video Link:
          <input
            type="text"
            value={form.video_link || ""}
            onChange={e => handleChange("video_link", e.target.value)}
            disabled={isSubmitting}
          />
        </label>
        {/* Media Links field (comma separated) */}
        <label>
          Media Links:
          <input
            type="text"
            value={form.media_links ? form.media_links.join(", ") : ""}
            onChange={e =>
              handleChange(
                "media_links",
                e.target.value
                  .split(",")
                  .map(link => link.trim())
                  .filter(link => link.length > 0)
              )
            }
            disabled={isSubmitting}
            placeholder="Enter multiple links separated by commas"
          />
        </label>
        {formError && <div style={{ color: "#ff6b6b", marginBottom: "1em" }}>{formError}</div>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
        <button type="button" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </button>
      </form>
    </Modal>
  );
};

export default LogFleetModal;