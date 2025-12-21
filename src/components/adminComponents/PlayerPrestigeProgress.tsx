import React, { useMemo, useState } from "react";
import { grantPrestige } from "../../api/grantPrestige";
import { groupPrestige, getBadgeProgress, isBadgeReady, voiceHoursFromStats } from "../../utils/progressionEngine";
import { getAllUsers } from "../../api/userService";
import type { User as OrgUser } from "../../types/user";
import { hasRoleMatch, splitRoleIds } from "../../utils/roleUtils";

// Simple module-level cache to avoid duplicate fetches when component is rendered twice
let cachedOrgUsers: OrgUser[] | null = null;
let cachedOrgUsersPromise: Promise<OrgUser[] | null> | null = null;

interface PlayerPrestigeProgressProps {
  activeBadgeReusables: any[];
  playerStats: any;
  playerStatsLoading: boolean;
  player?: any;
  isModerator?: boolean;
  dbUser?: any; // Optional prop for database user context
  /** If provided, limits rendering to a single prestige (RAPTOR or RAIDER) */
  onlyPrestige?: 'RAPTOR' | 'RAIDER';
  /** If false, hides the member lists (used on Admin Activity page) */
  showMembers?: boolean;
  /** If false, hides the progress / requirements UI for the prestige */
  showProgress?: boolean;
  /** Allows embedding the component without the default heading */
  showHeading?: boolean;
  /** Already-earned badges for the player */
  playerBadges?: any[];
}

