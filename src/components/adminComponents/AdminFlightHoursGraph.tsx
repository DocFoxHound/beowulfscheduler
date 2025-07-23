import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

interface LeaderboardSBLog {
  flight_time?: string;
  kill_death_ratio?: number;
  rating?: number;
  created_at?: bigint;
}

interface UserWithData {
  id: string | number;
  username?: string;
  voiceHours: number;
  sbPlayerSummary?: {
    total_flight_time?: number;
    kill_death_ratio?: number;
    rating?: number;
    // ...other aggregate fields
  };
  sb_leaderboard_logs?: LeaderboardSBLog[];
}

interface AdminFlightHoursGraphProps {
  usersWithData: UserWithData[];
}

const AdminFlightHoursGraph: React.FC<AdminFlightHoursGraphProps> = ({ usersWithData }) => {
  // Aggregate sbPlayerSummary stats
  const totalFlightTimeRaw = usersWithData.reduce((sum, u) => sum + (u.sbPlayerSummary?.total_flight_time || 0), 0);
  const totalFlightTime = typeof totalFlightTimeRaw === 'number' && !isNaN(totalFlightTimeRaw) ? totalFlightTimeRaw : 0;
  const avgKillDeathRatio = (
    usersWithData.reduce((sum, u) => sum + (u.sbPlayerSummary?.kill_death_ratio || 0), 0) /
    (usersWithData.length || 1)
  ).toFixed(2);
  const avgRating = (
    usersWithData.reduce((sum, u) => sum + (u.sbPlayerSummary?.rating || 0), 0) /
    (usersWithData.length || 1)
  ).toFixed(0);

  // Aggregate sb_leaderboard_logs by date
  const logsByDate: Record<string, { flight_time: number; kill_death_ratio: number; rating: number; count: number }> = {};
  let hasLeaderboardLogs = false;
  usersWithData.forEach(user => {
    if (user.sb_leaderboard_logs && user.sb_leaderboard_logs.length > 0) {
      hasLeaderboardLogs = true;
    }
    (user.sb_leaderboard_logs || []).forEach(log => {
      if (log.created_at) {
        const date = new Date(Number(log.created_at)).toISOString().slice(0, 10);
        if (!logsByDate[date]) {
          logsByDate[date] = { flight_time: 0, kill_death_ratio: 0, rating: 0, count: 0 };
        }
        // flight_time is a string, convert to hours (assume format "HH:MM:SS" or just hours)
        let flightHours = 0;
        if (log.flight_time) {
          if (log.flight_time.includes(":")) {
            const [h, m, s] = log.flight_time.split(":").map(Number);
            flightHours = h + (m || 0) / 60 + (s || 0) / 3600;
          } else {
            flightHours = Number(log.flight_time);
          }
        }
        logsByDate[date].flight_time += flightHours;
        logsByDate[date].kill_death_ratio += log.kill_death_ratio || 0;
        logsByDate[date].rating += log.rating || 0;
        logsByDate[date].count += 1;
      }
    });
  });
  // Prepare chart data: average per day
  const chartData = Object.entries(logsByDate).map(([date, vals]) => ({
    date,
    flight_time: Number(vals.flight_time.toFixed(2)),
    kill_death_ratio: vals.count ? Number((vals.kill_death_ratio / vals.count).toFixed(2)) : 0,
    rating: vals.count ? Number((vals.rating / vals.count).toFixed(0)) : 0,
  })).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div>
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
        <div style={{ background: '#333', color: '#fff', borderRadius: 8, padding: '1rem', minWidth: 120 }}>
          <div style={{ fontSize: 12 }}>Total Flight Time</div>
          <div style={{ fontWeight: 'bold', fontSize: 20 }}>{Number(totalFlightTime).toFixed(1)} hrs</div>
        </div>
        <div style={{ background: '#333', color: '#fff', borderRadius: 8, padding: '1rem', minWidth: 120 }}>
          <div style={{ fontSize: 12 }}>Avg K/D Ratio</div>
          <div style={{ fontWeight: 'bold', fontSize: 20 }}>{avgKillDeathRatio}</div>
        </div>
        <div style={{ background: '#333', color: '#fff', borderRadius: 8, padding: '1rem', minWidth: 120 }}>
          <div style={{ fontSize: 12 }}>Avg Rating</div>
          <div style={{ fontWeight: 'bold', fontSize: 20 }}>{avgRating}</div>
        </div>
      </div>
      {hasLeaderboardLogs && chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="date" stroke="#fff" interval={0} angle={-30} textAnchor="end" height={60} />
            <YAxis yAxisId="left" stroke="#82ca9d" label={{ value: 'Flight Time (hrs)', angle: -90, position: 'insideLeft', fill: '#82ca9d' }} />
            <YAxis yAxisId="right" orientation="right" stroke="#8884d8" label={{ value: 'Rating', angle: 90, position: 'insideRight', fill: '#8884d8' }} />
            <Tooltip wrapperStyle={{ backgroundColor: '#333', color: '#fff' }} />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="flight_time" stroke="#82ca9d" name="Flight Time (hrs)" dot={false} />
            <Line yAxisId="left" type="monotone" dataKey="kill_death_ratio" stroke="#ffb347" name="K/D Ratio" dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="rating" stroke="#8884d8" name="Rating" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ color: '#ccc', textAlign: 'center', marginTop: '2rem' }}>
          No leaderboard log data available to display chart.
        </div>
      )}
    </div>
  );
};

export default AdminFlightHoursGraph;
