import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from "recharts";
import AdminVoiceActivityGraph from "./AdminVoiceActivityGraph";
import AdminFlightHoursGraph from "./AdminFlightHoursGraph";
import React from "react";
import AdminUpdate from "./AdminUpdate";
import { fetchBadgesByUserId } from "../../api/badgeRecordApi";

interface UserWithData extends Record<string, unknown> {
  id: string | number;
  username?: string;
  voiceHours: number;
  voiceSessions: any[];
  blackBoxes: any[];
  fleetLogs: any[];
  recentGatherings: any[];
  hitTrackers: any[];
  sbPlayerSummary?: { total_flight_time?: number };
  // ...other properties as needed
}

interface AdminActivityGraphProps {
  usersWithData: UserWithData[];
  fleetLogsData?: any[];
  hitTrackersData?: any[];
  recentGatheringsData?: any[];
  selectedUser?: UserWithData;
  allPlayerStats?: any[];
  activeBadgeReusables?: any[];
}

const AdminActivityGraph: React.FC<AdminActivityGraphProps> = ({ usersWithData, fleetLogsData, hitTrackersData, recentGatheringsData, activeBadgeReusables, allPlayerStats }) => {
  // Helper: format date to YYYY-MM-DD
  const formatDate = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    return d.toISOString().slice(0, 10);
  };

  // ...existing code...

  // Build a map of userId -> earned badges to prevent duplicate award prompts
  const [playerBadgesByUser, setPlayerBadgesByUser] = React.useState<Record<string, any[]>>({});

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const ids = (usersWithData || [])
        .map((u) => (u && u.id != null ? String(u.id) : null))
        .filter((v): v is string => Boolean(v));
      if (ids.length === 0) {
        setPlayerBadgesByUser({});
        return;
      }
      try {
        const results: Array<[string, any[]]> = await Promise.all(
          ids.map(async (id): Promise<[string, any[]]> => {
            try {
              const badges = await fetchBadgesByUserId(id);
              return [id, Array.isArray(badges) ? [...badges] : []];
            } catch {
              return [id, []];
            }
          })
        );
        if (!cancelled) {
          const map: Record<string, any[]> = {};
          for (const [id, arr] of results) map[id] = arr;
          setPlayerBadgesByUser(map);
        }
      } catch {
        if (!cancelled) setPlayerBadgesByUser({});
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [usersWithData]);

  // 2. Pie chart: Blackbox data (moved to AdminPieChart)
  const allBlackBoxes = usersWithData.flatMap(u => Array.isArray(u.blackBoxes) ? u.blackBoxes : []);
  const blackboxTypeCounts: Record<string, number> = {};
  allBlackBoxes.forEach(bb => {
    const type = bb.type || 'Unknown';
    blackboxTypeCounts[type] = (blackboxTypeCounts[type] || 0) + 1;
  });
  const blackboxPieData = Object.entries(blackboxTypeCounts).map(([type, count]) => ({ name: type, value: count }));

  // Import AdminPieChart
  // ...existing code...
  // 3. Stacked Bar chart: fleetLogs, recentGatherings, hitTrackers by date using respective data props
  const stackByDate: Record<string, { fleetLogs: number; recentGatherings: number; hitTrackers: number }> = {};
  // FleetLogs: use fleetLogsData prop
  (fleetLogsData || []).forEach(fl => {
    if (fl.created_at) {
      const date = formatDate(fl.created_at);
      stackByDate[date] = stackByDate[date] || { fleetLogs: 0, recentGatherings: 0, hitTrackers: 0 };
      stackByDate[date].fleetLogs += 1;
    }
  });
  // RecentGatherings: use recentGatheringsData prop
  (recentGatheringsData || []).forEach(g => {
    if (g.timestamp) {
      const date = formatDate(g.timestamp);
      stackByDate[date] = stackByDate[date] || { fleetLogs: 0, recentGatherings: 0, hitTrackers: 0 };
      stackByDate[date].recentGatherings += 1;
    }
  });
  // HitTrackers: use hitTrackersData prop
  (hitTrackersData || []).forEach(ht => {
    if (ht.timestamp) {
      const date = formatDate(ht.timestamp);
      stackByDate[date] = stackByDate[date] || { fleetLogs: 0, recentGatherings: 0, hitTrackers: 0 };
      stackByDate[date].hitTrackers += 1;
    }
  });
  const stackBarData = Object.entries(stackByDate).map(([date, vals]) => ({ date, ...vals }));

  // 4. Bar chart: Voice Hours and Flight Time by user (moved to AdminFlightHoursGraph)

  return (
    <div style={{ background: "#222", borderRadius: "8px", padding: "1rem", color: "#fff" }}>
      <div style={{ display: "flex", gap: "2rem" }}>
        {/* Pie chart on the left, now taking up about half the width */}
        <div style={{ flex: "1 1 0", minWidth: 350, maxWidth: "50%" }}>
          <AdminUpdate allPlayerStats={
            allPlayerStats ?? []} 
            usersWithData={usersWithData} 
            activeBadgeReusables={activeBadgeReusables}
            playerBadgesByUser={playerBadgesByUser}
          />
        </div>
        {/* Other charts stacked vertically on the right */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* 1. Voice Activity Bar Chart moved to AdminVoiceActivityGraph */}
          <AdminVoiceActivityGraph usersWithData={usersWithData} />
          {/* 4. Bar chart: Voice Hours and Flight Time by user moved to AdminFlightHoursGraph */}
          <AdminFlightHoursGraph usersWithData={usersWithData} />
        </div>
      </div>
    </div>
  );
};

export default AdminActivityGraph;
