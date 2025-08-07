import React, { useEffect, useState } from "react";
import { fetchAllFleets } from "../../api/fleetApi";
import { fetchShipLogsByPatch, fetchAllShipLogs } from "../../api/fleetLogApi";

interface FleetCommandTeamProps {
  dbUser: any;
  latestPatch: string; 
  isFleetMember?: boolean; 
}

export default function FleetCommandTeam({ dbUser, latestPatch }: FleetCommandTeamProps) {
  const [fleets, setFleets] = useState<any[]>([]);
  const [fleetStats, setFleetStats] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const fleetsData = await fetchAllFleets();
        setFleets(fleetsData);

        // Use latestPatch prop, fallback to empty string if not provided
        const patch = typeof latestPatch === "string" ? latestPatch : "";
        const logs = await fetchAllShipLogs();

        // For each fleet, calculate stats from logs
        const stats = fleetsData.map(fleet => {
          const fleetLogs = logs.filter(log => log.fleet_id === fleet.id);
          const totalLogs = fleetLogs.length;
          const totalKills = fleetLogs.reduce((sum, log) => sum + (log.total_kills || 0), 0);
          const valueStolen = fleetLogs.reduce((sum, log) => sum + (log.value_stolen || 0), 0);
          const damagesValue = fleetLogs.reduce((sum, log) => sum + (log.damages_value || 0), 0);
          // Count total players engaged
          const totalPlayers = fleetLogs.reduce((sum, log) => {
            const air = Array.isArray(log.air_sub_ids) ? log.air_sub_ids.length : 0;
            const fps = Array.isArray(log.fps_sub_ids) ? log.fps_sub_ids.length : 0;
            const crew = Array.isArray(log.crew_ids) ? log.crew_ids.length : 0;
            return sum + air + fps + crew;
          }, 0);
          return {
            fleet,
            totalLogs,
            totalKills,
            valueStolen,
            damagesValue,
            totalPlayers
          };
        });
        setFleetStats(stats);
      } catch (error) {
        // handle error
      }
    }
    fetchData();
  }, [latestPatch]);

  return (
    <div>
      <h2>Fleet Stats</h2>
      {/* Quick summary of the fleet owned by dbUser */}
      {(() => {
        const ownedFleetId = dbUser?.fleet;
        let ownedFleetStat = fleetStats.find(f => f.fleet.id === ownedFleetId);
        let isNoLogs = false;
        if (!ownedFleetStat) {
          // Try to find the fleet object from fleets
          const fleet = fleets.find(f => f.id === ownedFleetId);
          if (!fleet) return null;
          ownedFleetStat = {
            fleet,
            totalLogs: 0,
            totalKills: 0,
            valueStolen: 0,
            damagesValue: 0,
            totalPlayers: 0
          };
          isNoLogs = true;
        }
        const { fleet, totalLogs, totalKills, valueStolen, damagesValue, totalPlayers } = ownedFleetStat;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, background: "#181a1b", padding: 12, borderRadius: 8 }}>
            {fleet.avatar && (
              <img src={fleet.avatar} alt="avatar" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", marginRight: 12 }} />
            )}
            <div>
              <div style={{ fontWeight: "bold", fontSize: 18 }}>{fleet.name || fleet.id}</div>
              <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                <span title="Logs" style={{ color: "#d76decff" }}>Logs: {totalLogs}</span>
                <span title="Kills" style={{ color: "#e74c3c" }}>Kills: {totalKills}</span>
                <span title="Value Stolen" style={{ color: "#f1c40f" }}>Stolen: {valueStolen}</span>
                <span title="Damages" style={{ color: "#3498db" }}>Damages: {damagesValue}</span>
                <span title="Players Engaged" style={{ color: "#2ecc71" }}>
                  Players: {isNoLogs ? "No Fleet Log Yet" : totalPlayers}
                </span>
              </div>
            </div>
          </div>
        );
      })()}
      <div>
        <h3>Fleet Stats</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Find max values for scaling bars */}
          {(() => {
            const maxLogs = Math.max(...fleetStats.map(f => f.totalLogs), 1);
            const maxKills = Math.max(...fleetStats.map(f => f.totalKills), 1);
            const maxValueStolen = Math.max(...fleetStats.map(f => f.valueStolen), 1);
            const maxDamages = Math.max(...fleetStats.map(f => f.damagesValue), 1);
            const maxPlayers = Math.max(...fleetStats.map(f => f.totalPlayers), 1);
            return fleetStats.map(({ fleet, totalLogs, totalKills, valueStolen, damagesValue, totalPlayers }) => (
              <div key={fleet.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {/* Avatar icon */}
                {fleet.avatar && (
                  <img src={fleet.avatar} alt="avatar" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", marginRight: 8 }} />
                )}
                <div style={{ minWidth: 80, fontWeight: "bold" }}>{fleet.name || fleet.id}</div>
                {/* Stat bars */}
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <div title={`Logs: ${totalLogs}`} style={{ height: 8, width: `${(totalLogs / maxLogs) * 40}px`, background: "#d76decff", borderRadius: 2 }} />
                  <div title={`Kills: ${totalKills}`} style={{ height: 8, width: `${(totalKills / maxKills) * 40}px`, background: "#e74c3c", borderRadius: 2 }} />
                  <div title={`Value Stolen: ${valueStolen}`} style={{ height: 8, width: `${(valueStolen / maxValueStolen) * 40}px`, background: "#f1c40f", borderRadius: 2 }} />
                  <div title={`Damages: ${damagesValue}`} style={{ height: 8, width: `${(damagesValue / maxDamages) * 40}px`, background: "#3498db", borderRadius: 2 }} />
                  <div title={`Players Engaged: ${totalPlayers}`} style={{ height: 8, width: `${(totalPlayers / maxPlayers) * 40}px`, background: "#2ecc71", borderRadius: 2 }} />
                </div>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}
