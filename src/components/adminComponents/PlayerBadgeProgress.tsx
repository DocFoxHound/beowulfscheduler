
import React from "react";
import styles from "./PlayerBadgeProgress.module.css";
import { createBadge } from "../../api/badgeRecordApi";
import { notifyAward } from "../../api/notifyAwardApi";
import { getBadgeProgress, isBadgeReady } from "../../utils/progressionEngine";

interface BadgeProgressProps {
  badgeReusables: any[];
  loading: boolean;
  playerStats: any;
  playerStatsLoading: boolean;
  playerBadges: any[];
  playerBadgesLoading: boolean;
  isModerator?: boolean;
  dbUser?: any; // Optional prop for database user context
  player?: any; // Optional prop for player context
  onRefreshBadges?: () => void; // Optional callback to refresh badge reusables
  onRefreshPlayerBadges?: () => void; // Optional callback to refresh player badges
}


const BadgeProgress: React.FC<BadgeProgressProps> = ({ badgeReusables, loading, playerStats, playerBadges, isModerator, dbUser, player, onRefreshBadges, onRefreshPlayerBadges }) => {
  if (loading) return <div>Loading...</div>;

  // Prepare a Set of badge_names for quick lookup
  const playerBadgeNames = React.useMemo(() => new Set((playerBadges || []).map(b => b.badge_name)), [playerBadges]);

  // Calculate total points earned
  const totalPoints = React.useMemo(() => (playerBadges || []).reduce((sum, b) => sum + (Number(b.badge_weight) || 0), 0), [playerBadges]);
// Table for earned player badges, grouped by series_id and sorted by series_position
const PlayerBadgesTable: React.FC<{ playerBadges: any[]; totalPoints: number }> = ({ playerBadges, totalPoints }) => {
  if (!playerBadges || playerBadges.length === 0) return null;

  // Group badges by series_id ("none" for those without)
  const grouped: Record<string, any[]> = {};
  playerBadges.forEach((badge) => {
    const seriesId = badge.series_id || "none";
    if (!grouped[seriesId]) grouped[seriesId] = [];
    grouped[seriesId].push(badge);
  });

  // Sort each group by series_position (ascending), fallback to badge_name
  Object.keys(grouped).forEach(seriesId => {
    grouped[seriesId].sort((a, b) => {
      const posA = Number(a.series_position ?? 0);
      const posB = Number(b.series_position ?? 0);
      if (posA !== posB) return posA - posB;
      const nameA = (a.badge_name || '').toLowerCase();
      const nameB = (b.badge_name || '').toLowerCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });
  });

  return (
    <div style={{ marginTop: 40 }}>
      <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Earned Badges</div>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 10 }}>
        Total Points Earned: {totalPoints}
      </div>
      {Object.entries(grouped).map(([seriesId, badges]) => (
        <div key={seriesId} style={{ marginBottom: 24 }}>
          {seriesId !== 'none' && (
            <div style={{ fontWeight: 600, fontSize: 16, margin: '10px 0 6px 0' }}>
              Series: {badges[0]?.badge_name || seriesId}
            </div>
          )}
          <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(80,90,120,0.06)' }}>
            <thead>
              <tr style={{ fontWeight: 600, fontSize: 15 }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1.5px solid #b0b6c3' }}>Name</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1.5px solid #b0b6c3' }}>Description</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', borderBottom: '1.5px solid #b0b6c3' }}>Weight</th>
              </tr>
            </thead>
            <tbody>
              {badges.map((badge, idx) => (
                <tr key={badge.id || idx} style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <td style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    {badge.badge_url && (
                      <img src={badge.badge_url} alt={badge.badge_name} style={{ width: 32, height: 32, borderRadius: 6, marginRight: 8 }} />
                    )}
                    <span>{badge.badge_name}</span>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 14 }}>{badge.badge_description}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{badge.badge_weight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

  // Group badges by subject, with special handling for Prestige badges
  const grouped: Record<string, any> = {};
  badgeReusables.forEach((badge) => {
    if (playerBadgeNames.has(badge.badge_name)) return; // skip earned badges
    if (badge.subject === "Prestige") {
      const prestigeName = badge.prestige_name || "Unknown";
      // Get player's prestige level for this prestige type
      let playerPrestigeLevel = null;
      if (prestigeName === "RAPTOR") playerPrestigeLevel = player?.raptor_level;
      else if (prestigeName === "RAIDER") playerPrestigeLevel = player?.raider_level;
      else if (prestigeName === "CORSAIR") playerPrestigeLevel = player?.corsair_level;
      // Only show badge if its prestige_level matches player's NEXT level
      const nextPrestigeLevel = (typeof playerPrestigeLevel === 'number' ? playerPrestigeLevel : 0) + 1;
      if (badge.prestige_level !== nextPrestigeLevel) return;
      // Group by subject -> prestige_name
      if (!grouped["Prestige"]) grouped["Prestige"] = {};
      if (!grouped["Prestige"][prestigeName]) grouped["Prestige"][prestigeName] = [];
      grouped["Prestige"][prestigeName].push(badge);
    } else {
      const subject = badge.subject || "Other";
      // Group by subject -> series_id
      if (!grouped[subject]) grouped[subject] = {};
      const seriesId = badge.series_id || "none";
      if (!grouped[subject][seriesId]) grouped[subject][seriesId] = [];
      grouped[subject][seriesId].push(badge);
    }
  });

  // Sort badges within each group
  Object.keys(grouped).forEach(subject => {
    if (subject === "Prestige") {
      Object.keys(grouped["Prestige"]).forEach(prestigeName => {
        grouped["Prestige"][prestigeName].sort((a: any, b: any) => {
          const nameA = (a.badge_name || '').toLowerCase();
          const nameB = (b.badge_name || '').toLowerCase();
          if (nameA < nameB) return -1;
          if (nameA > nameB) return 1;
          return 0;
        });
      });
    } else {
      Object.keys(grouped[subject]).forEach(seriesId => {
        grouped[subject][seriesId].sort((a: any, b: any) => {
          // Sort by series_position ascending
          const posA = Number(a.series_position ?? 0);
          const posB = Number(b.series_position ?? 0);
          if (posA !== posB) return posA - posB;
          // Fallback: sort by badge_name
          const nameA = (a.badge_name || '').toLowerCase();
          const nameB = (b.badge_name || '').toLowerCase();
          if (nameA < nameB) return -1;
          if (nameA > nameB) return 1;
          return 0;
        });
      });
    }
  });



  // State for Award confirmation modal
  const [showAwardModal, setShowAwardModal] = React.useState(false);
  const [awarding, setAwarding] = React.useState(false);
  const [awardError, setAwardError] = React.useState<string | null>(null);
  const [selectedBadge, setSelectedBadge] = React.useState<any>(null);

  // Handler for Award button click
  const handleAwardClick = (badge: any) => {
    setSelectedBadge(badge);
    setShowAwardModal(true);
    setAwardError(null);
  };

  // Handler for confirming award
  const handleConfirmAward = async () => {
    if (!selectedBadge || !playerStats?.user_id) return;
    setAwarding(true);
    setAwardError(null);
    try {
      // Construct badge record according to BadgeRecord type
      const badgeRecord = {
        id: `${Date.now()}${Math.floor(Math.random() * 10000)}`,
        user_id: playerStats.user_id,
        badge_name: selectedBadge.badge_name,
        badge_description: selectedBadge.badge_description,
        badge_weight: selectedBadge.badge_weight || 0,
        patch: selectedBadge.patch || null,
        badge_icon: selectedBadge.badge_icon || selectedBadge.image_url || "",
        badge_url: selectedBadge.badge_url || selectedBadge.image_url || "",
      };
      // Create badge in DB
      await createBadge(badgeRecord);
      // Notify player
      notifyAward(
        selectedBadge.badge_name,
        selectedBadge.badge_description,
        player.nickname || player.username || "Player",
        playerStats.user_id
      );
      setShowAwardModal(false);
      setSelectedBadge(null);
      // Refresh badge reusables if callback provided (after modal closes)
      if (typeof onRefreshBadges === 'function') {
        onRefreshBadges();
      }
      // Refresh player badges if callback provided
      if (typeof onRefreshPlayerBadges === 'function') {
        onRefreshPlayerBadges();
      }
    } catch (err) {
      setAwardError("Failed to award badge. Please try again.");
    } finally {
      setAwarding(false);
    }
  };

  // Tooltip component
  const InfoTooltip: React.FC<{ description: string }> = ({ description }) => {
    const [show, setShow] = React.useState(false);
    return (
      <span style={{ position: 'relative', display: 'inline-block', marginLeft: 6 }}>
        <span
          style={{ cursor: 'pointer', color: '#2196f3', fontSize: 16 }}
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
        >
          ℹ️
        </span>
        {show && (
          <div style={{
            position: 'absolute',
            left: '110%',
            top: '50%',
            transform: 'translateY(-50%)',
            background: '#23272f',
            color: '#fff',
            padding: '8px 14px',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(80,90,120,0.18)',
            fontSize: 13,
            zIndex: 10,
            minWidth: 180,
            maxWidth: 320,
            whiteSpace: 'normal',
          }}>
            {description}
          </div>
        )}
      </span>
    );
  };

  // Collapsible state for badge progress categories (excluding Earned Badges)
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({});
  // For nested collapsible (Prestige, series), use a composite key
  const getKey = (...parts: string[]) => parts.join('||');

  // On mount or when grouped changes, set all categories/subcategories to collapsed by default
  React.useEffect(() => {
    const newCollapsed: Record<string, boolean> = {};
    Object.entries(grouped)
      .filter(([subject]) => subject !== "Prestige" || isModerator)
      .forEach(([subject, badgesOrGroups]) => {
        const subjectKey = getKey(subject);
        newCollapsed[subjectKey] = true;
        if (subject === "Prestige") {
          Object.keys(badgesOrGroups).forEach(prestigeName => {
            const prestigeKey = getKey(subject, prestigeName);
            newCollapsed[prestigeKey] = true;
          });
        } else {
          Object.keys(badgesOrGroups).forEach(seriesId => {
            const seriesKey = getKey(subject, seriesId);
            newCollapsed[seriesKey] = true;
          });
        }
      });
    setCollapsed(newCollapsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(grouped), isModerator]);

  const handleToggle = (key: string) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={{ marginTop: "2rem", position: "relative" }}>
      <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 18 }}>Badge Progress</div>
      {badgeReusables.length === 0 && <div>No active badges.</div>}
      {/* Categorized badge list (collapsible) */}
      <div style={{ marginBottom: 32 }}>
        {Object.entries(grouped)
          .filter(([subject]) => subject !== "Prestige" || isModerator)
          .map(([subject, badgesOrGroups]) => {
            const subjectKey = getKey(subject);
            return (
              <div key={subject} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 17, marginBottom: 8 }}>
                  <button
                    onClick={() => handleToggle(subjectKey)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 18,
                      padding: 0,
                      marginRight: 4,
                      color: '#2196f3',
                      lineHeight: 1,
                      userSelect: 'none',
                    }}
                    aria-label={collapsed[subjectKey] ? `Expand ${subject}` : `Collapse ${subject}`}
                  >
                    {collapsed[subjectKey] ? '▶' : '▼'}
                  </button>
                  {subject}
                </div>
                {!collapsed[subjectKey] && (
                  subject === "Prestige"
                    ? Object.entries(badgesOrGroups).map(([prestigeName, badges]) => {
                        const prestigeKey = getKey(subject, prestigeName);
                        return (
                          <div key={prestigeName} style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500, fontSize: 15, marginBottom: 6 }}>
                              <button
                                onClick={() => handleToggle(prestigeKey)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: 16,
                                  padding: 0,
                                  marginRight: 4,
                                  color: '#2196f3',
                                  lineHeight: 1,
                                  userSelect: 'none',
                                }}
                                aria-label={collapsed[prestigeKey] ? `Expand Prestige: ${prestigeName}` : `Collapse Prestige: ${prestigeName}`}
                              >
                                {collapsed[prestigeKey] ? '▶' : '▼'}
                              </button>
                              Prestige: {prestigeName}
                            </div>
                            {!collapsed[prestigeKey] && (
                              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                                {(badges as any[]).map((badge: any, idx: number) => {
                                  const isCompleted = playerBadgeNames.has(badge.badge_name);
                                  const ready = isBadgeReady(badge, playerStats);
                                  let overallProgress = Math.round(getBadgeProgress(badge, playerStats) * 100);
                                  if (isCompleted) overallProgress = 100;
                                  return (
                                    <li key={badge.id || idx} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 0', borderBottom: '1px solid #e0e0e0' }}>
                                      {badge.image_url && (
                                        <img src={badge.image_url} alt={badge.badge_name} style={{ width: 36, height: 36, borderRadius: 6 }} />
                                      )}
                                      <span style={{ fontWeight: 600 }}>{badge.badge_name}</span>
                                      <InfoTooltip description={badge.badge_description || ''} />
                                      <div style={{ flex: 1, marginLeft: 8, marginRight: 8 }}>
                                        <div style={{ position: 'relative', background: '#f3f3f3', borderRadius: 6, height: 12, width: '100%', overflow: 'hidden' }}>
                                          <div style={{ height: '100%', width: `${overallProgress}%`, background: (overallProgress === 100 || ready) ? '#4caf50' : '#2196f3', transition: 'width 0.5s', position: 'absolute', left: 0, top: 0, borderRadius: 6 }} />
                                          <div
                                            style={{
                                              position: 'absolute',
                                              left: 0,
                                              top: 0,
                                              width: '100%',
                                              height: '100%',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              fontSize: 10,
                                              fontWeight: 600,
                                              color: overallProgress > 50 ? '#fff' : '#222',
                                              textShadow: overallProgress > 50 ? '0 1px 2px rgba(0,0,0,0.25)' : '0 1px 2px #fff',
                                              pointerEvents: 'none',
                                              userSelect: 'none',
                                              zIndex: 2,
                                            }}
                                          >
                                            {overallProgress}%
                                          </div>
                                        </div>
                                      </div>
                                      {isModerator && dbUser?.id !== playerStats?.user_id && (
                                        <button
                                          style={{
                                            background: '#ff9800',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: 5,
                                            padding: '6px 16px',
                                            fontWeight: 700,
                                            fontSize: 14,
                                            cursor: 'pointer',
                                            marginLeft: 'auto',
                                            boxShadow: '0 1px 4px rgba(80,90,120,0.10)'
                                          }}
                                          onClick={() => handleAwardClick(badge)}
                                        >
                                          Award
                                        </button>
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        );
                      })
                    : Object.entries(badgesOrGroups).map(([seriesId, badges]) => {
                        const seriesKey = getKey(subject, seriesId);
                        return (
                          <div key={seriesId} style={{ marginBottom: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500, fontSize: 15, marginBottom: 6 }}>
                              <button
                                onClick={() => handleToggle(seriesKey)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: 15,
                                  padding: 0,
                                  marginRight: 4,
                                  color: '#2196f3',
                                  lineHeight: 1,
                                  userSelect: 'none',
                                }}
                                aria-label={collapsed[seriesKey] ? `Expand Series: ${seriesId}` : `Collapse Series: ${seriesId}`}
                              >
                                {collapsed[seriesKey] ? '▶' : '▼'}
                              </button>
                              {seriesId !== 'none'
                                ? `Series: ${(Array.isArray(badges) && badges.length > 0 && badges[0].badge_name) ? badges[0].badge_name : seriesId}`
                                : 'Other Badges'}
                            </div>
                            {!collapsed[seriesKey] && (
                              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                                {(badges as any[]).map((badge: any, idx: number) => {
                                  const isCompleted = playerBadgeNames.has(badge.badge_name);
                                  const ready = isBadgeReady(badge, playerStats);
                                  let overallProgress = Math.round(getBadgeProgress(badge, playerStats) * 100);
                                  if (isCompleted) overallProgress = 100;
                                  return (
                                    <li key={badge.id || idx} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 0', borderBottom: '1px solid #e0e0e0' }}>
                                      {badge.image_url && (
                                        <img src={badge.image_url} alt={badge.badge_name} style={{ width: 36, height: 36, borderRadius: 6 }} />
                                      )}
                                      <span style={{ fontWeight: 600 }}>{badge.badge_name}</span>
                                      <InfoTooltip description={badge.badge_description || ''} />
                                      <div style={{ flex: 1, marginLeft: 8, marginRight: 8 }}>
                                        <div style={{ position: 'relative', background: '#f3f3f3', borderRadius: 6, height: 12, width: '100%', overflow: 'hidden' }}>
                                          <div style={{ height: '100%', width: `${overallProgress}%`, background: (overallProgress === 100 || ready) ? '#4caf50' : '#2196f3', transition: 'width 0.5s', position: 'absolute', left: 0, top: 0, borderRadius: 6 }} />
                                          <div
                                            style={{
                                              position: 'absolute',
                                              left: 0,
                                              top: 0,
                                              width: '100%',
                                              height: '100%',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              fontSize: 10,
                                              fontWeight: 600,
                                              color: overallProgress > 50 ? '#fff' : '#222',
                                              textShadow: overallProgress > 50 ? '0 1px 2px rgba(0,0,0,0.25)' : '0 1px 2px #fff',
                                              pointerEvents: 'none',
                                              userSelect: 'none',
                                              zIndex: 2,
                                            }}
                                          >
                                            {overallProgress}%
                                          </div>
                                        </div>
                                      </div>
                                      {isModerator && dbUser?.id !== playerStats?.user_id && (
                                        <button
                                          style={{
                                            background: '#ff9800',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: 5,
                                            padding: '6px 16px',
                                            fontWeight: 700,
                                            fontSize: 14,
                                            cursor: 'pointer',
                                            marginLeft: 'auto',
                                            boxShadow: '0 1px 4px rgba(80,90,120,0.10)'
                                          }}
                                          onClick={() => handleAwardClick(badge)}
                                        >
                                          Award
                                        </button>
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        );
                      })
                )}
              </div>
            );
          })}
      </div>
      {/* Player earned badges table */}
      <PlayerBadgesTable playerBadges={playerBadges} totalPoints={totalPoints} />

      {/* Award Confirmation Modal */}
      {showAwardModal && selectedBadge && (
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
            <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 16 }}>Confirm Award</div>
            <div style={{ marginBottom: 18 }}>
              Are you sure you want to award <strong>{selectedBadge.badge_name}</strong> to this player?
            </div>
            {awardError && <div style={{ color: "red", marginBottom: 10 }}>{awardError}</div>}
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => { setShowAwardModal(false); setSelectedBadge(null); }}
                style={{
                  background: "#eee",
                  color: "#333",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 16px",
                  fontWeight: 500,
                  cursor: awarding ? "not-allowed" : "pointer"
                }}
                disabled={awarding}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAward}
                style={{
                  background: "#4caf50",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 16px",
                  fontWeight: 600,
                  cursor: awarding ? "not-allowed" : "pointer"
                }}
                disabled={awarding}
              >
                {awarding ? "Awarding..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgeProgress;
