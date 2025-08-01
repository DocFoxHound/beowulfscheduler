import React, { useEffect, useState } from "react";
import { fetchNewest100FPSKillsByPatch, fetchNewest100ShipKillsByPatch } from "../api/blackboxApi";
import { BlackBox } from "../types/blackbox";
import { User } from "../types/user";

interface KillOverviewBoardProps {
  patch: string;
  allUsers: User[];
}

const PAGE_SIZE = 20;

const KillOverviewBoard: React.FC<KillOverviewBoardProps> = ({ patch, allUsers }) => {
  const [kills, setKills] = useState<BlackBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const fetchKills = async () => {
      setLoading(true);
      try {
        // Fetch both FPS and Ship kills, then combine and sort by timestamp desc
        const [fpsKills, shipKills] = await Promise.all([
          fetchNewest100FPSKillsByPatch(patch),
          fetchNewest100ShipKillsByPatch(patch)
        ]);
        const allKills = [...(fpsKills || []), ...(shipKills || [])];
        allKills.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setKills(allKills);
        setPage(0); // Reset to first page on patch change
      } catch {
        setKills([]);
      } finally {
        setLoading(false);
      }
    };
    if (patch) fetchKills();
  }, [patch]);

  // Helper to get display name from userId
  const getDisplayName = (userId: string) => {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return userId;
    return user.nickname || user.username || user.id;
  };

  const totalKills = kills.length;
  const fpsKills = kills.filter(k => k.ship_killed === "FPS").length;
  const shipKills = kills.filter(k => k.ship_killed !== "FPS").length;
  const totalDamage = kills.reduce((sum, k) => sum + (Number(k.value) || 0), 0);

  const totalPages = Math.ceil(kills.length / PAGE_SIZE);
  const paginatedKills = kills.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

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
              {paginatedKills.map((kill) => (
                <div key={kill.id} className="kill-card" style={{
                  border: "1px solid #2d7aee",
                  borderRadius: 8,
                  padding: 12,
                  background: "#23272a"
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>💀{kill.victims}</span>
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
                  <div>{getDisplayName(kill.user_id)}</div>
                </div>
              ))}
              {kills.length === 0 && <div>No kills found.</div>}
            </div>
            {/* Pagination controls */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 16 }}>
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  style={{
                    padding: "6px 18px",
                    borderRadius: 6,
                    border: "none",
                    background: "#2d7aee",
                    color: "#fff",
                    cursor: page === 0 ? "not-allowed" : "pointer",
                    opacity: page === 0 ? 0.5 : 1
                  }}
                >
                  Previous
                </button>
                <span style={{ color: "#fff", alignSelf: "center" }}>
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  style={{
                    padding: "6px 18px",
                    borderRadius: 6,
                    border: "none",
                    background: "#2d7aee",
                    color: "#fff",
                    cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
                    opacity: page >= totalPages - 1 ? 0.5 : 1
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default KillOverviewBoard;