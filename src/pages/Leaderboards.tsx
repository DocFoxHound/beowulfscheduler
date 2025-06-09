import React, { useEffect, useState } from "react";
import { fetchSBAllPlayerSummaries } from "../api/leaderboardApi";
import { fetchPiracyLeaderboardByPatchEnriched } from "../api/leaderboardPiracyApi";
import { fetchBlackboxLeaderboardByPatchEnriched } from "../api/leaderboardBlackboxApi";
import { fetchFleetlogLeaderboardByPatchEnriched } from "../api/leaderboardFleetlogApi";
import { getAllGameVersions } from "../api/patchApi";
import { SBLeaderboardPlayerSummary } from "../types/sb_leaderboard_summary";
import Navbar from "../components/Navbar";
import LeaderboardTable, { LeaderboardColumn } from "../components/LeaderboardTable";
import { computeRankingScore } from "../utils/sb_ranking_function";
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';
import sbColumns from "../columns/dogfightingColumns";
import piracyColumns from "../columns/piracyColumns";
import killTrackerColumns from "../columns/killTrackerColumns";
import fleetColumns from "../columns/fleetColumns"; // Assuming you have a fleetColumns file

const PAGE_SIZE = 100;

type LeaderboardMode = "dogfighting" | "piracy" | "killtracker" | "fleets";

