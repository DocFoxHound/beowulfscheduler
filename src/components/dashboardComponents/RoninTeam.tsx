import React, { useEffect, useState } from "react";
import { SBLeaderboardOrgSummary } from "../../types/sb_leaderboard_org_summary";
import { fetchPlayerSummaryByNickname, fetchSBAllPlayerSummaries } from "../../api/leaderboardApi";

import { getUsersByRoninRole, getAllUsers } from "../../api/userService";



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
    //   {orgSummaries && Array.isArray(orgSummaries) && orgSummaries.length > 0 && (() => {
  const RONIN_IDS = (import.meta.env.VITE_RONIN_ID || "").split(",").map((s: string) => s.trim()).filter(Boolean);

  useEffect(() => {
    // Fetch leaderboard summary for the current user
    const attemptFetchSummary = async (handle: string) => {
      // Build normalization variants to maximize match likelihood across case/punctuation differences
      const trimmed = handle.trim();
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
          // Continue trying other variants
        }
      }
      throw new Error('No summary found for any variant');
    };

    // Helper to lazy-load all summaries once so we can do client-side matching (mirrors AdminUserList approach)
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
      } catch (e) {
        console.warn('[RoninTeam] Failed to prefetch all summaries, will fall back to per-user variant fetching.');
        return null;
      }
    };

    // Fetch all users with Ronin role (backend endpoint), fallback to client-side filter if needed
    const loadRoninUsers = async () => {
      try {
        console.log('[RoninTeam] Loading Ronin users via backend endpoint...');
        let users = await getUsersByRoninRole();
        console.log('[RoninTeam] Backend returned users count:', Array.isArray(users) ? users.length : 0);
        if (!users || users.length === 0) {
          // Fallback: fetch all users and filter by env Ronin IDs
          console.warn('[RoninTeam] Backend returned 0 Ronin users. Falling back to getAllUsers with RONIN_IDS:', RONIN_IDS);
          const allUsers = await getAllUsers();
          if (Array.isArray(allUsers) && RONIN_IDS.length > 0) {
            users = allUsers.filter((u: any) => Array.isArray(u.roles) && u.roles.some((r: string) => RONIN_IDS.includes(r)));
            console.log('[RoninTeam] Filtered Ronin users from all users:', users.length);
          } else {
            users = [] as any[];
            if (!Array.isArray(allUsers)) {
              console.warn('[RoninTeam] getAllUsers did not return an array');
            }
            if (RONIN_IDS.length === 0) {
              console.warn('[RoninTeam] RONIN_IDS env var is empty; cannot filter Ronin users');
            }
          }
        }
        setRoninUsers(users || []);
        if (Array.isArray(users)) {
          console.debug('[RoninTeam] Ronin users sample:', users.slice(0, 5).map((u: any) => ({ id: u.id, username: u.username, rsi_handle: u.rsi_handle, roles: u.roles })));
        }
        if (users && users.length > 0) {
          // Load all summaries first for efficient matching
            const allSummaries = await loadAllSummariesOnce();
            let summaryResults: Array<{ user: any; summary: any | null }> = [];

            if (Array.isArray(allSummaries) && allSummaries.length > 0) {
              // Normalization helper: generate multiple variant keys for robust matching
              const normKeys = (raw?: string) => {
                if (!raw || typeof raw !== 'string') return [] as string[];
                const t = raw.trim();
                const set = new Set<string>();
                const push = (s: string) => { if (s) set.add(s.toLowerCase()); };
                // Base variants
                push(t);
                push(t.replace(/\s+/g, ''));
                push(t.replace(/"/g, ''));
                push(t.replace(/[._]/g, ''));
                push(t.replace(/[\s._]/g, ''));
                // Leet-style digit -> letter substitutions (k0zuka -> kozuka, 3lite -> elite)
                const digitToLetter = t
                  .replace(/0/g, 'o')
                  .replace(/1/g, 'l')
                  .replace(/3/g, 'e')
                  .replace(/4/g, 'a')
                  .replace(/5/g, 's')
                  .replace(/7/g, 't');
                push(digitToLetter);
                push(digitToLetter.replace(/[._]/g, ''));
                // Letter -> digit (optional) to catch inverse scoreboard oddities (e.g., o -> 0)
                const letterToDigit = t
                  .replace(/o/gi, '0')
                  .replace(/l/gi, '1')
                  .replace(/e/gi, '3')
                  .replace(/a/gi, '4')
                  .replace(/s/gi, '5')
                  .replace(/t/gi, '7');
                push(letterToDigit);
                push(letterToDigit.replace(/[._]/g, ''));
                return Array.from(set);
              };
              // Preprocess for O(1) matching using normalized keys (both raw and cleaned variants)
              const index = new Map<string, any>();
              for (const s of allSummaries) {
                const candidates = [
                  ...(normKeys((s as any).nickname)),
                  ...(normKeys((s as any).displayname)),
                  ...(normKeys((s as any).rsi_handle)),
                ];
                candidates.forEach((k) => {
                  if (!index.has(k)) index.set(k, s); // first wins; order not critical
                });
              }
              // Attempt index match using rsi_handle, username, nickname and their variants
              const initial = users.map((user: any) => {
                const variantsSet = new Set<string>();
                const pushAll = (arr: string[]) => arr.forEach(v => variantsSet.add(v));
                pushAll(normKeys(user.rsi_handle));
                pushAll(normKeys(user.username));
                pushAll(normKeys(user.nickname));
                const variantsArr = Array.from(variantsSet);
                let found: any | null = null;
                for (const h of variantsArr) {
                  if (index.has(h)) { found = index.get(h); break; }
                }
                // Targeted diagnostic logging for kozuka / k0zuka matching issues
                const loweredName = (user.username || '').toLowerCase();
                const loweredNick = (user.nickname || '').toLowerCase();
                if (loweredName.includes('k0zuka') || loweredNick.includes('kozuka')) {
                  console.log('[RoninTeam][DEBUG][Kozuka] User variants generated:', {
                    userId: user.id,
                    username: user.username,
                    nickname: user.nickname,
                    rsi_handle: user.rsi_handle,
                    variants: variantsArr.slice(0, 50), // cap size
                    matchedKey: found ? variantsArr.find(v => index.has(v)) : null,
                    summaryFound: !!found,
                  });
                }
                return { user, summary: found };
              });
              // Fallback for still-missing: try per-user network variant attempts by RSI handle, username, then nickname
              summaryResults = await Promise.all(initial.map(async (rec) => {
                if (rec.summary) return rec;
                const candidates = [rec.user?.rsi_handle, rec.user?.username, rec.user?.nickname].filter(Boolean);
                for (const c of candidates) {
                  try {
                    const s = await attemptFetchSummary(String(c));
                    const lowered = String(c).toLowerCase();
                    if (lowered.includes('k0zuka') || lowered.includes('kozuka')) {
                      console.log('[RoninTeam][DEBUG][Kozuka] Fallback network fetch succeeded for candidate:', c);
                    }
                    return { user: rec.user, summary: s };
                  } catch {
                    // try next candidate
                  }
                }
                const loweredAll = candidates.map(c => String(c).toLowerCase());
                if (loweredAll.some(v => v.includes('k0zuka') || v.includes('kozuka'))) {
                  console.warn('[RoninTeam][DEBUG][Kozuka] All fallback candidates failed for user:', {
                    userId: rec.user.id,
                    username: rec.user.username,
                    nickname: rec.user.nickname,
                    rsi_handle: rec.user.rsi_handle,
                    candidates,
                  });
                }
                return rec;
              }));
            } else {
              // Fallback to per-user network variant attempts (slower)
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

            // Separate valid summaries and missing records
            const validSummaries = summaryResults
              .filter(({ summary }) => summary)
              .map(({ summary, user }) => ({
                ...summary,
                rsi_handle: user?.rsi_handle ?? (summary as any)?.rsi_handle,
                username: user?.username ?? (summary as any)?.username,
                nickname: (summary as any)?.nickname ?? user?.nickname,
                id: user.id,
              } as any));

            // Sort by avg_rank ascending (best rank = lowest number). If avg_rank missing, push to end.
            validSummaries.sort((a, b) => {
              const ar = typeof a.avg_rank === 'number' ? a.avg_rank : Number.POSITIVE_INFINITY;
              const br = typeof b.avg_rank === 'number' ? b.avg_rank : Number.POSITIVE_INFINITY;
              if (ar !== br) return ar - br; // ascending rank number
              // Secondary tie-breaker: higher total_rating first
              return (b.total_rating ?? 0) - (a.total_rating ?? 0);
            });
            setRoninSummaries(validSummaries);

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
        // Silent fail; keep UI minimal but avoid crash
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
                    { label: 'Rating', value: summary.total_rating ?? '-' },
                    { label: 'Avg Rank', value: summary.avg_rank !== undefined && summary.avg_rank !== null ? `#${Math.round(summary.avg_rank)}` : '-' },
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
