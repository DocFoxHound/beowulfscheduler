import React, { useEffect, useState } from "react";
import { fetchAllPlayerSummaries } from "../api/leaderboardApi";
import { SBLeaderboardPlayerSummary } from "../types/sb_leaderboard_summary";
import Navbar from "../components/Navbar";
import LeaderboardTable, { LeaderboardColumn } from "../components/LeaderboardTable";
import { computeRankingScore } from "../utils/sb_ranking_function";
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

const PAGE_SIZE = 100;

const Leaderboards: React.FC = () => {
  const [players, setPlayers] = useState<(SBLeaderboardPlayerSummary & { ranking_score: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<(SBLeaderboardPlayerSummary & { ranking_score: number }) | null>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetchAllPlayerSummaries()
      .then((data) => {
        // Compute ranking score for each player
        const withScores = data.map(player => ({
          ...player,
          ranking_score: computeRankingScore(player, data),
        }));
        // Sort by avg_rank ascending (lowest/best at the top)
        const sorted = [...withScores].sort((a, b) => a.avg_rank - b.avg_rank);
        setPlayers(sorted);
      })
      .finally(() => setLoading(false));
  }, []);

  // Pagination logic
  const pageCount = Math.ceil(players.length / PAGE_SIZE);
  const pagedPlayers = players.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page when selectedPlayer changes or players change
  useEffect(() => {
    setPage(0);
  }, [selectedPlayer, players]);

  const sbColumns: LeaderboardColumn<SBLeaderboardPlayerSummary & { ranking_score: number }>[] = [
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
            title={row.symbol} // Tooltip on hover
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

  return (
    <div className="leaderboards-root" style={{ minHeight: "100vh", background: "#181a1b" }}>
      <Navbar />
      <main className="dashboard-content">
        <section className="dashboard-header" style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1>Leaderboards</h1>
          <p>Players sorted by <b>avg_rank</b> (highest first)</p>
        </section>
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
            columns={sbColumns}
          />
        </div>
      </main>
      {/* IronPoint Rating Explanation Card */}
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
    </div>
  );
};

export default Leaderboards;