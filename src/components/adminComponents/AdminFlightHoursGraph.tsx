
import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

interface AdminFlightHoursGraphProps {
  usersWithData: any[];
}

const AdminFlightHoursGraph: React.FC<AdminFlightHoursGraphProps> = ({ usersWithData }) => {
  // Helper to parse flight_time (object or string) to total seconds
  function parseFlightTime(val: any): number {
    if (!val) return 0;
    if (typeof val === 'object' && val !== null) {
      // { hours, minutes, seconds, milliseconds }
      const h = Number(val.hours) || 0;
      const m = Number(val.minutes) || 0;
      const s = Number(val.seconds) || 0;
      const ms = Number(val.milliseconds) || 0;
      return h * 3600 + m * 60 + s + ms / 1000;
    }
    if (typeof val === 'string') {
      const parts = val.split(":");
      if (parts.length < 3) return 0;
      const hours = parseInt(parts[0], 10) || 0;
      const minutes = parseInt(parts[1], 10) || 0;
      const seconds = parseFloat(parts[2]) || 0;
      return hours * 3600 + minutes * 60 + seconds;
    }
    return 0;
  }

  const flightTimeByDate: Record<string, number> = {};
  if (usersWithData.length === 1) {
    // Single user: for each day, show only the last .flight_time entry for that day
    const user = usersWithData[0];
    if (Array.isArray(user.sbLogEntries)) {
      // Collect all dates
      const allDatesSet = new Set<string>();
      user.sbLogEntries.forEach((log: { created_at: any; }) => {
        const dateRaw = log.created_at;
        if (!dateRaw || isNaN(Number(dateRaw))) return;
        const date = new Date(Number(dateRaw)).toISOString().slice(0, 10);
        allDatesSet.add(date);
      });
      const allDates = Array.from(allDatesSet).sort();
      allDates.forEach(date => {
        // Find the latest log for this user on this date
        const logsForDate = user.sbLogEntries.filter((log: { created_at: any; }) => {
          const logDate = new Date(Number(log.created_at)).toISOString().slice(0, 10);
          return logDate === date;
        });
        if (logsForDate.length > 0) {
          const latestLog = logsForDate.reduce((a: any, b: any) => Number(a.created_at) > Number(b.created_at) ? a : b);
          flightTimeByDate[date] = parseFlightTime(latestLog.flight_time);
        }
      });
    }
  } else {
    // Multiple users: for each day, sum the latest .flight_time per user
    // Collect all dates from all logs
    const allDatesSet = new Set<string>();
    usersWithData.forEach(user => {
      if (Array.isArray(user.sbLogEntries)) {
        user.sbLogEntries.forEach((log: { created_at: any; }) => {
          const dateRaw = log.created_at;
          if (!dateRaw || isNaN(Number(dateRaw))) return;
          const date = new Date(Number(dateRaw)).toISOString().slice(0, 10);
          allDatesSet.add(date);
        });
      }
    });
    const allDates = Array.from(allDatesSet).sort();
    allDates.forEach(date => {
      let dailyTotal = 0;
      usersWithData.forEach(user => {
        if (Array.isArray(user.sbLogEntries)) {
          // Find the latest log for this user on this date
          const logsForDate = user.sbLogEntries.filter((log: { created_at: any; }) => {
            const logDate = new Date(Number(log.created_at)).toISOString().slice(0, 10);
            return logDate === date;
          });
          if (logsForDate.length > 0) {
            const latestLog = logsForDate.reduce((a: any, b: any) => Number(a.created_at) > Number(b.created_at) ? a : b);
            dailyTotal += parseFlightTime(latestLog.flight_time);
          }
        }
      });
      flightTimeByDate[date] = dailyTotal;
    });
  }

  // Convert to array for recharts
  // Also, convert totalFlightTime (seconds) to hours:minutes for display
  const flightTimeChartData = Object.entries(flightTimeByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, totalFlightTime]) => ({ date, totalFlightTime }));

  // Helper to format seconds as "Hh Mm"
  function formatSecondsToHM(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={flightTimeChartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis
          tickFormatter={formatSecondsToHM}
          label={{ value: 'Total Flight Time (h m)', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip formatter={(value) => formatSecondsToHM(Number(value))} />
        <Legend />
        <Line type="monotone" dataKey="totalFlightTime" stroke="#82ca9d" name="Total Flight Time" activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default AdminFlightHoursGraph;
