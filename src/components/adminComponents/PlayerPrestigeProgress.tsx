import React from "react";

interface PlayerPrestigeProgressProps {
  activeBadgeReusables: any[];
  playerStats: any;
  playerStatsLoading: boolean;
  player?: any;
  isModerator?: boolean;
}


const PrestigeProgress: React.FC<PlayerPrestigeProgressProps> = ({ activeBadgeReusables, playerStats, playerStatsLoading, isModerator }) => {
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


  const corsairLevel = playerStats?.corsair ?? 0;
  const raiderLevel = playerStats?.raider ?? 0;
  const raptorLevel = playerStats?.raptor ?? 0;
  const nextCorsair = getNextLevelRequirements("CORSAIR", corsairLevel);
  const nextRaider = getNextLevelRequirements("RAIDER", raiderLevel);
  const nextRaptor = getNextLevelRequirements("RAPTOR", raptorLevel);

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

  return (
    <div style={{ marginTop: "2rem" }}>
      <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 18 }}>Prestige Progress</div>
      <div style={{ marginBottom: "1rem" }}>
        <strong>RAPTOR {raptorLevel} → {raptorLevel + 1} Requirements:</strong>
        <ProgressBar progress={getPrestigeProgress(nextRaptor)} />
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {nextRaptor.length === 0 ? <li>No requirements for next level.</li> :
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
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <strong>RAIDER {raiderLevel} → {raiderLevel + 1} Requirements:</strong>
        <ProgressBar progress={getPrestigeProgress(nextRaider)} />
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {nextRaider.length === 0 ? <li>No requirements for next level.</li> :
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
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <strong>CORSAIR {corsairLevel} → {corsairLevel + 1} Requirements:</strong>
        <ProgressBar progress={getPrestigeProgress(nextCorsair)} />
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {nextCorsair.length === 0 ? <li>No requirements for next level.</li> :
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
      </div>
    </div>
  );
};

export default PrestigeProgress;
