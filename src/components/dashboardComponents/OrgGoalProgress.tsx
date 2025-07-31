import React from "react";

interface Trigger {
  metric: string;
  operator: string;
  value: number;
  category?: string;
}

interface OrgGoalProgressProps {
  triggers: Trigger[];
  manual_progress: boolean;
  manual_percentage: number;
  // In the future, pass in actual metric values here
}


// Grouped metric types for future logic
const PIRACY_METRICS = ["pirateHits", "scuStolen", "valueStolen"];
const COMBAT_METRICS = [
  "puShipKills", "acShipKills",
  "puShipDamages", "acShipDamages",
  "puFPSKills", "acFPSKills"
];
const FLEET_METRICS = ["fleetOperations"];
const ITEM_METRICS = ["itemCollected"];
const LEADERBOARD_METRICS = ["orgLeaderboardStanding"];

// Stub function to get completion for a metric (replace with real logic later)
function getMetricCompletion(trigger: Trigger): number {
  if (PIRACY_METRICS.includes(trigger.metric)) {
    // TODO: Add piracy metric logic/API call here
    return 0;
  } else if (COMBAT_METRICS.includes(trigger.metric)) {
    // TODO: Add combat metric logic/API call here
    return 0;
  } else if (FLEET_METRICS.includes(trigger.metric)) {
    // TODO: Add fleet metric logic/API call here
    return 0;
  } else if (ITEM_METRICS.includes(trigger.metric)) {
    // TODO: Add item collected logic/API call here
    return 0;
  } else if (LEADERBOARD_METRICS.includes(trigger.metric)) {
    // TODO: Add leaderboard standing logic/API call here
    return 0;
  }
  // Default/fallback
  return 0;
}

const OrgGoalProgress: React.FC<OrgGoalProgressProps> = ({ triggers, manual_progress, manual_percentage }) => {
  let percentage: number | null = null;
  if (manual_progress) {
    percentage = manual_percentage;
  } else if (triggers && triggers.length > 0) {
    // Calculate completion for each trigger
    const completions = triggers.map(trigger => getMetricCompletion(trigger));
    percentage = completions.reduce((a, b) => a + b, 0) / completions.length;
  }

  if (percentage === null) {
    return <div>No triggers defined.</div>;
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        height: 12,
        background: '#eee',
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 4,
        marginTop: 2,
        width: '100%'
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: '#4caf50',
          borderRadius: 6,
          transition: 'width 0.3s'
        }} />
      </div>
      <div style={{ fontSize: 12, color: '#333' }}>{percentage.toFixed(0)}% complete</div>
    </div>
  );
};

export default OrgGoalProgress;
