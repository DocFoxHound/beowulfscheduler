import React, { useEffect, useState } from "react";
import { SBLeaderboardOrgSummary } from "../../types/sb_leaderboard_org_summary";
import { fetchPlayerSummaryByNickname, fetchSBAllPlayerSummaries } from "../../api/leaderboardApi";

import { getUsersByRoninRole, getAllUsers } from "../../api/userService";

const normalizeHandleVariants = (raw?: string): string[] => {
  if (!raw || typeof raw !== "string") return [];
  const base = raw.trim();
  if (!base) return [];
  const set = new Set<string>();
  const push = (val?: string | null) => {
    const cleaned = val?.trim().toLowerCase();
    if (cleaned) set.add(cleaned);
  };
  push(base);
  push(base.replace(/\s+/g, ""));
  push(base.replace(/[._]/g, ""));
  push(base.replace(/["']/g, ""));
  push(base.replace(/[\s._"']/g, ""));
  return Array.from(set);
};

interface RoninTeamProps {
  dbUser: any;
  orgSummaries?: SBLeaderboardOrgSummary[];
}

export default function RoninTeam(props: RoninTeamProps) {
  const { dbUser, orgSummaries } = props;
  const [roninUsers, setRoninUsers] = useState<any[]>([]);
  const [roninSummaries, setRoninSummaries] = useState<any[]>([]); // enriched with summary + user id/handle
  const [roninMissing, setRoninMissing] = useState<any[]>([]); // users without summary
  const [globalSummaries, setGlobalSummaries] = useState<any[] | null>(null); // cache of all player summaries
  const RONIN_IDS = (import.meta.env.VITE_RONIN_ID || "").split(",").map((s: string) => s.trim()).filter(Boolean);

  useEffect(() => {
    const attemptFetchSummary = async (handle: string) => {
      const trimmed = (handle || "").trim();
      if (!trimmed) throw new Error('No summary found for empty handle');
      const variants = Array.from(new Set([
        trimmed,
        trimmed.toLowerCase(),
        trimmed.toUpperCase(),
        trimmed.replace(/\s+/g, ''),
        trimmed.replace(/"/g, ''),
        trimmed.replace(/[._]/g, ''),
        trimmed.replace(/[\s._]/g, ''),
      ].filter(Boolean)));
      for (const variant of variants) {
        try {
          const data = await fetchPlayerSummaryByNickname(variant);
          if (data) {
            console.debug('[RoninTeam] Summary matched using variant:', variant);
            return data;
          }
        } catch (err: any) {
          if (err?.response) {
            console.debug('[RoninTeam] Variant fetch failed:', { variant, status: err.response.status });
          } else {
            console.debug('[RoninTeam] Variant fetch error (network/other):', { variant, message: err?.message });
          }
        }
      }
      throw new Error('No summary found for any variant');
    };

    const loadAllSummariesOnce = async () => {
      if (globalSummaries && Array.isArray(globalSummaries) && globalSummaries.length > 0) {
        return globalSummaries;
      }
      try {
        console.log('[RoninTeam] Fetching ALL player summaries for aggregation...');
        const all = await fetchSBAllPlayerSummaries();
        setGlobalSummaries(all);
        console.log('[RoninTeam] Loaded all summaries count:', all.length);
        return all;
      } catch {
        console.warn('[RoninTeam] Failed to prefetch all summaries, will fall back to per-user variant fetching.');
        return null;
      }
    };

    const loadRoninUsers = async () => {
      try {
        console.log('[RoninTeam] Loading Ronin users via backend endpoint...');
        let users = await getUsersByRoninRole();
        if (!Array.isArray(users)) users = [];
        console.log('[RoninTeam] Backend returned users count:', users.length);

        if (users.length === 0) {
          console.warn('[RoninTeam] Backend returned 0 Ronin users. Falling back to getAllUsers with RONIN_IDS:', RONIN_IDS);
          const allUsers = await getAllUsers();
          if (Array.isArray(allUsers) && RONIN_IDS.length > 0) {
            users = allUsers.filter((u: any) => Array.isArray(u.roles) && u.roles.some((r: string) => RONIN_IDS.includes(r)));
            console.log('[RoninTeam] Filtered Ronin users from all users:', users.length);
          } else {
            users = [];
            if (!Array.isArray(allUsers)) {
              console.warn('[RoninTeam] getAllUsers did not return an array');
            }
            if (RONIN_IDS.length === 0) {
              console.warn('[RoninTeam] RONIN_IDS env var is empty; cannot filter Ronin users');
            }
          }
        }

        setRoninUsers(users);
        if (users.length > 0) {
          console.debug('[RoninTeam] Ronin users sample:', users.slice(0, 5).map((u: any) => ({ id: u.id, username: u.username, rsi_handle: u.rsi_handle, roles: u.roles })));
        }

        if (users.length > 0) {
          const allSummaries = await loadAllSummariesOnce();
          let summaryResults: Array<{ user: any; summary: any | null }> = [];
          let globalRankIndex: Map<string, number> | null = null;

          if (Array.isArray(allSummaries) && allSummaries.length > 0) {
            globalRankIndex = new Map<string, number>();
            const globalSorted = [...allSummaries].sort((a: any, b: any) => {
              const ratingDiff = (Number(b?.total_rating) || 0) - (Number(a?.total_rating) || 0);
              if (ratingDiff !== 0) return ratingDiff;
              const ar = typeof a?.avg_rank === 'number' ? a.avg_rank : Number.POSITIVE_INFINITY;
              const br = typeof b?.avg_rank === 'number' ? b.avg_rank : Number.POSITIVE_INFINITY;
              return ar - br;
            });
            globalSorted.forEach((summary: any, idx: number) => {
              const keys = [
                ...normalizeHandleVariants(summary?.nickname),
                ...normalizeHandleVariants(summary?.displayname),
                ...normalizeHandleVariants(summary?.rsi_handle),
              ];
              keys.forEach((key) => {
                if (key && !globalRankIndex!.has(key)) {
                  globalRankIndex!.set(key, idx + 1);
                }
              });
            });

            const index = new Map<string, any>();
            for (const s of allSummaries) {
              const candidates = [
                ...normalizeHandleVariants((s as any).nickname),
                ...normalizeHandleVariants((s as any).displayname),
                ...normalizeHandleVariants((s as any).rsi_handle),
              ];
              candidates.forEach((k) => {
                if (!index.has(k)) index.set(k, s);
              });
            }

            const initial = users.map((user: any) => {
              const variantsSet = new Set<string>();
              const pushAll = (arr: string[]) => arr.forEach((v) => variantsSet.add(v));
              pushAll(normalizeHandleVariants(user.rsi_handle));
              pushAll(normalizeHandleVariants(user.username));
              pushAll(normalizeHandleVariants(user.nickname));
              const variantsArr = Array.from(variantsSet);
              let found: any | null = null;
              for (const h of variantsArr) {
                if (index.has(h)) { found = index.get(h); break; }
              }
              return { user, summary: found };
            });

            summaryResults = await Promise.all(initial.map(async (rec) => {
              if (rec.summary) return rec;
              const candidates = [rec.user?.rsi_handle, rec.user?.username, rec.user?.nickname].filter(Boolean);
              for (const c of candidates) {
                try {
                  const s = await attemptFetchSummary(String(c));
                  return { user: rec.user, summary: s };
                } catch {
                  // try next candidate
                }
              }
              return rec;
            }));
          } else {
            summaryResults = await Promise.all(
              users.map(async (user: any) => {
                if (user.rsi_handle) {
                  try {
                    const summary = await attemptFetchSummary(user.rsi_handle);
                    return { user, summary };
                  } catch {
                    return { user, summary: null };
                  }
                }
                return { user, summary: null };
              })
            );
          }

          const validSummaries = summaryResults
            .filter(({ summary }) => summary)
            .map(({ summary, user }) => ({
              ...summary,
              rsi_handle: user?.rsi_handle ?? (summary as any)?.rsi_handle,
              username: user?.username ?? (summary as any)?.username,
              nickname: (summary as any)?.nickname ?? user?.nickname,
              id: user.id,
            } as any));

          const leaderboardSorted = [...validSummaries]
            .map((summary) => {
              const keys = [
                ...normalizeHandleVariants(summary.nickname),
                ...normalizeHandleVariants(summary.displayname),
                ...normalizeHandleVariants(summary.rsi_handle),
              ];
              const rank = keys
                .map((key) => globalRankIndex?.get(key))
                .find((val) => typeof val === 'number');
              return { ...summary, rating_rank: rank ?? null };
            })
            .sort((a, b) => {
              const ar = typeof a.rating_rank === 'number' ? a.rating_rank : Number.POSITIVE_INFINITY;
              const br = typeof b.rating_rank === 'number' ? b.rating_rank : Number.POSITIVE_INFINITY;
              if (ar !== br) return ar - br;
              const ratingDiff = (Number(b.total_rating) || 0) - (Number(a.total_rating) || 0);
              if (ratingDiff !== 0) return ratingDiff;
              const aAvg = typeof a.avg_rank === 'number' ? a.avg_rank : Number.POSITIVE_INFINITY;
              const bAvg = typeof b.avg_rank === 'number' ? b.avg_rank : Number.POSITIVE_INFINITY;
              return aAvg - bAvg;
            });
          setRoninSummaries(leaderboardSorted);

          const missing = summaryResults
            .filter(({ summary }) => !summary)
            .map(({ user }) => user);
          setRoninMissing(missing);
          console.log('[RoninTeam] Summary results:', {
            totalUsers: users.length,
            summariesFound: validSummaries.length,
            missingCount: missing.length,
            missingHandles: missing.slice(0, 10).map((u: any) => u.rsi_handle || u.username || u.id),
          });
        } else {
          setRoninSummaries([]);
          setRoninMissing([]);
          console.warn('[RoninTeam] No Ronin users found after both backend and fallback.');
        }
      } catch (e) {
        setRoninUsers([]);
        setRoninSummaries([]);
        setRoninMissing([]);
        console.error('[RoninTeam] Error loading Ronin users:', e);
      }
    };

    loadRoninUsers();
  }, []);

  // Normalize media URLs from RSI: accept absolute URLs, fix missing colon (https// -> https://),
  // and prefix host when path starts with '/media'.
  const resolveMediaUrl = (input?: string | null): string => {
    const BASE = 'https://robertsspaceindustries.com';
    const CDN_DEFAULT = 'https://cdn.robertsspaceindustries.com/static/images/account/avatar_default_medium.jpg';
    const fallback = CDN_DEFAULT;
    if (!input || typeof input !== 'string') return fallback;
    let s = input.trim();
    // If it's already absolute with scheme prefix, just return as-is
    if (s.startsWith('https:') || s.startsWith('http:')) return s;
    // Fix common malformed scheme (missing colon)
    if (s.startsWith('https//')) s = 'https://' + s.slice('https//'.length);
    if (s.startsWith('http//')) s = 'http://' + s.slice('http//'.length);
    if (s.startsWith('//')) return 'https:' + s;
    if (s.startsWith('cdn.robertsspaceindustries.com')) return 'https://' + s;
    if (/^https?:\/\//i.test(s)) return s; // already absolute
    // Normalize common path variants
    if (s.startsWith('/')) return `${BASE}${s}`;
    if (s.startsWith('media/') || s.startsWith('static/') || s.startsWith('images/') || s.startsWith('account/')) return `${BASE}/${s}`;
    // Default: append to base
    return `${BASE}/${s}`;
  };

  const formatFlightTime = (input: any) => {
    if (!input) return "-";
    if (typeof input === "object") {
      const hours = input.hours ?? 0;
      const mins = input.minutes ?? 0;
      return `${hours}h ${mins}m`;
    }
    if (typeof input === "number") {
      const hours = Math.floor(input);
      const mins = Math.round((input - hours) * 60);
      return `${hours}h ${mins}m`;
    }
    return String(input);
  };

  const roninHandle = dbUser?.rsi_handle || dbUser?.username;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5em' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: '0.25em' }}>
        <span style={{ fontSize: '0.8em', letterSpacing: '0.35em', color: '#ffd88c', textTransform: 'uppercase' }}>RONIN</span>
        <h3 style={{ margin: 0, fontSize: '1.5em', color: '#ffffff' }}>Competitive Dogfighters</h3>
        {roninHandle && (
          <p style={{ margin: 0, fontSize: '0.85em', color: '#d7d7d7' }}>
            {roninHandle}, Ronin sorties prioritize discipline, tempo control, and advanced dogfighting micro. Maintain your lead queue; cadence reviews happen weekly.
          </p>
        )}
      </header>
      <p style={{ margin: 0, lineHeight: 1.5 }}>
        Ronin are IronPoint's competitive pilots—structured wing fights, mirrored drills, and high-intensity duels. Gold standard comms, shared mental map, no wasted motion.
      </p>
      <div
        style={{
          marginTop: '0.6em',
          padding: '0.6em 0.8em',
          borderRadius: '8px',
          background: 'rgba(255,215,0,0.08)',
          border: '1px solid rgba(255,215,0,0.25)',
          fontSize: '0.85em',
          color: '#f7f2d0',
        }}
      >
        Team Captain: <strong>K0zuka</strong>
      </div>
      <div style={{ display: 'flex', gap: '0.75em', flexWrap: 'wrap' }}>
        <span style={{ background: '#ffd700', color: '#121212', padding: '0.35em 0.8em', borderRadius: '999px', fontSize: '0.75em', fontWeight: 600 }}>Competitive</span>
        <span style={{ background: '#2f3034', color: '#ededed', padding: '0.35em 0.8em', borderRadius: '999px', fontSize: '0.75em', fontWeight: 500 }}>Dogfighting</span>
        <span style={{ background: '#2f3034', color: '#ededed', padding: '0.35em 0.8em', borderRadius: '999px', fontSize: '0.75em', fontWeight: 500 }}>Teamfight Micro</span>
      </div>

      <div style={{ marginTop: '0.5em' }}>
        <h3 style={{ fontWeight: 'bold', fontSize: '1.25em', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.4em', marginBottom: '1em' }}>Roster</h3>
        {(roninSummaries.length === 0 && roninMissing.length === 0) ? (
          <p>No Ronin pilot summaries found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6em' }}>
            {roninSummaries.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6em' }}>
                {roninSummaries.map((summary) => {
                  const primaryLabel = summary.nickname?.trim()
                    ? summary.nickname
                    : (summary.username || summary.rsi_handle);
                  const stats = [
                    { label: 'KDA', value: summary.total_kda ? summary.total_kda.toFixed(2) : '-' },
                    { label: 'Rank', value: summary.sort_rank ? `#${summary.sort_rank}` : '-' },
                    { label: 'Flight Time', value: formatFlightTime(summary.total_flight_time) },
                  ];
                  return (
                    <div
                      key={summary.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.35em',
                        padding: '0.6em 0.9em',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        background: 'rgba(14,15,18,0.9)',
                        boxShadow: '0 6px 16px rgba(0,0,0,0.22)',
                        flexWrap: 'nowrap',
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65em', minWidth: 0, maxWidth: '32%', flexShrink: 0 }}>
                        <img
                          src={resolveMediaUrl(summary.account_media)}
                          alt={summary.rsi_handle}
                          title={(primaryLabel || summary.displayname || summary.rsi_handle) as string}
                          style={{ width: '38px', height: '38px', borderRadius: '999px', objectFit: 'cover', border: '1px solid rgba(255,215,0,0.35)' }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.98em', color: '#f7f6f1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{primaryLabel}</div>
                          <div style={{ fontSize: '0.78em', color: '#b4b4b4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{summary.rsi_handle}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.1em', marginLeft: 'auto', flexWrap: 'nowrap', fontSize: '0.82em', minWidth: 0, overflow: 'hidden' }}>
                        {stats.map((stat) => (
                          <span
                            key={`${summary.id}-${stat.label}`}
                            style={{
                              display: 'flex',
                              alignItems: 'baseline',
                              gap: '0.25em',
                              whiteSpace: 'nowrap',
                              flexShrink: 0
                            }}
                          >
                            <span style={{ fontSize: '0.62em', letterSpacing: '0.08em', color: '#8f8f8f', textTransform: 'uppercase' }}>{stat.label}</span>
                            <span style={{ fontSize: '0.9em', fontWeight: 600, color: '#fdfdfd' }}>{stat.value}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
