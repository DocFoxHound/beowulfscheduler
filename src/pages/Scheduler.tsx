import { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./Dashboard.css"; // Reuse the same styles
import "./Scheduler.css"; // Import scheduler-specific styles
import Calendar from "../components/Calendar";
import { getWeeklySchedule, saveSchedule } from "../api/scheduleService";
import { type Availability, type ScheduleEntry } from "../types/schedule";

export default function Scheduler() {
  const [user, setUser] = useState<any>(null);
  const [availability, setAvailability] = useState<Availability>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [availabilityType, setAvailabilityType] = useState<string>("Dogfighting"); // Default type
  const [weekRange, setWeekRange] = useState<{ start: Date; end: Date } | null>(null);
  const hasLoadedInitialWeek = useRef(false);

  const availabilityTypes = ["Dogfighting", "Piracy", "FPS", "Fleet", "Event"];

  // Fetch user data
  useEffect(() => {
    axios
      .get("http://localhost:3000/auth/user", { withCredentials: true })
      .then((res) => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

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
    }
    else if (user && weekRange) {
      console.log("Fetching schedule for user:", user.username);
      setLoading(true);
      getWeeklySchedule(weekRange.start, weekRange.end)
        .then((data) => {
          setAvailability(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Failed to load schedule:", error);
          setLoading(false);
        });
    }
  }, [user, weekRange]);

  // Handle toggling an hour in the availability
  const handleToggleHour = (date: Date, hour: number) => {
    // Create a new Date at the correct hour in the user's local time
    const local = new Date(date);
    local.setHours(hour, 0, 0, 0);

    // Convert to ISO string (UTC) or with offset
    const timestamp = local.toISOString(); // or use luxon/moment for more control

    setAvailability((prev) => {
      // const updated: Availability | { author_id: any; timestamp: string; type: string; attendees: never[]; author_username: any; attendees_usernames: never[]; }[] = [];
      const previous = [...prev];
      // const newArray: Availability | { action: string, id: number, author_id: any; timestamp: string; type: string; attendees: number[]; author_username: any; attendees_usernames: string[]; }[] = [];
      // const deleteArray: Availability | { action: string, id: number, author_id: any; timestamp: string; type: string; attendees: number[]; author_username: any; attendees_usernames: string[]; }[] = [];
      const existingIndex = previous.findIndex(
        (entry) => entry.timestamp === timestamp
      );

      if (existingIndex >= 0) {//click off availability
        const existingEntry = previous.find(
          (entry) =>
            entry.timestamp === timestamp &&
            entry.author_id === user.id
        );
        if (existingEntry) {
          if(existingEntry.action === "add") {
            previous.splice(existingIndex, 1);
          }else{
            existingEntry.action = "delete";
          }
        }        
      } else {//click on availability
        //check the previous array for an entry that has the same timestamp, type, and author_id, and if it exists don't add a new one
        const existingEntry = previous.find(
          (entry) =>
            entry.timestamp === timestamp &&
            entry.author_id === user.id
        );
        if (existingEntry) {
          existingEntry.action = "update";
          existingEntry.type = availabilityType;
        }else if (!existingEntry) {
          previous.push({
            action: "add",
            id: Math.floor(Math.random() * 1000000), // Temporary ID, replace with real ID from backend
            author_id: user.id,
            timestamp,
            type: availabilityType,
            attendees: [],
            author_username: user.username,
            attendees_usernames: [],
          });
        }        
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
          <a href="/charts">Charts</a>
          <a href="/scheduler">Beowulf Scheduler</a>
          <a href="/hittracker">Hits</a>
          <a href="/settings">Settings</a>
          <a href="/logout" className="logout-link">Logout</a>
        </nav>
      </header>

      {/* Main Content */}
      <main className="dashboard-content">
        <section className="dashboard-header">
          <h1>Scheduler</h1>
          <p>Create and manage your upcoming mission schedules.</p>
        </section>

        {/* Calendar UI */}
        <section className="calendar-container">
          <div className="availability-type-selector">
            {availabilityTypes.map((type) => (
              <label key={type} className={`type-option ${availabilityType === type ? 'active' : ''}`}>
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

          {loading ? (
            <div className="loading-indicator">Loading your schedule...</div>
          ) : (
            <>
              <Calendar
                initialDate={weekRange ? weekRange.start : undefined}
                availability={availability}
                onToggleHour={handleToggleHour}
                onWeekChange={handleWeekChange}
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
