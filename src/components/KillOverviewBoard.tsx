import React, { useEffect, useState } from "react";
import { fetchBlackBoxsByUserIdPatchGameMode } from "../api/blackboxApi";
import { BlackBox } from "../types/blackbox";

interface KillOverviewBoardProps {
  userId: string;
  patch: string;
}

const KillOverviewBoard: React.FC<KillOverviewBoardProps> = ({ userId, patch }) => {
  const [kills, setKills] = useState<BlackBox[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKills = async () => {
      setLoading(true);
      try {
        const data = await fetchBlackBoxsByUserIdPatchGameMode(userId, patch, "PU");
        setKills(data || []);
      } catch {
        setKills([]);
      } finally {
        setLoading(false);
      }
    };
    if (userId && patch) fetchKills();
  }, [userId, patch]);

  const totalKills = kills.length;
  const fpsKills = kills.filter(k => k.ship_killed === "FPS").length;
  const shipKills = kills.filter(k => k.ship_killed !== "FPS").length;
  const totalDamage = kills.reduce((sum, k) => sum + (Number(k.value) || 0), 0);

  return (
    <div style={{ padding: 16 }}>
      <h2>Kill Overview</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <div className="kill-metric-card">Total Kills: <b>{totalKills}</b></div>
            <div className="kill-metric-card">FPS Kills: <b>{fpsKills}</b></div>
            <div className="kill-metric-card">Ship Kills: <b>{shipKills}</b></div>
            <div className="kill-metric-card">Total Damages Done: <b>{totalDamage}</b></div>
          </div>
          <div>
            <h3>Recent Kills</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {kills.slice(0, 6).map((kill) => (
                <div key={kill.id} className="kill-card" style={{
                  border: "1px solid #2d7aee",
                  borderRadius: 8,
                  padding: 12,
                  background: "#23272a"
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>{kill.victims}</span>
                    <span
                      style={{
                        color: kill.ship_killed === "FPS" ? "#ff3b3b" : "#2d7aee",
                        fontWeight: 600,
                        marginLeft: 8
                      }}
                    >
                      {kill.ship_killed}
                    </span>
                  </div>
                  <div>{new Date(kill.timestamp).toLocaleString()}</div>
                </div>
              ))}
              {kills.length === 0 && <div>No kills found.</div>}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default KillOverviewBoard;