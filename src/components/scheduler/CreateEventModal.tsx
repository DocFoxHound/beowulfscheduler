import React, { useState, useRef, useEffect } from "react";
import Modal from "../Modal";
import { saveSchedule, updateSchedule, getNextScheduleByRepeatSeries, deleteSeries } from "../../api/scheduleService";
import { ScheduleEntry } from "../../types/schedule";
import { fetchAllFleets } from "../../api/fleetApi"; // <-- Import this
import "emoji-picker-element";
import { UserFleet } from "../../types/fleet"; // <-- Add this import
import { getLatestPatch } from "../../api/patchApi"; // Add this import

// Allow usage of <emoji-picker> as a JSX element
declare namespace JSX {
  interface IntrinsicElements {
    "emoji-picker": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
  }
}

interface CreateEventModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (event: Omit<ScheduleEntry, "id">) => void;
  defaultDate: Date;
  defaultHour: number;
  currentUserId: number;
  currentUsername: string;
  userRoleIds: string[];
  view?: "training" | "events";
  dbUser: any;
  RONIN_IDS: string[];
  timezone: string;
  mode: "create" | "edit";
  editingEvent?: ScheduleEntry; // Optional prop for editing an existing event
  isModerator?: boolean; // Optional prop to indicate if the user is a moderator
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({
open,
onClose,
onCreate,
defaultDate,
defaultHour,
currentUserId,
currentUsername,
userRoleIds,
dbUser,
RONIN_IDS,
timezone,
mode,
isModerator,
editingEvent
}) => {

  const isLive = import.meta.env.VITE_IS_LIVE === "true";
  // Determine if Fleet Association should be shown
  const showFleetAssociation = dbUser && dbUser.fleet && Array.isArray(dbUser.fleet)
    ? dbUser.fleet.length > 0
    : !!dbUser?.fleet;

  // Determine if user is Ronin
  const isRonin = Array.isArray(dbUser?.roles) && dbUser.roles.some((role: string) => RONIN_IDS.includes(role));

  const PUBLIC_EVENTS_CHANNEL = isLive
    ? import.meta.env.VITE_PUBLIC_EVENTS_CHANNEL
    : import.meta.env.VITE_TEST_PUBLIC_EVENTS_CHANNEL;
  const PROSPECT_EVENTS_CHANNEL = isLive
    ? import.meta.env.VITE_PROSPECT_EVENTS_CHANNEL
    : import.meta.env.VITE_TEST_PROSPECT_EVENTS_CHANNEL;
  const CREW_EVENTS_CHANNEL = isLive
    ? import.meta.env.VITE_CREW_EVENTS_CHANNEL
    : import.meta.env.VITE_TEST_CREW_EVENTS_CHANNEL;
  const MARAUDER_EVENTS_CHANNEL = isLive
    ? import.meta.env.VITE_MARAUDER_EVENTS_CHANNEL
    : import.meta.env.VITE_TEST_MARAUDER_EVENTS_CHANNEL;

  const pad = (n: number) => n.toString().padStart(2, "0");

  const getLocalDateTimeString = (date: Date, hour: number) => {
    const d = new Date(date);
    d.setHours(hour, 0, 0, 0);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
  };

  // State initialization with editingEvent if in edit mode
  const [title, setTitle] = useState<string>(
    mode === "edit" && editingEvent && typeof editingEvent.title === "string"
      ? editingEvent.title
      : "Event Title"
  );
  const [description, setDescription] = useState(() =>
    mode === "edit" && editingEvent ? editingEvent.description : ""
  );
  const [startTime, setStartTime] = useState(() => {
    if (mode === "edit" && editingEvent && editingEvent.start_time) {
      // Convert to local datetime string for input
      const d = new Date(editingEvent.start_time);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    return getLocalDateTimeString(defaultDate, defaultHour);
  });
  const [endTime, setEndTime] = useState<string | undefined>(() => {
    if (mode === "edit" && editingEvent && editingEvent.end_time) {
      const d = new Date(editingEvent.end_time);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    const start = getLocalDateTimeString(defaultDate, defaultHour);
    const d = new Date(start);
    d.setHours(d.getHours() + 1);
    return getLocalDateTimeString(d, d.getHours());
  });
  const [channel, setChannel] = useState(() =>
    mode === "edit" && editingEvent ? String(editingEvent.discord_channel) : ""
  );
  const [rsvpOptions, setRsvpOptions] = useState(() => {
    if (mode === "edit" && editingEvent && editingEvent.rsvp_options) {
      try {
        const opts = JSON.parse(editingEvent.rsvp_options);
        if (Array.isArray(opts)) return opts;
      } catch {}
    }
    return [
      { emoji: "✅", name: "Yes" },
      { emoji: "❔", name: "Maybe" },
      { emoji: "❌", name: "No" }
    ];
  });
  const [appearanceColor, setAppearanceColor] = useState(() => {
    if (mode === "edit" && editingEvent && editingEvent.appearance && editingEvent.appearance.color) {
      return editingEvent.appearance.color;
    }
    return "#5865F2";
  });
  const [appearanceImage, setAppearanceImage] = useState(() => {
    if (mode === "edit" && editingEvent && editingEvent.appearance && editingEvent.appearance.image) {
      return editingEvent.appearance.image;
    }
    return "";
  });
  const [repeat, setRepeat] = useState(() =>
    mode === "edit" && editingEvent ? !!editingEvent.repeat : false
  );
  const [repeatFrequency, setRepeatFrequency] = useState(() =>
    mode === "edit" && editingEvent && editingEvent.repeat_frequency ? editingEvent.repeat_frequency : "weekly"
  );
  const [repeatEndDate, setRepeatEndDate] = useState<string | undefined>(() => {
    if (mode === "edit" && editingEvent && editingEvent.repeat_end_date) {
      // Convert to yyyy-mm-dd
      const d = new Date(editingEvent.repeat_end_date);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }
    return undefined;
  });

  const [emojiPickerIdx, setEmojiPickerIdx] = useState<number | null>(null);
  const [emojiPickerAnchor, setEmojiPickerAnchor] = useState<DOMRect | null>(null);
  const emojiPickerRef = useRef<any>(null);

  // Fleet/Ronin association state for edit mode
  const [fleetAssociation, setFleetAssociation] = useState(() =>
    mode === "edit" && editingEvent && editingEvent.fleet && editingEvent.fleet.length > 0
      ? true
      : false
  );
  const [roninAssociation, setRoninAssociation] = useState(() =>
    mode === "edit" && editingEvent && editingEvent.type && (editingEvent.type === "Ronin" || editingEvent.type === "RoninFleet")
      ? true
      : false
  );
  const [fleetSelection, setFleetSelection] = useState("");
  const [fleets, setFleets] = useState<UserFleet[]>([]);
  const [showFleetPicker, setShowFleetPicker] = useState(false);
  const [selectedFleets, setSelectedFleets] = useState<UserFleet[]>([]);

  // Validation state
  const [validationError, setValidationError] = useState<string | null>(null);

  // Populate selectedFleets in edit mode after fleets are loaded
  useEffect(() => {
    if (mode === "edit" && editingEvent && fleets.length > 0 && editingEvent.fleet && editingEvent.fleet.length > 0) {
      // editingEvent.fleet is array of fleet IDs
      const selected = editingEvent.fleet
        ? fleets.filter(f => (editingEvent.fleet ?? []).includes(Number(f.id)))
        : [];
      setSelectedFleets(selected);
    }
  }, [mode, editingEvent, fleets]);

  // Fetch fleets on open
  useEffect(() => {
    if (!open) return;
    fetchAllFleets()
      .then(fleets => {
        // Sort by last_active descending (most recent first)
        const sorted = [...fleets].sort((a, b) => {
          if (!a.last_active && !b.last_active) return 0;
          if (!a.last_active) return 1;
          if (!b.last_active) return -1;
          return new Date(b.last_active).getTime() - new Date(a.last_active).getTime();
        });
        setFleets(sorted);
        // Debug: log fleets to verify
      })
      .catch(() => setFleets([]));
  }, [open]);

  // Update endTime automatically when startTime changes
  useEffect(() => {
    if (!startTime) return;
    const d = new Date(startTime);
    d.setHours(d.getHours() + 1);
    setEndTime(getLocalDateTimeString(d, d.getHours()));
  }, [startTime]);

  const handleRsvpChange = (idx: number, field: "emoji" | "name", value: string) => {
    setRsvpOptions(options =>
      options.map((opt, i) => i === idx ? { ...opt, [field]: value } : opt)
    );
  };

  const addRsvpOption = () => setRsvpOptions(options => [...options, { emoji: "", name: "" }]);
  const removeRsvpOption = (idx: number) => setRsvpOptions(options => options.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) {
      setValidationError("Title is required.");
      return;
    }
    if (!channel) {
      setValidationError("Channel is required.");
      return;
    }
    if (!startTime) {
      setValidationError("Start time is required.");
      return;
    }
    if (!(description ?? "").trim()) {
      setValidationError("Description is required.");
      return;
    }

    if (rsvpOptions.length === 0 || rsvpOptions.some(opt => !opt.emoji || !opt.name.trim())) {
      setValidationError("At least one RSVP position with both emoji and name is required.");
      return;
    }

    // Require at least one fleet if Fleet Association is checked
    if (fleetAssociation && selectedFleets.length === 0) {
      setValidationError("At least one fleet must be selected when Fleet Association is checked.");
      return;
    }

    setValidationError(null); // Clear error if all validations pass

    // Fetch latest patch version
    let patchVersion = "";
    try {
      const patchObject = await getLatestPatch();
      patchVersion = patchObject.version;
    } catch (err) {
      alert("Failed to fetch latest patch version.");
      return;
    }

    // Save appearance as JSON
    const appearance = {
      color: appearanceColor,
      image: appearanceImage
    };

    // Helper to generate a single event object
    const makeEvent = (start: string, repeatSeries: number = 0) => {
      let type = "Event";
      if (isRonin && roninAssociation && fleetAssociation && selectedFleets.length > 0) {
        type = "RoninFleet";
      } else if (isRonin && roninAssociation && (!fleetAssociation || selectedFleets.length === 0)) {
        type = "Ronin";
      } else if (fleetAssociation && selectedFleets.length > 0) {
        type = "Fleet";
      } // If neither Ronin nor Fleet Association is checked, type remains "Event"
      return {
        id: Math.floor(Math.random() * 9_000_000_000) + 1_000_000_000,
        author_id: currentUserId,
        type,
        title,
        description,
        attendees: [],
        author_username: currentUsername,
        attendees_usernames: [],
        // Convert start, end to UTC using timezone
        timestamp: window.moment ? window.moment.tz(start, timezone).utc().toISOString() : new Date(start).toISOString(),
        start_time: window.moment ? window.moment.tz(start, timezone).utc().toISOString() : new Date(start).toISOString(),
        end_time: endTime ? (window.moment ? window.moment.tz(endTime, timezone).utc().toISOString() : new Date(endTime).toISOString()) : undefined,
        appearance,
        repeat,
        repeat_end_date: repeat ? repeatEndDate : undefined,
        repeat_frequency: repeat ? repeatFrequency : undefined,
        rsvp_options: JSON.stringify(rsvpOptions),
        fleet: fleetAssociation && selectedFleets.length > 0
          ? selectedFleets.map(f => f.id)
          : [],
        patch: patchVersion,
        active: false,
        repeat_series: repeatSeries,
        discord_channel: String(channel),
        first_notice: false,
        second_notice: false
      };
    };

    let events: any[] = [];

    // Calculate duration in milliseconds
    const durationMs =
      endTime && startTime
        ? new Date(endTime).getTime() - new Date(startTime).getTime()
        : 0;

    // --- EDIT MODE: handle repeat_series replacement and deletion ---
    let originalRepeatSeries: string | null = null;
    if (
      mode === "edit" &&
      editingEvent &&
      editingEvent.repeat_series !== null &&
      typeof editingEvent.repeat_series !== "undefined"
    ) {
      originalRepeatSeries = String(editingEvent.repeat_series);
    }

    let newRepeatSeries: number | undefined = undefined;

    if (repeat && repeatEndDate && repeatFrequency) {
      // Generate a random 8-digit repeat_series number
      newRepeatSeries = Math.floor(Math.random() * 90_000_000) + 10_000_000;

      // Generate all repeat events
      let current = new Date(startTime);
      const end = new Date(repeatEndDate);
      while (current <= end) {
        const eventStart = new Date(current);
        const eventEnd =
          durationMs > 0 ? new Date(eventStart.getTime() + durationMs) : undefined;
        const event = makeEvent(eventStart.toISOString(), newRepeatSeries);
        event.start_time = eventStart.toISOString();
        event.end_time = eventEnd ? eventEnd.toISOString() : undefined;
        events.push(event);

        if (repeatFrequency === "daily") {
          current.setDate(current.getDate() + 1);
        } else if (repeatFrequency === "weekly") {
          current.setDate(current.getDate() + 7);
        } else if (repeatFrequency === "monthly") {
          current.setMonth(current.getMonth() + 1);
        }
      }
    } else {
      // One-off event
      events = [makeEvent(startTime)];
    }

    try {
      const saved = await saveSchedule(events);
      // If we edited a series, and created a new series, delete the old series
      if (mode === "edit" && originalRepeatSeries && newRepeatSeries) {
        // Call deleteSeries from scheduleService (use direct import)
        try {
          await deleteSeries(originalRepeatSeries);
        } catch (err) {
          // Optionally handle error, but don't block event creation
          console.error("Failed to delete original repeat series:", err);
        }
      }
      if (saved && saved.length > 0) {
        onCreate(saved[0]);
      }
      onClose();
      window.location.reload();
    } catch (error) {
      setValidationError("Failed to create event(s).");
    }
  };

  const handleEmojiButtonClick = (idx: number, e: React.MouseEvent<HTMLButtonElement>) => {
    setEmojiPickerIdx(idx);
    setEmojiPickerAnchor(e.currentTarget.getBoundingClientRect());
  };

  const handleEmojiSelect = (emoji: string) => {
    if (emojiPickerIdx !== null) {
      handleRsvpChange(emojiPickerIdx, "emoji", emoji);
    }
    setEmojiPickerIdx(null);
    setEmojiPickerAnchor(null);
  };

  useEffect(() => {
    if (!emojiPickerRef.current) return;
    const picker = emojiPickerRef.current;
    const handleEmojiClick = (event: any) => {
      handleEmojiSelect(event.detail.unicode);
    };
    picker.addEventListener("emoji-click", handleEmojiClick);
    return () => {
      picker.removeEventListener("emoji-click", handleEmojiClick);
    };
  }, [emojiPickerIdx]);

  if (!open) return null;

  return (
    <Modal onClose={onClose}>
      <h2 style={{ textAlign: "center" }}>{mode === "edit" ? "Edit Event" : "Create Event"}</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 16 }}>
          <label style={{ flex: 3, display: "flex", flexDirection: "column" }}>
            Title
            <input
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Event title"
            />
          </label>
          <label style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            Channel
            <select
                value={channel}
                onChange={e => setChannel(e.target.value)}
                style={{
                    width: "100%",
                    height: 36,
                    fontSize: 15,
                    marginBottom: 12,
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #444",
                    background: "#23272a",
                    fontWeight: 500,
                    color: "#fff",
                }}
                >
                <option value="" disabled>
                    Channel Selection
                </option>
                <option value={PUBLIC_EVENTS_CHANNEL}>Public Events</option>
                <option value={PROSPECT_EVENTS_CHANNEL}>Prospect Events</option>
                <option value={CREW_EVENTS_CHANNEL}>Crew Events</option>
                <option value={MARAUDER_EVENTS_CHANNEL}>Marauder Events</option>
            </select>
          </label>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <label style={{ flex: 1 }}>
            Start Time
            <input
              type="datetime-local"
              required
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
            />
          </label>
        </div>
        <label style={{ marginTop: 16, display: "block" }}>
          Description
        </label>
        <textarea
          style={{ minHeight: 140, width: "100%", resize: "vertical", marginBottom: 16 }}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Event description"
        />
        {/* Options Section */}
        <div
          style={{
            marginTop: 24,
            borderTop: "1px solid #ccc",
            paddingTop: 16,
            display: "flex",
            gap: 0, // Remove gap so borders touch
            alignItems: "flex-start",
          }}
        >
          {/* RSVP Positions - 1/3 */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              paddingRight: 24,
              borderRight: "1px solid #ddd",
            }}
          >
            <div style={{ marginBottom: 8, fontWeight: 500 }}>RSVP Positions</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "40px 1fr 70px",
                rowGap: "6px",
                columnGap: "8px",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 14, lineHeight: "36px" }}>Emoji</div>
              <div style={{ fontWeight: 600, fontSize: 14, lineHeight: "36px" }}>Position Name</div>
              <div></div>
              {rsvpOptions.map((opt, idx) => (
                <React.Fragment key={idx}>
                  <button
                    type="button"
                    onClick={e => handleEmojiButtonClick(idx, e)}
                    style={{
                      width: "36px",
                      height: "36px",
                      fontSize: 20,
                      textAlign: "center",
                      border: "1px solid #444",
                      borderRadius: 4,
                      background: "#23272a",
                      color: "#fff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                      margin: 0,
                    }}
                    aria-label="Select emoji"
                  >
                    {opt.emoji || "🙂"}
                  </button>
                  <input
                    type="text"
                    placeholder="Position name"
                    value={opt.name}
                    onChange={e => handleRsvpChange(idx, "name", e.target.value)}
                    style={{
                      width: "100%",
                      fontSize: 15,
                      padding: "0 8px",
                      height: "36px",
                      boxSizing: "border-box",
                      margin: 0,
                      verticalAlign: "middle",
                    }}
                  />
                  {rsvpOptions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRsvpOption(idx)}
                      style={{
                        color: "#c00",
                        fontSize: 14,
                        height: "36px",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        borderRadius: 4,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                        margin: 0,
                      }}
                    >
                      Remove
                    </button>
                  )}
                </React.Fragment>
              ))}
            </div>
            <button type="button" onClick={addRsvpOption} style={{ marginTop: 2 }}>
              + Add Position
            </button>
          </div>

          {/* Appearance - 1/3 */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              paddingLeft: 24,
              paddingRight: 24,
              borderRight: "1px solid #ddd",
            }}
          >
            <div style={{ marginBottom: 8, fontWeight: 500 }}>Appearance</div>
            <label style={{ display: "block", marginBottom: 8 }}>
              Embed Color
              <input
                type="color"
                value={appearanceColor || "#5865F2"}
                onChange={e => setAppearanceColor(e.target.value)}
                style={{ marginLeft: 8, verticalAlign: "middle" }}
              />
            </label>
            <label style={{ display: "block", marginBottom: 8 }}>
              Image URL
              <input
                type="text"
                value={appearanceImage || ""}
                onChange={e => setAppearanceImage(e.target.value)}
                placeholder="https://example.com/image.png"
                style={{ width: "100%", marginTop: 4 }}
              />
            </label>
            {appearanceImage && (
              <div style={{ marginTop: 8 }}>
                <img
                  src={appearanceImage}
                  alt="Event"
                  style={{
                    maxWidth: "100%",
                    maxHeight: 120,
                    borderRadius: 6,
                    border: "1px solid #ccc",
                    objectFit: "contain",
                    background: "#fafbfc"
                  }}
                  onError={e => (e.currentTarget.style.display = "none")}
                />
              </div>
            )}
          </div>

          {/* Repeat - 1/3 */}
          <div style={{ flex: 1, minWidth: 0, paddingLeft: 24 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>Repeat</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: repeat ? 8 : 16,
                opacity: isModerator ? 1 : 0.5,
                cursor: isModerator ? "pointer" : "not-allowed",
                position: "relative"
              }}
              title={isModerator ? undefined : "Only Blooded+ can create repeating events."}
              onMouseOver={e => {
                if (!isModerator) {
                  const tooltip = document.createElement("div");
                  tooltip.innerText = "Only Blooded+ can create repeating events.";
                  tooltip.style.position = "absolute";
                  tooltip.style.top = "-32px";
                  tooltip.style.left = "0";
                  tooltip.style.background = "#23272a";
                  tooltip.style.color = "#fff";
                  tooltip.style.padding = "6px 12px";
                  tooltip.style.borderRadius = "6px";
                  tooltip.style.fontSize = "14px";
                  tooltip.style.zIndex = "9999";
                  tooltip.className = "repeat-tooltip";
                  e.currentTarget.appendChild(tooltip);
                }
              }}
              onMouseOut={e => {
                const tooltip = e.currentTarget.querySelector(".repeat-tooltip");
                if (tooltip) e.currentTarget.removeChild(tooltip);
              }}
            >
              <input
                type="checkbox"
                checked={repeat}
                onChange={e => isModerator && setRepeat(e.target.checked)}
                style={{
                  width: 24,
                  height: 24,
                  accentColor: "#5865F2",
                  cursor: isModerator ? "pointer" : "not-allowed",
                  verticalAlign: "middle",
                }}
                disabled={!isModerator}
              />
              <span
                style={{
                  fontSize: 17,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                Repeat Event
              </span>
            </label>
              {repeat && (
                <>
                  <select
                    value={repeatFrequency}
                    onChange={e => setRepeatFrequency(e.target.value)}
                    style={{ width: "100%", marginBottom: 12, height: 36, fontSize: 15 }}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <label style={{ marginTop: 8 }}>
                    End Date
                    <input
                      type="date"
                      value={repeatEndDate || ""}
                      onChange={e => setRepeatEndDate(e.target.value || undefined)}
                      style={{ width: "100%", marginTop: 4 }}
                      min={startTime ? startTime.slice(0, 10) : undefined}
                    />
                  </label>
                </>
              )}
              {/* Only show Fleet Association if dbUser.fleet is not null or empty */}
              {showFleetAssociation && (
                <>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: fleetAssociation ? 8 : 0,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={fleetAssociation}
                      onChange={e => setFleetAssociation(e.target.checked)}
                      style={{
                        width: 24,
                        height: 24,
                        accentColor: "#5865F2",
                        cursor: "pointer",
                        verticalAlign: "middle",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 17,
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      Fleet Association
                    </span>
                  </label>
                  {/* Ronin Checkbox, only if user is Ronin */}
                  {isRonin && (
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: roninAssociation ? 8 : 0,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={roninAssociation}
                        onChange={e => setRoninAssociation(e.target.checked)}
                        style={{
                          width: 24,
                          height: 24,
                          accentColor: "#5865F2",
                          cursor: "pointer",
                          verticalAlign: "middle",
                        }}
                      />
                      <span
                        style={{
                          fontSize: 17,
                          fontWeight: 500,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        Ronin Team
                      </span>
                    </label>
                  )}
                  {fleetAssociation && (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowFleetPicker(true)}
                        style={{ marginBottom: 8 }}
                      >
                        Select Fleets
                      </button>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                        {selectedFleets.map(fleet => (
                          <div
                            key={fleet.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              padding: "4px 12px 4px 4px",
                              borderRadius: 20,
                              border: "2px solid #5865F2",
                              background: "#5865F222",
                              minWidth: 0,
                              marginRight: 8,
                            }}
                          >
                            <img
                              src={fleet.avatar}
                              alt={fleet.name || `Fleet #${fleet.id}`}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                objectFit: "cover",
                                marginRight: 8,
                                border: "1px solid #ccc",
                                background: "#fff"
                              }}
                              onError={e => (e.currentTarget.style.display = "none")}
                            />
                            <span style={{
                              fontWeight: 500,
                              fontSize: 15,
                              color: "#fff",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: 100
                            }}>
                              {fleet.name || `Fleet #${fleet.id}`}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedFleets(selectedFleets.filter(f => f.id !== fleet.id))}
                              style={{
                                marginLeft: 8,
                                color: "#c00",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: 700,
                                fontSize: 16,
                              }}
                              aria-label="Remove fleet"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                      {/* Fleet Picker Modal/Area */}
                      {showFleetPicker && (
                        <div
                          style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            width: "100vw",
                            height: "100vh",
                            background: "rgba(0,0,0,0.6)",
                            zIndex: 2000,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                          onClick={() => setShowFleetPicker(false)}
                        >
                          <div
                            style={{
                              background: "#23272a",
                              borderRadius: 12,
                              padding: 24,
                              minWidth: 340,
                              maxWidth: 600,
                              maxHeight: "70vh",
                              overflowY: "auto",
                              boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
                            }}
                            onClick={e => e.stopPropagation()}
                          >
                            <h3 style={{ color: "#fff", marginBottom: 16 }}>Select Fleets</h3>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                              {fleets.map(fleet => (
                                <div
                                  key={fleet.id}
                                  onClick={() => {
                                    if (!selectedFleets.some(f => f.id === fleet.id)) {
                                      setSelectedFleets([...selectedFleets, fleet]);
                                    }
                                  }}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "4px 12px 4px 4px",
                                    borderRadius: 20,
                                    border: selectedFleets.some(f => f.id === fleet.id)
                                      ? "2px solid #5865F2"
                                      : "1px solid #444",
                                    background: selectedFleets.some(f => f.id === fleet.id)
                                      ? "#5865F222"
                                      : "#23272a",
                                    cursor: selectedFleets.some(f => f.id === fleet.id)
                                      ? "not-allowed"
                                      : "pointer",
                                    opacity: selectedFleets.some(f => f.id === fleet.id)
                                      ? 0.5
                                      : 1,
                                    minWidth: 0,
                                    marginBottom: 8,
                                    transition: "border 0.2s, background 0.2s",
                                  }}
                                >
                                  <img
                                    src={fleet.avatar}
                                    alt={fleet.name || `Fleet #${fleet.id}`}
                                    style={{
                                      width: 32,
                                      height: 32,
                                      borderRadius: "50%",
                                      objectFit: "cover",
                                      marginRight: 10,
                                      border: "1px solid #ccc",
                                      background: "#fff"
                                    }}
                                    onError={e => (e.currentTarget.style.display = "none")}
                                  />
                                  <span style={{
                                    fontWeight: 500,
                                    fontSize: 15,
                                    color: "#fff",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    maxWidth: 120
                                  }}>
                                    {fleet.name || `Fleet #${fleet.id}`}
                                  </span>
                                  {selectedFleets.some(f => f.id === fleet.id) && (
                                    <span style={{ marginLeft: 8, color: "#5865F2", fontWeight: 700 }}>✓</span>
                                  )}
                                </div>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowFleetPicker(false)}
                              style={{ marginTop: 16 }}
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        {validationError && (
          <div style={{ color: "#c00", marginBottom: 12, fontWeight: 500, textAlign: "center" }}>
            {validationError}
          </div>
        )}
        <div style={{ marginTop: 16 }}>
          <button type="submit">
            {mode === "edit" ? "Save Changes" : "Create Event"}
          </button>
          <button type="button" onClick={onClose} style={{ marginLeft: 8 }}>
            Cancel
          </button>
        </div>
      </form>
      {emojiPickerIdx !== null && emojiPickerAnchor && (
        <div
          style={{
            position: "fixed",
            top: emojiPickerAnchor.bottom - 30,
            left: emojiPickerAnchor.left - 250,
            zIndex: 1000,
            background: "#23272a",
            borderRadius: 8,
            boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
            padding: 0,
            minWidth: 340,
            maxWidth: 420,
            fontSize: "unset",
            overflow: "visible",
          }}
        >
          {React.createElement("emoji-picker", {
            ref: emojiPickerRef,
            style: { width: "100%" }
          })}
        </div>
      )}
    </Modal>
  );
};

export default CreateEventModal;