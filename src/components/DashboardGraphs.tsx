import React, { useEffect, useState } from "react";
import { fetchHitEntryCount, fetchTotalValueStolenSum } from "../api/hittrackerApi";
import {
  fetchACGameModeCount,
  fetchPUGameModeCount,
  fetchShipKillCount,
  fetchFPSKillCount,
  fetchTotalValueDestroyedSum, // <-- Import the correct function
} from "../api/blackboxApi";
import { set } from "date-fns";

const DashboardGraphs: React.FC = () => {
  const [acKills, setAcKills] = useState<number>(0);
  const [puKills, setPuKills] = useState<number>(0);
  const [shipKills, setShipKills] = useState<number>(0);
  const [fpsKills, setFpsKills] = useState<number>(0);
  const [totalHits, setTotalHits] = useState<number>(0);
  const [totalValueStolen, setTotalValueStolen] = useState<number>(0);
  const [totalValueDestroyed, setTotalValueDestroyed] = useState<number>(0);

  useEffect(() => {
    fetchACGameModeCount().then(setAcKills);
    fetchPUGameModeCount().then(setPuKills);
    fetchShipKillCount().then(setShipKills);
    fetchFPSKillCount().then(setFpsKills);
    fetchHitEntryCount().then(setTotalHits);
    fetchTotalValueStolenSum().then(setTotalValueStolen); // Stolen
    fetchTotalValueDestroyedSum().then(setTotalValueDestroyed);    // Destroyed
  }, []);

  // Format numbers with commas
  const formatNumber = (num: number) => num.toLocaleString();
  const formatValue = (num: number) => Math.floor(num).toLocaleString();

  return (
    <div className="recent-other-hits">
      <h2>Org Stats</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <strong>AC Kills</strong>
          <div>{formatNumber(acKills)}</div>
        </div>
        <div className="stat-card">
          <strong>PU Kills</strong>
          <div>{formatNumber(puKills)}</div>
        </div>
        <div className="stat-card">
          <strong>Ship Kills</strong>
          <div>{formatNumber(shipKills)}</div>
        </div>
        <div className="stat-card">
          <strong>FPS Kills</strong>
          <div>{formatNumber(fpsKills)}</div>
        </div>
        <div className="stat-card">
          <strong>Total Hits</strong>
          <div>{formatNumber(totalHits)}</div>
        </div>
        <div className="stat-card">
          <strong>Total Value Stolen</strong>
          <div>{formatValue(totalValueStolen)} aUEC</div>
        </div>
        <div className="stat-card">
          <strong>Total Value Destroyed</strong>
          <div>${formatValue(totalValueDestroyed)}</div>
        </div>
      </div>
    </div>
  );
};

export default DashboardGraphs;