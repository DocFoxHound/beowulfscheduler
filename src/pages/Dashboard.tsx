import { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css";
import { getUserById, getUserRank } from "../api/userService";
import { useUserContext } from "../context/UserContext"; // <-- Import the context hook
import Navbar from "../components/Navbar";
import { fetchFleetByMember } from "../api/fleetApi";
import OrgGoals from "../components/dashboardComponents/OrgGoals";
import PlayerCard from "../components/dashboardComponents/playerCard";
import PlayerBadgeProgress from "../components/adminComponents/PlayerBadgeProgress";
import PlayerPromotionProgress from "../components/adminComponents/PlayerPromotionProgress";
import PlayerPrestigeProgress from "../components/adminComponents/PlayerPrestigeProgress";
import { fetchPlayerStatsByUserId } from "../api/playerStatsApi";
import { fetchAllActiveBadgeReusables, fetchBadgeReusablesById } from "../api/badgeReusableApi";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const { dbUser, setDbUser, userRank, setUserRank } = useUserContext(); 
  const [fleet, setFleet] = useState<any>(null); // Add fleet state

  // New state for badge/progress components
  const [playerStats, setPlayerStats] = useState<any>(null);
  const [playerStatsLoading, setPlayerStatsLoading] = useState(false);
  const [activeBadgeReusables, setActiveBadgeReusables] = useState<any[]>([]);
  const [activeBadgeReusablesLoading, setActiveBadgeReusablesLoading] = useState(false);
  const [playerBadges, setPlayerBadges] = useState<any[]>([]);
  const [playerBadgesLoading, setPlayerBadgesLoading] = useState(false);

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

      <main className="dashboard-content unified-dashboard-grid">
        {/* Top row: PlayerCard (1/3) and OrgGoals (2/3) */}
        <div className="dashboard-area playercard-area">
          <PlayerCard dbUser={dbUser} user={user} />
        </div>
        <div className="dashboard-area org-goals-area" style={{ gridColumn: '2 / 4' }}>
          <OrgGoals dbUser={dbUser} user={user} />
        </div>
        {/* Bottom row: three progress sections */}
        <div className="dashboard-area">
          <PlayerBadgeProgress
            activeBadgeReusables={activeBadgeReusables}
            loading={activeBadgeReusablesLoading}
            playerStats={playerStats}
            playerStatsLoading={playerStatsLoading}
            playerBadges={playerBadges}
            playerBadgesLoading={playerBadgesLoading}
            dbUser={dbUser}
          />
        </div>
        <div className="dashboard-area">
          <PlayerPromotionProgress
            playerStats={playerStats}
            playerStatsLoading={playerStatsLoading}
            dbUser={dbUser}
          />
          <PlayerPrestigeProgress
            activeBadgeReusables={activeBadgeReusables}
            playerStats={playerStats}
            playerStatsLoading={playerStatsLoading}
            dbUser={dbUser}
          />
        </div>
        <div className="dashboard-area">
          
        </div>
      </main>
    </div>
  );
}
