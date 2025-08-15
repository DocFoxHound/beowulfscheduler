import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from "recharts";
import AdminVoiceActivityGraph from "./AdminVoiceActivityGraph";
import AdminFlightHoursGraph from "./AdminFlightHoursGraph";
import React from "react";
import AdminUpdate from "./AdminUpdate";
import { fetchBadgesByUserId, fetchBadgesByUserIdsBulk } from "../../api/badgeRecordApi";

interface UserWithData extends Record<string, unknown> {
  id: string | number;
  username?: string;
  voiceHours: number;
  voiceSessions: any[];
  blackBoxes: any[];
  fleetLogs: any[];
  recentGatherings: any[];
  hitTrackers: any[];
  sbPlayerSummary?: { total_flight_time?: number };
  // ...other properties as needed
}

interface AdminActivityGraphProps {
  usersWithData: UserWithData[];
  fleetLogsData?: any[];
  hitTrackersData?: any[];
  recentGatheringsData?: any[];
  selectedUser?: UserWithData;
  allPlayerStats?: any[];
  activeBadgeReusables?: any[];
}

const AdminActivityGraph: React.FC<AdminActivityGraphProps> = ({ usersWithData, fleetLogsData, hitTrackersData, recentGatheringsData, activeBadgeReusables, allPlayerStats, selectedUser }) => {
  // Helper: format date to YYYY-MM-DD
  const formatDate = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    return d.toISOString().slice(0, 10);
  };

  // ...existing code...

  // Build a map of userId -> earned badges to prevent duplicate award prompts
  // Avoid fetching for all users at once. Cache results and only fetch for the selected user
  // and a small filtered set (if usersWithData is small). Limit concurrency to reduce load.
  const [playerBadgesByUser, setPlayerBadgesByUser] = React.useState<Record<string, any[]>>({});
  const badgesCacheRef = React.useRef<Record<string, any[]>>({});

  React.useEffect(() => {
    let cancelled = false;

    const includedIds = new Set<string>();
    if (selectedUser && selectedUser.id != null) {
      includedIds.add(String(selectedUser.id));
    }

    // If the list is already filtered/small, include those as well; otherwise skip to avoid floods
    const MAX_BULK = 12;
    if (Array.isArray(usersWithData) && usersWithData.length > 0 && usersWithData.length <= MAX_BULK) {
      usersWithData.forEach((u) => {
        if (u && u.id != null) includedIds.add(String(u.id));
      });
    }

    const idsToFetch = Array.from(includedIds).filter((id) => !(id in badgesCacheRef.current));

    // Helper to project cache into the state map for the included ids
    const projectFromCache = () => {
      const map: Record<string, any[]> = {};
      includedIds.forEach((id) => {
        map[id] = badgesCacheRef.current[id] || [];
      });
      setPlayerBadgesByUser(map);
    };

    if (idsToFetch.length === 0) {
      projectFromCache();
      return () => {
        cancelled = true;
      };
    }

    const fetchBulkOrFallback = async () => {
      // Try bulk first when multiple IDs are needed
      if (idsToFetch.length > 1) {
        try {
          const resp = await fetchBadgesByUserIdsBulk(idsToFetch);
          if (cancelled) return;
          // resp may be an array (flat) or a map keyed by user id; support both
          if (Array.isArray(resp)) {
            const grouped: Record<string, any[]> = {};
            for (const rec of resp as any[]) {
              const uid = rec?.user_id != null ? String(rec.user_id) : undefined;
              if (!uid) continue;
              if (!grouped[uid]) grouped[uid] = [];
              grouped[uid].push(rec);
            }
            for (const id of idsToFetch) {
              badgesCacheRef.current[id] = grouped[id] || [];
            }
            projectFromCache();
            return;
          }
          if (resp && typeof resp === "object") {
            const mapResp = resp as Record<string, any[]>;
            for (const id of idsToFetch) {
              badgesCacheRef.current[id] = Array.isArray(mapResp[id]) ? mapResp[id] : [];
            }
            projectFromCache();
            return;
          }
        } catch {
          // fall through to per-id limited fetch
        }
      }

      // Fallback: fetch per id with limited concurrency
      const concurrency = 3;
      let next = 0;
      const results: Array<[string, any[]]> = [];
      const runWorker = async () => {
        while (true) {
          const i = next++;
          if (i >= idsToFetch.length) break;
          const id = idsToFetch[i];
          try {
            const badges = await fetchBadgesByUserId(id);
            results.push([id, Array.isArray(badges) ? [...badges] : []]);
          } catch {
            results.push([id, []]);
          }
          if (cancelled) return;
        }
      };
      await Promise.all(Array.from({ length: Math.min(concurrency, idsToFetch.length) }, runWorker));
      if (cancelled) return;
      for (const [id, arr] of results) {
        badgesCacheRef.current[id] = arr;
      }
      projectFromCache();
    };

    fetchBulkOrFallback().catch(() => {
      if (!cancelled) projectFromCache();
    });

    return () => {
      cancelled = true;
    };
  }, [usersWithData, selectedUser]);

  // 2. Pie chart: Blackbox data (moved to AdminPieChart)
  const allBlackBoxes = usersWithData.flatMap(u => Array.isArray(u.blackBoxes) ? u.blackBoxes : []);
  const blackboxTypeCounts: Record<string, number> = {};
  allBlackBoxes.forEach(bb => {
    const type = bb.type || 'Unknown';
    blackboxTypeCounts[type] = (blackboxTypeCounts[type] || 0) + 1;
  });
  const blackboxPieData = Object.entries(blackboxTypeCounts).map(([type, count]) => ({ name: type, value: count }));

  // Import AdminPieChart
  // ...existing code...
  // 3. Stacked Bar chart: fleetLogs, recentGatherings, hitTrackers by date using respective data props
  const stackByDate: Record<string, { fleetLogs: number; recentGatherings: number; hitTrackers: number }> = {};
  // FleetLogs: use fleetLogsData prop
  (fleetLogsData || []).forEach(fl => {
    if (fl.created_at) {
      const date = formatDate(fl.created_at);
      stackByDate[date] = stackByDate[date] || { fleetLogs: 0, recentGatherings: 0, hitTrackers: 0 };
      stackByDate[date].fleetLogs += 1;
    }
  });
  // RecentGatherings: use recentGatheringsData prop
  (recentGatheringsData || []).forEach(g => {
    if (g.timestamp) {
      const date = formatDate(g.timestamp);
      stackByDate[date] = stackByDate[date] || { fleetLogs: 0, recentGatherings: 0, hitTrackers: 0 };
      stackByDate[date].recentGatherings += 1;
    }
  });
  // HitTrackers: use hitTrackersData prop
  (hitTrackersData || []).forEach(ht => {
    if (ht.timestamp) {
      const date = formatDate(ht.timestamp);
      stackByDate[date] = stackByDate[date] || { fleetLogs: 0, recentGatherings: 0, hitTrackers: 0 };
      stackByDate[date].hitTrackers += 1;
    }
  });
  const stackBarData = Object.entries(stackByDate).map(([date, vals]) => ({ date, ...vals }));

  // 4. Bar chart: Voice Hours and Flight Time by user (moved to AdminFlightHoursGraph)

  return (
    <div style={{ background: "#222", borderRadius: "8px", padding: "1rem", color: "#fff" }}>
      <div style={{ display: "flex", gap: "2rem" }}>
        {/* Pie chart on the left, now taking up about half the width */}
        <div style={{ flex: "1 1 0", minWidth: 350, maxWidth: "50%" }}>
          <AdminUpdate allPlayerStats={
            allPlayerStats ?? []} 
            usersWithData={usersWithData} 
            activeBadgeReusables={activeBadgeReusables}
            playerBadgesByUser={playerBadgesByUser}
          />
        </div>
        {/* Other charts stacked vertically on the right */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* 1. Voice Activity Bar Chart moved to AdminVoiceActivityGraph */}
          <AdminVoiceActivityGraph usersWithData={usersWithData} />
          {/* 4. Bar chart: Voice Hours and Flight Time by user moved to AdminFlightHoursGraph */}
          <AdminFlightHoursGraph usersWithData={usersWithData} />
        </div>
      </div>
    </div>
  );
};

export default AdminActivityGraph;
