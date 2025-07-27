import React from "react";

interface PlayerPrestigeProgressProps {
  activeBadgeReusables: any[];
  playerStats: any;
  playerStatsLoading: boolean;
  player?: any; // Optional player prop for additional context
}

const PrestigeProgress: React.FC<PlayerPrestigeProgressProps> = ({ playerStats, playerStatsLoading }) => {
  // TODO: Implement prestige progress logic
  return (
    <div style={{ marginTop: "2rem" }}>
      <h4>Prestige Progress</h4>
      <div>Prestige progress details go here.</div>
    </div>
  );
};

export default PrestigeProgress;
