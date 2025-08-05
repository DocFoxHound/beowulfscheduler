import React, { useState } from "react";
import Modal from "./Modal";
import { User } from "../types/user";
import { UserFleet } from "../types/fleet";
import { createFleet } from "../api/fleetApi"; // <-- Import createFleet

interface CreateFleetModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (fleet: Partial<UserFleet>) => Promise<void>;
  allUsers: User[];
  userId: number;
  isSubmitting?: boolean;
  formError?: string | null;
  dbUser: User;
}

const initialForm = {
  avatar: "",
  name: "",
  primary_mission: "",
  secondary_mission: "",
  commander_id: "",
  members_ids: [] as string[],
};

const CreateFleetModal: React.FC<CreateFleetModalProps> = ({
  show,
  onClose,
  onSubmit,
  allUsers,
  userId,
  isSubmitting = false,
  formError = null,
  dbUser,
}) => {
  // ...existing code...
  const [form, setForm] = useState({ ...initialForm});
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setForm(f => ({ ...f}));
  }, [show]);

  if (!show) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Fleet title is required.");
      return;
    }

    try {
      // Format date as 'YYYY-MM-DD HH:mm:ss+03' (or local offset)
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const year = now.getFullYear();
      const month = pad(now.getMonth() + 1);
      const day = pad(now.getDate());
      const hour = pad(now.getHours());
      const min = pad(now.getMinutes());
      const sec = pad(now.getSeconds());
      // Get timezone offset in +HH:mm or -HH:mm
      const offsetMin = now.getTimezoneOffset();
      const offsetSign = offsetMin <= 0 ? '+' : '-';
      const absOffset = Math.abs(offsetMin);
      const offsetHour = pad(Math.floor(absOffset / 60));
      const offsetMinute = pad(absOffset % 60);
      const offset = `${offsetSign}${offsetHour}${offsetMinute !== '00' ? ':' + offsetMinute : ''}`;
      const formattedDate = `${year}-${month}-${day} ${hour}:${min}:${sec}${offset}`;

      await createFleet({
        id: String(new Date().getTime()), // Temporary ID as string, will be replaced by the server
        avatar: form.avatar,
        name: form.name,
        primary_mission: form.primary_mission,
        secondary_mission: form.secondary_mission,
        commander_id: String(dbUser.id),
        members_ids: [String(dbUser.id)],
        last_active: formattedDate,
        commander_corsair_rank: dbUser.corsair_level,
        updated_at: String(Date.now()),
      } as UserFleet);

      setForm({ ...initialForm });
      onClose();
      window.location.reload(); // Refresh the page after closing the modal
    } catch (err) {
      setError("Failed to create fleet. Please try again.");
    }
  };

  return (
    <Modal onClose={onClose}>
      <h2>Create New Fleet</h2>
      <form onSubmit={handleSubmit}>
        {/* Fleet Avatar */}
        {form.avatar && (
          <div style={{ marginBottom: 12 }}>
            <img
              src={form.avatar}
              alt="Fleet Avatar Preview"
              style={{ maxWidth: 120, maxHeight: 120, borderRadius: 8, border: "1px solid #ccc" }}
              onError={e => (e.currentTarget.style.display = "none")}
            />
          </div>
        )}
        <label>
          Fleet Avatar URL:
          <input
            type="url"
            value={form.avatar}
            onChange={e => setForm(f => ({ ...f, avatar: e.target.value }))}
            disabled={isSubmitting}
            placeholder="Paste an image URL"
            style={{ marginBottom: 8 }}
          />
        </label>

        {/* Fleet Title */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ width: "100%" }}>
            Fleet Title:
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              disabled={isSubmitting}
              placeholder="Enter your fleet's name"
              style={{ width: "100%" }}
            />
            <div style={{ fontSize: "0.95em", color: "rgb(197, 197, 197)" }}>
              Choose wisely! Fleet names are permanent and unique.
            </div>
          </label>
        </div>

        <div
          style={{
            marginBottom: 18,
            background: "rgba(255, 0, 0, 0.14)",
            color: "rgb(255, 255, 255)",
            border: "1px solid rgb(255, 0, 0)",
            borderRadius: 6,
            padding: "12px 16px",
            fontSize: "1em"
          }}
        >
          <b>Important!</b> 
          <p></p>You may only ever create <b>one</b> fleet. You can leave your fleet and join others, but you can never create a new fleet — if you want to lead a fleet again, you must re-take this fleet or another inactive fleet.<br />
          <span style={{ color: "rgb(255, 0, 0)" }}>
            Choose your fleet's name wisely, because it will be forever!
          </span>
        </div>

        {/* Primary Mission */}
        <label>
          Primary Mission:
          <textarea
            value={form.primary_mission}
            onChange={e => setForm(f => ({ ...f, primary_mission: e.target.value }))}
            rows={3}
            disabled={isSubmitting}
            placeholder="Describe your fleet's main focus (e.g. Pirate Stanton, Blockade Hathors, Kill People...)"
            style={{ width: "100%", marginBottom: 12 }}
            maxLength={1000}
          />
        </label>

        {/* Secondary Mission */}
        <label>
          Secondary Mission:
          <textarea
            value={form.secondary_mission}
            onChange={e => setForm(f => ({ ...f, secondary_mission: e.target.value }))}
            rows={3}
            disabled={isSubmitting}
            placeholder="Describe your fleet's secondary focus"
            style={{ width: "100%", marginBottom: 12 }}
            maxLength={1000}
          />
        </label>

        {(error || formError) && (
          <div style={{ color: "#ff6b6b", marginBottom: "1em" }}>{error || formError}</div>
        )}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Fleet"}
        </button>
        <button type="button" onClick={onClose} disabled={isSubmitting} style={{ marginLeft: 8 }}>
          Cancel
        </button>
      </form>
    </Modal>
  );
};

export default CreateFleetModal;