
import React from "react";
import styles from "./PlayerBadgeProgress.module.css";
import { createBadge } from "../../api/badgeRecordApi";
import { notifyAward } from "../../api/notifyAwardApi";

interface BadgeProgressProps {
  activeBadgeReusables: any[];
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


// Helper to evaluate conditionals
const evaluateCondition = (playerValue: number, operator: string, targetValue: number) => {
  switch (operator) {
    case '>=':
      return playerValue >= targetValue;
    case '<=':
      return playerValue <= targetValue;
    case '>':
      return playerValue > targetValue;
    case '<':
      return playerValue < targetValue;
    case '=':
    case '==':
      return playerValue === targetValue;
    default:
      return false;
  }
};

// Helper to calculate progress percentage
const getProgress = (playerValue: number, operator: string, targetValue: number) => {
  if (operator === '>=' || operator === '>') {
    return Math.min((playerValue / targetValue) * 100, 100);
  } else if (operator === '<=' || operator === '<') {
    return Math.min(((targetValue - playerValue) / targetValue) * 100, 100);
  } else if (operator === '=' || operator === '==') {
    return playerValue === targetValue ? 100 : 0;
  }
  return 0;
};


const BadgeProgress: React.FC<BadgeProgressProps> = ({ activeBadgeReusables, loading, playerStats, playerBadges, isModerator, dbUser, player, onRefreshBadges, onRefreshPlayerBadges }) => {
  if (loading) return <div>Loading...</div>;

  // Prepare a Set of badge_names for quick lookup
  const playerBadgeNames = React.useMemo(() => new Set((playerBadges || []).map(b => b.badge_name)), [playerBadges]);

  // Calculate total points earned
  const totalPoints = React.useMemo(() => (playerBadges || []).reduce((sum, b) => sum + (Number(b.badge_weight) || 0), 0), [playerBadges]);
// Table for earned player badges
const PlayerBadgesTable: React.FC<{ playerBadges: any[]; totalPoints: number }> = ({ playerBadges, totalPoints }) => {
  if (!playerBadges || playerBadges.length === 0) return null;
  return (
    <div style={{ marginTop: 40 }}>
      <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Earned Badges</div>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 10 }}>
        Total Points Earned: {totalPoints}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(80,90,120,0.06)' }}>
        <thead>
          <tr style={{ fontWeight: 600, fontSize: 15 }}>
            <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1.5px solid #b0b6c3' }}>Name</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1.5px solid #b0b6c3' }}>Description</th>
            <th style={{ padding: '10px 12px', textAlign: 'right', borderBottom: '1.5px solid #b0b6c3' }}>Weight</th>
          </tr>
        </thead>
        <tbody>
          {playerBadges.map((badge, idx) => (
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
  );
};

  // Group badges by subject, but filter out badges already earned
  const grouped = activeBadgeReusables.reduce((acc: Record<string, any[]>, badge) => {
    if (playerBadgeNames.has(badge.badge_name)) return acc; // skip earned badges
    const subject = badge.subject || 'Other';
    if (!acc[subject]) acc[subject] = [];
    acc[subject].push(badge);
    return acc;
  }, {});


  // State for open/closed categories
  const [openCategories, setOpenCategories] = React.useState(() => {
    const initial: Record<string, boolean> = {};
    Object.keys(grouped).forEach(subject => { initial[subject] = true; });
    return initial;
  });

  const toggleCategory = (subject: string) => {
    setOpenCategories(prev => ({ ...prev, [subject]: !prev[subject] }));
  };

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

  return (
    <div style={{ marginTop: "2rem", position: "relative" }}>
      <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 18 }}>Badge Progress</div>
      {activeBadgeReusables.length === 0 && <div>No active badges.</div>}
      {Object.entries(grouped).map(([subject, badges]) => (
        <div key={subject} style={{ marginBottom: 18, border: '1px solid #b0b6c3', borderRadius: 8 }}>
          <div
            style={{ cursor: 'pointer', padding: '10px 18px', fontWeight: 600, fontSize: 16, display: 'flex', alignItems: 'center', userSelect: 'none' }}
            onClick={() => toggleCategory(subject)}
          >
            <span style={{ marginRight: 8, fontSize: 18, transition: 'transform 0.2s', transform: openCategories[subject] ? 'rotate(90deg)' : 'rotate(0deg)' }}>
              ▶
            </span>
            {subject}
          </div>
          {openCategories[subject] && (
            <div style={{ padding: '10px 18px 0 18px' }}>
              {badges.map((badge, idx) => {
                // Parse triggers
                let triggers: any[] = [];
                try {
                  triggers = Array.isArray(badge.trigger)
                    ? badge.trigger.map((t: any) => (typeof t === 'string' ? JSON.parse(t) : t))
                    : [];
                } catch (e) {
                  triggers = [];
                }

                // If badge is in playerBadges, set progress to 100%
                const isCompleted = playerBadgeNames.has(badge.badge_name);

                // For each trigger, calculate progress
                const triggerProgress = triggers.map((trigger) => {
                  const metric = trigger.metric;
                  const operator = trigger.operator || trigger.conditional;
                  const value = Number(trigger.value);
                  let playerValue = Number(playerStats?.[metric] ?? 0);
                  if (isNaN(playerValue)) playerValue = 0;
                  return getProgress(playerValue, operator, value);
                });

                // Aggregate progress (average for multiple triggers)
                let overallProgress = triggerProgress.length > 0
                  ? Math.round(triggerProgress.reduce((a, b) => a + b, 0) / triggerProgress.length)
                  : 0;
                if (isCompleted) overallProgress = 100;

                return (
                  <div key={badge.id || idx} style={{ marginBottom: '1.5rem', border: '1.5px solid #b0b6c3', borderRadius: 8, padding: 16, position: 'relative', boxShadow: '0 2px 8px rgba(80,90,120,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                              boxShadow: '0 1px 4px rgba(80,90,120,0.10)'
                            }}
                            onClick={() => handleAwardClick(badge)}
                          >
                            Award
                          </button>
                        )}
                        {badge.image_url && (
                          <img src={badge.image_url} alt={badge.badge_name} style={{ width: 40, height: 40, borderRadius: 6 }} />
                        )}
                        <div>
                          <strong>{badge.badge_name}</strong>
                          <div style={{ fontSize: 13, color: '#666' }}>{badge.badge_description}</div>
                        </div>
                      </div>
                      <div style={{ minWidth: 0, textAlign: 'right', marginLeft: 12 }}>
                        {triggers.length > 0 && (
                          <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: 12, color: '#888', display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {triggers.map((trigger, i) => {
                              const metric = trigger.metric;
                              const operator = trigger.operator || trigger.conditional;
                              const value = trigger.value;
                              let playerValue = playerStats?.[metric] ?? 0;
                              return (
                                <li key={i} style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                  {metric}: {Math.round(playerValue)} {operator} {Math.round(Number(value))}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    </div>
                    <div style={{ position: 'relative', background: '#f3f3f3', borderRadius: 6, height: 18, width: '100%', overflow: 'hidden', marginBottom: 6 }}>
                      <div style={{ height: '100%', width: `${overallProgress}%`, background: overallProgress === 100 ? '#4caf50' : '#2196f3', transition: 'width 0.5s', position: 'absolute', left: 0, top: 0 }} />
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
                          fontSize: 12,
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
                );
              })}
            </div>
          )}
        </div>
      ))}
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
