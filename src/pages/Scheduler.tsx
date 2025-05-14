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
    case "Event":
      return "event";
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
  const hasLoadedInitialWeek = useRef(false);
  const { dbUser, setDbUser, userRank, setUserRank } = useUserContext();

  const availabilityTypes = ["Dogfighting", "Piracy", "FPS", "Fleet", "Event"];

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

  // Handle toggling an hour in the availability
  const handleToggleHour = (date: Date, hour: number) => {
    const localDate = new Date(date);
    localDate.setHours(hour, 0, 0, 0);
    const timestamp = localDate.toISOString();

    setAvailability((prev) => {
      const previous = [...prev];
      const existingIndex = previous.findIndex(
        (entry) => entry.timestamp === timestamp
      );

      if (existingIndex >= 0) {
        const existingEntry = previous[existingIndex];
        // If user is author or DocHound, allow delete
        if (existingEntry.author_id === user.id || user.id === 664023164350627843) {
          if (existingEntry.action === "add") {
            previous.splice(existingIndex, 1);
          } else {
            existingEntry.action = "delete";
          }
        } else {
          // --- ENFORCE ALLOWED RANKS HERE ---
          // Only allow joining if user has at least one allowed role
          const userRoleIds = dbUser?.roles || [];
          const allowedRanks = existingEntry.allowed_ranks || [];
          console.log("Allowed ranks:", allowedRanks);
          const canJoin = allowedRanks.length === 0 || userRoleIds.some((roleId: string) => allowedRanks.includes(roleId));
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

    try {
      await saveSchedule(availability);
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

  if (!user) {
    return (
      <div className="centered-screen">
        <p>Not logged in. <a href="/">Go to Login</a></p>
      </div>
    );
  }

  return (
    <div className="dashboard-root">
      {/* Top Navigation */}
      <header className="navbar">
        <div className="navbar-title">IronPoint</div>
        <nav className="navbar-links">
          <a href="/dashboard">Dashboard</a>
          <a href="/scheduler">Training Scheduler</a>
          <a href="/hittracker">Hits</a>
          {/* <a href="/charts">Charts</a> */}
          {/* <a href="/settings">Settings</a> */}
          {/* <a href="/logout" className="logout-link">Logout</a> */}
        </nav>
      </header>

      {/* Main Content */}
      <main className="dashboard-content">
        <section className="dashboard-header">
          <h1>Scheduler</h1>
          <p>Create and sign up for training availabilities.</p>
        </section>

        {/* Calendar UI */}
        <section className="calendar-container">
          <div className="availability-type-selector">
            {availabilityTypes.map((type) => (
              <label
                key={type}
                className={`type-option ${typeColorClass(type)}${availabilityType === type ? ' active' : ''}`}
                style={{
                  // Optional: make the active one stand out more
                  border: availabilityType === type ? "2px solid #fff" : undefined,
                }}
              >
                <input
                  type="radio"
                  name="availabilityType"
                  value={type}
                  checked={availabilityType === type}
                  onChange={() => setAvailabilityType(type)}
                />
                {type}
              </label>
            ))}
          </div>

          {canCreateAvailability && (
            <div className="allowed-ranks-dropdown" style={{ display: "inline-block", marginLeft: 16 }}>
              <button type="button" onClick={() => setDropdownOpen(v => !v)}>
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
                availability={availability}
                onToggleHour={handleToggleHour}
                onWeekChange={handleWeekChange}
                currentUserId={user.id}
                currentUsername={user.username}
                userRoleIds={dbUser?.roles || []}
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
                  {saving ? 'Saving...' : 'Save Availability'}
                </button>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
