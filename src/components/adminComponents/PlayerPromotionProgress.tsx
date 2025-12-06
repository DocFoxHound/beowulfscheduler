
import React, { useState, useEffect, useRef } from "react";
import { promotePlayer } from "../../api/promotePlayerApi";
import { getUserById } from "../../api/userService";
import { assessPromotion } from "../../utils/progressionEngine";
import { fetchBadgesByUserId } from "../../api/badgeRecordApi";
// If BadgeRecord type exists we could import it, but keep any to avoid breaking if not loaded lazily

export interface ProspectPromotionSummary {
  // Core promotion engine outputs
  progressPercent: number;
  nextRank: string | null;
  detectedRank: string | null;

  // Raw prospect metrics
  prospectPiracyHits: number;
  prospectCrewChallenge: boolean;
  hasCrewChallengeBadge: boolean;

  // Derived requirement flags (for C/H/T and arrows)
  hasHits: boolean;
  hasTimeInRank: boolean;
  readyForCrew: boolean;
}

export const buildProspectPromotionSummary = (
  playerStats: any,
  userRankId: string,
  activeBadges: any[],
  promoteDate?: string | Date | null,
): ProspectPromotionSummary => {
  const promo = assessPromotion(playerStats, userRankId, undefined, activeBadges as { badge_name: string }[]);
  const nextRank = promo.nextRank ?? null;
  const progressPercent = promo.progressPercent ?? 0;
  const detectedRank = promo.detectedRank ?? null;

  const prospectPiracyHits = Number((playerStats as any)?.piracyhits) || 0;
  const crewChallengeFlags = [
    (playerStats as any)?.crewchallenge,
    (playerStats as any)?.crew_challenge,
    (playerStats as any)?.crewchallengepassed,
    (playerStats as any)?.crewChallengePassed,
    (playerStats as any)?.crew_challenge_passed,
    (playerStats as any)?.crew_challenge_completed,
  ];
  const hasCrewChallengeBadge = (activeBadges || []).some(
    (b) => (b?.badge_name || '').toLowerCase() === 'crew challenge'
  );
  const prospectCrewChallenge = hasCrewChallengeBadge || crewChallengeFlags.some(
    (v) => v === true || v === 1 || v === 'true' || v === 'completed'
  );

  const hasHits = prospectPiracyHits >= 10;

  let hasTimeInRank = false;
  if (promoteDate) {
    const start = new Date(promoteDate);
    if (!isNaN(start.getTime())) {
      const now = new Date();
      const diffMs = now.getTime() - start.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      hasTimeInRank = diffDays >= 30;
    }
  }

  const readyForCrew =
    nextRank === 'Crew' &&
    progressPercent >= 100 &&
    prospectCrewChallenge &&
    hasHits &&
    hasTimeInRank;

  return {
    progressPercent,
    nextRank,
    detectedRank,
    prospectPiracyHits,
    prospectCrewChallenge,
    hasCrewChallengeBadge,
    hasHits,
    hasTimeInRank,
    readyForCrew,
  };
};

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

