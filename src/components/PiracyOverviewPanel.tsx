import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LineChart, Line } from 'recharts';
import { fetchOrgOverviewSummaryByPatch } from '../api/hittrackerApi';

interface OverviewPanelProps {
  gameVersion: string | null;
}

const OverviewPanel: React.FC<OverviewPanelProps> = ({ gameVersion }) => {
  const [overviewAll, setOverviewAll] = useState<any | null>(null);
  const [overviewPatch, setOverviewPatch] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      setLoading(true);
      try {
        const data = await fetchOrgOverviewSummaryByPatch();
        // Find the "ALL" entry for overall stats
        const allEntry = data.find((entry: any) => entry.patch?.toUpperCase() === "ALL");
        // Find the patch-specific entry
        const patchEntry = gameVersion
          ? data.find((entry: any) => entry.patch === gameVersion)
          : null;
        setOverviewAll(allEntry || null);
        setOverviewPatch(patchEntry || null);
      } catch {
        setOverviewAll(null);
        setOverviewPatch(null);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, [gameVersion]);

  // Prepare chart data for hits over time (patch-specific)
  const buildChartData = (hitTimes: any) => {
    let chartData: { date: string; count: number }[] = [];
    if (hitTimes) {
      try {
        const parsed = Array.isArray(hitTimes) ? hitTimes : JSON.parse(hitTimes);
        const counts: { [date: string]: number } = {};
        parsed.forEach((iso: string) => {
          const date = new Date(iso).toISOString().slice(0, 10);
          counts[date] = (counts[date] || 0) + 1;
        });
        chartData = Object.entries(counts).map(([date, count]) => ({ date, count }));
        chartData.sort((a, b) => a.date.localeCompare(b.date));
      } catch {
        chartData = [];
      }
    }
    return chartData;
  };

  const chartDataPatch = buildChartData(overviewPatch?.hit_times);
  const chartDataAll = buildChartData(overviewAll?.hit_times);

  return (
    <div className="overview-panel">
      <h2>Overview</h2>
      {loading ? (
        <div>Loading...</div>
      ) : !overviewAll ? (
        <div>No data available.</div>
      ) : (
        <>
          <div className="statistics">
            <div>
              <strong>Total Value Stolen:</strong>
              <br />
              {Number(overviewAll.total_value).toLocaleString()} aUEC
            </div>
            <div>
              <strong>Total Value Stolen (This Patch):</strong>
              <br />
              {Number(overviewPatch?.total_value ?? 0).toLocaleString()} aUEC
            </div>
            <div>
              <strong>Total SCU Stolen:</strong>
              <br />
              {Number(overviewAll.total_scu).toLocaleString()} SCU
            </div>
            <div>
              <strong>Total SCU Stolen (This Patch):</strong>
              <br />
              {Number(overviewPatch?.total_scu ?? 0).toLocaleString()} SCU
            </div>
            <div>
              <strong>Total Air Piracy Hits:</strong> {overviewAll.air_total}
            </div>
            <div>
              <strong>Air Piracy Hits (This Patch):</strong> {overviewPatch?.air_total ?? 0}
            </div>
            <div>
              <strong>Total Ground Piracy Hits:</strong> {overviewAll.ground_total}
            </div>
            <div>
              <strong>Ground Piracy Hits (This Patch):</strong> {overviewPatch?.ground_total ?? 0}
            </div>
            <div>
              <strong>Total Mixed Piracy Hits:</strong> {overviewAll.mixed_total}
            </div>
            <div>
              <strong>Mixed Piracy Hits (This Patch):</strong> {overviewPatch?.mixed_total ?? 0}
            </div>
            <div>
              <strong>Total Extortion Hits:</strong> {overviewAll.extortion_total}
            </div>
            <div>
              <strong>Extortion Hits (This Patch):</strong> {overviewPatch?.extortion_total ?? 0}
            </div>
            <div>
              <strong>Total Brute Force Hits:</strong> {overviewAll.brute_force_total}
            </div>
            <div>
              <strong>Brute Force Hits (This Patch):</strong> {overviewPatch?.brute_force_total ?? 0}
            </div>
          </div>
          <div className="hits-graph" style={{ marginTop: '2rem' }}>
            <h3>Hits ({gameVersion || "Patch"})</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartDataPatch}>
                <CartesianGrid stroke="#333" />
                <XAxis dataKey="date" stroke="#aaa" />
                <YAxis allowDecimals={false} stroke="#aaa" />
                <Tooltip />
                <Bar dataKey="count" fill="#4fa3ff" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="hits-graph" style={{ marginTop: '2rem' }}>
            <h3>Hits (total)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartDataAll}>
                <CartesianGrid stroke="#333" />
                <XAxis dataKey="date" stroke="#aaa" />
                <YAxis allowDecimals={false} stroke="#aaa" />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#ffb14f" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default OverviewPanel;