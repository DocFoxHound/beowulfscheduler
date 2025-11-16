import React from "react";
import { type PlayerStats } from "../../types/player_stats";
import { assessPlayerForAdminUpdates, summarizeUpdates, assessPromotion } from "../../utils/progressionEngine";
import { fetchBadgesByUserId } from "../../api/badgeRecordApi";

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
  // Local cache for fetched badges by user to fill gaps so promotion readiness can be computed globally
  const [fetchedBadgesByUser, setFetchedBadgesByUser] = React.useState<Record<string, any[]>>({});

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
          const name = user?.nickname || user?.username || user?.displayName || `User ${id}`;
          // Determine if we actually have badge data loaded for this user.
          // Undefined means we haven't fetched it; an empty array means fetched and none earned.
          const combinedBadgesByUser = { ...(playerBadgesByUser || {}), ...(fetchedBadgesByUser || {}) } as Record<string, any[]>;
          const badgeDataLoadedForUser = combinedBadgesByUser && Object.prototype.hasOwnProperty.call(combinedBadgesByUser, String(id));
          // Compute promotion state mirroring PlayerPromotionProgress
          const userRankId = String((user?.rank ?? user?.rank_id ?? ""));
          const userBadges = combinedBadgesByUser?.[String(id)] || [];
          const promo = assessPromotion(ps, userRankId, undefined, userBadges as any[]);
          const nextRank = promo?.nextRank as string | undefined;
          const progressPercent = typeof promo?.progressPercent === 'number' ? promo.progressPercent : 0;
          const updates = assessPlayerForAdminUpdates({
            user,
            stats: ps,
            activeBadgeReusables,
            playerBadges: combinedBadgesByUser?.[String(id)] || [],
          });
          if (Array.isArray(updates) && updates.length > 0) {
            updates.forEach((u, upIdx) => {
            // For AdminUpdate, only show prestige when ready (met requirements)
            if (u.type === 'prestige' && u.severity !== 'success') return;
            // Only show promotion when ready (no partial progress)
            if (u.type === 'promotion') {
              if (u.severity !== 'success') return;
              // Remove Crew -> Marauder promotion notices
              if (nextRank === 'Marauder') return;
            }
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
          }


            // Manual injection parity with PlayerPromotionProgress for Prospect -> Crew only
            // If engine didn't produce a promotion entry but progress is 100% to Crew, add one.
            try {
              const hasPromotionEntry = updatesList.some(e => String(e.id).startsWith(`${id}-promotion-`));
              if (!hasPromotionEntry && nextRank === 'Crew' && progressPercent >= 100) {
                updatesList.push({
                  id: `${id}-promotion-manual`,
                  name,
                  status: 'eligible',
                  tooltip: 'Ready for promotion to Crew',
                  type: 'promotion',
                });
              }
            } catch (e) {
              // defensive
            }
        });
        return updatesList;
      }

      // No badge reusables provided: still compute Prospect -> Crew promotion readiness
      const manualOnly: PlaceholderEntry[] = [];
      activeUsersWithStats.forEach(({ user, stats: ps }, uIdx) => {
        const id = user?.id ?? uIdx + 1;
        const name = user?.nickname || user?.username || user?.displayName || `User ${id}`;
        const combinedBadgesByUser = { ...(playerBadgesByUser || {}), ...(fetchedBadgesByUser || {}) } as Record<string, any[]>;
        const userRankId = String((user?.rank ?? user?.rank_id ?? ""));
        const userBadges = combinedBadgesByUser?.[String(id)] || [];
        const promo = assessPromotion(ps, userRankId, undefined, userBadges as any[]);
        const nextRank = promo?.nextRank as string | undefined;
        const progressPercent = typeof promo?.progressPercent === 'number' ? promo.progressPercent : 0;
        // Only add Prospect -> Crew
        if (nextRank === 'Crew' && progressPercent >= 100) {
          manualOnly.push({
            id: `${id}-promotion-manual`,
            name,
            status: 'eligible',
            tooltip: 'Ready for promotion to Crew',
            type: 'promotion',
          });
        }
      });
      return manualOnly;
    }

    // Next, if no matches yet but we do have stats, fall back to stats-only rows
    if (stats.length > 0) {
      // Previously returned placeholder stats-only rows; suppress to avoid misleading entries.
      return [] as PlaceholderEntry[];
    }

    // Fallback: generate 50 placeholder rows when no stats yet
    // Suppress placeholder content entirely until real data is ready.
    return [] as PlaceholderEntry[];
  }, [activeUsersWithStats, stats, activeBadgeReusables, playerBadgesByUser, fetchedBadgesByUser]);

  // Proactively fetch missing badge data for users (especially Prospects) so promotion readiness can be computed without clicking
  React.useEffect(() => {
    if (!activeUsersWithStats || activeUsersWithStats.length === 0) return;
    // Determine Prospect rank IDs from env
    const prospectIds = (import.meta.env.VITE_PROSPECT_ID || "")
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);

    // Build list of user IDs that need badge fetching
    const toFetch: string[] = [];
    for (const { user } of activeUsersWithStats) {
      const id = String(user?.id ?? "");
      if (!id) continue;
      const userRankId = String((user?.rank ?? user?.rank_id ?? ""));
      // Only fetch for Prospects to limit API load
      if (!prospectIds.includes(userRankId)) continue;
      const alreadyProvided = playerBadgesByUser && Object.prototype.hasOwnProperty.call(playerBadgesByUser, id);
      const alreadyFetched = fetchedBadgesByUser && Object.prototype.hasOwnProperty.call(fetchedBadgesByUser, id);
      if (!alreadyProvided && !alreadyFetched) toFetch.push(id);
    }
    if (toFetch.length === 0) return;

    let cancelled = false;
    (async () => {
      // Fetch in parallel; could be batched if necessary
      try {
        const results = await Promise.all(
          toFetch.map(async (uid) => {
            try {
              const badges = await fetchBadgesByUserId(uid);
              return { uid, badges: Array.isArray(badges) ? badges : [] };
            } catch {
              return { uid, badges: [] as any[] };
            }
          })
        );
        if (cancelled) return;
        setFetchedBadgesByUser((prev) => {
          const next: Record<string, any[]> = { ...(prev || {}) };
          for (const { uid, badges } of results) {
            // Don't overwrite if parent provided since then it's authoritative
            if (playerBadgesByUser && Object.prototype.hasOwnProperty.call(playerBadgesByUser, uid)) continue;
            if (!(uid in next)) next[uid] = badges;
          }
          return next;
        });
      } catch {
        // swallow errors; best-effort prefetch
      }
    })();
    return () => { cancelled = true; };
  }, [activeUsersWithStats, playerBadgesByUser, fetchedBadgesByUser]);

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
