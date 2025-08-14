import { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css";
import { getUserById, getUserRank } from "../api/userService";
import { useUserContext } from "../context/UserContext"; // <-- Import the context hook
import Navbar from "../components/Navbar";
import { fetchFleetByMember } from "../api/fleetApi";
import OrgGoals from "../components/dashboardComponents/OrgGoals";
import { fetchSBAllOrgSummaries } from "../api/leaderboardApi";
import { SBLeaderboardOrgSummary } from "../types/sb_leaderboard_org_summary";
import PlayerCard from "../components/dashboardComponents/playerCard";
import PlayerBadgeProgress from "../components/adminComponents/PlayerBadgeProgress";
import PlayerPromotionProgress from "../components/adminComponents/PlayerPromotionProgress";
import PlayerPrestigeProgress from "../components/adminComponents/PlayerPrestigeProgress";
import SpecializedTeams from "../components/dashboardComponents/SpecializedTeams";
import PlayerGangStats from "../components/gangComponents/PlayerGangStats";
import KillOverviewBoard from "../components/dashboardComponents/KillOverviewBoard";
import { fetchRecentGangsSummary } from "../api/recentGangsApi";
import { fetchPlayerStatsByUserId } from "../api/playerStatsApi";
import { fetchAllActiveBadgeReusables, fetchBadgeReusablesById } from "../api/badgeReusableApi";
import UpcomingEvents from "../components/dashboardComponents/UpcomingEvents";
import { fetchBadgesByUserId } from "../api/badgeRecordApi";

import { getAllGameVersions } from "../api/patchApi";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const { dbUser, setDbUser, userRank, setUserRank } = useUserContext(); 
  const [fleet, setFleet] = useState<any>(null); // Add fleet state

  // State for summaryData (for PlayerGangStats)
  const [summaryData, setSummaryData] = useState<any[]>([]);

  // New state for badge/progress components
  const [playerStats, setPlayerStats] = useState<any>(null);
  const [playerStatsLoading, setPlayerStatsLoading] = useState(false);
  const [activeBadgeReusables, setActiveBadgeReusables] = useState<any[]>([]);
  const [activeBadgeReusablesLoading, setActiveBadgeReusablesLoading] = useState(false);
  const [playerBadges, setPlayerBadges] = useState<any[]>([]);
  const [playerBadgesLoading, setPlayerBadgesLoading] = useState(false);
  // isModerator: true if any dbUser.roles[] matches any BLOODED_IDS
  const BLOODED_IDS = (import.meta.env.VITE_BLOODED_ID || "").split(",");
  const RONIN_IDS = (import.meta.env.VITE_RONIN_ID || "").split(",");
  const isModerator = dbUser?.roles?.some((role: string) => BLOODED_IDS.includes(role)) ?? false;
  const isRonin = dbUser?.roles?.some((role: string) => RONIN_IDS.includes(role)) ?? false;

  // State for latest patch version string
  const [latestPatch, setLatestPatch] = useState<string>("");
  // State for org summaries
  const [orgSummaries, setOrgSummaries] = useState<SBLeaderboardOrgSummary[]>([]);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_USER_URL : import.meta.env.VITE_TEST_USER_URL}`, { withCredentials: true })
      .then((res) => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (user && user.id) {
      getUserById(user.id)
        .then((data) => setDbUser(data))
        .catch(() => setDbUser(null));
    }
  }, [user, setDbUser]);

  useEffect(() => {
    if (dbUser && dbUser.id) {
      getUserRank(dbUser.rank)
        .then((data) => setUserRank(data))
        .catch(() => setUserRank(null));
    }
  }, [dbUser, setUserRank]);

  useEffect(() => {
    if (user && user.id) {
      fetchFleetByMember(user.id)
        .then((fleet) => setFleet(fleet))
        .catch(() => setFleet(null));
    }
  }, [user]);

  // Fetch playerStats
  useEffect(() => {
    if (dbUser && dbUser.id) {
      setPlayerStatsLoading(true);
      fetchPlayerStatsByUserId(dbUser.id)
        .then((stats) => setPlayerStats(stats))
        .finally(() => setPlayerStatsLoading(false));
    }
  }, [dbUser]);

  // Fetch active badge reusables
  useEffect(() => {
    setActiveBadgeReusablesLoading(true);
    fetchAllActiveBadgeReusables()
      .then((badges) => setActiveBadgeReusables(badges))
      .finally(() => setActiveBadgeReusablesLoading(false));
  }, []);

  // Fetch player badges (reusables by user id)
  useEffect(() => {
    if (dbUser && dbUser.id) {
      setPlayerBadgesLoading(true);
      fetchBadgeReusablesById(dbUser.id)
        .then((badges) => setPlayerBadges(badges))
        .finally(() => setPlayerBadgesLoading(false));
    }
  }, [dbUser]);

  // Fetch all game versions and determine the highest version
  useEffect(() => {
    getAllGameVersions()
      .then((patches) => {
        if (!patches || patches.length === 0) {
          setLatestPatch("");
          return;
        }
        // Sort by version (assuming semantic versioning)
        const sorted = patches.slice().sort((a, b) => {
          const aParts = a.version.split('.').map(Number);
          const bParts = b.version.split('.').map(Number);
          for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
            const aNum = aParts[i] || 0;
            const bNum = bParts[i] || 0;
            if (aNum !== bNum) return bNum - aNum;
          }
          return 0;
        });
        setLatestPatch(sorted[0].version);
      })
      .catch(() => setLatestPatch(""));
  }, []);

  // Fetch summaryData for PlayerGangStats when latestPatch or dbUser changes
  useEffect(() => {
    if (latestPatch && dbUser && dbUser.id) {
      fetchRecentGangsSummary(latestPatch, 500, 0)
        .then((data) => {
          // Filter for this user only, as in Gangr.tsx
          const filtered = Array.isArray(data) ? data.filter((row: any) => row.user_id === dbUser.id) : [];
          setSummaryData(filtered);
        })
        .catch(() => setSummaryData([]));
    } else {
      setSummaryData([]);
    }
  }, [latestPatch, dbUser]);

  // Fetch org summaries
  useEffect(() => {
    fetchSBAllOrgSummaries()
      .then(setOrgSummaries)
      .catch(() => setOrgSummaries([]));
  }, []);

  // Fetch player badge records (badgeRecordApi)
  useEffect(() => {
    if (dbUser && dbUser.id) {
      fetchBadgesByUserId(dbUser.id)
        .then((badges) => setPlayerBadges(badges))
        .catch(() => setPlayerBadges([]));
    }
  }, [dbUser]);

  if (!user) {
    return (
      <div className="centered-screen">
        <p>Not logged in. <a href="/">Go to Login</a></p>
      </div>
    );
  }

  return (
    <div className="dashboard-root">
      <Navbar dbUser={dbUser} />
      {/* Upcoming Events bar - full width, sliver below Navbar */}
      <UpcomingEvents 
        dbUser={dbUser}
        isRonin={isRonin}
      />
      <main className="dashboard-content unified-dashboard-grid">
        {/* Top row: PlayerCard (1/3) and OrgGoals (2/3) */}
        <div className="dashboard-area playercard-area">
          <PlayerCard 
            dbUser={dbUser} 
            user={user}
            playerStats={playerStats}
            playerStatsLoading={playerStatsLoading}
             />
        </div>
        <div className="dashboard-area org-goals-area" style={{ gridColumn: '2 / 4' }}>
          <OrgGoals
            dbUser={dbUser}
            user={user}
            isModerator={isModerator}
            latestPatch={latestPatch}
            orgSummaries={orgSummaries}
          />
        </div>
        {/* Bottom row: three progress sections */}
        <div className="dashboard-area">
          <PlayerBadgeProgress
            badgeReusables={activeBadgeReusables}
            loading={activeBadgeReusablesLoading}
            playerStats={playerStats}
            playerStatsLoading={playerStatsLoading}
            playerBadges={playerBadges}
            playerBadgesLoading={playerBadgesLoading}
            dbUser={dbUser}
          />
        </div>
        <div className="dashboard-area">
          <PlayerPrestigeProgress
            activeBadgeReusables={activeBadgeReusables}
            playerStats={playerStats}
            playerStatsLoading={playerStatsLoading}
            player={dbUser}
            dbUser={dbUser}
          />
          <SpecializedTeams 
            dbUser={dbUser} 
            orgSummaries={orgSummaries}
            latestPatch={latestPatch}
          />
        </div>
        <div className="dashboard-area">
          <PlayerGangStats
            dbUser={dbUser}
            gameVersion={latestPatch}
            summaryData={summaryData}
            displayType="Dashboard"
            playerStats={playerStats}
            playerStatsLoading={playerStatsLoading}
          />
          <KillOverviewBoard
            patch={latestPatch}
            dbUser={dbUser ? [dbUser] : []}
          />
        </div>
      </main>
    </div>
  );
}
