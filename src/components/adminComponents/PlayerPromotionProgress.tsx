
import React, { useState, useEffect } from "react";
import { promotePlayer } from "../../api/promotePlayer";
import { getUserById } from "../../api/userService";

interface PlayerPromotionProgressProps {
  playerStats: any;
  playerStatsLoading: boolean;
  player?: any;
  isModerator?: boolean;
}


const rankOrder = ["Friendly", "Prospect", "Crew", "Marauder", "Blooded"];

const PromotionProgress: React.FC<PlayerPromotionProgressProps> = ({ playerStats, playerStatsLoading, isModerator, player }) => {
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [promoteError, setPromoteError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);

  // Get all rank ID arrays from .env
  const friendlyIds = (import.meta.env.VITE_FRIENDLY_ID || "").split(",").map((s: string) => s.trim()).filter(Boolean);
  const prospectIds = (import.meta.env.VITE_PROSPECT_ID || "").split(",").map((s: string) => s.trim()).filter(Boolean);
  const crewIds = (import.meta.env.VITE_CREW_ID || "").split(",").map((s: string) => s.trim()).filter(Boolean);
  const marauderIds = (import.meta.env.VITE_MARAUDER_ID || "").split(",").map((s: string) => s.trim()).filter(Boolean);
  const bloodedIds = (import.meta.env.VITE_BLOODED_ID || "").split(",").map((s: string) => s.trim()).filter(Boolean);

  // Fetch user object from backend
  useEffect(() => {
    const fetchUser = async () => {
      setUserLoading(true);
      try {
        const playerId = playerStats?.user_id || playerStats?.id || (player && (player.id || player.user_id));
        if (!playerId) {
          setUser(null);
          setUserLoading(false);
          return;
        }
        const userObj = await getUserById(playerId);
        setUser(userObj);
      } catch (err) {
        setUser(null);
      } finally {
        setUserLoading(false);
      }
    };
    if (!playerStatsLoading && playerStats) {
      fetchUser();
    }
  }, [playerStatsLoading, playerStats, player]);

  if (playerStatsLoading || !playerStats || userLoading) {
    return <div style={{ marginTop: "2rem" }}>Loading promotion progress...</div>;
  }

  // Determine current rank from user.rank (or user.rank_id)
  let detectedRank: string | null = null;
  const userRankId = user?.rank || user?.rank_id || "";
  if (bloodedIds.includes(userRankId)) detectedRank = "Blooded";
  else if (marauderIds.includes(userRankId)) detectedRank = "Marauder";
  else if (crewIds.includes(userRankId)) detectedRank = "Crew";
  else if (prospectIds.includes(userRankId)) detectedRank = "Prospect";
  else if (friendlyIds.includes(userRankId)) detectedRank = "Friendly";

  let nextRank = null;
  let progressPercent = 0;
  const currentRankIndex = detectedRank ? rankOrder.indexOf(detectedRank) : -1;
  nextRank = currentRankIndex >= 0 ? rankOrder[currentRankIndex + 1] || null : null;

  // Progression logic for each rank
  if (detectedRank === "Friendly") {
    progressPercent = 100;
  } else if (detectedRank === "Prospect") {
    const piracyHits = Number(playerStats.piracyhits) || 0;
    const fleetParticipated = Number(playerStats.fleetparticipated) || 0;
    const recentGatherings = Number(playerStats.recentgatherings) || 0;
    const points = piracyHits + fleetParticipated + 0.25 * recentGatherings;
    const pointsProgress = Math.min(points / 10, 1);
    const flightHours = Number(playerStats.flighthours) || 0;
    const shipsBLeaderboardRank = Number(playerStats.shipsbleaderboardrank) || Infinity;
    const shipKills = Number(playerStats.shipkills) || 0;
    const secondaryProgress = Math.max(
      Math.min(flightHours / 20, 1),
      shipsBLeaderboardRank <= 1000 ? 1 : 0,
      Math.min(shipKills / 100, 1)
    );
    progressPercent = Math.round(((pointsProgress + secondaryProgress) / 2) * 100);
  } else if (detectedRank === "Crew") {
    const shipsBLeaderboardRank = Number(playerStats.shipsbleaderboardrank) || Infinity;
    const piracyHits = Number(playerStats.piracyhits) || 0;
    const fleetParticipated = Number(playerStats.fleetparticipated) || 0;
    const recentGatherings = Number(playerStats.recentgatherings) || 0;
    const voiceHours = Number(playerStats.voicehours) || 0;
    const reqProgress = [
      shipsBLeaderboardRank <= 200 ? 1 : 0,
      Math.min(piracyHits / 200, 1),
      fleetParticipated > 20 ? 1 : Math.max(fleetParticipated / 20, 0),
      Math.min(recentGatherings / 50, 1),
      Math.min(voiceHours / 200, 1),
    ];
    progressPercent = Math.round(Math.max(...reqProgress) * 100);
  } else if (detectedRank === "Marauder") {
    progressPercent = 0;
  } else if (detectedRank === "Blooded") {
    progressPercent = 100;
    nextRank = null;
  } else {
    progressPercent = 0;
  }

  // Prepare requirements breakdown
  let requirementsSection = null;
  if (nextRank && progressPercent < 100) {
    if (detectedRank === "Prospect") {
      const piracyHits = Number(playerStats.piracyhits) || 0;
      const fleetParticipated = Number(playerStats.fleetparticipated) || 0;
      const recentGatherings = Number(playerStats.recentgatherings) || 0;
      const points = piracyHits + fleetParticipated + 0.25 * recentGatherings;
      const flightHours = Number(playerStats.flighthours) || 0;
      const shipsBLeaderboardRank = Number(playerStats.shipsbleaderboardrank) || Infinity;
      const shipKills = Number(playerStats.shipkills) || 0;
      requirementsSection = (
        <div style={{ marginTop: "1rem" }}>
          <strong>Requirements for Crew:</strong>
          <ul style={{ marginTop: 4 }}>
            <li>
              <span>10 total points (1 per piracy hit, 1 per fleet participated, 0.25 per recent gathering): </span>
              <strong>{points.toFixed(2)} / 10</strong>
            </li>
            <li>
              <span>One of the following:</span>
              <ul>
                <li>Flight hours: <strong>{flightHours} / 20</strong> {flightHours >= 20 ? '✅' : ''}</li>
                <li>Squadron Battle leaderboard rank: <strong>{shipsBLeaderboardRank}</strong> (≤ 1000) {shipsBLeaderboardRank <= 1000 ? '✅' : ''}</li>
                <li>Ship kills: <strong>{shipKills} / 100</strong> {shipKills >= 100 ? '✅' : ''}</li>
              </ul>
            </li>
          </ul>
        </div>
      );
    } else if (detectedRank === "Crew") {
      const shipsBLeaderboardRank = Number(playerStats.shipsbleaderboardrank) || Infinity;
      const piracyHits = Number(playerStats.piracyhits) || 0;
      const fleetParticipated = Number(playerStats.fleetparticipated) || 0;
      const recentGatherings = Number(playerStats.recentgatherings) || 0;
      const voiceHours = Number(playerStats.voicehours) || 0;
      requirementsSection = (
        <div style={{ marginTop: "1rem" }}>
          <strong>Requirements for Marauder (any one):</strong>
          <ul style={{ marginTop: 4 }}>
            <li>Ships B leaderboard rank: <strong>{shipsBLeaderboardRank}</strong> (≤ 200) {shipsBLeaderboardRank <= 200 ? '✅' : ''}</li>
            <li>Piracy hits: <strong>{piracyHits} / 200</strong> {piracyHits >= 200 ? '✅' : ''}</li>
            <li>Fleet participated: <strong>{fleetParticipated} &gt; 20</strong> {fleetParticipated > 20 ? '✅' : ''}</li>
            <li>Recent gatherings: <strong>{recentGatherings} / 50</strong> {recentGatherings >= 50 ? '✅' : ''}</li>
            <li>Voice hours: <strong>{voiceHours} / 200</strong> {voiceHours >= 200 ? '✅' : ''}</li>
          </ul>
        </div>
      );
    } else if (detectedRank === "Marauder") {
      requirementsSection = (
        <div style={{ marginTop: "1rem" }}>
          <strong>Requirements for Blooded:</strong>
          <ul style={{ marginTop: 4 }}>
            <li>No requirements. Promotion is manual or based on other criteria.</li>
          </ul>
        </div>
      );
    }
  }


  // Handler for promotion using backend API
  const handlePromote = async () => {
    setPromoting(true);
    setPromoteError(null);
    try {
      if (!playerStats?.user_id && !playerStats?.id && !(player && (player.id || player.user_id))) {
        throw new Error("No player ID found.");
      }
      // Try to get the player ID from playerStats or player prop
      const playerId = playerStats?.user_id || playerStats?.id || (player && (player.id || player.user_id));
      await promotePlayer(playerId);
      setShowPromoteModal(false);
      // Optionally, trigger a refresh or callback here
    } catch (err) {
      setPromoteError("Failed to promote player. Please try again.");
    } finally {
      setPromoting(false);
    }
  };

  return (
    <div style={{ marginTop: "2rem", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 20 }}>Promotion Progress</div>
        {isModerator && (
          <button
            style={{
              background: "#2196f3",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "6px 16px",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 15
            }}
            onClick={() => setShowPromoteModal(true)}
          >
            Promote
          </button>
        )}
      </div>
      {nextRank ? (
        <div>
          <div style={{ marginBottom: "0.5rem" }}>
            Next Rank: <strong>{nextRank}</strong>
          </div>
          <div style={{
            background: "#eee",
            borderRadius: "8px",
            overflow: "hidden",
            height: "24px",
            width: "100%",
            marginBottom: "0.5rem"
          }}>
            <div style={{
              width: `${progressPercent}%`,
              background: "linear-gradient(90deg, #4caf50, #2196f3)",
              height: "100%",
              transition: "width 0.5s"
            }} />
          </div>
          <div>{progressPercent}% to {nextRank}</div>
          {requirementsSection}
        </div>
      ) : (
        <div>Highest rank achieved!</div>
      )}

      {/* Promote Confirmation Modal */}
      {showPromoteModal && (
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
            <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 16 }}>Confirm Promotion</div>
            <div style={{ marginBottom: 18 }}>
              Are you sure you want to promote this player to the next rank?
            </div>
            {promoteError && <div style={{ color: "red", marginBottom: 10 }}>{promoteError}</div>}
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowPromoteModal(false)}
                style={{
                  background: "#eee",
                  color: "#333",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 16px",
                  fontWeight: 500,
                  cursor: promoting ? "not-allowed" : "pointer"
                }}
                disabled={promoting}
              >
                Cancel
              </button>
              <button
                onClick={handlePromote}
                style={{
                  background: "#4caf50",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 16px",
                  fontWeight: 600,
                  cursor: promoting ? "not-allowed" : "pointer"
                }}
                disabled={promoting}
              >
                {promoting ? "Promoting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionProgress;
