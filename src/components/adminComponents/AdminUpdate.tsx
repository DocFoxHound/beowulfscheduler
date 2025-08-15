import React from "react";
import { type PlayerStats } from "../../types/player_stats";
import { assessPlayerForAdminUpdates, summarizeUpdates } from "../../utils/progressionEngine";

type AdminUpdateProps = {
  allPlayerStats: any[];
  usersWithData: any[];
  // Optional inputs to unlock richer status via progression engine
  activeBadgeReusables?: any[];
  // Map of user id -> earned badges (to exclude from eligibility)
  playerBadgesByUser?: Record<string, any[]>;
};

type PlaceholderEntry = {
  id: string | number;
  name: string;
  status: "earned" | "needs_award" | "eligible" | "progress";
  tooltip?: string;
  badgeName?: string;
  badgeSubject?: string;
  type?: 'badge' | 'prestige' | 'promotion';
};

const AdminUpdate: React.FC<AdminUpdateProps> = ({ allPlayerStats, usersWithData, activeBadgeReusables, playerBadgesByUser }) => {
  const stats = Array.isArray(allPlayerStats) ? allPlayerStats : [];

  // Create an array of active users that have a matching stats object
  const activeUsersWithStats = React.useMemo(
    () => {
      if (!Array.isArray(usersWithData) || usersWithData.length === 0 || stats.length === 0) return [] as Array<{ user: any; stats: PlayerStats }>;
      const statsById = new Map<string, PlayerStats>(
        stats
          .filter((s: any) => s && (s.user_id !== undefined && s.user_id !== null))
          .map((s: any) => [String(s.user_id), s as PlayerStats])
      );
      return usersWithData
        .map((u: any) => ({ user: u, stats: statsById.get(String(u?.id)) }))
        .filter((pair): pair is { user: any; stats: PlayerStats } => Boolean(pair.stats));
    },
    [usersWithData, stats]
  );

  const entries: PlaceholderEntry[] = React.useMemo(() => {
    // If we have active users with stats, try to use the progression engine when possible.
    if (activeUsersWithStats.length > 0) {
      // When engine inputs are available, create one feed item per returned update
      if (Array.isArray(activeBadgeReusables)) {
        const updatesList: PlaceholderEntry[] = [];
        activeUsersWithStats.forEach(({ user, stats: ps }, uIdx) => {
          const id = user?.id ?? uIdx + 1;
          const name = user?.username ?? user?.displayName ?? `User ${id}`;
          // Determine if we actually have badge data loaded for this user.
          // Undefined means we haven't fetched it; an empty array means fetched and none earned.
          const badgeDataLoadedForUser = playerBadgesByUser && Object.prototype.hasOwnProperty.call(playerBadgesByUser, String(id));
          const updates = assessPlayerForAdminUpdates({
            user,
            stats: ps,
            activeBadgeReusables,
            playerBadges: playerBadgesByUser?.[String(id)] || [],
          });
          if (!updates || updates.length === 0) return; // skip users with no updates
          updates.forEach((u, upIdx) => {
            // For AdminUpdate, only show prestige when ready (met requirements)
            if (u.type === 'prestige' && u.severity !== 'success') return;
            // Only show promotion when ready (no partial progress)
            if (u.type === 'promotion' && u.severity !== 'success') return;
            // Avoid showing badge "ready" items unless we have confirmed earned-badge data for this user.
            // This prevents false positives when bulk badge data hasn't been fetched for this user.
            if (u.type === 'badge' && u.severity === 'success' && !badgeDataLoadedForUser) return;
            const statusSummary = summarizeUpdates([u]);
            const status: PlaceholderEntry["status"] = statusSummary.status as PlaceholderEntry["status"];
            updatesList.push({
              id: `${id}-${u.type}-${upIdx}`,
              name,
              status,
              tooltip: u.title,
              badgeName: u.type === 'badge' ? (u as any).badgeName : undefined,
              badgeSubject: u.type === 'badge' ? (u as any).badgeSubject : undefined,
              type: u.type as 'badge' | 'prestige' | 'promotion',
            });
          });
        });
        return updatesList;
      }

      // Legacy placeholder selection if no badge data provided
      // Previously returned rotating placeholder statuses; suppress to avoid misleading entries.
      return [] as PlaceholderEntry[];
    }

    // Next, if no matches yet but we do have stats, fall back to stats-only rows
    if (stats.length > 0) {
      // Previously returned placeholder stats-only rows; suppress to avoid misleading entries.
      return [] as PlaceholderEntry[];
    }

    // Fallback: generate 50 placeholder rows when no stats yet
    // Suppress placeholder content entirely until real data is ready.
    return [] as PlaceholderEntry[];
  }, [activeUsersWithStats, stats, activeBadgeReusables, playerBadgesByUser]);

  // Hide any entries marked as 'needs_award' (partial progress not required to display)
  const visibleEntries = React.useMemo(
  () => entries.filter((e) => e.status !== 'needs_award' && e.status !== 'progress'),
    [entries]
  );

  const statusText = (e: PlaceholderEntry) => {
    // If we know the update type, tailor copy accordingly
    if (e.type === 'promotion') {
  if (e.status === 'eligible') return 'is eligible to promote';
  if (e.status === 'progress') return 'has promotion progress';
  return 'has a promotion update';
    }
    if (e.type === 'prestige') {
      if (e.status === 'earned') return 'is ready to advance prestige';
      return 'is progressing in prestige';
    }
    // Badge-specific copy: clarify that 'earned' means ready to award,
    // while 'needs_award' reflects partial progress toward earning.
    if (e.type === 'badge') {
      if (e.status === 'earned') return 'is ready to be awarded a badge';
      if (e.status === 'needs_award') return 'is progressing toward a badge';
      return 'has a badge update';
    }
    // Default/badge copy
    if (e.status === 'earned') return 'earned a badge';
    if (e.status === 'needs_award') return 'needs to be awarded a badge';
    return 'has an update';
  };

  const statusColor = (s: PlaceholderEntry["status"]) => {
    if (s === "earned") return "#4caf50"; // green
    if (s === "needs_award") return "#ff9800"; // orange
  return "#42a5f5"; // blue
  };

  return (
  <div style={{ display: "flex", flexDirection: "column", height: "90vh" }}>
      <div style={{ marginBottom: "0.5rem" }}>
        <h2 style={{ margin: 0 }}>Admin Update</h2>
        <div style={{ color: "#aaa", fontSize: "0.9rem" }}>
          Updates on the users viewable.
        </div>
      </div>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          background: "#1b1b1b",
          border: "1px solid #333",
          borderRadius: 8,
          padding: "0.25rem 0.5rem",
        }}
      >
    {visibleEntries.map((e) => (
          <div
            key={e.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontSize: "0.9rem",
              color: "#ddd",
              padding: "0.35rem 0.25rem",
              borderBottom: "1px solid #2a2a2a",
      // cursor left default; no click handler
            }}
            title={e.tooltip || `${e.name} ${statusText(e)}`}
          >
            <span style={{ flex: "0 0 auto", width: 8, height: 8, borderRadius: 999, background: statusColor(e.status) }} />
            <span style={{ color: "#eee" }}>{e.name}</span>
            <span style={{ color: "#888" }}>—</span>
            <span style={{ color: statusColor(e.status) }}>
              {statusText(e)}
              {e.badgeName && (
                <>
                  : <strong>{e.badgeName}</strong>{e.badgeSubject ? ` (${e.badgeSubject})` : ""}
                </>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminUpdate;