const PromotionProgress: React.FC<PlayerPromotionProgressProps> = ({ playerStats, playerStatsLoading, isModerator, player, dbUser, playerBadges, onPromote }) => {
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [promoteError, setPromoteError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [fetchedBadges, setFetchedBadges] = useState<any[] | null>(null);
  const [badgesLoading, setBadgesLoading] = useState(false);
  const [badgesError, setBadgesError] = useState<string | null>(null);
  const lastFetchedUserIdRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const previousPlayerIdRef = useRef<string | null>(null);
  const userFetchIdRef = useRef(0);

  // Get all rank ID arrays from .env
  const friendlyIds = (import.meta.env.VITE_FRIENDLY_ID || "").split(",").map((s: string) => s.trim()).filter(Boolean);
  const prospectIds = (import.meta.env.VITE_PROSPECT_ID || "").split(",").map((s: string) => s.trim()).filter(Boolean);
  const crewIds = (import.meta.env.VITE_CREW_ID || "").split(",").map((s: string) => s.trim()).filter(Boolean);
  const marauderIds = (import.meta.env.VITE_MARAUDER_ID || "").split(",").map((s: string) => s.trim()).filter(Boolean);
  const bloodedIds = (import.meta.env.VITE_BLOODED_ID || "").split(",").map((s: string) => s.trim()).filter(Boolean);
  const raptorIds = (import.meta.env.VITE_RAPTOR_ID || "").split(",").map((s: string) => s.trim()).filter(Boolean);
  const raiderIds = (import.meta.env.VITE_RAIDER_ID || "").split(",").map((s: string) => s.trim()).filter(Boolean);

  // Determine current playerId for badge fetching and other lookups
  const playerId = playerStats?.user_id || playerStats?.id || (player && (player.id || player.user_id));
  const playerIdKey = playerId ? String(playerId) : null;

  // Fetch user object from backend with stale-response guards
  useEffect(() => {
    if (playerStatsLoading || !playerStats) return;
    if (!playerIdKey) {
      setUser(null);
      setUserLoading(false);
      return;
    }

    let cancelled = false;
    const fetchId = ++userFetchIdRef.current;
    setUserLoading(true);

    const fetchUser = async () => {
      try {
        const userObj = await getUserById(playerIdKey);
        if (cancelled || userFetchIdRef.current !== fetchId) return;
        setUser(userObj);
      } catch (err) {
        if (cancelled || userFetchIdRef.current !== fetchId) return;
        setUser(null);
      } finally {
        if (cancelled || userFetchIdRef.current !== fetchId) return;
        setUserLoading(false);
      }
    };

    fetchUser();

    return () => {
      cancelled = true;
    };
  }, [playerStatsLoading, playerStats, playerIdKey]);

  const resolvedUserRoles: string[] = (Array.isArray(user?.roles)
    ? user.roles
    : Array.isArray(playerStats?.roles)
    ? playerStats.roles
    : Array.isArray(player?.roles)
    ? player.roles
    : [])
    .filter((role: string | number | null | undefined): role is string | number => role !== null && role !== undefined)
    .map((role: string | number) => String(role));
  const hasRaptorRole = resolvedUserRoles.some((role) => raptorIds.includes(role));
  const hasRaiderRole = resolvedUserRoles.some((role) => raiderIds.includes(role));
  const meetsMarauderPrestigeRequirement = hasRaptorRole && hasRaiderRole;

  // Reset badge cache whenever the target player changes to avoid stale state
  useEffect(() => {
    if (previousPlayerIdRef.current === playerIdKey) return;
    previousPlayerIdRef.current = playerIdKey;
    abortRef.current?.abort();
    lastFetchedUserIdRef.current = null;
    setFetchedBadges(null);
    setBadgesError(null);
  }, [playerIdKey]);

  // Fetch badges if not provided via props
  useEffect(() => {
    if (!playerIdKey || playerStatsLoading || userLoading) return;

    // Prefer parent-supplied badges when populated
    if (playerBadges && playerBadges.length > 0) {
      abortRef.current?.abort();
      abortRef.current = null;
      setBadgesLoading(false);
      setBadgesError(null);
      setFetchedBadges(playerBadges);
      lastFetchedUserIdRef.current = playerIdKey;
      return;
    }

    if (lastFetchedUserIdRef.current === playerIdKey) {
      return;
    }

    setBadgesLoading(true);
    setBadgesError(null);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    fetchBadgesByUserId(playerIdKey)
      .then((data) => {
        if (controller.signal.aborted) return;
        setFetchedBadges(data || []);
        lastFetchedUserIdRef.current = playerIdKey;
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setFetchedBadges([]);
        setBadgesError("Failed to load badges");
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setBadgesLoading(false);
      });

    return () => controller.abort();
  }, [playerIdKey, playerStatsLoading, userLoading, playerBadges]);

  if (playerStatsLoading || !playerStats || userLoading || badgesLoading) {
    return <div style={{ marginTop: "2rem" }}>Loading promotion progress...</div>;
  }

  // Prefer rank info from playerStats to avoid stale user rank flashes
  const statsRankRaw =
    playerStats?.rank_id ??
    playerStats?.rank ??
    playerStats?.rank_name ??
    playerStats?.rankName ??
    playerStats?.rank_text;
  const rankSource =
    statsRankRaw ??
    user?.rank ??
    user?.rank_id ??
    (playerStats as any)?.detected_rank ??
    null;
  const userRankId = rankSource !== null && rankSource !== undefined && rankSource !== ''
    ? String(rankSource)
    : '';

  // Determine current rank from derived rank id/name (fallback arrays cover either form)
  let detectedRank: string | null = null;
  if (userRankId) {
    if (bloodedIds.includes(userRankId)) detectedRank = "Blooded";
    else if (marauderIds.includes(userRankId)) detectedRank = "Marauder";
    else if (crewIds.includes(userRankId)) detectedRank = "Crew";
    else if (prospectIds.includes(userRankId)) detectedRank = "Prospect";
    else if (friendlyIds.includes(userRankId)) detectedRank = "Friendly";
  }

  // Centralized promotion computation, including badge-aware Prospect summary
  const activeBadges = (fetchedBadges !== null ? fetchedBadges : (playerBadges ?? []));
  const summary = buildProspectPromotionSummary(playerStats, userRankId, activeBadges, user?.promote_date);
  const nextRank = summary.nextRank;
  const progressPercent = summary.progressPercent;
  detectedRank = summary.detectedRank;
  const prospectPiracyHits = summary.prospectPiracyHits;
  const prospectCrewChallenge = summary.prospectCrewChallenge;
  const requiresPrestigeRoles = detectedRank === 'Crew' && nextRank === 'Marauder';
  const promotionBlockedForPrestige = requiresPrestigeRoles && !meetsMarauderPrestigeRequirement;

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
            <li><strong>Part 1: </strong>You will recieve this badge once you have demonstrated that you understand the basics of dogfighting and can win the fighting portion of the Crew Challenge. </li>
            <li><strong>Part 2: </strong>Defeat <strong>DocHound</strong> in a duel within 3 lives. When you recieve the Badge, DocHound will reach out and coordinate a time with you. </li>
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
          <p style={{ marginTop: 6, marginBottom: 10, lineHeight: 1.5 }}>
            Crew members must hold both a RAPTOR Tier I (or higher) role and a RAIDER Tier I (or higher) role before they can be promoted to Marauder.
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
            <li style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", borderRadius: 6, background: hasRaptorRole ? "rgba(76, 175, 80, 0.15)" : "rgba(255, 152, 0, 0.15)", color: hasRaptorRole ? "#9fefb4" : "#ffb874" }}>
              <span>RAPTOR role assigned</span>
              <span>{hasRaptorRole ? "Complete" : "Missing"}</span>
            </li>
            <li style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", borderRadius: 6, background: hasRaiderRole ? "rgba(76, 175, 80, 0.15)" : "rgba(255, 152, 0, 0.15)", color: hasRaiderRole ? "#9fefb4" : "#ffb874" }}>
              <span>RAIDER role assigned</span>
              <span>{hasRaiderRole ? "Complete" : "Missing"}</span>
            </li>
          </ul>
          <div style={{ marginTop: 8, fontSize: 13, color: "#a8b3c7" }}>
            RAPTOR is IronPoint's Dogfighting rating, which requires assessments to increment.
            <br />
            RAIDER is IronPoint's Piracy Skillset measurement, which gains through learning and demonstrating proficiencies.
          </div>
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
    if (promotionBlockedForPrestige) {
      setPromoteError("RAPTOR I and RAIDER I (or higher) roles are required before promoting to Marauder.");
      return;
    }
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
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <button
              style={{
                background: promotionBlockedForPrestige ? "#4a5568" : "#2196f3",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "6px 16px",
                fontWeight: 600,
                cursor: promotionBlockedForPrestige || promoting ? "not-allowed" : "pointer",
                fontSize: 15,
                opacity: promotionBlockedForPrestige ? 0.7 : 1
              }}
              onClick={() => {
                if (promotionBlockedForPrestige) return;
                setShowPromoteModal(true);
              }}
              disabled={promotionBlockedForPrestige}
            >
              Promote
            </button>
            {promotionBlockedForPrestige && (
              <div style={{ marginTop: 6, fontSize: 12, color: "#ffb874", textAlign: "right", maxWidth: 260 }}>
                Add both RAPTOR and RAIDER prestige roles before promoting to Marauder.
              </div>
            )}
          </div>
        )}
      </div>
      {badgesError && (
        <div style={{ color: "#ff7878", marginBottom: 12, fontSize: 13 }}>{badgesError}</div>
      )}
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
