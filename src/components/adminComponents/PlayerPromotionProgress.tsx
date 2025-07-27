import React from "react";

interface PlayerPromotionProgressProps {
  playerStats: any;
  playerStatsLoading: boolean;
  player?: any; // Optional player prop for additional context
}


const rankOrder = ["Friendly", "Prospect", "Crew", "Marauder", "Blooded"];

const PromotionProgress: React.FC<PlayerPromotionProgressProps> = ({ playerStats, playerStatsLoading }) => {
  if (playerStatsLoading || !playerStats) {
    return <div style={{ marginTop: "2rem" }}>Loading promotion progress...</div>;
  }


  const currentRank = playerStats.rank_name;
  const rankLower = currentRank?.toLowerCase() || "";
  let nextRank = null;
  let progressPercent = 0;

  // Use substring matching for rank detection
  if (rankLower.includes("captain") || rankLower.includes("blooded")) {
    nextRank = "Blooded";
    progressPercent = 100;
  } else {
    // Determine which rank the player is in by substring
    let detectedRank = null;
    if (rankLower.includes("friendly")) detectedRank = "Friendly";
    else if (rankLower.includes("prospect")) detectedRank = "Prospect";
    else if (rankLower.includes("crew")) detectedRank = "Crew";
    else if (rankLower.includes("marauder")) detectedRank = "Marauder";

    const currentRankIndex = detectedRank ? rankOrder.indexOf(detectedRank) : -1;
    nextRank = currentRankIndex >= 0 ? rankOrder[currentRankIndex + 1] || null : null;

    // Progression logic for each rank
    if (detectedRank === "Friendly") {
      // No requirements, always 100%
      progressPercent = 100;
    } else if (detectedRank === "Prospect") {
      // Prospect to Crew
      // Points calculation
      const piracyHits = Number(playerStats.piracyhits) || 0;
      const fleetParticipated = Number(playerStats.fleetparticipated) || 0;
      const recentGatherings = Number(playerStats.recentgatherings) || 0;
      const points = piracyHits + fleetParticipated + 0.25 * recentGatherings;
      const pointsProgress = Math.min(points / 10, 1); // 0 to 1

      // Secondary requirement progress (max of 1 if any met, else partial)
      const flightHours = Number(playerStats.flighthours) || 0;
      const shipsBLeaderboardRank = Number(playerStats.shipsbleaderboardrank) || Infinity;
      const shipKills = Number(playerStats.shipkills) || 0;
      const secondaryProgress = Math.max(
        Math.min(flightHours / 20, 1),
        shipsBLeaderboardRank <= 1000 ? 1 : 0,
        Math.min(shipKills / 100, 1)
      );

      // Overall progress: average of points and secondary requirement
      progressPercent = Math.round(((pointsProgress + secondaryProgress) / 2) * 100);
    } else if (detectedRank === "Crew") {
      // Crew to Marauder
      const shipsBLeaderboardRank = Number(playerStats.shipsbleaderboardrank) || Infinity;
      const piracyHits = Number(playerStats.piracyhits) || 0;
      const fleetParticipated = Number(playerStats.fleetparticipated) || 0;
      const recentGatherings = Number(playerStats.recentgatherings) || 0;
      const voiceHours = Number(playerStats.voicehours) || 0;

      // Each requirement is a progress value (0 to 1)
      const reqProgress = [
        shipsBLeaderboardRank <= 200 ? 1 : 0,
        Math.min(piracyHits / 200, 1),
        fleetParticipated > 20 ? 1 : Math.max(fleetParticipated / 20, 0),
        Math.min(recentGatherings / 50, 1),
        Math.min(voiceHours / 200, 1),
      ];
      // Take the highest progress (since only one needs to be met)
      progressPercent = Math.round(Math.max(...reqProgress) * 100);
    } else if (detectedRank === "Marauder") {
      // Marauder to Blooded: No requirements, always 0%
      progressPercent = 0;
    } else {
      // Fallback for unknown rank
      progressPercent = 0;
    }
  }

  // Prepare requirements breakdown
  let requirementsSection = null;
  if (nextRank && progressPercent < 100) {
    if (rankLower.includes("prospect")) {
      // Prospect to Crew
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
    } else if (rankLower.includes("crew")) {
      // Crew to Marauder
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
    } else if (rankLower.includes("marauder")) {
      // Marauder to Blooded
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

  return (
    <div style={{ marginTop: "2rem" }}>
      <h4>Promotion Progress</h4>
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
    </div>
  );
};

export default PromotionProgress;
