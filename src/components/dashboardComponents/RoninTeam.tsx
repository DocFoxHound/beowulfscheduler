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
  const [playerSummary, setPlayerSummary] = useState<any>(null);
  const [roninUsers, setRoninUsers] = useState<any[]>([]);
  const [roninSummaries, setRoninSummaries] = useState<any[]>([]); // enriched with summary + user id/handle
  const [roninMissing, setRoninMissing] = useState<any[]>([]); // users without summary
  const [globalSummaries, setGlobalSummaries] = useState<any[] | null>(null); // cache of all player summaries
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

    if (dbUser?.rsi_handle) {
      console.log('[RoninTeam] Fetching player summary for handle:', dbUser.rsi_handle);
      setLoading(true);
      attemptFetchSummary(dbUser.rsi_handle)
        .then((data) => {
          setPlayerSummary(data);
          setError(null);
          console.log('[RoninTeam] Loaded player summary:', {
            handle: dbUser.rsi_handle,
            rank: (data as any)?.rank,
            total_rating: (data as any)?.total_rating,
            avg_rank: (data as any)?.avg_rank,
          });
        })
        .catch(() => {
          setError("You do not have a leaderboard summary yet. Please play some matches to generate one.");
          setPlayerSummary(null);
          console.warn('[RoninTeam] No player summary found for handle (after variant attempts):', dbUser.rsi_handle);
        })
        .finally(() => setLoading(false));
    }

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
              .map(({ summary, user }) => ({ ...summary, rsi_handle: user.rsi_handle, id: user.id } as any));

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
  }, [dbUser?.rsi_handle]);

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

  return (
    <div>
      <h2>RONIN</h2>
      {/* You can use dbUser for more personalized info here if needed */}
      {loading && <p>Loading leaderboard data...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {playerSummary && (
        <div style={{ marginTop: '1em' }}>
          <h3>Leaderboard Summary for {dbUser.rsi_handle}</h3>
          <ul>
            <li>Rank: {playerSummary.rank}</li>
            <li>Total Kills: {String(playerSummary.total_kills)}</li>
            <li>Total Deaths: {String(playerSummary.total_deaths)}</li>
            <li>Total Rating: {playerSummary.total_rating}</li>
            <li>Average Rank: {playerSummary.avg_rank}</li>
            <li>Flight Time: {typeof playerSummary.total_flight_time === "object" && playerSummary.total_flight_time !== null
              ? `${playerSummary.total_flight_time.hours ?? 0}:${playerSummary.total_flight_time.minutes ?? 0}:${playerSummary.total_flight_time.seconds ?? 0}`
              : playerSummary.total_flight_time}
            </li>
            {/* Add more fields as needed */}
          </ul>
        </div>
      )}
      


      <div style={{ marginTop: '2em' }}>
        <h3 style={{ fontWeight: 'bold', fontSize: '1.5em', letterSpacing: '1px', borderBottom: '2px solid #222', paddingBottom: '0.3em', marginBottom: '1em' }}>The Ronin</h3>
        {(roninSummaries.length === 0 && roninMissing.length === 0) ? (
          <p>No Ronin pilot summaries found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2em' }}>
            {roninSummaries.length > 0 && (
              <div>
                {roninSummaries.map((summary) => (
                  <div key={summary.id} style={{ display: 'flex', alignItems: 'center', background: '#181a1b', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', padding: '1em', marginBottom: '0.5em' }}>
                    <img
                      src={resolveMediaUrl(summary.account_media)}
                      alt={summary.rsi_handle}
                      title={(summary.nickname || summary.displayname || summary.rsi_handle) as string}
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', marginRight: '1em', border: '2px solid #444' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1.15em', color: '#e0e0e0', marginBottom: '0.2em' }}>{summary.rsi_handle}</div>
                      <div style={{ color: '#b0b0b0', fontSize: '0.85em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <span style={{ marginRight: '1.5em' }}>Rating: <span style={{ fontWeight: 'bold', color: '#ffd700' }}>{summary.total_rating}</span></span>
                        <span style={{ marginRight: '1.5em' }}>Flight Time: <span style={{ fontWeight: 'bold' }}>{typeof summary.total_flight_time === "object" && summary.total_flight_time !== null
                          ? `${summary.total_flight_time.hours ?? 0}:${summary.total_flight_time.minutes ?? 0}:${summary.total_flight_time.seconds ?? 0}`
                          : summary.total_flight_time}</span></span>
                        <span>Rank: <span style={{ fontWeight: 'bold', color: '#9ad0ff' }}>{summary.avg_rank !== undefined && summary.avg_rank !== null ? Math.round(summary.avg_rank) : '-'}</span></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {roninMissing.length > 0 && (
              <div style={{ marginTop: '0.2em' }}>
                <h4 style={{ color: '#c00', fontWeight: 'bold' }}>No leaderboard record yet</h4>
                {roninSummaries.length === 0 && (
                  <p style={{ color: '#999', marginTop: '0.3em' }}>Showing placeholder roster cards until summaries are generated.</p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6em', marginTop: '0.6em' }}>
                  {roninMissing.map((user) => (
                    <div key={user.id} style={{ display: 'flex', alignItems: 'center', background: '#141516', borderRadius: '8px', padding: '0.75em 0.9em', boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7em', color: '#666', marginRight: '0.9em', border: '2px solid #333' }}>N/A</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '1.05em', color: '#ddd', marginBottom: '0.15em' }}>{user.rsi_handle || user.username || user.name}</div>
                        <div style={{ fontSize: '0.75em', color: '#777' }}>Rating: - | Flight Time: - | Rank: -</div>
                      </div>
                      <div style={{ fontSize: '0.65em', background: '#333', color: '#aaa', padding: '0.25em 0.55em', borderRadius: '6px' }}>Pending</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
