// Utility for determining if a user should get the "Promote" tag
// You can expand the criteria for each rank as needed

import { User } from "../types/user";

export function shouldShowPromoteTag(user: any): boolean {
  // Helper to get rank name
  const getRank = (user: any): string | null => {
    if (!user.roles) return null;
    const rankMap = {
      Prospect: (import.meta.env.VITE_PROSPECT_ID || "").split(","),
      Crew: (import.meta.env.VITE_CREW_ID || "").split(","),
      Marauder: (import.meta.env.VITE_MARAUDER_ID || "").split(","),
    };
    for (const [rank, ids] of Object.entries(rankMap)) {
      if (user.roles.some((role: string) => ids.includes(role))) {
        return rank;
      }
    }
    return null;
  };

  const rank = getRank(user);
  if (!rank) return false;

  // Example criteria (replace with your real logic):
  switch (rank) {
    case "Prospect": {
      // Must have at least 40 hours in voice
      if ((user.voiceHours || 0) < 40) return false;
      // Weighted system: hit log = 1, fleet log = 1, recent gathering = 0.25, threshold = 10
      const hitPoints = Array.isArray(user.hitTrackers) ? user.hitTrackers.length : 0;
      const fleetPoints = Array.isArray(user.fleetLogs) ? user.fleetLogs.length : 0;
      const gatheringPoints = (Array.isArray(user.recentGatherings) ? user.recentGatherings.length : 0) * 0.25;
      const totalPoints = hitPoints + fleetPoints + gatheringPoints;
      if (totalPoints < 10) return false;

      // Must have more than 20 hours of total flight time OR be ranked in top 1000 SB leaderboard OR have >100 blackbox logs (not FPS)
      const flightTime = typeof user.sbPlayerSummary?.total_flight_time === 'number' ? user.sbPlayerSummary.total_flight_time : 0;
      const sbRank = typeof user.sbPlayerSummary?.rank === 'number' ? user.sbPlayerSummary.rank : null;
      if (flightTime > 20) return true;
      if (sbRank !== null && sbRank > 0 && sbRank <= 1000) return true;
      // Count blackBoxes where .ship_killed !== 'FPS'
      const qualifyingBlackBoxes = Array.isArray(user.blackBoxes)
        ? user.blackBoxes.filter((bb: any) => bb && bb.ship_killed !== 'FPS').length
        : 0;
      if (qualifyingBlackBoxes > 100) return true;
      return false;
    }
    case "Crew":
      // Crew: any of the following
      // 1. Ranked top 200 in sbleaderboardsummary (.rank)
      const sbRank = typeof user.sbPlayerSummary?.rank === 'number' ? user.sbPlayerSummary.rank : null;
      if (sbRank !== null && sbRank > 0 && sbRank <= 200) return true;
      // 2. Over 50 pirate hits
      if (Array.isArray(user.hitTrackers) && user.hitTrackers.length > 50) return true;
      // 3. Over 20 fleet logs
      if (Array.isArray(user.fleetLogs) && user.fleetLogs.length > 20) return true;
      // 4. Over 50 recent gatherings
      if (Array.isArray(user.recentGatherings) && user.recentGatherings.length > 50) return true;
      // 5. Over 200 voice hours
      if ((user.voiceHours || 0) > 200) return true;
      return false;
    case "Marauder":
      // Example: Promote if voiceHours > 20 and fleetLogs > 10
      return (user.voiceHours || 0) > 20 && (Array.isArray(user.fleetLogs) ? user.fleetLogs.length : 0) > 10;
    default:
      return false;
  }
}
