/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_IS_LIVE: string;
  readonly VITE_LIVE_USER_URL: string;
  readonly VITE_TEST_USER_URL: string;
  readonly VITE_LIVE_CREW_PLUS: string;
  // Add other environment variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./Dashboard.css"; // Reuse the same styles
import "./Scheduler.css"; // Import scheduler-specific styles
import Calendar from "../components/Calendar";
import { getWeeklySchedule, saveSchedule } from "../api/scheduleService";
import { type Availability, type ScheduleEntry } from "../types/schedule";
import { useUserContext } from "../context/UserContext"; // Import the context hook
import { getUserById, getUserRank } from "../api/userService";
import Navbar from "../components/Navbar";
import CreateEventModal from "../components/CreateEventModal"; // Import your modal component

const ROLE_OPTIONS = [
  { label: "Blooded", ids: import.meta.env.VITE_BLOODED_ID.split(",").map((id: string) => id.trim()).filter(Boolean) },
  { label: "Marauder", ids: import.meta.env.VITE_MARAUDER_ID.split(",").map((id: string) => id.trim()).filter(Boolean)},
  { label: "Crew", ids: import.meta.env.VITE_CREW_ID.split(",").map((id: string) => id.trim()).filter(Boolean) },
  { label: "Prospect", ids: import.meta.env.VITE_PROSPECT_ID.split(",").map((id: string) => id.trim()).filter(Boolean) },
  { label: "Friendly", ids: import.meta.env.VITE_FRIENDLY_ID.split(",").map((id: string) => id.trim()).filter(Boolean) },
  { label: "RAPTOR", ids: import.meta.env.VITE_RAPTOR_ID.split(",").map((id: string) => id.trim()).filter(Boolean) },
  { label: "CORSAIR", ids: import.meta.env.VITE_CORSAIR_ID.split(",").map((id: string) => id.trim()).filter(Boolean) },
  { label: "RAIDER", ids: import.meta.env.VITE_RAIDER_ID.split(",").map((id: string) => id.trim()).filter(Boolean) },
  { label: "Pilot Instructor", ids: import.meta.env.VITE_PILOT_INSTRUCTOR_ID.split(",").map((id: string) => id.trim()).filter(Boolean) },
  { label: "Pirate Instructor", ids: import.meta.env.VITE_PIRATE_INSTRUCTOR_ID.split(",").map((id: string) => id.trim()).filter(Boolean) },
  { label: "Fleet Instructor", ids: import.meta.env.VITE_FLEET_INSTRUCTOR_ID.split(",").map((id: string) => id.trim()).filter(Boolean) },
];

// Add this helper function above your component:
const typeColorClass = (type: string) => {
  switch (type) {
    case "Dogfighting":
      return "dogfighting";
    case "Piracy":
      return "piracy";
    case "FPS":
      return "fps";
    case "Fleet":
      return "fleet";
    case "Poll":
      return "poll";
    default:
      return "";
  }
};

