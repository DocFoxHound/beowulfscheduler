import React, { useEffect, useState } from "react";
import { getWeeklySchedule } from "../../api/scheduleService";
import { ScheduleEntry } from "../../types/schedule";

interface UpcomingEventsProps {
    dbUser?: any; 
    isRonin?: boolean; 
}


function getTint(type: string) {
  switch (type) {
    case "Event":
      return { background: "#2a2327", color: "#ffb3b3" };
    case "RoninFleet":
      return { background: "#232a23", color: "#d1c97a" };
    case "Fleet":
      return { background: "#232a27", color: "#7fd7a3" };
    case "Ronin":
      return { background: "#2a2723", color: "#e6d36a" };
    default:
      return { background: "#23272a", color: "#bbb" };
  }
}

function getCountdown(target: string) {
  const now = new Date();
  const eventTime = new Date(target);
  const diff = eventTime.getTime() - now.getTime();
  if (diff <= 0) return "Started";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export default function UpcomingEvents({ dbUser, isRonin }: UpcomingEventsProps) {
  const [events, setEvents] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(Date.now());

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      const now = new Date();
      const end = new Date(now);
      end.setMonth(end.getMonth() + 1);
      const startDate = now.toISOString();
      const endDate = end.toISOString();
      try {
        const data = await getWeeklySchedule(startDate, endDate);
        let filtered = Array.isArray(data) ? data : [];
        // Filtering logic
        if (!isRonin) {
          filtered = filtered.filter(ev => ev.type !== "Ronin");
        }
        if (dbUser?.fleet === null) {
          filtered = filtered.filter(ev => ev.type !== "Fleet");
        }
        if (!isRonin && dbUser?.fleet === null) {
          filtered = filtered.filter(ev => ev.type !== "RoninFleet");
        }
        // Only future events
        filtered = filtered.filter(ev => {
          const t = new Date(ev.timestamp || ev.start_time || "");
          return t.getTime() > now.getTime();
        });
        // Sort by soonest
        filtered.sort((a, b) => {
          const ta = new Date(a.timestamp || a.start_time || "").getTime();
          const tb = new Date(b.timestamp || b.start_time || "").getTime();
          return ta - tb;
        });
        setEvents(filtered.slice(0, 5));
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, [dbUser, isRonin]);

  // Timer effect for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{
        width: "100%",
        minHeight: 32,
        maxHeight: 48,
        background: "#23272a",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        fontWeight: 500,
        borderRadius: 8,
        margin: "8px 0 16px 0",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        overflow: "hidden"
      }}>
        Loading events...
      </div>
    );
  }

  if (!events.length) {
    return (
      <div style={{
        width: "100%",
        minHeight: 32,
        maxHeight: 48,
        background: "#23272a",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        fontWeight: 500,
        borderRadius: 8,
        margin: "8px 0 16px 0",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        overflow: "hidden"
      }}>
        No upcoming events
      </div>
    );
  }

  return (
    <div style={{ width: "100%", margin: "8px 0 16px 0", display: "flex", gap: 10 }}>
      {events.map(ev => {
        const tint = getTint(ev.type || "Event");
        return (
          <div
            key={ev.id}
            style={{
              flex: 1,
              minWidth: 0,
              ...tint,
              borderRadius: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              padding: "8px 10px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 500,
              fontSize: 14,
              overflow: "hidden",
              height: 48
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2, textAlign: "center", width: "100%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title || "Untitled"}</div>
            <div style={{ fontSize: 13, color: tint.color, background: "#181c22", borderRadius: 4, padding: "2px 8px", marginTop: 2, textAlign: "center", width: "100%" }}>
              {getCountdown(ev.timestamp || ev.start_time || "")}
            </div>
          </div>
        );
      })}
    </div>
  );
}
