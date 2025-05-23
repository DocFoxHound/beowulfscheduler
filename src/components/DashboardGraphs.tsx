import React, { useEffect, useState } from "react";
import { fetchRecentOtherHits } from "../api/hittrackerApi";
import { getLatestPatch } from "../api/patchApi";
import { fetchAllBlackBoxs } from "../api/blackboxApi";
import { Hit } from "../types/hittracker";
import { BlackBox } from "../types/blackbox";

interface FleetStats {
  name: string;
  activity: number;
  kills: number;
  value: number;
}

const DashboardGraphs: React.FC = () => {
  const [hits, setHits] = useState<Hit[]>([]);
  const [blackboxes, setBlackboxes] = useState<BlackBox[]>([]);
  const [latestPatch, setLatestPatch] = useState<string | null>(null);
  const [fleetStats, setFleetStats] = useState<FleetStats[]>([]);

  useEffect(() => {
    getLatestPatch().then((patch) => setLatestPatch(patch.version));
  }, []);

  useEffect(() => {
    if (latestPatch) {
      fetchRecentOtherHits().then((data) => {
        const filtered = data.filter((hit) => hit.patch === latestPatch);
        setHits(filtered);

        // // Calculate fleet stats (from hits)
        // const fleetMap: Record<string, FleetStats> = {};
        // filtered.forEach((hit) => {
        //   const fleet = hit.fleet_name || "Unknown";
        //   if (!fleetMap[fleet]) {
        //     fleetMap[fleet] = { name: fleet, activity: 0, kills: 0, value: 0 };
        //   }
        //   fleetMap[fleet].activity += 1;
        //   fleetMap[fleet].kills += hit.kills || 0;
        //   fleetMap[fleet].value += hit.total_cut_value || 0;
        // });
        // setFleetStats(Object.values(fleetMap));
      });

      fetchAllBlackBoxs().then((data) => {
        setBlackboxes(data.filter((bb) => bb.patch === latestPatch));
      });
    }
  }, [latestPatch]);

  // Org-wide kill stats from BlackBox
  const acKills = blackboxes.filter((b) => b.game_mode === "AC").reduce((sum, b) => sum + (b.kill_count || 0), 0);
  const puKills = blackboxes.filter((b) => b.game_mode === "PU").reduce((sum, b) => sum + (b.kill_count || 0), 0);
  const shipKills = blackboxes.filter((b) => b.ship_killed && b.game_mode === "PU").reduce((sum, b) => sum + (b.kill_count || 0), 0);
  const fpsKills = blackboxes.filter((b) => b.ship_killed === "FPS" || b.game_mode === "FPS").reduce((sum, b) => sum + (b.kill_count || 0), 0);

  // Org-wide hit stats from Hit
  const totalHits = hits.length;
  const totalValue = hits.reduce((sum, h) => sum + (h.total_cut_value || 0), 0);

  // Top fleets (from hits)
  // const topFleetByActivity = [...fleetStats].sort((a, b) => b.activity - a.activity)[0];
  // const topFleetByKills = [...fleetStats].sort((a, b) => b.kills - a.kills)[0];
  // const topFleetByValue = [...fleetStats].sort((a, b) => b.value - a.value)[0];

  return (
    <div className="recent-other-hits">
      <h2>Org Stats (Latest Patch)</h2>
      <div className="stats-grid">
        <div className="stat-card"><strong>AC Kills</strong><div>{acKills}</div></div>
        <div className="stat-card"><strong>PU Kills</strong><div>{puKills}</div></div>
        <div className="stat-card"><strong>Ship Kills</strong><div>{shipKills}</div></div>
        <div className="stat-card"><strong>FPS Kills</strong><div>{fpsKills}</div></div>
        <div className="stat-card"><strong>Total Hits</strong><div>{totalHits}</div></div>
        <div className="stat-card"><strong>Total Value Stolen</strong><div>{totalValue.toLocaleString()} aUEC</div></div>
        {/* <div className="stat-card">
          <strong>Top Fleet by Activity</strong>
          <div>{topFleetByActivity ? `${topFleetByActivity.name} (${topFleetByActivity.activity})` : "N/A"}</div>
        </div>
        <div className="stat-card">
          <strong>Top Fleet by Kills</strong>
          <div>{topFleetByKills ? `${topFleetByKills.name} (${topFleetByKills.kills})` : "N/A"}</div>
        </div>
        <div className="stat-card">
          <strong>Top Fleet by Value</strong>
          <div>{topFleetByValue ? `${topFleetByValue.name} (${topFleetByValue.value.toLocaleString()} aUEC)` : "N/A"}</div>
        </div> */}
      </div>
    </div>
  );
};

export default DashboardGraphs;