export default function Scheduler() {
  const [user, setUser] = useState<any>(null);
  const [availability, setAvailability] = useState<Availability>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [availabilityType, setAvailabilityType] = useState<string>("Dogfighting"); // Default type
  const [weekRange, setWeekRange] = useState<{ start: Date; end: Date } | null>(null);
  const [viewMode, setViewMode] = useState<"normal" | "events">("normal"); // NEW
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventModalDate, setEventModalDate] = useState<Date | null>(null);
  const [eventModalHour, setEventModalHour] = useState<number | null>(null);
  const hasLoadedInitialWeek = useRef(false);
  const { dbUser, setDbUser, userRank, setUserRank } = useUserContext();

  const availabilityTypes = ["Dogfighting", "Piracy", "FPS", "Fleet", "Poll", "Event"]; // Add "Event"

  const [allowedRanks, setAllowedRanks] = useState<string[]>(ROLE_OPTIONS.map(r => r.label));
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Parse allowed rank IDs from env
  const crewPlusRanks = (import.meta.env.VITE_LIVE_CREW_PLUS || "")
    .split(",")
    .map((id: string) => id.trim());

  // Determine if user can create new availabilities
  const canCreateAvailability = userRank && crewPlusRanks.includes(String(userRank.id));
  // console.log("DB User:", dbUser);
  // console.log("Role Options:", ROLE_OPTIONS);
  // console.log("User rank:", userRank);

  const userRoleIds = dbUser?.roles || [];
  const availableRoleOptions = ROLE_OPTIONS;

  // Fetch Discord user
  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_USER_URL : import.meta.env.VITE_TEST_USER_URL}`, { withCredentials: true })
      .then((res) => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  // Fetch dbUser if not set
  useEffect(() => {
    if (user && user.id && !dbUser) {
      getUserById(user.id)
        .then((data) => setDbUser(data))
        .catch(() => setDbUser(null));
    }
  }, [user, dbUser, setDbUser]);

  // Fetch userRank if not set
  useEffect(() => {
    if (dbUser && dbUser.rank && !userRank) {
      getUserRank(dbUser.rank)
        .then((data) => setUserRank(data))
        .catch(() => setUserRank(null));
    }
  }, [dbUser, userRank, setUserRank]);

  // When week changes in Calendar, store the range
  const handleWeekChange = (startOfWeek: Date, endOfWeek: Date) => {
    setWeekRange({ start: startOfWeek, end: endOfWeek });
  };

  // When both user and weekRange are available, fetch data
  useEffect(() => {
    if (user && !weekRange) {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      setWeekRange({ start: startOfWeek, end: endOfWeek });
    } else if (user && weekRange) {
      setLoading(true);
      getWeeklySchedule(weekRange.start, weekRange.end)
        .then((data) => {
          setAvailability(data);
          setLoading(false);
        })
        .catch((error) => {
          setLoading(false);
        });
    }
  }, [user, weekRange]);

  // Filtered availability for calendar
  const filteredAvailability = viewMode === "events"
    ? availability.filter(a => a.type === "Event")
    : availability.filter(a => a.type !== "Event");

  // Handle toggling an hour in the availability
  const handleToggleHour = (date: Date, hour: number, options?: { forceAdd?: boolean, removeOwn?: boolean, availabilityId?: string }) => {
    const localDate = new Date(date);
    localDate.setHours(hour, 0, 0, 0);
    const timestamp = localDate.toISOString();

    setAvailability((prev) => {
      let previous = [...prev];
      // If availabilityId is provided, use it to find the entry
      let existingIndex = -1;
      if (options?.availabilityId !== undefined) {
        existingIndex = previous.findIndex(entry => String(entry.id) === options.availabilityId);
      } else {
        existingIndex = previous.findIndex(
          (entry) => entry.timestamp === timestamp && entry.author_id === user.id
        );
      }

      if (options?.removeOwn && existingIndex >= 0) {
        // If the entry has an id, mark for deletion; otherwise, remove it
        if (previous[existingIndex].id) {
          previous[existingIndex] = {
            ...previous[existingIndex],
            action: "delete"
          };
        } else {
          previous.splice(existingIndex, 1);
        }
        return previous;
      }

      // If joining/leaving as attendee
      if (existingIndex >= 0 && options?.availabilityId !== undefined) {
        const existingEntry = previous[existingIndex];
        const attendeeIdx = existingEntry.attendees.indexOf(user.id);
        const attendeeNameIdx = existingEntry.attendees_usernames.indexOf(user.username);
        if (attendeeIdx !== -1) {
          // Remove attendee
          existingEntry.attendees.splice(attendeeIdx, 1);
          if (attendeeNameIdx !== -1) existingEntry.attendees_usernames.splice(attendeeNameIdx, 1);
        } else {
          // Add attendee
          existingEntry.attendees.push(user.id);
          existingEntry.attendees_usernames.push(user.username);
        }
        // Mark as update for backend
        if (existingEntry.action !== "add") {
          existingEntry.action = "update";
        }
        return previous;
      }

      const existingIndexGeneral = previous.findIndex(
        (entry) => entry.timestamp === timestamp
      );

      if (existingIndexGeneral >= 0 && !options?.forceAdd) {
        const existingEntry = previous[existingIndexGeneral];
        // If user is author or DocHound, allow delete or re-adding
        if (existingEntry.author_id === user.id || user.id === 664023164350627843) {
          if (existingEntry.action === "add") {
            previous.splice(existingIndexGeneral, 1);
          } else if (existingEntry.action === "delete") {
            // Allow re-adding by changing action back to "add"
            existingEntry.action = "add";
            existingEntry.type = availabilityType;
            existingEntry.allowed_ranks = ROLE_OPTIONS
              .filter(r => allowedRanks.includes(r.label))
              .flatMap(r => r.ids);
            existingEntry.allowed_ranks_names = ROLE_OPTIONS
              .filter(r => allowedRanks.includes(r.label))
              .map(r => r.label);
          } else {
            existingEntry.action = "delete";
          }
        } else {
          // --- ENFORCE ALLOWED RANKS HERE ---
          // Only allow joining if user has at least one allowed role
          const userRoleIds = dbUser?.roles || [];
          const allowedRanks = existingEntry.allowed_ranks || [];
          console.log("Allowed ranks:", allowedRanks);
          const canJoin = allowedRanks.length === 0 || userRoleIds.some((roleId: any) => allowedRanks.includes(roleId));
          if (!canJoin) {
            setSaveStatus("You do not have permission to join this availability.");
            return previous;
          }
          // Not author: toggle attendee status
          const attendeeIdx = existingEntry.attendees.indexOf(user.id);
          const attendeeNameIdx = existingEntry.attendees_usernames.indexOf(user.username);
          if (attendeeIdx !== -1) {
            // Remove attendee
            existingEntry.attendees.splice(attendeeIdx, 1);
            if (attendeeNameIdx !== -1) existingEntry.attendees_usernames.splice(attendeeNameIdx, 1);
          } else {
            // Add attendee
            existingEntry.attendees.push(user.id);
            existingEntry.attendees_usernames.push(user.username);
          }
          // Mark as update for backend
          if (existingEntry.action !== "add") {
            existingEntry.action = "update";
          }
        }
      } else {
        // Only allow creation if user is Crew+ or higher
        if (!canCreateAvailability) {
          setSaveStatus("You do not have permission to create new availabilities.");
          return previous;
        }
        // Add new availability for self
        previous.push({
          action: "add",
          id: Math.floor(Math.random() * 1000000),
          author_id: user.id,
          timestamp,
          type: availabilityType,
          attendees: [],
          author_username: user.username,
          attendees_usernames: [],
          allowed_ranks: ROLE_OPTIONS
            .filter(r => allowedRanks.includes(r.label))
            .flatMap(r => r.ids),
          allowed_ranks_names: ROLE_OPTIONS
            .filter(r => allowedRanks.includes(r.label))
            .map(r => r.label),
        });
      }
      return previous;
    });

    setSaveStatus(null);
  };

  // Handle saving the schedule
  const handleSave = async () => {
    setSaving(true);
    setSaveStatus(null);

    // Only send new availabilities (action === "add")
    const newAvailabilities = availability.filter(a => a.action === "add");

    try {
      await saveSchedule(newAvailabilities);
      setSaveStatus("Schedule saved successfully!");

      // Re-fetch the latest schedule after saving
      if (weekRange) {
        const fresh = await getWeeklySchedule(weekRange.start, weekRange.end);
        setAvailability(fresh);
      }
    } catch (error) {
      console.error("Failed to save schedule:", error);
      setSaveStatus("Failed to save schedule. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // New handler for event creation
  const handleDayCellClick = (date: Date, hour: number) => {
    if (viewMode === "events") {
      setEventModalDate(date);
      setEventModalHour(hour);
      setEventModalOpen(true);
    } else {
      handleToggleHour(date, hour);
    }
  };

  // Add this function inside your Scheduler component
  const refreshSchedule = async () => {
    if (weekRange) {
      setLoading(true);
      try {
        const fresh = await getWeeklySchedule(weekRange.start, weekRange.end);
        setAvailability(fresh);
      } finally {
        setLoading(false);
      }
    }
  };

  if (!user) {
    return (
      <div className="centered-screen">
        <p>Not logged in. <a href="/">Go to Login</a></p>
      </div>
    );
  }

  return (
    <div className="dashboard-root">
      <Navbar dbUser={dbUser} />
      {/* Top header spanning full width */}
      <div className="scheduler-header-fullwidth" style={{
        width: '100%',
        background: '#181a1b',
        borderRadius: 8,
        margin: '1.5rem 0 2rem 0',
        padding: '2rem 2rem 1.5rem 2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
      }}>
        <h1 style={{margin: 0}}>Scheduler</h1>
        <p style={{margin: 0}}>Create and sign up for training availabilities.</p>
      </div>
      <main className="dashboard-content" style={{ width: '100%', margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
        {/* VIEW MODE TOGGLE */}
        <div style={{ marginBottom: 16, width: '100%' }}>
          <button
            onClick={() => setViewMode("normal")}
            style={{
              marginRight: 8,
              fontWeight: viewMode === "normal" ? "bold" : "normal",
              background: viewMode === "normal" ? "#444" : "#222",
              color: "#fff",
              border: "1px solid #666",
              borderRadius: 4,
              padding: "4px 12px",
              cursor: "pointer"
            }}
          >
            Training
          </button>
          <button
            onClick={() => setViewMode("events")}
            style={{
              fontWeight: viewMode === "events" ? "bold" : "normal",
              background: viewMode === "events" ? "#444" : "#222",
              color: "#fff",
              border: "1px solid #666",
              borderRadius: 4,
              padding: "4px 12px",
              cursor: "pointer"
            }}
          >
            Events
          </button>
        </div>
        {/* Calendar UI - truly full width */}
        <section className="calendar-container" style={{ width: '100%', maxWidth: '100vw', minWidth: 0, margin: 0, padding: 0 }}>
          {/* Always show type selector, but grey out and disable in events view */}
          <div className="availability-type-selector" style={{ opacity: viewMode === "events" ? 0.5 : 1, pointerEvents: viewMode === "events" ? "none" : "auto" }}>
            {availabilityTypes
              .filter(type => type !== "Event")
              .map((type) => (
                <label
                  key={type}
                  className={`type-option ${typeColorClass(type)}${availabilityType === type ? ' active' : ''}`}
                  style={{
                    border: availabilityType === type ? "2px solid #fff" : undefined,
                  }}
                >
                  <input
                    type="radio"
                    name="availabilityType"
                    value={type}
                    checked={availabilityType === type}
                    onChange={() => setAvailabilityType(type)}
                    disabled={viewMode === "events"}
                  />
                  {type}
                </label>
              ))}
          </div>

          {canCreateAvailability && (
            <div
              className="allowed-ranks-dropdown"
              style={{
                display: "inline-block",
                marginLeft: 16,
                opacity: viewMode === "events" ? 0.5 : 1,
                pointerEvents: viewMode === "events" ? "none" : "auto"
              }}
            >
              <button type="button" onClick={() => setDropdownOpen(v => !v)} disabled={viewMode === "events"}>
                Allowed Ranks ▾
              </button>
              {dropdownOpen && (
                <div className="dropdown-menu" style={{ position: "absolute", background: "#222", border: "1px solid #444", zIndex: 10, padding: 8 }}>
                  {availableRoleOptions.map(role => (
                    <label key={role.label} style={{ display: "block" }}>
                      <input
                        type="checkbox"
                        checked={allowedRanks.includes(role.label)}
                        onChange={() => {
                          setAllowedRanks(prev =>
                            prev.includes(role.label)
                              ? prev.filter(l => l !== role.label)
                              : [...prev, role.label]
                          );
                        }}
                        disabled={viewMode === "events"}
                      />
                      {role.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div className="loading-indicator">Loading your schedule...</div>
          ) : (
            <>
              <Calendar
                initialDate={weekRange ? weekRange.start : undefined}
                availability={filteredAvailability}
                onToggleHour={handleDayCellClick}
                onWeekChange={handleWeekChange}
                currentUserId={user.id}
                currentUsername={user.username}
                userRoleIds={dbUser?.roles || []}
                viewMode={viewMode}
                onScheduleUpdated={refreshSchedule} // <-- Pass this prop
              />

              <div className="save-container">
                {saveStatus && (
                  <div className={`save-status ${saveStatus.includes('Failed') ? 'error' : 'success'}`}>
                    {saveStatus}
                  </div>
                )}
                <button
                  className="save-button"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>

              {/* Event Modal */}
              {eventModalOpen && (
                <CreateEventModal
                  open={eventModalOpen}
                  onClose={() => setEventModalOpen(false)}
                  onCreate={(event) => {
                    // Optionally add the new event to your state or refetch events
                    setEventModalOpen(false);
                    // You may want to refresh the schedule here
                  }}
                  defaultDate={eventModalDate!}
                  defaultHour={eventModalHour!}
                  currentUserId={user.id}
                  currentUsername={user.username}
                  userRoleIds={dbUser?.roles || []}
                />
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
