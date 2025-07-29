import React, { useState } from "react";
import { grantPrestige } from "../../api/grantPrestige";

interface PlayerPrestigeProgressProps {
  activeBadgeReusables: any[];
  playerStats: any;
  playerStatsLoading: boolean;
  player?: any;
  isModerator?: boolean;
  dbUser?: any; // Optional prop for database user context
}


const PrestigeProgress: React.FC<PlayerPrestigeProgressProps> = ({ activeBadgeReusables, playerStats, playerStatsLoading, isModerator, dbUser, player }) => {
  // Filter badgeReusables with a prestige_name and group by prestige
  const prestigeGroups: Record<string, any[]> = {
    RAPTOR: [],
    RAIDER: [],
    CORSAIR: [],
  };

  activeBadgeReusables?.forEach((badge) => {
    if (badge.prestige_name && prestigeGroups[badge.prestige_name]) {
      prestigeGroups[badge.prestige_name].push(badge);
    }
  });

  // Helper to get next level requirements for a prestige
  const getNextLevelRequirements = (prestigeName: string, currentLevel: number) => {
    // Find badges for the next level only
    return prestigeGroups[prestigeName].filter(
      (badge) => badge.prestige_level === currentLevel + 1
    );
  };


  // Local state for prestige levels to allow UI refresh after grant
  const [localLevels, setLocalLevels] = useState({
    corsair: player?.corsair_level ?? 0,
    raider: player?.raider_level ?? 0,
    raptor: player?.raptor_level ?? 0,
  });

  // Update localLevels if player prop changes (e.g., on prop refresh)
  React.useEffect(() => {
    setLocalLevels({
      corsair: player?.corsair_level ?? 0,
      raider: player?.raider_level ?? 0,
      raptor: player?.raptor_level ?? 0,
    });
  }, [player?.corsair_level, player?.raider_level, player?.raptor_level]);

  const corsairLevel = localLevels.corsair;
  const raiderLevel = localLevels.raider;
  const raptorLevel = localLevels.raptor;
  const nextCorsair = getNextLevelRequirements("CORSAIR", corsairLevel);
  const nextRaider = getNextLevelRequirements("RAIDER", raiderLevel);
  const nextRaptor = getNextLevelRequirements("RAPTOR", raptorLevel);

  // Max level for prestige
  const MAX_PRESTIGE_LEVEL = 5;

  // Helper to calculate progress for a badge
  const getBadgeProgress = (badge: any): number => {
    if (!badge.trigger || !Array.isArray(badge.trigger) || badge.trigger.length === 0) {
      // Given manually, 0% progress
      return 0;
    }
    // If any trigger is shipsbleaderboardrank and playerValue is 0 or null, badge progress is 0
    for (const triggerStr of badge.trigger) {
      if (!triggerStr) continue;
      let triggerObj;
      try {
        triggerObj = typeof triggerStr === 'string' ? JSON.parse(triggerStr) : triggerStr;
      } catch {
        continue;
      }
      if (triggerObj.metric === 'shipsbleaderboardrank') {
        const playerValue = playerStats?.[triggerObj.metric] ?? 0;
        if (!playerValue || playerValue === 0) {
          return 0;
        }
      }
    }
    let total = 0;
    let count = 0;
    for (const triggerStr of badge.trigger) {
      if (!triggerStr) continue;
      let triggerObj;
      try {
        triggerObj = typeof triggerStr === 'string' ? JSON.parse(triggerStr) : triggerStr;
      } catch {
        continue;
      }
      if (!triggerObj.metric || !triggerObj.operator || triggerObj.value === undefined) continue;
      const playerValue = playerStats?.[triggerObj.metric] ?? 0;
      let progress = 0;
      switch (triggerObj.operator) {
        case '>=':
          progress = Math.min(playerValue / triggerObj.value, 1);
          break;
        case '<=':
          progress = playerValue <= triggerObj.value ? 1 : 0;
          break;
        case '=':
        case '==':
          progress = playerValue === triggerObj.value ? 1 : 0;
          break;
        default:
          progress = 0;
      }
      total += progress;
      count++;
    }
    return count > 0 ? total / count : 0;
  };

  // Helper to calculate overall progress for a prestige's next level
  const getPrestigeProgress = (badges: any[]): number => {
    if (!badges.length) return 0;
    const total = badges.reduce((sum, badge) => sum + getBadgeProgress(badge), 0);
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
  const [selectedPrestige, setSelectedPrestige] = useState<null | "RAPTOR" | "RAIDER" | "CORSAIR">(null);

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
      if (selectedPrestige === "CORSAIR") {
        prestigeLevel = corsairLevel + 1;
        prestigeKey = "corsair";
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

  return (
    <div style={{ marginTop: "2rem", position: "relative" }}>
      <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 18 }}>Prestige Progress</div>
      <div style={{ marginBottom: "1rem" }}>
        <strong>RAPTOR {raptorLevel} → {raptorLevel + 1} Requirements:</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {raptorLevel >= MAX_PRESTIGE_LEVEL ? <li>Max level reached.</li> :
          nextRaptor.length === 0 ? <li>No requirements for next level.</li> :
          nextRaptor.map((badge, idx) => (
            <li key={idx} style={{ marginBottom: 18, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              {badge.image_url && <img src={badge.image_url} alt="badge" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 6, marginRight: 8 }} />}
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{badge.badge_name || badge.name || badge.display_name || `Badge #${badge.id}`}</div>
                <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>{badge.badge_description}</div>
                {(!badge.trigger || badge.trigger.length === 0) ? (
                  <div><em>Given Manually</em></div>
                ) : (
                  <div style={{ fontSize: 13 }}>
                    {badge.trigger.map((triggerStr: string, tIdx: number) => {
                      let triggerObj;
                      try {
                        triggerObj = typeof triggerStr === 'string' ? JSON.parse(triggerStr) : triggerStr;
                      } catch {
                        return <div key={tIdx}>Invalid requirement</div>;
                      }
                      if (!triggerObj.metric || !triggerObj.operator || triggerObj.value === undefined) return null;
                      let playerValue = playerStats?.[triggerObj.metric] ?? 0;
                      // Special case: shipsbleaderboardrank, show as 'infinite' if 0 or null
                      let displayValue: string | number = playerValue;
                      if (triggerObj.metric === 'shipsbleaderboardrank' && (!playerValue || playerValue === 0)) {
                        displayValue = 'infinite';
                      }
                      let met = false;
                      // Special handling for shipsbleaderboardrank: if playerValue is 0 or null, never met
                      if (triggerObj.metric === 'shipsbleaderboardrank' && (!playerValue || playerValue === 0)) {
                        met = false;
                      } else {
                        switch (triggerObj.operator) {
                          case '>=':
                            met = playerValue >= triggerObj.value;
                            break;
                          case '<=':
                            met = playerValue <= triggerObj.value;
                            break;
                          case '=':
                          case '==':
                            met = playerValue === triggerObj.value;
                            break;
                          default:
                            met = false;
                        }
                      }
                      return (
                        <div key={tIdx} style={{ color: met ? '#4caf50' : '#d32f2f' }}>
                          <strong>{triggerObj.metric}</strong> {triggerObj.operator} <strong>{triggerObj.value}</strong> &nbsp;
                          (<span>you: {displayValue}</span>)
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </li>
          ))}
      </ul>
      <div style={{ marginBottom: "1rem" }}>
        <strong>RAIDER {raiderLevel} → {raiderLevel + 1} Requirements:</strong>
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
          nextRaider.map((badge, idx) => (
            <li key={idx} style={{ marginBottom: 18, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              {badge.image_url && <img src={badge.image_url} alt="badge" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 6, marginRight: 8 }} />}
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{badge.badge_name || badge.name || badge.display_name || `Badge #${badge.id}`}</div>
                <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>{badge.badge_description}</div>
                {(!badge.trigger || badge.trigger.length === 0) ? (
                  <div><em>Given Manually</em></div>
                ) : (
                  <div style={{ fontSize: 13 }}>
                    {badge.trigger.map((triggerStr: string, tIdx: number) => {
                      let triggerObj;
                      try {
                        triggerObj = typeof triggerStr === 'string' ? JSON.parse(triggerStr) : triggerStr;
                      } catch {
                        return <div key={tIdx}>Invalid requirement</div>;
                      }
                      if (!triggerObj.metric || !triggerObj.operator || triggerObj.value === undefined) return null;
                      const playerValue = playerStats?.[triggerObj.metric] ?? 0;
                      let met = false;
                      switch (triggerObj.operator) {
                        case '>=':
                          met = playerValue >= triggerObj.value;
                          break;
                        case '<=':
                          met = playerValue <= triggerObj.value;
                          break;
                        case '=':
                        case '==':
                          met = playerValue === triggerObj.value;
                          break;
                        default:
                          met = false;
                      }
                      return (
                        <div key={tIdx} style={{ color: met ? '#4caf50' : '#d32f2f' }}>
                          <strong>{triggerObj.metric}</strong> {triggerObj.operator} <strong>{triggerObj.value}</strong> &nbsp;
                          (<span>you: {playerValue}</span>)
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </li>
          ))}
      </ul>
      <div style={{ marginBottom: "1rem" }}>
        <strong>CORSAIR {corsairLevel} → {corsairLevel + 1} Requirements:</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ProgressBar progress={corsairLevel >= MAX_PRESTIGE_LEVEL ? 1 : getPrestigeProgress(nextCorsair)} />
          {canGrant && corsairLevel < MAX_PRESTIGE_LEVEL && (
            <button
              style={{ height: 32, padding: '0 18px', fontWeight: 600, background: '#0ebc37ff', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
              onClick={() => { setShowGrantModal(true); setSelectedPrestige("CORSAIR"); }}
            >
              Grant
            </button>
          )}
        </div>
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {corsairLevel >= MAX_PRESTIGE_LEVEL ? <li>Max level reached.</li> :
          nextCorsair.length === 0 ? <li>No requirements for next level.</li> :
          nextCorsair.map((badge, idx) => (
            <li key={idx} style={{ marginBottom: 18, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              {badge.image_url && <img src={badge.image_url} alt="badge" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 6, marginRight: 8 }} />}
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{badge.badge_name || badge.name || badge.display_name || `Badge #${badge.id}`}</div>
                <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>{badge.badge_description}</div>
                {(!badge.trigger || badge.trigger.length === 0) ? (
                  <div><em>Given Manually</em></div>
                ) : (
                  <div style={{ fontSize: 13 }}>
                    {badge.trigger.map((triggerStr: string, tIdx: number) => {
                      let triggerObj;
                      try {
                        triggerObj = typeof triggerStr === 'string' ? JSON.parse(triggerStr) : triggerStr;
                      } catch {
                        return <div key={tIdx}>Invalid requirement</div>;
                      }
                      if (!triggerObj.metric || !triggerObj.operator || triggerObj.value === undefined) return null;
                      const playerValue = playerStats?.[triggerObj.metric] ?? 0;
                      let met = false;
                      switch (triggerObj.operator) {
                        case '>=':
                          met = playerValue >= triggerObj.value;
                          break;
                        case '<=':
                          met = playerValue <= triggerObj.value;
                          break;
                        case '=':
                        case '==':
                          met = playerValue === triggerObj.value;
                          break;
                        default:
                          met = false;
                      }
                      return (
                        <div key={tIdx} style={{ color: met ? '#4caf50' : '#d32f2f' }}>
                          <strong>{triggerObj.metric}</strong> {triggerObj.operator} <strong>{triggerObj.value}</strong> &nbsp;
                          (<span>you: {playerValue}</span>)
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </li>
          ))}
      </ul>
      {/* Grant Confirmation Modal */}
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
