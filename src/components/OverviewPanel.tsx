import React from 'react';
import { Hit } from '../types/hittracker';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

interface OverviewPanelProps {
  recentHits: Hit[];
  pirateHits: Hit[];
  assistHits: Hit[];
  gameVersion: string | null;
}

const OverviewPanel: React.FC<OverviewPanelProps> = ({ recentHits, pirateHits, assistHits, gameVersion }) => {
  // Total counts
  const totalPirateHits = pirateHits.length;
  const totalAssistHits = assistHits.length;

  // This patch
  const pirateHitsThisPatch = gameVersion
    ? pirateHits.filter(hit => hit.patch === gameVersion)
    : [];
  const assistHitsThisPatch = gameVersion
    ? assistHits.filter(hit => hit.patch === gameVersion)
    : [];

  const totalPirateHitsThisPatch = pirateHitsThisPatch.length;
  const totalAssistHitsThisPatch = assistHitsThisPatch.length;

  // Total value stolen (sum total_cut_value of all pirate hits)
  const totalValueStolen = pirateHits.reduce((sum, hit) => sum + (hit.total_cut_value || 0), 0);

  // Total value stolen this patch
  const totalValueStolenThisPatch = pirateHitsThisPatch.reduce((sum, hit) => sum + (hit.total_cut_value || 0), 0);

  // Total air piracy hits
  const totalAirPiracyHits = pirateHits.filter(hit => hit.air_or_ground === 'air').length;

  // Total ground piracy hits
  const totalGroundPiracyHits = pirateHits.filter(hit => hit.air_or_ground === 'ground').length;

  // Group pirate hits by date (YYYY-MM-DD)
  const hitsByDate: Record<string, number> = {};
  pirateHits.forEach(hit => {
    const date = new Date(hit.id ? parseInt(hit.id, 10) : Date.now());
    const dateStr = date.toISOString().slice(0, 10);
    hitsByDate[dateStr] = (hitsByDate[dateStr] || 0) + 1;
  });

  // All-time chart data
  const chartDataAll = Object.entries(hitsByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  // Last 3 months chart data
  const today = new Date();
  const threeMonthsAgo = new Date(today);
  threeMonthsAgo.setDate(today.getDate() - 90);

  const chartDataThreeMonths = chartDataAll.filter(d => {
    const dDate = new Date(d.date);
    return dDate >= threeMonthsAgo && dDate <= today;
  });

  return (
    <div className="overview-panel">
      <h2>Overview</h2>
      <div className="statistics">
        <div><strong>Total Pirate Hits:</strong> {totalPirateHits}</div>
        <div><strong>Total Assist Hits:</strong> {totalAssistHits}</div>
        <div><strong>Total Pirate Hits (This Patch):</strong> {totalPirateHitsThisPatch}</div>
        <div><strong>Total Assist Hits (This Patch):</strong> {totalAssistHitsThisPatch}</div>
        <div><strong>Total Value Stolen:</strong> {totalValueStolen.toLocaleString()} aUEC</div>
        <div><strong>Total Value Stolen (This Patch):</strong> {totalValueStolenThisPatch.toLocaleString()} aUEC</div>
        <div><strong>Total Air Piracy Hits:</strong> {totalAirPiracyHits}</div>
        <div><strong>Total Ground Piracy Hits:</strong> {totalGroundPiracyHits}</div>
      </div>
      <div className="hits-graph" style={{ marginTop: '2rem' }}>
        <h3>Hits Over Time (All Time)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartDataAll}>
            <CartesianGrid stroke="#333" />
            <XAxis dataKey="date" stroke="#aaa" />
            <YAxis allowDecimals={false} stroke="#aaa" />
            <Tooltip />
            <Bar dataKey="count" fill="#4fa3ff" />
          </BarChart>
        </ResponsiveContainer>
        <h3 style={{ marginTop: '2rem' }}>Hits Over Time (Last 3 Months)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartDataThreeMonths}>
            <CartesianGrid stroke="#333" />
            <XAxis dataKey="date" stroke="#aaa" />
            <YAxis allowDecimals={false} stroke="#aaa" />
            <Tooltip />
            <Bar dataKey="count" fill="#ffb14f" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default OverviewPanel;