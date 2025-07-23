
import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

interface PieData {
  name: string;
  value: number;
}

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
}

interface AdminPieChartProps {
  data: PieData[];
  usersWithData: UserWithData[];
}

const COLORS = ["#e02323", "#8884d8", "#4fd339", "#82ca9d", "#ffc658", "#ff7300", "#00c49a", "#0088fe"];


const AdminPieChart: React.FC<AdminPieChartProps> = ({ usersWithData }) => {
  // Aggregate counts from usersWithData
  const fleetLogsCount = usersWithData.reduce((sum, u) => sum + (Array.isArray(u.fleetLogs) ? u.fleetLogs.length : 0), 0);
  const recentGatheringsCount = usersWithData.reduce((sum, u) => sum + (Array.isArray(u.recentGatherings) ? u.recentGatherings.length : 0), 0);
  const hitTrackersCount = usersWithData.reduce((sum, u) => sum + (Array.isArray(u.hitTrackers) ? u.hitTrackers.length : 0), 0);

  const donutData = [
    { name: "Fleet Logs", value: fleetLogsCount },
    { name: "Recent Gatherings", value: recentGatheringsCount },
    { name: "Hit Trackers", value: hitTrackersCount },
  ];

  // Custom legend renderer for center placement
  const renderCenteredLegend = () => (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'transparent',
        borderRadius: '12px',
        padding: '24px 32px',
        zIndex: 2,
        minWidth: '180px',
        textAlign: 'center',
      }}
    >
      {donutData.map((entry, idx) => (
        <div key={entry.name} style={{ display: 'flex', alignItems: 'center', marginBottom: 8, justifyContent: 'center' }}>
          <span style={{ display: 'inline-block', width: 18, height: 18, background: COLORS[idx % COLORS.length], borderRadius: '50%', marginRight: 10 }} />
          <span style={{ fontWeight: 500 }}>{entry.name}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ position: 'relative', width: '100%', height: 800 }}>
      <ResponsiveContainer width="100%" height={800}>
        <PieChart>
          <Pie
            data={donutData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={180}
            outerRadius={300}
            label
          >
            {donutData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip wrapperStyle={{ backgroundColor: '#333', color: '#fff' }} />
        </PieChart>
      </ResponsiveContainer>
      {renderCenteredLegend()}
    </div>
  );
};

export default AdminPieChart;
