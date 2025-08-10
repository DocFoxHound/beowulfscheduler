import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";

interface UserWithData {
  id: string | number;
  username?: string;
  voiceHours: number;
  voiceSessions: any[];
  // ...other properties as needed
}

interface AdminVoiceActivityGraphProps {
  usersWithData: UserWithData[];
}

const AdminVoiceActivityGraph: React.FC<AdminVoiceActivityGraphProps> = ({ usersWithData }) => {
  // Helper: format date to YYYY-MM-DD
  const formatDate = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    return d.toISOString().slice(0, 10);
  };

  // Collect all sessions, flatten
  const voiceSessions = usersWithData.flatMap(u => Array.isArray(u.voiceSessions) ? u.voiceSessions : []);

  // Find earliest joined_at and latest left_at
  let minDate: Date | null = null;
  let maxDate: Date | null = null;
  voiceSessions.forEach(session => {
    if (session.joined_at) {
      const joined = new Date(session.joined_at);
      if (!minDate || joined < minDate) minDate = joined;
    }
    if (session.left_at) {
      const left = new Date(session.left_at);
      if (!maxDate || left > maxDate) maxDate = left;
    }
  });

  // Group sessions by day (using joined_at)
  const voiceByDate: Record<string, number> = {};
  voiceSessions.forEach(session => {
    if (session.joined_at) {
      const date = formatDate(session.joined_at);
      voiceByDate[date] = (voiceByDate[date] || 0) + (session.minutes || 0);
    }
  });

  // Build full date range (inclusive)
  const dateRange: string[] = [];
  if (minDate && maxDate) {
    let d = new Date(minDate);
    const end = new Date(maxDate);
    while (d <= end) {
      dateRange.push(formatDate(d));
      d.setDate(d.getDate() + 1);
    }
  }

  // Prepare data for chart: every day in range, hours (0 if none)
  const voiceLineData = dateRange.map(date => ({
    date,
    hours: +( (voiceByDate[date] || 0) / 60 ).toFixed(2)
  }));

  // Calculate total voice activity hours
  const totalVoiceMinutes = voiceSessions.reduce((sum, session) => sum + (session.minutes || 0), 0);
  const totalVoiceHours = +(totalVoiceMinutes / 60).toFixed(2);

  // Calculate average voice hours per day
  const avgVoiceHours = voiceLineData.length > 0
    ? +(voiceLineData.reduce((sum, d) => sum + d.hours, 0) / voiceLineData.length).toFixed(2)
    : 0;

  return (
    <div>
      <h3>Voice Activity Over Time</h3>
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
        <div style={{ background: '#333', color: '#fff', borderRadius: 8, padding: '1rem', minWidth: 120 }}>
          <div style={{ fontSize: 12 }}>Total Voice Activity</div>
          <div style={{ fontWeight: 'bold', fontSize: 20 }}>{totalVoiceHours} hrs</div>
        </div>
        <div style={{ background: '#333', color: '#fff', borderRadius: 8, padding: '1rem', minWidth: 120 }}>
          <div style={{ fontSize: 12 }}>Average Voice Hours</div>
          <div style={{ fontWeight: 'bold', fontSize: 20 }}>{avgVoiceHours} hrs</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={voiceLineData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="date" stroke="#fff" />
          <YAxis stroke="#fff" />
          <Tooltip wrapperStyle={{ backgroundColor: '#333', color: '#fff' }} />
          <Bar dataKey="hours" fill="#82ca9d" />
          <ReferenceLine y={avgVoiceHours} stroke="red" label={{ value: `Avg (${avgVoiceHours} hrs)`, position: 'right', fill: 'red', fontSize: 12 }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AdminVoiceActivityGraph;
