import React, { useEffect, useState } from "react";
import { fetchSBAllPlayerSummaries } from "../api/leaderboardApi";
import { fetchPiracyLeaderboardByPatchEnriched } from "../api/leaderboardPiracyApi";
import { getAllGameVersions } from "../api/patchApi";
import { SBLeaderboardPlayerSummary } from "../types/sb_leaderboard_summary";
import Navbar from "../components/Navbar";
import LeaderboardTable, { LeaderboardColumn } from "../components/LeaderboardTable";
import { computeRankingScore } from "../utils/sb_ranking_function";
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

const PAGE_SIZE = 100;

type LeaderboardMode = "dogfighting" | "piracy";

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
            ranking_score: computeRankingScore(player, data),
          }));
          const sorted = [...withScores].sort((a, b) => b.ranking_score - a.ranking_score);
          setPlayers(sorted);
        })
        .finally(() => setLoading(false));
    } else {
      fetchPiracyLeaderboardByPatchEnriched(selectedPatch)
        .then((data) => {
          const sorted = [...data].sort((a, b) => b.total_value - a.total_value);
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

  // Columns for dogfighting leaderboard
  const sbColumns: LeaderboardColumn<any>[] = [
    {
      key: "rank",
      title: "#",
      align: "center",
      render: (_row, idx) => idx + 1,
    },
    {
      key: "account_media",
      title: "",
      align: "center",
      render: row =>
        row.account_media ? (
          <img
            src={row.account_media}
            alt="Account"
            style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
          />
        ) : null,
    },
    {
      key: "displayname",
      title: "Display Name",
      render: row => row.displayname,
    },
    {
      key: "org_media",
      title: "Org",
      align: "left",
      render: row =>
        row.org_media ? (
          <img
            src={row.org_media}
            alt="Org"
            title={row.symbol}
            style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
          />
        ) : null,
    },
    {
      key: "total_kills",
      title: "Kills",
      render: row =>
        row.total_kills != null
          ? Number(row.total_kills).toLocaleString()
          : "-",
      sortable: true,
      sortAccessor: row => row.total_kills,
    },
    {
      key: "total_deaths",
      title: "Deaths",
      render: row =>
        row.total_deaths != null
          ? Number(row.total_deaths).toLocaleString()
          : "-",
      sortable: true,
      sortAccessor: row => row.total_deaths,
    },
    {
      key: "avg_score",
      title: "Avg Score",
      render: row =>
        row.avg_score != null
          ? Number(row.avg_score).toLocaleString()
          : "-",
      sortable: true,
      sortAccessor: row => row.avg_score,
    },
    {
      key: "avg_rank",
      title: "Avg RSI Rank",
      render: row => row.avg_rank ?? "-",
      sortable: true,
      sortAccessor: row => row.avg_rank,
    },
    {
      key: "ranking_score",
      title: "IronPoint Score",
      render: row => row.ranking_score?.toFixed(3) ?? "-",
      sortable: true,
      sortAccessor: row => row.ranking_score,
    },
  ];

  // Columns for piracy leaderboard
  const piracyColumns: LeaderboardColumn<any>[] = [
    {
      key: "rank",
      title: "#",
      align: "center",
      render: (_row, idx) => idx + 1,
    },
    {
      key: "username",
      title: "Username",
      render: row => row.username || row.nickname || row.player_id,
    },
    {
      key: "hits_created",
      title: "Hits",
      render: row => row.hits_created ?? "-",
      sortable: true,
      sortAccessor: row => row.hits_created,
    },
    {
      key: "air_count",
      title: "Air",
      render: row => row.air_count ?? "-",
      sortable: true,
      sortAccessor: row => row.air_count,
    },
    {
      key: "ground_count",
      title: "Ground",
      render: row => row.ground_count ?? "-",
      sortable: true,
      sortAccessor: row => row.ground_count,
    },
    {
      key: "mixed_count",
      title: "Mixed",
      render: row => row.mixed_count ?? "-",
      sortable: true,
      sortAccessor: row => row.mixed_count,
    },
    {
      key: "brute_force_count",
      title: "Brute Force",
      render: row => row.brute_force_count ?? "-",
      sortable: true,
      sortAccessor: row => row.brute_force_count,
    },
    {
      key: "extortion_count",
      title: "Extortion",
      render: row => row.extortion_count ?? "-",
      sortable: true,
      sortAccessor: row => row.extortion_count,
    },
    {
      key: "total_value",
      title: "Total Value",
      render: row => row.total_value?.toLocaleString() ?? "-",
      sortable: true,
      sortAccessor: row => row.total_value,
    },
  ];

  // Choose columns based on mode
  const columns = mode === "dogfighting" ? sbColumns : piracyColumns;

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
        style={{
          padding: "0.5rem 1rem",
          borderRadius: 8,
          border: "1px solid #444",
          background: "#23272a",
          color: "#fff",
          fontSize: 16,
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
            {mode === "dogfighting"
              ? <>Players sorted by <b>IronPoint Score</b> (highest first)</>
              : <>Players sorted by <b>Total Value</b> (highest first)</>
            }
          </p>
        </section>
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
            <span style={{ fontSize: 20, fontWeight: 700 }}>Dogfighting</span>
          </button>
          {mode === "piracy" && patchSelector}
          <div style={{ flex: 1, maxWidth: 500 }} />
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
            columns={mode === "dogfighting" ? sbColumns : piracyColumns}
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