const Leaderboards: React.FC = () => {
  const [mode, setMode] = useState<LeaderboardMode>("dogfighting");
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
  const [page, setPage] = useState(0);

  // Patch selector state
  const [patches, setPatches] = useState<string[]>([]);
  const [selectedPatch, setSelectedPatch] = useState<string>("");

  // Load patch options on mount
  useEffect(() => {
    getAllGameVersions().then((versions) => {
      // Sort versions descending (e.g., 4.1 > 4.0 > 3.23)
      const sorted = versions
        .map(v => v.version)
        .sort((a, b) => parseFloat(b) - parseFloat(a));
      setPatches(sorted);
      setSelectedPatch(sorted[0] || "");
    });
  }, []);

  // Fetch data based on mode and selectedPatch
  useEffect(() => {
    if (!selectedPatch && mode === "piracy") return;
    setLoading(true);
    setSelectedPlayer(null);
    setPage(0);

    if (mode === "dogfighting") {
      fetchSBAllPlayerSummaries()
        .then((data) => {
          const withScores = data.map((player: any) => ({
            ...player,
            ranking_score: (computeRankingScore(player, data)*100),
          }));
          const sorted = [...withScores].sort((a, b) => a.avg_rank - b.avg_rank);
          setPlayers(sorted);
        })
        .finally(() => setLoading(false));
    } else if (mode === "piracy") {
      fetchPiracyLeaderboardByPatchEnriched(selectedPatch)
        .then((data) => {
          const sorted = [...data].sort((a, b) => b.total_value - a.total_value);
          setPlayers(sorted);
        })
        .finally(() => setLoading(false));
    } else if (mode === "killtracker") {
      fetchBlackboxLeaderboardByPatchEnriched(selectedPatch)
        .then((data) => {
          const sorted = [...data].sort((a, b) => b.fps_kills_total - a.fps_kills_total);
          setPlayers(sorted);
        })
        .finally(() => setLoading(false));
    } else if (mode === "fleets") {
      fetchFleetlogLeaderboardByPatchEnriched(selectedPatch)
        .then((data) => {
          const sorted = [...data].sort((a, b) => b.total_activity - a.total_activity);
          setPlayers(sorted);
        })
        .finally(() => setLoading(false));
    }
  }, [mode, selectedPatch]);

  // Pagination logic
  const pageCount = Math.ceil(players.length / PAGE_SIZE);
  const pagedPlayers = players.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [selectedPlayer, players]);

  // Choose columns based on mode
  const columns =
    mode === "dogfighting"
      ? sbColumns
      : mode === "piracy"
      ? piracyColumns
      : mode === "killtracker"
      ? killTrackerColumns
      : mode === "fleets"
      ? fleetColumns
      : [];

  // Patch selector UI
  const patchSelector = (
    <div style={{ marginLeft: 24, marginRight: 24 }}>
      <label htmlFor="patch-select" style={{ color: "#fff", marginRight: 8, fontWeight: 500 }}>
        Patch:
      </label>
      <select
        id="patch-select"
        value={selectedPatch}
        onChange={e => setSelectedPatch(e.target.value)}
        disabled={mode === "dogfighting"}
        style={{
          padding: "0.5rem 1rem",
          borderRadius: 8,
          border: "1px solid #444",
          background: mode === "dogfighting" ? "#444" : "#23272a",
          color: "#fff",
          fontSize: 16,
          opacity: mode === "dogfighting" ? 0.5 : 1,
          cursor: mode === "dogfighting" ? "not-allowed" : "pointer",
        }}
      >
        {patches.map(patch => (
          <option key={patch} value={patch}>{patch}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="leaderboards-root" style={{ minHeight: "100vh", background: "#181a1b" }}>
      <Navbar />
      <main className="dashboard-content">
        <section className="dashboard-header" style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1>Leaderboards</h1>
          <p>
            {mode === "dogfighting" && (
              <>Players sorted by <b>CiG Rating</b> (highest first)</>
            )}
            {mode === "piracy" && (
              <>Players sorted by <b>Total Value</b> (highest first)</>
            )}
            {mode === "killtracker" && (
              <>Players sorted by <b>FPS Kills (Total)</b> (highest first)</>
            )}
            {mode === "fleets" && (
              <>Players sorted by <b>Total Fleet Activity</b> (highest first)</>
            )}
          </p>
        </section>
        {/* View option buttons */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "2rem", marginBottom: "1.5rem" }}>
          <button
            onClick={() => setMode("dogfighting")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: mode === "dogfighting" ? "#2d7aee" : "#23272a",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "1rem 2rem",
              cursor: "pointer",
              boxShadow: mode === "dogfighting" ? "0 2px 8px #2d7aee88" : "0 2px 8px #0008",
              minWidth: 160,
              transition: "background 0.2s",
            }}
          >
            <img src="https://i.imgur.com/9wMuyX1.png" alt="Dogfighting" style={{ width: 48, height: 48, marginBottom: 8 }} />
            <span style={{ fontSize: 20, fontWeight: 700 }}>Squadron Battle</span>
          </button>
          <button
            onClick={() => setMode("fleets")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: mode === "fleets" ? "#2d7aee" : "#23272a",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "1rem 2rem",
              cursor: "pointer",
              boxShadow: mode === "fleets" ? "0 2px 8px #2d7aee88" : "0 2px 8px #0008",
              minWidth: 160,
              transition: "background 0.2s",
            }}
          >
            <img src="https://i.imgur.com/O6TpgjD.png" alt="Fleets" style={{ width: 48, height: 48, marginBottom: 8 }} />
            <span style={{ fontSize: 20, fontWeight: 700 }}>Fleets</span>
          </button>
          <button
            onClick={() => setMode("piracy")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: mode === "piracy" ? "#2d7aee" : "#23272a",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "1rem 2rem",
              cursor: "pointer",
              boxShadow: mode === "piracy" ? "0 2px 8px #2d7aee88" : "0 2px 8px #0008",
              minWidth: 160,
              transition: "background 0.2s",
            }}
          >
            <img src="https://i.imgur.com/FNBpkfz.png" alt="Piracy" style={{ width: 48, height: 48, marginBottom: 8 }} />
            <span style={{ fontSize: 20, fontWeight: 700 }}>Piracy</span>
          </button>
          <button
            onClick={() => setMode("killtracker")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: mode === "killtracker" ? "#2d7aee" : "#23272a",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "1rem 2rem",
              cursor: "pointer",
              boxShadow: mode === "killtracker" ? "0 2px 8px #2d7aee88" : "0 2px 8px #0008",
              minWidth: 160,
              transition: "background 0.2s",
            }}
          >
            <img src="https://i.imgur.com/UoZsrrM.png" alt="Kill Tracker" style={{ width: 48, height: 48, marginBottom: 8 }} />
            <span style={{ fontSize: 20, fontWeight: 700 }}>Kill Tracker</span>
          </button>
        </div>
        {/* Patch selector below the buttons */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
          {patchSelector}
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <LeaderboardTable
            data={players}
            loading={loading}
            selectedRow={selectedPlayer}
            pagedData={pagedPlayers}
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
            pageSize={PAGE_SIZE}
            columns={columns}
          />
        </div>
      </main>
      {/* IronPoint Rating Explanation Card */}
      {mode === "dogfighting" && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: "2rem", marginBottom: "2rem" }}>
          <div style={{ background: "#23272a", borderRadius: "12px", boxShadow: "0 2px 8px #0008", padding: "1.5rem", maxWidth: "800px", color: "#fff" }}>
            <h2 style={{ marginTop: 0 }}>🏆 IronPoint Score Equation</h2>
            <BlockMath math={`
              \\text{Score} = 0.30E + 0.25I + 0.20D + 0.15KDR + 0.10K
            `} />
            <BlockMath math={`
              \\text{normalized}(x) = \\frac{x - \\min(x)}{\\max(x) - \\min(x)}
            `} />
            <p>
              This formula ranks pilots based on efficiency, impact, consistent damage output, survival, and kill contribution:
            </p>
            <ul style={{ marginLeft: "1.5rem" }}>
              <li><strong>E</strong>: Average score per minute (normalized)</li>
              <li><strong>I</strong>: Average score per round (normalized)</li>
              <li><strong>D</strong>: Damage per kill (normalized)</li>
              <li><strong>KDR</strong>: Kill/Death ratio (normalized)</li>
              <li><strong>K</strong>: Total kills (normalized)</li>
            </ul>
            <h3 style={{ marginTop: "2rem" }}>📊 Explanation</h3>
            <p>
              This ranking formula is designed to measure true player performance in dogfighting by combining several metrics:
            </p>
            <ul style={{ marginLeft: "1.5rem" }}>
              <li>
                <strong>avg_score_minute (E)</strong> rewards players who earn points efficiently over time, rewarding aggressive behavior.
              </li>
              <li>
                <strong>avg_score (I)</strong> emphasizes high-impact gameplay by factoring in kill difficulty, damage, and round performance.
              </li>
              <li>
                <strong>damage_per_kill (D)</strong> discourages kill-stealing by valuing consistent damage over opportunistic kills.
              </li>
              <li>
                <strong>avg_kill_death_ratio (KDR)</strong> rewards players who maintain a good balance between aggression and survival.
              </li>
              <li>
                <strong>total_kills (K)</strong> has minimal weight, recognizing raw output while avoiding overinflation from farming.
              </li>
            </ul>
            <p>
              The weights are tuned to ensure balanced scoring across play styles, encouraging aggressive but efficient, impactful play rather than passive or opportunistic strategies.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboards;