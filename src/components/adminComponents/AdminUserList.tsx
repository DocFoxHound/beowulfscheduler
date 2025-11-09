import React, { useState, useEffect } from "react";
import { getUsersByActiveMemberRole, getUsersByProspectRole, getUsersByCrewRole, getUsersByMarauderRole, getUsersByBloodedRole } from "../../api/userService";
import { shouldShowPromoteTag } from "../../utils/promotionUtils";
import { fetchVoiceChannelSessionsByTimeframe } from "../../api/voiceChannelSessionsApi";
import { VoiceChannelSession } from "../../types/voice_channel_sessions";
import { type User } from "../../types/user";
import { type PlayerStats } from "../../types/player_stats";

interface AdminUserListProps {
  users: User[];
  loading: boolean;
  onFilteredUsersChange?: (filtered: any[]) => void;
  selectedPlayerStats?: PlayerStats | null;
  blackBoxesData: any[];
  fleetLogsData: any[];
  recentGatheringsData: any[];
  hitTrackersData: any[];
  sbPlayerSummariesData: any[];
  sbLeaderboardLogsData: any[];
  startDate: string;
  endDate: string;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
}

// Player ranks from .env
const playerRanks = [
  { name: "Blooded", color: "#e02323", ids: (import.meta.env.VITE_BLOODED_ID || "").split(",") },
  { name: "Marauder", color: "#d14618", ids: (import.meta.env.VITE_MARAUDER_ID || "").split(",") },
  { name: "Crew", color: "#c57b30", ids: (import.meta.env.VITE_CREW_ID || "").split(",") },
  { name: "Prospect", color: "#4fd339", ids: (import.meta.env.VITE_PROSPECT_ID || "").split(",") },
  { name: "Friendly", color: "#3bbca9", ids: (import.meta.env.VITE_FRIENDLY_ID || "").split(",") },
];


