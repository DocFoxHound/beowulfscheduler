import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import axios from "axios";
import { getUserById } from "../api/userService";
import AdminUserList from "../components/adminComponents/AdminUserList";
import AdminActivityGraph from "../components/adminComponents/AdminActivityGraphs";
import AdminManagementTab from "../components/adminComponents/AdminManagementTab";
import { fetchAllEmojis } from "../api/emojiApi";
import { getAllUsers } from "../api/userService";
import { fetchAllBadgeReusables, deleteBadgeReusable, createBadgeReusable, fetchAllActiveBadgeReusables } from "../api/badgeReusableApi";
import { fetchLeaderboardSBLogsByTimespan } from "../api/leaderboardSBLogApi";
import { refreshPlayerStatsView, fetchAllPlayerStats } from "../api/playerStatsApi";

const BLOODED_PLUS_IDS = (import.meta.env.VITE_LIVE_BLOODED_PLUS || "").split(",");

const AdminActivity: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [dbUser, setDbUser] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [filteredUsersWithData, setFilteredUsersWithData] = useState<any[]>([]);
  // Resource data states
  const [blackBoxesData, setBlackBoxesData] = useState<any[]>([]);
  const [fleetLogsData, setFleetLogsData] = useState<any[]>([]);
  const [recentGatheringsData, setRecentGatheringsData] = useState<any[]>([]);
  const [hitTrackersData, setHitTrackersData] = useState<any[]>([]);
  const [sbPlayerSummariesData, setSBPlayerSummariesData] = useState<any[]>([]);
  const [sbLeaderboardLogsData, setSBLeaderboardLogsData] = useState<any[]>([]);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  // Fetch resources by timeframe
  useEffect(() => {
    setResourceLoading(true);
    const startDateTime = `${startDate}T00:00:00`;
    const endDateTime = `${endDate}T23:59:59.999`;
    const startMs = new Date(startDateTime).getTime();
    const endMs = new Date(endDateTime).getTime();
    Promise.all([
      import("../api/blackboxApi").then(m => m.fetchBlackBoxesWithinTimeframe(startDateTime, endDateTime)).catch(() => []),
      import("../api/fleetLogApi").then(m => m.fetchShipLogsByTimeframe(startDateTime, endDateTime)).catch(() => []),
      import("../api/recentGatheringsApi").then(m => m.fetchRecentGatheringsWithinTimeframe(startDateTime, endDateTime)).catch(() => []),
      import("../api/hittrackerApi").then(m => m.fetchHitsByTimeframe(startDateTime, endDateTime)).catch(() => []),
      import("../api/leaderboardApi").then(m => m.fetchSBAllPlayerSummaries()).catch(() => []),
      import("../api/leaderboardSBLogApi").then(m => m.fetchLeaderboardSBLogsByTimespan(startMs.toString(), endMs.toString())).catch(() => [])
    ])
      .then(([blackBoxes, fleetLogs, recentGatherings, hitTrackers, sbPlayerSummaries, sbLeaderboardLogs]) => {
        setBlackBoxesData(Array.isArray(blackBoxes) ? blackBoxes : []);
        setFleetLogsData(Array.isArray(fleetLogs) ? fleetLogs : []);
        setRecentGatheringsData(Array.isArray(recentGatherings) ? recentGatherings : []);
        setHitTrackersData(Array.isArray(hitTrackers) ? hitTrackers : []);
        setSBPlayerSummariesData(Array.isArray(sbPlayerSummaries) ? sbPlayerSummaries : []);
        setSBLeaderboardLogsData(Array.isArray(sbLeaderboardLogs) ? sbLeaderboardLogs : []);
      })
      .catch(() => {
        setBlackBoxesData([]);
        setFleetLogsData([]);
        setRecentGatheringsData([]);
        setHitTrackersData([]);
        setSBPlayerSummariesData([]);
        setSBLeaderboardLogsData([]);
      })
      .finally(() => setResourceLoading(false));
  }, [startDate, endDate]);
  const [emojis, setEmojis] = useState<any[]>([]);
  const [activeBadgeReusables, setActiveBadgeReusables] = useState<any[]>([]);
  // Player stats cache (loaded once per page view)
  const [allPlayerStats, setAllPlayerStats] = useState<any[]>([]);
  const [allPlayerStatsLoading, setAllPlayerStatsLoading] = useState(false);
  // Fetch active badge reusables on mount
  useEffect(() => {
    fetchAllBadgeReusables()
      .then((data) => {
        setActiveBadgeReusables(Array.isArray(data) ? data : []);
      })
      .catch(() => setActiveBadgeReusables([]));
  }, []);
  
  // Fetch emojis on mount
  useEffect(() => {
    fetchAllEmojis()
      .then((data) => {
        const emojiArray = Array.isArray(data) ? data : [];
        setEmojis(emojiArray);
      })
      .catch(() => setEmojis([]));
  }, []);
  // Track selected player from AdminUserList
  const selectedPlayer = filteredUsersWithData.length === 1 ? filteredUsersWithData[0] : null;
  // Derive selected player's stats from the cached list
  const selectedPlayerStats = React.useMemo(() => {
    if (!selectedPlayer || !Array.isArray(allPlayerStats)) return null;
    return allPlayerStats.find((ps: any) => ps?.user_id === selectedPlayer.id) || null;
  }, [selectedPlayer, allPlayerStats]);
  const navigate = useNavigate();
  // Fetch all users when page loads
  useEffect(() => {
    setUsersLoading(true);
    getAllUsers()
      .then((data) => {
        setAllUsers(Array.isArray(data) ? data : []);
        setUsersLoading(false);
      })
      .catch(() => {
        setAllUsers([]);
        setUsersLoading(false);
      });
  }, []);
  
  // Refresh aggregated player stats, then fetch all player stats once
  useEffect(() => {
    let cancelled = false;
    setAllPlayerStatsLoading(true);
    // Ensure the view is refreshed before fetching
    refreshPlayerStatsView()
      .catch(() => undefined)
      .finally(() => {
        fetchAllPlayerStats()
          .then((data) => {
            if (!cancelled) setAllPlayerStats(Array.isArray(data) ? data : []);
          })
          .catch(() => {
            if (!cancelled) setAllPlayerStats([]);
          })
          .finally(() => {
            if (!cancelled) setAllPlayerStatsLoading(false);
          });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch Discord user
  useEffect(() => {
    axios
      .get(
        import.meta.env.VITE_IS_LIVE === "true"
          ? import.meta.env.VITE_LIVE_USER_URL
          : import.meta.env.VITE_TEST_USER_URL,
        { withCredentials: true }
      )
      .then((res) => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  // Fetch dbUser from backend
  useEffect(() => {
    if (user && user.id) {
      getUserById(user.id)
        .then((data) => setDbUser(data))
        .catch(() => setDbUser(null));
    }
  }, [user]);

  // Redirect if not admin
  useEffect(() => {
    if (dbUser && (!Array.isArray(dbUser.roles) || !dbUser.roles.some((roleId: string) => BLOODED_PLUS_IDS.includes(roleId)))) {
      navigate("/dashboard");
    }
  }, [dbUser, navigate]);

  if (!dbUser) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Navbar dbUser={dbUser} />
      <div style={{ padding: "2rem", color: "#fff" }}>
        <h1>Admin Activity</h1>
        {/* Top area for reactive graph */}
            <div style={{ marginBottom: "2rem" }}>
              <React.Suspense fallback={<div>Loading graph...</div>}>
                <AdminActivityGraph 
                  usersWithData={filteredUsersWithData.length ? filteredUsersWithData : allUsers} 
                  fleetLogsData={fleetLogsData}
                  hitTrackersData={hitTrackersData}
                  recentGatheringsData={recentGatheringsData}
                  selectedUser={selectedPlayer}
                  allPlayerStats={allPlayerStats}
                  activeBadgeReusables={activeBadgeReusables}
                />
              </React.Suspense>
            </div>
        {/* Split page into two sides */}
        <div style={{ display: "flex", gap: "2rem" }}>
          {/* Left side: Users list */}
          <div style={{ flex: 1, background: "#222", borderRadius: "8px", padding: "1rem", minHeight: "400px" }}>
            <h2>Users List</h2>
            {/* AdminUserList displays the reactive list of users */}
            <React.Suspense fallback={<div>Loading users...</div>}>
              <AdminUserList
                users={allUsers}
                loading={usersLoading || resourceLoading}
                onFilteredUsersChange={setFilteredUsersWithData}
                selectedPlayerStats={selectedPlayerStats}
                blackBoxesData={blackBoxesData}
                fleetLogsData={fleetLogsData}
                recentGatheringsData={recentGatheringsData}
                hitTrackersData={hitTrackersData}
                sbPlayerSummariesData={sbPlayerSummariesData}
                sbLeaderboardLogsData={sbLeaderboardLogsData}
                startDate={startDate}
                endDate={endDate}
                setStartDate={setStartDate}
                setEndDate={setEndDate}
              />
            </React.Suspense>
          </div>
          {/* Right side: Recent Gatherings list */}
          <div style={{ flex: 1, background: "#222", borderRadius: "8px", padding: "1rem", minHeight: "400px" }}>
            <AdminManagementTab
              selectedPlayer={selectedPlayer}
              selectedPlayerStats={selectedPlayerStats}
              playerStatsLoading={allPlayerStatsLoading}
              users={allUsers}
              loading={usersLoading}
              emojis={emojis}
              activeBadgeReusables={activeBadgeReusables}
              dbUser={dbUser}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminActivity;