
import React, { useState, useEffect } from "react";
import { promotePlayer } from "../../api/promotePlayerApi";
import { getUserById } from "../../api/userService";
import { assessPromotion } from "../../utils/progressionEngine";

interface PlayerPromotionProgressProps {
  playerStats: any;
  playerStatsLoading: boolean;
  player?: any;
  isModerator?: boolean;
  dbUser?: any; // Optional prop for database user context
  playerBadges?: any[]; // Newly added: list of player's earned badges (badge_name field expected)
  onPromote?: () => void; // Optional callback to trigger refresh in parent
}


// Note: rank ordering is handled by the progression engine

const PromotionProgress: React.FC<PlayerPromotionProgressProps> = ({ playerStats, playerStatsLoading, isModerator, player, dbUser, playerBadges = [], onPromote }) => {
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
  const userRankRaw = (user?.rank ?? user?.rank_id ?? "") as string | number;
  const userRankId = String(userRankRaw);
  if (bloodedIds.includes(userRankId)) detectedRank = "Blooded";
  else if (marauderIds.includes(userRankId)) detectedRank = "Marauder";
  else if (crewIds.includes(userRankId)) detectedRank = "Crew";
  else if (prospectIds.includes(userRankId)) detectedRank = "Prospect";
  else if (friendlyIds.includes(userRankId)) detectedRank = "Friendly";

  // Centralized promotion computation
  const promo = assessPromotion(playerStats, userRankId);
  const nextRank = promo.nextRank;
  const progressPercent = promo.progressPercent;
  detectedRank = promo.detectedRank;

  // Prospect metric readouts for display (non-authoritative; engine is source of truth)
  const prospectPiracyHits = Number((playerStats as any)?.piracyhits) || 0;
  const crewChallengeFlags = [
    (playerStats as any)?.crewchallenge,
    (playerStats as any)?.crew_challenge,
    (playerStats as any)?.crewchallengepassed,
    (playerStats as any)?.crewChallengePassed,
    (playerStats as any)?.crew_challenge_passed,
    (playerStats as any)?.crew_challenge_completed,
  ];
  // Crew Challenge completion now determined by possession of the "Crew Challenge" badge.
  const hasCrewChallengeBadge = (playerBadges || []).some(
    (b) => (b?.badge_name || '').toLowerCase() === 'crew challenge'
  );
  // Fallback flags if badge not yet migrated
  const prospectCrewChallenge = hasCrewChallengeBadge || crewChallengeFlags.some(
    (v) => v === true || v === 1 || v === "true" || v === "completed"
  );

  // Prepare requirements breakdown
  let requirementsSection = null;
  if (nextRank) {
    // Replace numeric requirements with suggestion lists per request
    if (detectedRank === "Prospect") {
      requirementsSection = (
        <div style={{ marginTop: "1rem", background: "#1e232b", color: "#e6eef8", border: "1px solid #2c3440", borderRadius: 8, padding: 12 }}>
          <strong>The Crew Challenge</strong>
          <ul style={{ marginTop: 6, lineHeight: 1.6 }}>
            <li>The <strong>CREW CHALLENGE</strong> is a skill gate for dogfighting, making sure that IronPoint's Crew have at least a basic competency and will be able to overcome the average Star Citizen player.</li>
            <li><strong>TASK: </strong>Defeat a <strong>RAPTOR I</strong> pilot in a dogfight within 3 lives. </li>
          </ul>
        </div>
      );
    } else if (detectedRank === "Friendly") {
      requirementsSection = (
        <div style={{ marginTop: "1rem", background: "#1e232b", color: "#e6eef8", border: "1px solid #2c3440", borderRadius: 8, padding: 12 }}>
          Apply to IronPoint
        </div>
      );
    } else if (detectedRank === "Crew") {
      requirementsSection = (
        <div style={{ marginTop: "1rem", background: "#1e232b", color: "#e6eef8", border: "1px solid #2c3440", borderRadius: 8, padding: 12 }}>
          <strong>How to reach Marauder</strong>
          <ul style={{ marginTop: 6, lineHeight: 1.6 }}>
            <li>Heavy engagement with Prestige Schools, gaining multiple levels</li>
            <li>High activity</li>
            <li>Longevity (seniority)</li>
          </ul>
        </div>
      );
    } else if (detectedRank === "Marauder") {
      requirementsSection = (
        <div style={{ marginTop: "1rem", background: "#1e232b", color: "#e6eef8", border: "1px solid #2c3440", borderRadius: 8, padding: 12 }}>
          <strong>How to reach Blooded</strong>
          <ul style={{ marginTop: 6, lineHeight: 1.6 }}>
            <li>Selected based on leadership potential</li>
            <li>Mentor, guide, and leader</li>
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
      // Refresh user data after promotion
      // Refetch user object
      setUserLoading(true);
      try {
        const userObj = await getUserById(playerId);
        setUser(userObj);
      } catch (err) {
        setUser(null);
      } finally {
        setUserLoading(false);
      }
      // Optionally, trigger a refresh or callback here
      if (typeof onPromote === 'function') {
        onPromote();
      }
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
        {isModerator && dbUser?.id !== playerStats?.user_id && (
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
          {/* Show progress bar for all ranks except manual-only transitions Crew->Marauder and Marauder->Blooded */}
          {!(detectedRank === "Crew" || detectedRank === "Marauder") && (
            <>
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
              {detectedRank === 'Prospect' && (
                <div style={{ marginTop: 8, fontSize: 13, color: '#d0d7e2' }}>
                  <div>Progress = (Pirate Hits / 10 + Crew Challenge completion) / 2</div>
                  <ul style={{ marginTop: 6, lineHeight: 1.4 }}>
                    <li>Pirate hits: {prospectPiracyHits}/10</li>
                    <li>Crew challenge: {prospectCrewChallenge ? 'Completed (badge earned)' : 'Not yet'}</li>
                  </ul>
                </div>
              )}
            </>
          )}
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
