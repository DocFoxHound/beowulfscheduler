import React, { useState, useEffect } from "react";
import { shouldShowPromoteTag } from "../../utils/promotionUtils";
import AdminActivityGraph from "./AdminActivityGraphs";
import { fetchBlackBoxesWithinTimeframe } from "../../api/blackboxApi";
import { fetchShipLogsByTimeframe } from "../../api/fleetLogApi";
import { fetchRecentGatheringsWithinTimeframe } from "../../api/recentGatheringsApi";
import { fetchHitsByTimeframe } from "../../api/hittrackerApi";
import { fetchVoiceChannelSessionsByTimeframe } from "../../api/voiceChannelSessionsApi";
import { fetchSBAllPlayerSummaries } from "../../api/leaderboardApi";
import { VoiceChannelSession } from "../../types/voice_channel_sessions";
import { fetchLeaderboardSBLogsByTimespan } from "../../api/leaderboardSBLogApi";
import { type User } from "../../types/user";

interface AdminUserListProps {
  users: User[];
  loading: boolean;
  onDateChange?: (startDate: string, endDate: string) => void;
  onFilteredUsersChange?: (filtered: any[]) => void;
  // No change needed here, users already present
}

// Player ranks from .env
const playerRanks = [
  { name: "Blooded", color: "#e02323", ids: (import.meta.env.VITE_BLOODED_ID || "").split(",") },
  { name: "Marauder", color: "#d14618", ids: (import.meta.env.VITE_MARAUDER_ID || "").split(",") },
  { name: "Crew", color: "#c57b30", ids: (import.meta.env.VITE_CREW_ID || "").split(",") },
  { name: "Prospect", color: "#4fd339", ids: (import.meta.env.VITE_PROSPECT_ID || "").split(",") },
  { name: "Friendly", color: "#3bbca9", ids: (import.meta.env.VITE_FRIENDLY_ID || "").split(",") },
];

