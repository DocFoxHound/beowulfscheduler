import React, { useState, useRef, useEffect } from "react";
import Modal from "./Modal";
import { saveSchedule } from "../api/scheduleService";
import { ScheduleEntry } from "../types/schedule";
import "emoji-picker-element";

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
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({
  open,
  onClose,
  onCreate,
  defaultDate,
  defaultHour,
  currentUserId,
  currentUsername,
  userRoleIds
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState(() => {
    const d = new Date(defaultDate);
    d.setHours(defaultHour, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [endTime, setEndTime] = useState<string | undefined>(() => {
    const d = new Date(defaultDate);
    d.setHours(defaultHour + 1, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [channel, setChannel] = useState("1178563149079777352"); // Default to Public Events
  const [rsvpOptions, setRsvpOptions] = useState([
    { emoji: "✅", name: "Yes" },
    { emoji: "❔", name: "Maybe" },
    { emoji: "❌", name: "No" }
  ]);
  const [appearanceColor, setAppearanceColor] = useState("#5865F2");
  const [appearanceImage, setAppearanceImage] = useState("");
  const [repeat, setRepeat] = useState(false);
  const [repeatFrequency, setRepeatFrequency] = useState("weekly");

  const [emojiPickerIdx, setEmojiPickerIdx] = useState<number | null>(null);
  const [emojiPickerAnchor, setEmojiPickerAnchor] = useState<DOMRect | null>(null);
  const emojiPickerRef = useRef<any>(null);

  const [fleetAssociation, setFleetAssociation] = useState(false);
  const [fleetSelection, setFleetSelection] = useState("");

  const handleRsvpChange = (idx: number, field: "emoji" | "name", value: string) => {
    setRsvpOptions(options =>
      options.map((opt, i) => i === idx ? { ...opt, [field]: value } : opt)
    );
  };

  const addRsvpOption = () => setRsvpOptions(options => [...options, { emoji: "", name: "" }]);
  const removeRsvpOption = (idx: number) => setRsvpOptions(options => options.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const eventData = {
      id: new Date().getTime(),
      author_id: currentUserId,
      type: "Event",
      attendees: [],
      author_username: currentUsername,
      attendees_usernames: [],
      timestamp: new Date(startTime).toISOString(),
      action: "add",
      allowed_ranks: [],
      allowed_ranks_names: [],
      title: title,
      description: description,
      start_time: new Date(startTime).toISOString(),
      end_time: endTime ? new Date(endTime).toISOString() : undefined,
      channel: Number(channel),
      appearance: null,
      repeat: false,
      rsvp_options: "test",
      fleet: 0,
      patch: "",
      active: true, 
    };

    try {
      const saved = await saveSchedule([eventData]);
      if (saved && saved.length > 0) {
        onCreate(saved[0]);
      }
      onClose();
    } catch (error) {
      alert("Failed to create event.");
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
      <h2 style={{ textAlign: "center" }}>Create Event</h2>
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
                <option value="1178563149079777352">Public Events</option>
                <option value="1222195799249911909">Crew Events</option>
                <option value="1195840959284514926">Marauder Events</option>
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
          <label style={{ flex: 1 }}>
            End Time (optional)
            <input
              type="datetime-local"
              value={endTime || ""}
              onChange={e => setEndTime(e.target.value || undefined)}
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
                }}
              >
                <input
                  type="checkbox"
                  checked={repeat}
                  onChange={e => setRepeat(e.target.checked)}
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
                  Repeat Event
                </span>
              </label>
              {repeat && (
                <select
                  value={repeatFrequency}
                  onChange={e => setRepeatFrequency(e.target.value)}
                  style={{ width: "100%", marginBottom: 12, height: 36, fontSize: 15 }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              )}
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
              {fleetAssociation && (
                <select
                  value={fleetSelection}
                  onChange={e => setFleetSelection(e.target.value)}
                  style={{ width: "100%", height: 36, fontSize: 15 }}
                >
                  <option value="">Select Fleet</option>
                  <option value="fleet1">Fleet 1</option>
                  <option value="fleet2">Fleet 2</option>
                  <option value="fleet3">Fleet 3</option>
                </select>
              )}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <button type="submit">Create Event</button>
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