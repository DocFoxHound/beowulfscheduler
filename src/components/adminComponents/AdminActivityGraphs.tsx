import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from "recharts";
import AdminPieChart from "./AdminPieChart";
import AdminVoiceActivityGraph from "./AdminVoiceActivityGraph";
import AdminFlightHoursGraph from "./AdminFlightHoursGraph";
import React from "react";

interface UserWithData {
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
}

const AdminActivityGraph: React.FC<AdminActivityGraphProps> = ({ usersWithData }) => {
  // Helper: format date to YYYY-MM-DD
  const formatDate = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    return d.toISOString().slice(0, 10);
  };

  // ...existing code...

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
  // 3. Stacked Bar chart: fleetLogs, recentGatherings, hitTrackers by date
  const stackByDate: Record<string, { fleetLogs: number; recentGatherings: number; hitTrackers: number }> = {};
  usersWithData.forEach(u => {
    // FleetLogs
    (u.fleetLogs || []).forEach(fl => {
      if (fl.created_at) {
        const date = formatDate(fl.created_at);
        stackByDate[date] = stackByDate[date] || { fleetLogs: 0, recentGatherings: 0, hitTrackers: 0 };
        stackByDate[date].fleetLogs += 1;
      }
    });
    // RecentGatherings
    (u.recentGatherings || []).forEach(g => {
      if (g.timestamp) {
        const date = formatDate(g.timestamp);
        stackByDate[date] = stackByDate[date] || { fleetLogs: 0, recentGatherings: 0, hitTrackers: 0 };
        stackByDate[date].recentGatherings += 1;
      }
    });
    // HitTrackers
    (u.hitTrackers || []).forEach(ht => {
      if (ht.timestamp) {
        const date = formatDate(ht.timestamp);
        stackByDate[date] = stackByDate[date] || { fleetLogs: 0, recentGatherings: 0, hitTrackers: 0 };
        stackByDate[date].hitTrackers += 1;
      }
    });
  });
  const stackBarData = Object.entries(stackByDate).map(([date, vals]) => ({ date, ...vals }));

  // 4. Bar chart: Voice Hours and Flight Time by user (moved to AdminFlightHoursGraph)

  return (
    <div style={{ background: "#222", borderRadius: "8px", padding: "1rem", color: "#fff" }}>
      <h2>User Activity Graphs</h2>
      <div style={{ display: "flex", gap: "2rem" }}>
        {/* Pie chart on the left, now taking up about half the width */}
        <div style={{ flex: "1 1 0", minWidth: 350, maxWidth: "50%" }}>
          <AdminPieChart data={blackboxPieData} usersWithData={usersWithData} />
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
