import React, { useState } from "react";
import { grantPrestige } from "../../api/grantPrestige";
import { groupPrestige, getBadgeProgress, isBadgeReady, voiceHoursFromStats } from "../../utils/progressionEngine";

interface PlayerPrestigeProgressProps {
  activeBadgeReusables: any[];
  playerStats: any;
  playerStatsLoading: boolean;
  player?: any;
  isModerator?: boolean;
  dbUser?: any; // Optional prop for database user context
}


const PrestigeProgress: React.FC<PlayerPrestigeProgressProps> = ({ activeBadgeReusables, playerStats, playerStatsLoading, isModerator, dbUser, player }) => {
  // Build groups with shared engine
  const prestigeGroups = groupPrestige(activeBadgeReusables || []);


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
    const total = badges.reduce((sum, badge) => sum + getBadgeProgress(badge, playerStats), 0);
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
                <div style={{ fontWeight: 600, fontSize: 16 }}>{badge.badge_name}</div>
                <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>{badge.badge_description}</div>
                {(!badge.trigger || badge.trigger.length === 0) ? (
                  <div><em>Given Manually</em></div>
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
                      // Normalize voice hours display
                      if (metric === 'voicehours' || metric === 'voice_minutes') {
                        playerValue = voiceHoursFromStats(playerStats);
                      }
                      // Special case: shipsbleaderboardrank, show as 'infinite' if 0 or null
                      let displayValue: string | number = playerValue;
                      if (metric === 'shipsbleaderboardrank' && (!playerValue || playerValue === 0)) {
                        displayValue = 'infinite';
                      }
                      // Use engine readiness logic for consistency
                      const met = isBadgeReady({ ...badge, trigger: [parsed] }, playerStats);
                      return (
                        <div key={tIdx} style={{ color: met ? '#4caf50' : '#d32f2f' }}>
                          <strong>{metric}</strong> {operator} <strong>{value}</strong> &nbsp;
                          (<span>you: {typeof displayValue === 'number' ? Math.round(displayValue) : displayValue}</span>)
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
                <div style={{ fontWeight: 600, fontSize: 16 }}>{badge.badge_name}</div>
                <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>{badge.badge_description}</div>
                {(!badge.trigger || badge.trigger.length === 0) ? (
                  <div><em>Given Manually</em></div>
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
                      const met = isBadgeReady({ ...badge, trigger: [parsed] }, playerStats);
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