const AdminUserList: React.FC<AdminUserListProps> = ({
  users,
  loading,
  onFilteredUsersChange,
  blackBoxesData,
  fleetLogsData,
  recentGatheringsData,
  hitTrackersData,
  sbPlayerSummariesData,
  sbLeaderboardLogsData,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  selectedPlayerStats
}) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debouncedFilter, setDebouncedFilter] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(-1);
  const [sessions, setSessions] = useState<VoiceChannelSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  // Local source users state to support server-side role fetches on filter
  const [sourceUsers, setSourceUsers] = useState<User[]>(users || []);
  const [fetchUsersLoading, setFetchUsersLoading] = useState(false);
  const [timeframe, setTimeframe] = useState<'last_month' | 'last_3_months' | 'last_year' | 'all_time'>('last_month');

  // Keep local source users in sync when parent updates (e.g., active-member list)
  useEffect(() => {
    setSourceUsers(users || []);
  }, [users]);

  // Fetch voice channel sessions only
  useEffect(() => {
    setSessionsLoading(true);
    const startDateTime = `${startDate}T00:00:00`;
    const endDateTime = `${endDate}T23:59:59.999`;
    fetchVoiceChannelSessionsByTimeframe(startDateTime, endDateTime)
      .then((data) => {
        setSessions(data);
      })
      .catch((err) => {
        console.error('Error fetching voice channel sessions:', err);
      })
      .finally(() => setSessionsLoading(false));
  }, [startDate, endDate]);

  // Derive start/end dates from timeframe selection
  useEffect(() => {
    let start: Date;
    const end = new Date();
    if (timeframe === 'last_month') {
      start = new Date();
      start.setMonth(start.getMonth() - 1);
    } else if (timeframe === 'last_3_months') {
      start = new Date();
      start.setMonth(start.getMonth() - 3);
    } else if (timeframe === 'last_year') {
      start = new Date();
      start.setFullYear(start.getFullYear() - 1);
    } else { // all_time
      start = new Date('2000-01-01T00:00:00Z');
    }
    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);
    if (startStr !== startDate) setStartDate(startStr);
    if (endStr !== endDate) setEndDate(endStr);
  }, [timeframe, startDate, endDate, setStartDate, setEndDate]);


  // Baseline list: all users with all associated data (not filtered by timeframe or selection)
  const baselineUsersWithData = React.useMemo(() =>
    (sourceUsers || []).map((user) => {
      const userIdStr = String(user.id);
      // Voice sessions and hours
      const userSessions = sessions.filter((session) => String(session.user_id) === userIdStr);
      const totalMinutes = userSessions.reduce((sum, session) => sum + (session.minutes || 0), 0);
      // BlackBoxes
      const userBlackBoxes = blackBoxesData.filter((bb) => String(bb.user_id) === userIdStr);
      // FleetLogs: commander or crew
      const userFleetLogs = fleetLogsData.filter((fl) =>
        String(fl.commander_id) === userIdStr || (Array.isArray(fl.crew_ids) && fl.crew_ids.map(String).includes(userIdStr))
      );
      // RecentGatherings: user in user_ids array
      const userRecentGatherings = recentGatheringsData.filter((g) =>
        Array.isArray(g.user_ids) && g.user_ids.map(String).includes(userIdStr)
      );
      // HitTrackers: user in assists array
      const userHitTrackers = hitTrackersData.filter((ht) =>
        Array.isArray(ht.assists) && ht.assists.map(String).includes(userIdStr)
      );
      // SBLeaderboardLogs: user in log array
      const userSBLogEntries = sbLeaderboardLogsData.filter(
        (log) => String(log.user_id) === userIdStr
      );

      // Format user.nickname for matching
      let formattedNickname = (user.nickname || "").replace(/"[^"]*"/g, ""); // Remove quotes and content between
      formattedNickname = formattedNickname.replace(/\s+/g, ""); // Remove all spaces

      // Find matching SB leaderboard summary
      let sbPlayerSummary = sbPlayerSummariesData.find(
        (p) => (
          (typeof p.displayname === "string" && p.displayname.toLowerCase() === formattedNickname.toLowerCase()) ||
          (typeof p.nickname === "string" && p.nickname.toLowerCase() === formattedNickname.toLowerCase())
        )
      );
      // If not found, try matching rsi_handle
      if (!sbPlayerSummary && user.rsi_handle) {
        sbPlayerSummary = sbPlayerSummariesData.find(
          (p) => (
            (typeof p.displayname === "string" && p.displayname.toLowerCase() === user.rsi_handle.toLowerCase()) ||
            (typeof p.nickname === "string" && p.nickname.toLowerCase() === user.rsi_handle.toLowerCase())
          )
        );
      }

      const row = {
        ...user,
        voiceSessions: userSessions,
        voiceHours: +(totalMinutes / 60).toFixed(2),
        blackBoxes: userBlackBoxes,
        fleetLogs: userFleetLogs,
        recentGatherings: userRecentGatherings,
        hitTrackers: userHitTrackers,
        sbPlayerSummary,
        sbLogEntries: userSBLogEntries,
      } as any;
      // Attach selected player's stats to the matching user for table usage
      if (selectedPlayerStats && String(selectedPlayerStats.user_id) === userIdStr) {
        row.playerStats = selectedPlayerStats;
      }
      return row;
    })
  , [sourceUsers, sessions, blackBoxesData, fleetLogsData, recentGatheringsData, hitTrackersData, sbPlayerSummariesData, sbLeaderboardLogsData, selectedPlayerStats]);

  // Filtered list: updates based on timeframe and selected user
  const [filteredUsersWithData, setFilteredUsersWithData] = useState(baselineUsersWithData);

  // Update filtered list when baseline or selection changes
  useEffect(() => {
    let filtered = baselineUsersWithData;
    // If a user is selected, filter to that user only
    if (expandedUserId) {
      filtered = filtered.filter(u => String(u.id) === String(expandedUserId));
    }
    setFilteredUsersWithData(filtered);
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

  // Debounce search/filter to reduce recompute thrash and dependent callbacks
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilter(filter), 250);
    return () => clearTimeout(t);
  }, [filter]);

  // Build a lightweight search index for suggestions (username + nickname)
  const searchIndex = React.useMemo(() => {
    return (sourceUsers || []).map(u => ({
      id: u.id,
      username: (u.username || "").toString(),
      nickname: (u.nickname || "").toString(),
      username_lc: (u.username || "").toString().toLowerCase(),
      nickname_lc: (u.nickname || "").toString().toLowerCase(),
    }));
  }, [sourceUsers]);

  // Compute suggestions (not aggressive): prefix match first, then substring, limit to 8
  const suggestions = React.useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return [] as Array<{ id: string | number; label: string; type: 'username' | 'nickname' }>;

    const prefixMatches: Array<{ id: string | number; label: string; type: 'username' | 'nickname' }> = [];
    const substrMatches: Array<{ id: string | number; label: string; type: 'username' | 'nickname' }> = [];

    for (const rec of searchIndex) {
      if (rec.username_lc.startsWith(q)) prefixMatches.push({ id: rec.id, label: rec.username, type: 'username' });
      else if (rec.nickname_lc.startsWith(q)) prefixMatches.push({ id: rec.id, label: rec.nickname, type: 'nickname' });
      else if (rec.username_lc.includes(q)) substrMatches.push({ id: rec.id, label: rec.username, type: 'username' });
      else if (rec.nickname_lc.includes(q)) substrMatches.push({ id: rec.id, label: rec.nickname, type: 'nickname' });
    }

    // Deduplicate by label preserving order
    const seen = new Set<string>();
    const ordered = [...prefixMatches, ...substrMatches].filter(s => {
      const key = `${s.type}:${s.label.toLowerCase()}`;
      if (seen.has(key) || !s.label) return false;
      seen.add(key);
      return true;
    });
    return ordered.slice(0, 8);
  }, [debouncedSearch, searchIndex]);

  // Filter and search logic (visible users only) + sorting packaged in useMemo
  // Only show users with allowed ranks
  const allowedRanks = ["Prospect", "Crew", "Marauder", "Blooded"];
  const displayedUsers = React.useMemo(() => {
    let arr = filteredUsersWithData.filter((user: any) => {
      const q = debouncedSearch.toLowerCase();
      const matchesSearch = q ? user.username?.toLowerCase().includes(q) : true;
      const userRank = getUserRank(user);
      const matchesAllowedRanks = userRank && allowedRanks.includes(userRank.name);
      const matchesFilter = debouncedFilter ? (userRank && userRank.name === debouncedFilter) : true;
      // Do not require any activity; show all users in allowed roles
      return matchesSearch && matchesAllowedRanks && matchesFilter;
    });

    if (sortConfig) {
      arr = [...arr].sort((a, b) => {
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
          case 'avgRank':
            aValue = typeof a.sbPlayerSummary?.avg_rank === 'number' ? a.sbPlayerSummary.avg_rank : 0;
            bValue = typeof b.sbPlayerSummary?.avg_rank === 'number' ? b.sbPlayerSummary.avg_rank : 0;
            break;
          default:
            return 0;
        }
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return arr;
  }, [filteredUsersWithData, debouncedSearch, debouncedFilter, sortConfig]);

  // When rank filter changes to a specific role, fetch from backend; empty filter uses parent-provided list
  useEffect(() => {
    const role = debouncedFilter;
    let cancelled = false;
    const fetchByRole = async () => {
      if (!role || !allowedRanks.includes(role)) {
        // Reset to parent-provided users
        setSourceUsers(users || []);
        return;
      }
      setFetchUsersLoading(true);
      try {
        let data: User[] | null = null;
        if (role === 'Prospect') data = await getUsersByProspectRole();
        else if (role === 'Crew') data = await getUsersByCrewRole();
        else if (role === 'Marauder') data = await getUsersByMarauderRole();
        else if (role === 'Blooded') data = await getUsersByBloodedRole();
        if (!cancelled) setSourceUsers(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setSourceUsers([]);
      } finally {
        if (!cancelled) setFetchUsersLoading(false);
      }
    };
    fetchByRole();
    return () => { cancelled = true; };
  }, [debouncedFilter, users]);

  // Notify parent of the actually displayed list (debounced to match filters)
  useEffect(() => {
    if (typeof onFilteredUsersChange === "function") {
      const t = setTimeout(() => onFilteredUsersChange(displayedUsers), 0);
      return () => clearTimeout(t);
    }
  }, [displayedUsers, onFilteredUsersChange]);

  // Compute 90th percentile thresholds (top 10%) per metric over displayed users, excluding zeros/nulls
  const percentile90 = (vals: number[]): number => {
    const arr = vals.filter(v => typeof v === 'number' && v > 0).sort((a, b) => a - b);
    const n = arr.length;
    if (n === 0) return Number.POSITIVE_INFINITY; // no highlights when no valid data
    const idx = Math.ceil(0.9 * n) - 1; // 0-based index
    return arr[Math.max(0, Math.min(idx, n - 1))];
    };

  const thresholds = React.useMemo(() => {
    const voiceHoursVals = displayedUsers.map(u => Number(u.voiceHours) || 0);
    const fleetLogsVals = displayedUsers.map(u => (Array.isArray(u.fleetLogs) ? u.fleetLogs.length : 0));
    const hitTrackersVals = displayedUsers.map(u => (Array.isArray(u.hitTrackers) ? u.hitTrackers.length : 0));
    const blackBoxesVals = displayedUsers.map(u => (Array.isArray(u.blackBoxes) ? u.blackBoxes.length : 0));
    const flightTimeVals = displayedUsers.map(u => (typeof u.sbPlayerSummary?.total_flight_time === 'number' ? u.sbPlayerSummary.total_flight_time : 0));
    return {
      voiceHours: percentile90(voiceHoursVals),
      fleetLogs: percentile90(fleetLogsVals),
      hitTrackers: percentile90(hitTrackersVals),
      blackBoxes: percentile90(blackBoxesVals),
      flightTime: percentile90(flightTimeVals),
    };
  }, [displayedUsers]);

  return (
    <div>
      {/* Search, filter, and date selector section */}
      <div style={{ marginBottom: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ position: "relative", display: "inline-block" }}>
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => {
            // small delay to allow click on suggestion
            setTimeout(() => setSearchFocused(false), 120);
            setActiveSuggestionIndex(-1);
          }}
          onKeyDown={(e) => {
            if (!suggestions.length) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActiveSuggestionIndex((i) => (i + 1) % suggestions.length);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActiveSuggestionIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
            } else if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
              e.preventDefault();
              const s = suggestions[activeSuggestionIndex];
              if (s) setSearch(s.label);
              setActiveSuggestionIndex(-1);
              setSearchFocused(false);
            }
          }}
          style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #444", background: "#111", color: "#fff" }}
        />
        {searchFocused && suggestions.length > 0 && (
          <ul style={{
            position: 'absolute',
            top: '2.25rem',
            left: 0,
            right: 0,
            maxHeight: '220px',
            overflowY: 'auto',
            background: '#111',
            border: '1px solid #444',
            borderRadius: 4,
            margin: 0,
            padding: '0.25rem 0',
            listStyle: 'none',
            zIndex: 10,
          }}>
            {suggestions.map((s, idx) => (
              <li
                key={`${s.type}:${s.id}:${s.label}`}
                onMouseDown={(e) => {
                  // prevent input blur before click
                  e.preventDefault();
                  setSearch(s.label);
                  setSearchFocused(false);
                  setActiveSuggestionIndex(-1);
                }}
                style={{
                  padding: '0.35rem 0.5rem',
                  cursor: 'pointer',
                  background: idx === activeSuggestionIndex ? '#1c1c1c' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
                title={s.type === 'nickname' ? 'nickname' : 'username'}
              >
                <span style={{ opacity: 0.7, fontSize: 12 }}>{s.type === 'nickname' ? 'Nick' : 'User'}</span>
                <span>{s.label}</span>
              </li>
            ))}
          </ul>
        )}
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #444", background: "#111", color: "#fff" }}
        >
          <option value="">All Ranks</option>
          {allowedRanks.map(rankName => (
            <option key={rankName} value={rankName}>{rankName}</option>
          ))}
        </select>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value as any)}
          style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #444", background: "#111", color: "#fff" }}
        >
          <option value="last_month">Last Month</option>
          <option value="last_3_months">Last 3 Months</option>
          <option value="last_year">Last Year</option>
          <option value="all_time">All Time</option>
        </select>
      </div>
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
              {/* <th style={{ padding: "0.3rem 0.2rem", borderBottom: "1px solid #444", textAlign: "left", cursor: "pointer", fontWeight: 500 }} onClick={() => setSortConfig(sortConfig?.key === 'fleetLogs' ? { key: 'fleetLogs', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' } : { key: 'fleetLogs', direction: 'desc' })}>
                Fleet Activities {sortConfig?.key === 'fleetLogs' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th> */}
              <th style={{ padding: "0.3rem 0.2rem", borderBottom: "1px solid #444", textAlign: "left", cursor: "pointer", fontWeight: 500 }} onClick={() => setSortConfig(sortConfig?.key === 'hitTrackers' ? { key: 'hitTrackers', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' } : { key: 'hitTrackers', direction: 'desc' })}>
                Hits {sortConfig?.key === 'hitTrackers' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th style={{ padding: "0.3rem 0.2rem", borderBottom: "1px solid #444", textAlign: "left", cursor: "pointer", fontWeight: 500 }} onClick={() => setSortConfig(sortConfig?.key === 'blackBoxes' ? { key: 'blackBoxes', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' } : { key: 'blackBoxes', direction: 'desc' })}>
                PVP Kills {sortConfig?.key === 'blackBoxes' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th style={{ padding: "0.3rem 0.2rem", borderBottom: "1px solid #444", textAlign: "left", cursor: "pointer", fontWeight: 500 }} onClick={() => setSortConfig(sortConfig?.key === 'flightTime' ? { key: 'flightTime', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' } : { key: 'flightTime', direction: 'desc' })}>
                SB Time {sortConfig?.key === 'flightTime' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th style={{ padding: "0.3rem 0.2rem", borderBottom: "1px solid #444", textAlign: "left", cursor: "pointer", fontWeight: 500 }} onClick={() => setSortConfig(sortConfig?.key === 'avgRank' ? { key: 'avgRank', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' } : { key: 'avgRank', direction: 'desc' })}>
                Avg Rank {sortConfig?.key === 'avgRank' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading || sessionsLoading || fetchUsersLoading ? (
              <tr>
                <td colSpan={3} style={{ textAlign: "left", padding: "1rem" }}>Loading...</td>
              </tr>
            ) : displayedUsers.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: "left", padding: "1rem" }}>No users found.</td>
              </tr>
            ) : (
              displayedUsers.map((user: any) => (
                <React.Fragment key={user.id}>
                  <tr
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
                      {Number(user.voiceHours) > 0 && Number(user.voiceHours) >= thresholds.voiceHours && (
                        <span title="ahead of peers" style={{ marginLeft: 4, cursor: 'help' }}>✨</span>
                      )}
                    </td>
                    <td style={{ padding: "0.3rem 0.2rem", borderBottom: "1px solid #333", textAlign: "left" }}>
                      {Array.isArray(user.fleetLogs) ? user.fleetLogs.length : 0}
                      {Array.isArray(user.fleetLogs) && user.fleetLogs.length > 0 && user.fleetLogs.length >= thresholds.fleetLogs && (
                        <span title="ahead of peers" style={{ marginLeft: 4, cursor: 'help' }}>✨</span>
                      )}
                    </td>
                    <td style={{ padding: "0.3rem 0.2rem", borderBottom: "1px solid #333", textAlign: "left" }}>
                      {Array.isArray(user.hitTrackers) ? user.hitTrackers.length : 0}
                      {Array.isArray(user.hitTrackers) && user.hitTrackers.length > 0 && user.hitTrackers.length >= thresholds.hitTrackers && (
                        <span title="ahead of peers" style={{ marginLeft: 4, cursor: 'help' }}>✨</span>
                      )}
                    </td>
                    <td style={{ padding: "0.3rem 0.2rem", borderBottom: "1px solid #333", textAlign: "left" }}>
                      {Array.isArray(user.blackBoxes) ? user.blackBoxes.length : 0}
                      {Array.isArray(user.blackBoxes) && user.blackBoxes.length > 0 && user.blackBoxes.length >= thresholds.blackBoxes && (
                        <span title="ahead of peers" style={{ marginLeft: 4, cursor: 'help' }}>✨</span>
                      )}
                    </td>
                    <td style={{ padding: "0.3rem 0.2rem", borderBottom: "1px solid #333", textAlign: "left" }}>
                      {user.sbPlayerSummary?.total_flight_time || "-"}
                      {typeof user.sbPlayerSummary?.total_flight_time === 'number' && user.sbPlayerSummary.total_flight_time > 0 && user.sbPlayerSummary.total_flight_time >= thresholds.flightTime && (
                        <span title="ahead of peers" style={{ marginLeft: 4, cursor: 'help' }}>✨</span>
                      )}
                    </td>
                    <td style={{ padding: "0.3rem 0.2rem", borderBottom: "1px solid #333", textAlign: "left" }}>
                      {typeof user.sbPlayerSummary?.avg_rank === 'number' ? user.sbPlayerSummary.avg_rank.toFixed(0) : (user.sbPlayerSummary?.avg_rank || "-")}
                    </td>
                  </tr>
                  {expandedUserId === user.id && user.playerStats && (
                    <tr>
                      <td colSpan={8} style={{ padding: "0.75rem 0.2rem", borderBottom: "1px solid #333" }}>
                        <div style={{ marginTop: "0.25rem" }}>
                          <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Player Stats (All Time)</div>
                          <table style={{ width: "100%", borderCollapse: "collapse", background: "#1b1b1b", color: "#fff", border: "1px solid #333" }}>
                            <thead>
                              <tr>
                                <th style={{ textAlign: "left", padding: "0.4rem", borderBottom: "1px solid #333", width: "35%" }}>Stat</th>
                                <th style={{ textAlign: "left", padding: "0.4rem", borderBottom: "1px solid #333" }}>Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const allowedStats: Array<keyof PlayerStats> = [
                                  'shipackills',
                                  'shippukills',
                                  'shipkills',
                                  'shipacdamages',
                                  'shipdamages',
                                  'fpsackills',
                                  'fpspukills',
                                  'fpskills',
                                  'piracyscustolen',
                                  'piracyvaluestolen',
                                  'piracyhits',
                                  'piracyhitspublished',
                                  'ronin',
                                  'shipsbleaderboardrank',
                                ];
                                const stats = user.playerStats as PlayerStats;
                                return allowedStats.map((key) => {
                                  const value = (stats as any)[key];
                                  if (value === undefined || value === null || value === '') return null;
                                  return (
                                    <tr key={String(key)}>
                                      <td style={{ padding: "0.35rem", borderBottom: "1px solid #2a2a2a", opacity: 0.9 }}>{String(key)}</td>
                                      <td style={{ padding: "0.35rem", borderBottom: "1px solid #2a2a2a" }}>
                                        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                                      </td>
                                    </tr>
                                  );
                                });
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUserList;