const PrestigeProgress: React.FC<PlayerPrestigeProgressProps> = ({
  activeBadgeReusables,
  playerStats,
  playerStatsLoading,
  isModerator,
  dbUser,
  player,
  onlyPrestige,
  showMembers = true,
  showProgress = true,
  showHeading = true,
  playerBadges = [],
}) => {
  // Build groups with shared engine
  const prestigeGroups = groupPrestige(activeBadgeReusables || []);

  // Track earned badges for quick lookup
  const playerBadgeNames = useMemo(() => {
    const names = new Set<string>();
    (playerBadges || []).forEach((badge) => {
      if (badge?.badge_name) names.add(String(badge.badge_name).toLowerCase());
    });
    return names;
  }, [playerBadges]);
  const playerHasBadge = (badgeName?: string | null) => {
    if (!badgeName) return false;
    return playerBadgeNames.has(String(badgeName).toLowerCase());
  };

  // Local state for prestige levels to allow UI refresh after grant
  const [localLevels, setLocalLevels] = useState({
    raider: player?.raider_level ?? 0,
    raptor: player?.raptor_level ?? 0,
  });

  // Update localLevels if player prop changes (e.g., on prop refresh)
  React.useEffect(() => {
    setLocalLevels({
      raider: player?.raider_level ?? 0,
      raptor: player?.raptor_level ?? 0,
    });
  }, [player?.raider_level, player?.raptor_level]);

  const raiderLevel = localLevels.raider;
  const raptorLevel = localLevels.raptor;
  const nextRaider = (prestigeGroups["RAIDER"] || []).filter((b) => (b.prestige_level ?? 0) === raiderLevel + 1);
  const nextRaptor = (prestigeGroups["RAPTOR"] || []).filter((b) => (b.prestige_level ?? 0) === raptorLevel + 1);

  // Max level for prestige
  const MAX_PRESTIGE_LEVEL = 5;

  // Helper to calculate overall progress for a prestige's next level using engine
  const getPrestigeProgress = (badges: any[]): number => {
    if (!badges.length) return 0;
    const total = badges.reduce((sum, badge) => {
      if (playerHasBadge(badge?.badge_name)) return sum + 1;
      return sum + getBadgeProgress(badge, playerStats);
    }, 0);
    return total / badges.length;
  };

  // Simple progress bar component
  const ProgressBar = ({ progress }: { progress: number }) => (
    <div style={{ background: '#eee', borderRadius: 6, height: 18, width: 240, margin: '6px 0' }}>
      <div style={{
        width: `${Math.round(progress * 100)}%`,
        background: progress === 1 ? '#4caf50' : '#2196f3',
        height: '100%',
        borderRadius: 6,
        transition: 'width 0.3s',
        textAlign: 'right',
        color: 'white',
        fontWeight: 600,
        fontSize: 13,
        lineHeight: '18px',
        paddingRight: 8
      }}>{Math.round(progress * 100)}%</div>
    </div>
  );

  // Helper to determine if Grant button should show
  const canGrant = isModerator === true && dbUser?.id !== player?.user_id;

  // State for Grant confirmation modal
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [granting, setGranting] = useState(false);
  const [grantError, setGrantError] = useState<string | null>(null);
  // Track which prestige is being granted
  const [selectedPrestige, setSelectedPrestige] = useState<null | "RAPTOR" | "RAIDER">(null);

  // Fetch and cache org users to build lists under cards
  const [orgUsers, setOrgUsers] = useState<OrgUser[] | null>(cachedOrgUsers);
  const [orgUsersLoading, setOrgUsersLoading] = useState<boolean>(showMembers && !cachedOrgUsers);

  React.useEffect(() => {
    if (!showMembers) {
      // If we are not showing members, skip fetch to save bandwidth
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        if (cachedOrgUsers) {
          if (!cancelled) setOrgUsers(cachedOrgUsers);
          return;
        }
        if (!cachedOrgUsersPromise) {
          cachedOrgUsersPromise = getAllUsers() as unknown as Promise<OrgUser[] | null>;
        }
        const data = await cachedOrgUsersPromise;
        if (!cancelled) {
          cachedOrgUsers = Array.isArray(data) ? data : [];
          setOrgUsers(cachedOrgUsers);
        }
      } catch (e) {
        if (!cancelled) setOrgUsers([]);
      } finally {
        if (!cancelled) setOrgUsersLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [showMembers]);

  // Helper to parse env role IDs
  const toIds = (envVar?: string) => splitRoleIds(envVar);
  const CREW_IDS = toIds(import.meta.env.VITE_CREW_ID);
  const MARAUDER_IDS = toIds(import.meta.env.VITE_MARAUDER_ID);
  const BLOODED_IDS_ENV = toIds(import.meta.env.VITE_BLOODED_ID);
  const RONIN_IDS = toIds(import.meta.env.VITE_RONIN_ID); // Ronin role IDs for highlight/tag
  const REAVER_IDS = toIds(import.meta.env.VITE_REAVER_ID); // Reaver role IDs for RAIDER list highlight

  const hasAny = (roles: string[] | undefined, ids: string[]) => hasRoleMatch(roles, ids);
  const isActiveRank = (u: OrgUser) => hasAny(u.roles, BLOODED_IDS_ENV) || hasAny(u.roles, MARAUDER_IDS) || hasAny(u.roles, CREW_IDS);

  // Build sorted lists depending on view
  const raptorList = useMemo(() => {
    if (!orgUsers) return [] as OrgUser[];
    return orgUsers
      .filter(isActiveRank)
      .filter(u => (u.raptor_level ?? 0) > 0)
      .slice() // copy before sort
      .sort((a, b) => (b.raptor_level ?? 0) - (a.raptor_level ?? 0) || (a.username || "").localeCompare(b.username || ""));
  }, [orgUsers]);

  const raiderList = useMemo(() => {
    if (!orgUsers) return [] as OrgUser[];
    return orgUsers
      .filter(isActiveRank)
      .filter(u => (u.raider_level ?? 0) > 0)
      .slice()
      .sort((a, b) => (b.raider_level ?? 0) - (a.raider_level ?? 0) || (a.username || "").localeCompare(b.username || ""));
  }, [orgUsers]);

  // Grouped lists by level
  const raptorGroups = useMemo(() => {
    const groups = new Map<number, OrgUser[]>();
    for (const u of raptorList) {
      const lvl = u.raptor_level ?? 0;
      if (lvl <= 0) continue;
      if (!groups.has(lvl)) groups.set(lvl, []);
      groups.get(lvl)!.push(u);
    }
    return Array.from(groups.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([level, users]) => ({ level, users: users.slice().sort((a, b) => (a.nickname || a.username || '').localeCompare(b.nickname || b.username || '')) }));
  }, [raptorList]);

  const raiderGroups = useMemo(() => {
    const groups = new Map<number, OrgUser[]>();
    for (const u of raiderList) {
      const lvl = u.raider_level ?? 0;
      if (lvl <= 0) continue;
      if (!groups.has(lvl)) groups.set(lvl, []);
      groups.get(lvl)!.push(u);
    }
    return Array.from(groups.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([level, users]) => ({ level, users: users.slice().sort((a, b) => (a.nickname || a.username || '').localeCompare(b.nickname || b.username || '')) }));
  }, [raiderList]);

  // Collapsible state per level for readability
  const [collapsedRaptorLevels, setCollapsedRaptorLevels] = useState<Record<number, boolean>>({});
  const [collapsedRaiderLevels, setCollapsedRaiderLevels] = useState<Record<number, boolean>>({});

  const toggleRaptorLevel = (level: number) => {
    setCollapsedRaptorLevels((prev) => ({ ...prev, [level]: !prev[level] }));
  };
  const toggleRaiderLevel = (level: number) => {
    setCollapsedRaiderLevels((prev) => ({ ...prev, [level]: !prev[level] }));
  };

  // Handler for Grant action
  const handleGrant = async () => {
    if (!selectedPrestige) return;
    setGranting(true);
    setGrantError(null);
    try {
      let prestigeLevel = 0;
      let prestigeKey = "";
      if (selectedPrestige === "RAPTOR") {
        prestigeLevel = raptorLevel + 1;
        prestigeKey = "raptor";
      }
      if (selectedPrestige === "RAIDER") {
        prestigeLevel = raiderLevel + 1;
        prestigeKey = "raider";
      }
      await grantPrestige(player?.id, selectedPrestige, prestigeLevel);
      // Update local level for the granted prestige
      setLocalLevels((prev) => ({ ...prev, [prestigeKey]: prestigeLevel }));
      setShowGrantModal(false);
      setSelectedPrestige(null);
    } catch (err) {
      setGrantError("Failed to grant prestige. Please try again.");
    } finally {
      setGranting(false);
    }
  };

  // Determine which sections to show based on onlyPrestige prop
  const showRaptor = !onlyPrestige || onlyPrestige === 'RAPTOR';
  const showRaider = !onlyPrestige || onlyPrestige === 'RAIDER';
  const wrapperStyle = {
    marginTop: showProgress || showHeading ? "2rem" : 0,
    position: "relative" as const,
  };

  return (
    <div style={wrapperStyle}>
      {showHeading && (
        <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 18 }}>
          {onlyPrestige ? `${onlyPrestige} Prestige Progress` : 'Prestige Progress'}
        </div>
      )}
      {showRaptor && (
        <section style={{ marginBottom: "1rem" }}>
          {showProgress && (
            <>
              <strong>RAPTOR {raptorLevel} → {Math.min(raptorLevel + 1, MAX_PRESTIGE_LEVEL)} Advancement:</strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                <ProgressBar progress={raptorLevel >= MAX_PRESTIGE_LEVEL ? 1 : getPrestigeProgress(nextRaptor)} />
                {canGrant && raptorLevel < MAX_PRESTIGE_LEVEL && (
                  <button
                    style={{ height: 32, padding: '0 18px', fontWeight: 600, background: '#0ebc37ff', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                    onClick={() => { setShowGrantModal(true); setSelectedPrestige("RAPTOR"); }}
                  >
                    Grant
                  </button>
                )}
              </div>
              <div style={{ marginTop: 10, background: '#1e232b', color: '#e6eef8', border: '1px solid #2c3440', borderRadius: 8, padding: 12 }}>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li style={{ marginBottom: 6 }}>Defeat the next level of RAPTOR pilot in a Best-Out-Of-Three dogfight.</li>
                  <li>Pass a Teamfight assessment with a Ronin Team (our competitive dogfighting team) pilot.</li>
                </ul>
              </div>
            </>
          )}
          {showMembers && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>RAPTOR Members</div>
              <div style={{ background: '#1e232b', color: '#e6eef8', border: '1px solid #2c3440', borderRadius: 8, padding: 8 }}>
                {orgUsersLoading ? (
                  <div>Loading…</div>
                ) : raptorGroups.length === 0 ? (
                  <div>No active members found.</div>
                ) : (
                  <div>
                    {raptorGroups.map(group => (
                      <div key={group.level} style={{ marginBottom: 8 }}>
                        <div
                          onClick={() => toggleRaptorLevel(group.level)}
                          style={{
                            fontWeight: 700,
                            color: '#9cc3ff',
                            margin: '6px 0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            cursor: 'pointer',
                            userSelect: 'none'
                          }}
                          title="Toggle group"
                        >
                          <span style={{ display: 'inline-block', width: 14 }}>
                            {collapsedRaptorLevels[group.level] ? '▶' : '▼'}
                          </span>
                          <span>Level {group.level}</span>
                        </div>
                        {!collapsedRaptorLevels[group.level] && (
                          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 0 14px' }}>
                            {group.users.map((u, idx) => {
                            const isRoninRole = hasRoleMatch(u.roles, RONIN_IDS);
                            return (
                              <li
                                key={u.id}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  padding: '6px 6px',
                                  borderBottom: '1px solid #2c3440',
                                  marginLeft: 6,
                                  borderRadius: 4,
                                  background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                                  ...(isRoninRole ? {
                                    background: 'rgba(255,215,0,0.10)',
                                    color: '#ffd700',
                                    fontWeight: 600
                                  } : {})
                                }}
                              >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {u.nickname || u.username}
                                  {isRoninRole && (
                                    <span
                                      style={{
                                        background: '#ffd700',
                                        color: '#1a1a1a',
                                        padding: '2px 6px',
                                        borderRadius: 4,
                                        fontSize: 11,
                                        fontWeight: 700,
                                        letterSpacing: '0.05em'
                                      }}
                                    >RONIN</span>
                                  )}
                                </span>
                              </li>
                            );
                            })}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}
      {showRaider && (
        <section>
          {showProgress && (
            <>
              <div style={{ marginBottom: "1rem" }}>
                <strong>RAIDER {raiderLevel} → {Math.min(raiderLevel + 1, MAX_PRESTIGE_LEVEL)} Advancement:</strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <ProgressBar progress={raiderLevel >= MAX_PRESTIGE_LEVEL ? 1 : getPrestigeProgress(nextRaider)} />
                  {canGrant && raiderLevel < MAX_PRESTIGE_LEVEL && (
                    <button
                      style={{ height: 32, padding: '0 18px', fontWeight: 600, background: '#0ebc37ff', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                      onClick={() => { setShowGrantModal(true); setSelectedPrestige("RAIDER"); }}
                    >
                      Grant
                    </button>
                  )}
                </div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {raiderLevel >= MAX_PRESTIGE_LEVEL ? <li>Max level reached.</li> :
                  nextRaider.length === 0 ? <li>No requirements for next level.</li> :
                  nextRaider.map((badge, idx) => {
                    const isEarned = playerHasBadge(badge?.badge_name);
                    return (
                      <li key={idx} style={{ marginBottom: 18, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      {badge.image_url && <img src={badge.image_url} alt="badge" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 6, marginRight: 8 }} />}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                          {badge.badge_name}
                          {isEarned && (
                            <span style={{ background: '#4caf50', color: '#fff', borderRadius: 10, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                              Awarded
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>{badge.badge_description}</div>
                        {(!badge.trigger || badge.trigger.length === 0) ? (
                          <div>
                            <em>Given Manually</em>
                            {isEarned && <div style={{ color: '#4caf50', fontWeight: 600, marginTop: 4 }}>Already awarded</div>}
                          </div>
                        ) : (
                          <div style={{ fontSize: 13 }}>
                            {badge.trigger.map((triggerStr: string | { metric: string; operator: string; value: number }, tIdx: number) => {
                              let parsed: any;
                              try {
                                parsed = typeof triggerStr === 'string' ? JSON.parse(triggerStr) : triggerStr;
                              } catch {
                                return <div key={tIdx}>Invalid requirement</div>;
                              }
                              if (!parsed || typeof parsed !== 'object' || parsed.metric === undefined || parsed.operator === undefined || parsed.value === undefined) {
                                return <div key={tIdx}>Invalid requirement</div>;
                              }
                              const metric: string = parsed.metric;
                              const operator: string = parsed.operator;
                              const value: number = Number(parsed.value);
                              let playerValue = playerStats?.[metric] ?? 0;
                              if (metric === 'voicehours' || metric === 'voice_minutes') {
                                playerValue = voiceHoursFromStats(playerStats);
                              }
                              const met = isEarned || isBadgeReady({ ...badge, trigger: [parsed] }, playerStats);
                              return (
                                <div key={tIdx} style={{ color: met ? '#4caf50' : '#d32f2f' }}>
                                  <strong>{metric}</strong> {operator} <strong>{value}</strong> &nbsp;
                                  (<span>you: {typeof playerValue === 'number' ? Math.round(playerValue) : playerValue}</span>)
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                  })}
              </ul>
            </>
          )}
          {showMembers && (
            <div style={{ marginTop: 4 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>RAIDER Members</div>
              <div style={{ background: '#1e232b', color: '#e6eef8', border: '1px solid #2c3440', borderRadius: 8, padding: 8 }}>
                {orgUsersLoading ? (
                  <div>Loading…</div>
                ) : raiderGroups.length === 0 ? (
                  <div>No active members found.</div>
                ) : (
                  <div>
                    {raiderGroups.map(group => (
                      <div key={group.level} style={{ marginBottom: 8 }}>
                        <div
                          onClick={() => toggleRaiderLevel(group.level)}
                          style={{
                            fontWeight: 700,
                            color: '#9cc3ff',
                            margin: '6px 0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            cursor: 'pointer',
                            userSelect: 'none'
                          }}
                          title="Toggle group"
                        >
                          <span style={{ display: 'inline-block', width: 14 }}>
                            {collapsedRaiderLevels[group.level] ? '▶' : '▼'}
                          </span>
                          <span>Level {group.level}</span>
                        </div>
                        {!collapsedRaiderLevels[group.level] && (
                          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 0 14px' }}>
                            {group.users.map((u, idx) => {
                              const isReaverRole = hasRoleMatch(u.roles, REAVER_IDS);
                              return (
                                <li
                                  key={u.id}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '6px 6px',
                                    borderBottom: '1px solid #2c3440',
                                    marginLeft: 6,
                                    borderRadius: 4,
                                    background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                                    ...(isReaverRole ? {
                                      background: 'rgba(240,93,94,0.10)',
                                      color: '#f05d5e',
                                      fontWeight: 600
                                    } : {})
                                  }}
                                >
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {u.nickname || u.username}
                                    {isReaverRole && (
                                      <span
                                        style={{
                                          background: '#f05d5e',
                                          color: '#1a1a1a',
                                          padding: '2px 6px',
                                          borderRadius: 4,
                                          fontSize: 11,
                                          fontWeight: 700,
                                          letterSpacing: '0.05em'
                                        }}
                                      >REAVER</span>
                                    )}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}
      {showGrantModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.3)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{
            background: "#23272f",
            color: "#fff",
            borderRadius: 10,
            padding: 32,
            minWidth: 320,
            boxShadow: "0 2px 16px rgba(0,0,0,0.18)"
          }}>
            <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 16 }}>Confirm Grant</div>
            <div style={{ marginBottom: 18 }}>
              Are you sure you want to grant this prestige level?
            </div>
            {grantError && <div style={{ color: "red", marginBottom: 10 }}>{grantError}</div>}
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => { setShowGrantModal(false); setSelectedPrestige(null); }}
                style={{
                  background: "#eee",
                  color: "#333",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 16px",
                  fontWeight: 500,
                  cursor: granting ? "not-allowed" : "pointer"
                }}
                disabled={granting}
              >
                Cancel
              </button>
              <button
                onClick={handleGrant}
                style={{
                  background: "#4caf50",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 16px",
                  fontWeight: 600,
                  cursor: granting ? "not-allowed" : "pointer"
                }}
                disabled={granting}
              >
                {granting ? "Granting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrestigeProgress;
