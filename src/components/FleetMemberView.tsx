import React, { useState } from "react";
import { UserFleet } from "../types/fleet";
import { editFleet } from "../api/fleetApi";

interface FleetMemberViewProps {
  fleet: UserFleet;
  userId: string;
  username: string;
  members: { id: number; username: string }[];
  commander: { id: number; username: string } | null;
}

const FleetMemberView: React.FC<FleetMemberViewProps> = ({ fleet, userId, username, commander, members }) => {
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLeaveFleet = async () => {
    setLeaving(true);
    setError(null);
    try {
      // Remove userId from members_ids
      const newMembersIds = (fleet.members_ids || []).filter(id => id !== userId);

      const updatedFleet: UserFleet = {
        ...fleet,
        members_ids: newMembersIds,
      };

      await editFleet(String(fleet.id), updatedFleet);
      window.location.reload(); // Refresh the page after leaving
    } catch (e) {
      setError("Failed to leave fleet.");
      setLeaving(false);
    }
  };

  return (
    <div className="fleet-card member-view">
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <img src={fleet.avatar} alt="Fleet Avatar" style={{ width: 64, height: 64, borderRadius: 8, marginRight: 16 }} />
        <div>
          <h2 style={{ margin: 0 }}>{fleet.name}</h2>
          <div style={{ color: "#aaa" }}>Commander: {commander?.username}</div>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        <div className="fleet-stat">
          <strong>Members:</strong> {fleet.members_ids?.length}
        </div>
        <div className="fleet-stat">
          <strong>Primary Mission:</strong> {fleet.primary_mission || "N/A"}
        </div>
        <div className="fleet-stat">
          <strong>Secondary Mission:</strong> {fleet.secondary_mission || "N/A"}
        </div>
        <div className="fleet-stat">
          <strong>Kills (Patch):</strong> {fleet.patch_kills ?? 0}
        </div>
        <div className="fleet-stat">
          <strong>Events (Patch):</strong> {fleet.total_events_patch ?? 0}
        </div>
        <div className="fleet-stat">
          <strong>Last Active:</strong> {fleet.last_active ? new Date(fleet.last_active).toLocaleString() : "N/A"}
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <strong>Members:</strong>
        <ul>
          {members.map((member, idx) => (
            <li key={member.id || idx}>{member.username}</li>
          ))}
        </ul>
      </div>
      <div style={{ marginTop: 16 }}>
        <button
          onClick={handleLeaveFleet}
          disabled={leaving}
          style={{
            background: "#e22d2d",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            padding: "0.5rem 1.2rem",
            fontSize: "1rem",
            cursor: "pointer"
          }}
        >
          {leaving ? "Leaving..." : "Leave Fleet"}
        </button>
        {error && <div style={{ color: "#e22d2d", marginTop: 8 }}>{error}</div>}
      </div>
    </div>
  );
};

export default FleetMemberView;