const AdminUserList: React.FC<AdminUserListProps> = ({ users, loading, onDateChange, onFilteredUsersChange }) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [sessions, setSessions] = useState<VoiceChannelSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  // State for fetched resources
  const [blackBoxes, setBlackBoxes] = useState<any[]>([]);
  const [fleetLogs, setFleetLogs] = useState<any[]>([]);
  const [recentGatherings, setRecentGatherings] = useState<any[]>([]);
  const [hitTrackers, setHitTrackers] = useState<any[]>([]);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [sbPlayerSummaries, setSBPlayerSummaries] = useState<any[]>([]);
  const [sbLogEntries, setSBLogEntries] = useState<any[]>([]);

  useEffect(() => {
    setSessionsLoading(true);
    // Format startDate and endDate to include time for full day coverage
    const startDateTime = `${startDate}T00:00:00`;
    const endDateTime = `${endDate}T23:59:59`;
    fetchVoiceChannelSessionsByTimeframe(startDateTime, endDateTime)
      .then((data) => {
        setSessions(data);
      })
      .catch((err) => {
        console.error('Error fetching voice channel sessions:', err);
      })
      .finally(() => setSessionsLoading(false));
    // Fetch all resources by timeframe
    setResourceLoading(true);
    Promise.all([
      fetchBlackBoxesWithinTimeframe(startDateTime, endDateTime).catch(() => []),
      fetchShipLogsByTimeframe(startDateTime, endDateTime).catch(() => []),
      fetchRecentGatheringsWithinTimeframe(startDateTime, endDateTime).catch(() => []),
      fetchHitsByTimeframe(startDateTime, endDateTime).catch(() => []),
      fetchSBAllPlayerSummaries().catch(() => []),
      fetchLeaderboardSBLogsByTimespan(startDate, endDate).catch(() => [])
    ])
      .then(([blackBoxesData, fleetLogsData, recentGatheringsData, hitTrackersData, sbPlayerSummariesData, sbLeaderboardLogsData]) => {
        setBlackBoxes(Array.isArray(blackBoxesData) ? blackBoxesData : []);
        setFleetLogs(Array.isArray(fleetLogsData) ? fleetLogsData : []);
        setRecentGatherings(Array.isArray(recentGatheringsData) ? recentGatheringsData : []);
        setHitTrackers(Array.isArray(hitTrackersData) ? hitTrackersData : []);
        setSBPlayerSummaries(Array.isArray(sbPlayerSummariesData) ? sbPlayerSummariesData : []);
        setSBLogEntries(Array.isArray(sbLeaderboardLogsData) ? sbLeaderboardLogsData : []);
      })
      .catch((err) => {
        console.error('Error fetching resources by timeframe:', err);
      })
      .finally(() => setResourceLoading(false));
    // Notify parent to refresh users if callback provided
    if (typeof onDateChange === 'function') {
      onDateChange(startDate, endDate);
    }
  }, [startDate, endDate]);


  // Baseline list: all users with all associated data (not filtered by timeframe or selection)
  const baselineUsersWithData = React.useMemo(() =>
    users.map((user) => {
      const userIdStr = String(user.id);
      // Voice sessions and hours
      const userSessions = sessions.filter((session) => String(session.user_id) === userIdStr);
      const totalMinutes = userSessions.reduce((sum, session) => sum + (session.minutes || 0), 0);
      // BlackBoxes
      const userBlackBoxes = blackBoxes.filter((bb) => String(bb.user_id) === userIdStr);
      // FleetLogs: commander or crew
      const userFleetLogs = fleetLogs.filter((fl) =>
        String(fl.commander_id) === userIdStr || (Array.isArray(fl.crew_ids) && fl.crew_ids.map(String).includes(userIdStr))
      );
      // RecentGatherings: user in user_ids array
      const userRecentGatherings = recentGatherings.filter((g) =>
        Array.isArray(g.user_ids) && g.user_ids.map(String).includes(userIdStr)
      );
      // HitTrackers: user in assists array
      const userHitTrackers = hitTrackers.filter((ht) =>
        Array.isArray(ht.assists) && ht.assists.map(String).includes(userIdStr)
      );
      // SBLeaderboardLogs: user in log array
      const userSBLogEntries = sbLogEntries.filter(
        (log) => String(log.user_id) === userIdStr
      );

      // Format user.nickname for matching
      let formattedNickname = (user.nickname || "").replace(/"[^"]*"/g, ""); // Remove quotes and content between
      formattedNickname = formattedNickname.replace(/\s+/g, ""); // Remove all spaces

      // Find matching SB leaderboard summary
      const sbPlayerSummary = sbPlayerSummaries.find(
        (p) => typeof p.displayname === "string" && p.displayname.toLowerCase() === formattedNickname.toLowerCase()
      );

      return {
        ...user,
        voiceSessions: userSessions,
        voiceHours: +(totalMinutes / 60).toFixed(2),
        blackBoxes: userBlackBoxes,
        fleetLogs: userFleetLogs,
        recentGatherings: userRecentGatherings,
        hitTrackers: userHitTrackers,
        sbPlayerSummary,
        sbLogEntries: userSBLogEntries,
      };
    })
  , [users, sessions, blackBoxes, fleetLogs, recentGatherings, hitTrackers, sbPlayerSummaries, sbLogEntries]);

  // Filtered list: updates based on timeframe and selected user
  const [filteredUsersWithData, setFilteredUsersWithData] = useState(baselineUsersWithData);

  // Update filtered list when baseline, timeframe, or selection changes
  useEffect(() => {
    let filtered = baselineUsersWithData;
    // If a user is selected, filter to that user only
    if (expandedUserId) {
      filtered = filtered.filter(u => String(u.id) === String(expandedUserId));
    }
    setFilteredUsersWithData(filtered);
    if (typeof onFilteredUsersChange === "function") {
      onFilteredUsersChange(filtered);
    }
  }, [baselineUsersWithData, expandedUserId]);

  // Helper to get rank for a user based on their roles
  const getUserRank = (user: User): { name: string; color: string; ids: string[] } | null => {
    if (!user.roles) return null;
    for (const rank of playerRanks) {
      if (user.roles.some((role: string) => rank.ids.includes(role))) {
        return rank;
      }
    }
    return null;
  };

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Filter and search logic
  let filteredUsers = filteredUsersWithData.filter((user: any) => {
    const matchesSearch = user.username?.toLowerCase().includes(search.toLowerCase());
    const userRank = getUserRank(user);
    const matchesFilter = filter ? (userRank && userRank.name === filter) : true;
    const hasAnyActivity =
      user.voiceHours > 0 ||
      (Array.isArray(user.blackBoxes) && user.blackBoxes.length > 0) ||
      (Array.isArray(user.fleetLogs) && user.fleetLogs.length > 0) ||
      (Array.isArray(user.recentGatherings) && user.recentGatherings.length > 0) ||
      (Array.isArray(user.hitTrackers) && user.hitTrackers.length > 0) || 
      (Array.isArray(user.sbLogEntries) && user.sbLogEntries.length > 0);
    return matchesSearch && matchesFilter && hasAnyActivity;
  });

  // Sorting logic
  if (sortConfig) {
    filteredUsers = [...filteredUsers].sort((a, b) => {
      let aValue = 0;
      let bValue = 0;
      switch (sortConfig.key) {
        case 'voiceHours':
          aValue = a.voiceHours;
          bValue = b.voiceHours;
          break;
        case 'blackBoxes':
          aValue = Array.isArray(a.blackBoxes) ? a.blackBoxes.length : 0;
          bValue = Array.isArray(b.blackBoxes) ? b.blackBoxes.length : 0;
          break;
        case 'fleetLogs':
          aValue = Array.isArray(a.fleetLogs) ? a.fleetLogs.length : 0;
          bValue = Array.isArray(b.fleetLogs) ? b.fleetLogs.length : 0;
          break;
        case 'recentGatherings':
          aValue = Array.isArray(a.recentGatherings) ? a.recentGatherings.length : 0;
          bValue = Array.isArray(b.recentGatherings) ? b.recentGatherings.length : 0;
          break;
        case 'hitTrackers':
          aValue = Array.isArray(a.hitTrackers) ? a.hitTrackers.length : 0;
          bValue = Array.isArray(b.hitTrackers) ? b.hitTrackers.length : 0;
          break;
        case 'flightTime':
          aValue = typeof a.sbPlayerSummary?.total_flight_time === 'number' ? a.sbPlayerSummary.total_flight_time : 0;
          bValue = typeof b.sbPlayerSummary?.total_flight_time === 'number' ? b.sbPlayerSummary.total_flight_time : 0;
          break;
        default:
          return 0;
      }
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Calculate averages for each column using only filteredUsers (the displayed users)
  const avgVoiceHours = filteredUsers.length > 0 ? filteredUsers.reduce((sum, u) => sum + (u.voiceHours || 0), 0) / filteredUsers.length : 0;
  const avgFleetLogs = filteredUsers.length > 0 ? filteredUsers.reduce((sum, u) => sum + (Array.isArray(u.fleetLogs) ? u.fleetLogs.length : 0), 0) / filteredUsers.length : 0;
  const avgRecentGatherings = filteredUsers.length > 0 ? filteredUsers.reduce((sum, u) => sum + (Array.isArray(u.recentGatherings) ? u.recentGatherings.length : 0), 0) / filteredUsers.length : 0;
  const avgHitTrackers = filteredUsers.length > 0 ? filteredUsers.reduce((sum, u) => sum + (Array.isArray(u.hitTrackers) ? u.hitTrackers.length : 0), 0) / filteredUsers.length : 0;
  const avgBlackBoxes = filteredUsers.length > 0 ? filteredUsers.reduce((sum, u) => sum + (Array.isArray(u.blackBoxes) ? u.blackBoxes.length : 0), 0) / filteredUsers.length : 0;
  const avgFlightTime = filteredUsers.length > 0 ? filteredUsers.reduce((sum, u) => sum + (typeof u.sbPlayerSummary?.total_flight_time === 'number' ? u.sbPlayerSummary.total_flight_time : 0), 0) / filteredUsers.length : 0;

  return (
    <div>
      {/* Search, filter, and date selector section */}
      <div style={{ marginBottom: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #444", background: "#111", color: "#fff" }}
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #444", background: "#111", color: "#fff" }}
        >
          <option value="">All Ranks</option>
          {playerRanks.map(rank => (
            <option key={rank.name} value={rank.name}>{rank.name}</option>
          ))}
        </select>
        <label style={{ color: "#fff" }}>
          Start:
          <input
            type="date"
            value={startDate}
            max={endDate}
            onChange={e => setStartDate(e.target.value)}
            style={{ marginLeft: "0.5rem", padding: "0.5rem", borderRadius: "4px", border: "1px solid #444", background: "#111", color: "#fff" }}
          />
        </label>
        <label style={{ color: "#fff" }}>
          End:
          <input
            type="date"
            value={endDate}
            min={startDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={e => setEndDate(e.target.value)}
            style={{ marginLeft: "0.5rem", padding: "0.5rem", borderRadius: "4px", border: "1px solid #444", background: "#111", color: "#fff" }}
          />
        </label>
      </div>
      {/* Activity Graphs */}
      {/* <AdminActivityGraph usersWithData={filteredUsersWithData} /> */}
      {/* Users table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#222", color: "#fff", fontSize: "0.95rem" }}>
          <thead>
            <tr>
              <th style={{ padding: "0.3rem 0.2rem", borderBottom: "1px solid #444", textAlign: "left", fontWeight: 500 }}>Username</th>
              {/* <th style={{ padding: "0.3rem 0.2rem", borderBottom: "1px solid #444" }}>Display Name</th> */}
              <th style={{ padding: "0.3rem 0.2rem", borderBottom: "1px solid #444", textAlign: "left", fontWeight: 500 }}>Rank</th>
              <th style={{ padding: "0.3rem 0.2rem", borderBottom: "1px solid #444", textAlign: "left", cursor: "pointer", fontWeight: 500 }} onClick={() => setSortConfig(sortConfig?.key === 'voiceHours' ? { key: 'voiceHours', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' } : { key: 'voiceHours', direction: 'desc' })}>
                Voice Hours {sortConfig?.key === 'voiceHours' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th style={{ padding: "0.3rem 0.2rem", borderBottom: "1px solid #444", textAlign: "left", cursor: "pointer", fontWeight: 500 }} onClick={() => setSortConfig(sortConfig?.key === 'fleetLogs' ? { key: 'fleetLogs', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' } : { key: 'fleetLogs', direction: 'desc' })}>
                Fleet Activities {sortConfig?.key === 'fleetLogs' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th style={{ padding: "0.3rem 0.2rem", borderBottom: "1px solid #444", textAlign: "left", cursor: "pointer", fontWeight: 500 }} onClick={() => setSortConfig(sortConfig?.key === 'recentGatherings' ? { key: 'recentGatherings', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' } : { key: 'recentGatherings', direction: 'desc' })}>
                Gatherings {sortConfig?.key === 'recentGatherings' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th style={{ padding: "0.3rem 0.2rem", borderBottom: "1px solid #444", textAlign: "left", cursor: "pointer", fontWeight: 500 }} onClick={() => setSortConfig(sortConfig?.key === 'hitTrackers' ? { key: 'hitTrackers', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' } : { key: 'hitTrackers', direction: 'desc' })}>
                Pirate Actions {sortConfig?.key === 'hitTrackers' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th style={{ padding: "0.3rem 0.2rem", borderBottom: "1px solid #444", textAlign: "left", cursor: "pointer", fontWeight: 500 }} onClick={() => setSortConfig(sortConfig?.key === 'blackBoxes' ? { key: 'blackBoxes', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' } : { key: 'blackBoxes', direction: 'desc' })}>
                PVP Kills {sortConfig?.key === 'blackBoxes' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th style={{ padding: "0.3rem 0.2rem", borderBottom: "1px solid #444", textAlign: "left", cursor: "pointer", fontWeight: 500 }} onClick={() => setSortConfig(sortConfig?.key === 'flightTime' ? { key: 'flightTime', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' } : { key: 'flightTime', direction: 'desc' })}>
                Flight Time {sortConfig?.key === 'flightTime' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading || sessionsLoading ? (
              <tr>
                <td colSpan={3} style={{ textAlign: "left", padding: "1rem" }}>Loading...</td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: "left", padding: "1rem" }}>No users found.</td>
              </tr>
            ) : (
              filteredUsers.map((user: any) => (
                <tr
                  key={user.id}
                  style={{ cursor: "pointer", background: expandedUserId === user.id ? "#333" : undefined }}
                  onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                >
                  <td style={{ padding: "0.3rem 0.2rem", borderBottom: "1px solid #333", textAlign: "left" }}>
                    {user.username || "-"}
                    {shouldShowPromoteTag(user) && (
                      <span title="Eligible for promotion" style={{ marginLeft: 4, cursor: 'help' }}>🔼</span>
                    )}
                  </td>
                  {/* <td style={{ padding: "0.3rem 0.2rem", borderBottom: "1px solid #333" }}>{user.displayName || "-"}</td> */}
                  {(() => {
                    const rank = getUserRank(user);
                    return (
                      <td style={{ padding: "0.3rem 0.2rem", borderBottom: "1px solid #333", color: rank?.color || "#fff", fontWeight: "bold", textAlign: "left" }}>
                        {rank ? rank.name : "-"}
                      </td>
                    );
                  })()}
                  <td style={{ padding: "0.3rem 0.2rem", borderBottom: "1px solid #333", textAlign: "left" }}>
                    {user.voiceHours}
                    {user.voiceHours > avgVoiceHours && (
                      <span title="ahead of peers" style={{ marginLeft: 4, cursor: 'help' }}>✨</span>
                    )}
                  </td>
                  <td style={{ padding: "0.3rem 0.2rem", borderBottom: "1px solid #333", textAlign: "left" }}>
                    {Array.isArray(user.fleetLogs) ? user.fleetLogs.length : 0}
                    {Array.isArray(user.fleetLogs) && user.fleetLogs.length > avgFleetLogs && (
                      <span title="ahead of peers" style={{ marginLeft: 4, cursor: 'help' }}>✨</span>
                    )}
                  </td>
                  <td style={{ padding: "0.3rem 0.2rem", borderBottom: "1px solid #333", textAlign: "left" }}>
                    {Array.isArray(user.recentGatherings) ? user.recentGatherings.length : 0}
                    {Array.isArray(user.recentGatherings) && user.recentGatherings.length > avgRecentGatherings && (
                      <span title="ahead of peers" style={{ marginLeft: 4, cursor: 'help' }}>✨</span>
                    )}
                  </td>
                  <td style={{ padding: "0.3rem 0.2rem", borderBottom: "1px solid #333", textAlign: "left" }}>
                    {Array.isArray(user.hitTrackers) ? user.hitTrackers.length : 0}
                    {Array.isArray(user.hitTrackers) && user.hitTrackers.length > avgHitTrackers && (
                      <span title="ahead of peers" style={{ marginLeft: 4, cursor: 'help' }}>✨</span>
                    )}
                  </td>
                  <td style={{ padding: "0.3rem 0.2rem", borderBottom: "1px solid #333", textAlign: "left" }}>
                    {Array.isArray(user.blackBoxes) ? user.blackBoxes.length : 0}
                    {Array.isArray(user.blackBoxes) && user.blackBoxes.length > avgBlackBoxes && (
                      <span title="ahead of peers" style={{ marginLeft: 4, cursor: 'help' }}>✨</span>
                    )}
                  </td>
                  <td style={{ padding: "0.3rem 0.2rem", borderBottom: "1px solid #333", textAlign: "left" }}>
                    {user.sbPlayerSummary?.total_flight_time || "-"}
                    {typeof user.sbPlayerSummary?.total_flight_time === 'number' && user.sbPlayerSummary.total_flight_time > avgFlightTime && (
                      <span title="ahead of peers" style={{ marginLeft: 4, cursor: 'help' }}>✨</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUserList;
