import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import { FleetLog } from "../types/fleet_log";
import { createShipLog } from "../api/fleetLogApi";
import { getAllUsers } from "../api/userService";
import { User } from "../types/user";

interface LogFleetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (fleetLog: FleetLog) => Promise<void>;
  fleets: { id: number; name: string }[];
  userId: string;
  username: string;
  patch: string; // <-- Add this line
}

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
};

const parseArray = (str: string) =>
  str.split(",").map(s => s.trim()).filter(Boolean);

const LogFleetModal: React.FC<LogFleetModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  fleets,
  patch, // <-- Add this line
}) => {
  const [form, setForm] = useState<Partial<FleetLog>>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [crewInput, setCrewInput] = useState("");
  const [crewSuggestions, setCrewSuggestions] = useState<User[]>([]);
  const [commanderInput, setCommanderInput] = useState("");
  const [commanderSuggestions, setCommanderSuggestions] = useState<User[]>([]);

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
    }
  }, [isOpen, patch]); // <-- Add patch as dependency

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
          <label style={{ flex: 1, minWidth: 0 }}>
            <select
              style={{ width: "100%" }}
              value={form.fleet_id || ""}
              onChange={e => {
                const fleet = fleets.find(f => String(f.id) === e.target.value);
                handleChange("fleet_id", fleet?.id);
                handleChange("fleet_name", fleet?.name || "");
              }}
              disabled={isSubmitting}
            >
              <option value="">Select Fleet</option>
              {fleets.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </label>
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