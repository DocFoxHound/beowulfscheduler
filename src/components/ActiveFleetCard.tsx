import React, { useEffect, useState } from "react";
import { UserFleet } from "../types/fleet";
import { FleetLog } from "../types/fleet_log";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { editFleet, fetchFleetById } from "../api/fleetApi";

interface Props {
  fleet: UserFleet;
  fleetLogs: FleetLog[];
  commander_username?: string;
  members_usernames?: string[];
  original_commander_username?: string;
  isNotInAnyFleet?: boolean;
  userId?: string;
  dbUser?: any;
  onActionComplete?: () => void; // <-- Add this line
}

const ActiveFleetCard: React.FC<Props> = ({
  fleet, fleetLogs, commander_username, members_usernames, original_commander_username, isNotInAnyFleet, userId, dbUser, onActionComplete
}) => {
  const [showMembers, setShowMembers] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [activityData, setActivityData] = useState<{ date: string; count: number }[]>([]);

  useEffect(() => {
    const counts: Record<string, number> = {};
    fleetLogs.forEach(log => {
      if (log.created_at) {
        const date = log.created_at.slice(0, 10);
        counts[date] = (counts[date] || 0) + 1;
      }
    });
    const data: { date: string; count: number }[] = [];
    const now = new Date();
    let cumulative = 0;
    for (let i = 89; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      cumulative += counts[dateStr] || 0;
      data.push({ date: dateStr, count: cumulative });
    }
    setActivityData(data);
  }, [fleetLogs]);

  const isActive = fleet.active !== false;

  // Add join handler
  const handleJoin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) return;

    let latestFleet = fleet;
    try {
      const [freshFleet] = await fetchFleetById(String(fleet.id));
      if (freshFleet) latestFleet = freshFleet;
    } catch {}

    const currentMembers = Array.isArray(latestFleet.members_ids) ? latestFleet.members_ids : [];
    if (currentMembers.includes(userId)) {
      alert("You are already a member of this fleet.");
      return;
    }
    const newMembers = [...currentMembers, userId];
    try {
      await editFleet(String(fleet.id), { ...latestFleet, members_ids: newMembers, action: "add_member", changed_user_id: userId });
      if (typeof onActionComplete === "function") onActionComplete(); // <-- Use callback
    } catch (err: any) {
      if (err.response && err.response.status === 409) {
        alert("Another user has updated this fleet. Please refresh the page and try again.");
      } else {
        alert("Failed to join fleet.");
      }
    }
  };

  const formatNumber = (n?: number) => (n ?? 0).toLocaleString("en-US");
  const formatUSD = (n?: number) =>
    (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const formatAUEC = (n?: number) => `${(n ?? 0).toLocaleString()} aUEC`;

  return (
    <div
      onClick={() => setShowDetails((v) => !v)}
      style={{
        background: isActive ? "linear-gradient(135deg,rgb(42, 26, 26) 60%, #2d7aee 100%)" : "#444",
        color: isActive ? "#fff" : "#bbb",
        borderRadius: 12,
        padding: "1.5rem",
        marginBottom: "1.5rem",
        boxShadow: isActive
          ? "0 4px 24px 0 rgba(238, 45, 45, 0.25), 0 1.5px 4px 0 #000"
          : "0 2px 8px rgba(0, 0, 0, 0.15)",
        opacity: isActive ? 1 : 0.6,
        border: isActive ? "2px solid rgb(238, 45, 45)" : "2px solid #555",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Share Tech Mono', 'Consolas', monospace",
        cursor: "pointer",
        transition: "box-shadow 0.2s, border 0.2s"
      }}
    >
      {/* Condensed View */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: showDetails ? 12 : 0 }}>
        <img
          src={fleet.avatar}
          alt="Fleet Avatar"
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            border: isActive ? "3px solid rgb(238, 45, 45)" : "3px solid #555",
            marginRight: 18,
            background: "#222"
          }}
        />
        <div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: 1 }}>
            {fleet.name || `Fleet #${fleet.id}`}
          </div>
          <div style={{ fontSize: "1rem", color: "#ffb300" }}>
            Commander: {commander_username || fleet.commander_id}
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          {isNotInAnyFleet && isActive && (
              <button
                onClick={handleJoin}
                style={{
                  background: "#2d7aee",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 16px",
                  fontWeight: 700,
                  fontSize: "1rem",
                  cursor: "pointer",
                  marginRight: 8,
                  boxShadow: "0 1px 4px #000a"
                }}
              >
                Join
              </button>
            )}
          {!isActive && dbUser?.corsair_level > 0 && (
            <button
              onClick={async e => {
                e.stopPropagation();
                try {
                  await editFleet(String(fleet.id), {
                    ...fleet,
                    commander_id: dbUser.id,
                    commander_corsair_rank: dbUser.corsair_level,
                    members_ids: [ dbUser.id ],
                    active: true,
                    last_active: new Date().toISOString(),
                    action: "take_command",
                    changed_user_id: dbUser.id,
                  });
                  if (typeof onActionComplete === "function") onActionComplete(); // <-- Use callback
                } catch (err: any) {
                  if (err.response && err.response.status === 409) {
                    alert("Another user has updated this fleet. Please refresh the page and try again.");
                  } else {
                    alert("Failed to take command.");
                  }
                }
              }}
              style={{
                background: "#ffb300",
                color: "#222",
                border: "none",
                borderRadius: 6,
                padding: "6px 16px",
                fontWeight: 700,
                fontSize: "1rem",
                cursor: "pointer",
                marginRight: 8,
                boxShadow: "0 1px 4px #000a"
              }}
            >
              Take Command
            </button>
          )}
          <span style={{ fontSize: 22, color: "#7fd7ff" }}>
            {showDetails ? "▲" : "▼"}
          </span>
        </div>
      </div>

      {/* Expanded View */}
      {showDetails && (
        <>
          <div style={{ fontSize: "1rem", color: "#7fd7ff", fontWeight: 500, marginBottom: 8 }}>
            {isActive ? "ACTIVE" : "INACTIVE"}
          </div>
          <div style={{ marginBottom: 8 }}>
            <span style={{ color: "#ffb300" }}>Original Commander:</span>{" "}
            {original_commander_username || fleet.original_commander_id}
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "0.5rem 1.5rem",
            marginBottom: 10,
            fontSize: "1rem"
          }}>
            <div><b>🏴‍☠️ Corsair Rank:</b> {fleet.commander_corsair_rank ?? "?"}</div>
            <div><b>👥 Member Count:</b> {fleet.members_ids?.length}</div>
            <div style={{ marginBottom: 12 }}>
              <button
                onClick={e => { e.stopPropagation(); setShowMembers(v => !v); }}
                style={{
                  background: "none",
                  color: "#2d7aee",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "1rem",
                  marginBottom: 4,
                  textShadow: "0 0 4px #000"
                }}
              >
                {showMembers ? "Hide Members ▲" : "Show Members ▼"}
              </button>
              {showMembers && (
                <ul style={{
                  background: "#181c22",
                  borderRadius: 8,
                  padding: "0.5rem 1rem",
                  margin: 0,
                  listStyle: "none",
                  maxHeight: 120,
                  overflowY: "auto",
                  boxShadow: "0 1px 4px #000a"
                }}>
                  {(members_usernames || []).map((m, i) => (
                    <li key={i} style={{ padding: "2px 0", borderBottom: "1px solid #222" }}>
                      <span style={{ color: "#7fd7ff" }}>🧑‍🚀</span> {m}
                    </li>
                  ))}
                  {(!members_usernames || members_usernames.length === 0) && (
                    <li style={{ color: "#888" }}>No members</li>
                  )}
                </ul>
              )}
            </div>
          </div>

          {/* Activity Graph */}
          <div style={{ margin: "1rem 0", background: "#181c22", borderRadius: 8, padding: "1rem" }}>
            <div style={{ fontWeight: 600, marginBottom: 8, color: "#7fd7ff" }}>Activity (Last 3 Months)</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={activityData}>
                <CartesianGrid stroke="#222" />
                <XAxis dataKey="date" tickFormatter={d => d.slice(5)} minTickGap={20} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#2d7aee" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Stats Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "0.5rem 1.5rem",
            marginBottom: 10,
            fontSize: "1rem"
          }}>
            <div><b>⚔️ Total Kills:</b> {formatNumber(Number(fleet.total_kills))}</div>
            <div><b>⚡ Patch Kills:</b> {formatNumber(Number(fleet.patch_kills))}</div>
            <div><b>💥 Total Damages:</b> {formatUSD(fleet.total_damages)}</div>
            <div><b>⚡ Damages (Patch):</b> {formatUSD(fleet.total_damages_patch)}</div>
            <div><b>📜 Total Events:</b> {formatNumber(Number(fleet.total_events))}</div>
            <div><b>⚡ Events (Patch):</b> {formatNumber(Number(fleet.total_events_patch))}</div>
            <div><b>💰 Cargo Stolen:</b> {formatNumber(Number(fleet.total_cargo_stolen))}</div>
            <div><b>⚡ Cargo (Patch):</b> {formatNumber(Number(fleet.total_cargo_stolen_patch))}</div>
            <div><b>💎 Value Stolen:</b> {formatAUEC(fleet.total_value_stolen)}</div>
            <div><b>⚡ Value (Patch):</b> {formatAUEC(fleet.total_value_stolen_patch)}</div>
          </div>

          {/* Missions */}
          <div style={{ marginBottom: 6 }}>
            <span style={{ color: "#7fd7ff" }}>Primary Mission:</span>{" "}
            <span style={{ fontStyle: "italic" }}>{fleet.primary_mission || "N/A"}</span>
          </div>
          <div>
            <span style={{ color: "#7fd7ff" }}>Secondary Mission:</span>{" "}
            <span style={{ fontStyle: "italic" }}>{fleet.secondary_mission || "N/A"}</span>
          </div>
        </>
      )}

      {/* Sci-fi border effect */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0, height: 6,
        background: isActive
          ? "linear-gradient(90deg,rgb(238, 45, 45) 0%,rgb(255, 127, 127) 100%)"
          : "linear-gradient(90deg, #555 0%, #888 100%)",
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        boxShadow: isActive ? "0 0 12px rgba(238, 45, 45, 0.6)" : undefined
      }} />
    </div>
  );
};

export default ActiveFleetCard;