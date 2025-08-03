import React, { useEffect, useState } from "react";
import { fetchBlackBoxesWithinTimeframe } from "../../api/blackboxApi";
import { fetchAllWarehouseItems } from "../../api/warehouseApi";
import { fetchShipLogsByTimeframe } from "../../api/fleetLogApi";
import { fetchHitsByTimeframe } from "../../api/hittrackerApi";
import { SBLeaderboardOrgSummary } from "../../types/sb_leaderboard_org_summary";

interface Trigger {
  metric: string;
  operator: string;
  value: number;
  category?: string;
  item?: string; // For itemCollected triggers
}

interface OrgGoalProgressProps {
  triggers: Trigger[];
  manual_progress: boolean;
  manual_percentage: number;
  start_date?: string;
  end_date?: string;
  orgSummaries: SBLeaderboardOrgSummary[]; // Pass org summaries for leaderboard standing
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

// Async version to support API calls
async function getMetricCompletionAsync(trigger: Trigger, start_date?: string, end_date?: string, orgSummaries?: SBLeaderboardOrgSummary[]): Promise<number> {
  if (PIRACY_METRICS.includes(trigger.metric)) {
    if (start_date && end_date) {
      try {
        const hits = await fetchHitsByTimeframe(start_date, end_date);
        switch (trigger.metric) {
          case "pirateHits":
            // count all hits returned
            return hits.length;
          case "scuStolen":
            // sum all hits' .total_scu value
            return hits.reduce((sum: number, hit: any) => sum + (hit.total_scu || 0), 0);
          case "valueStolen":
            // sum all hits' .total_value value
            return hits.reduce((sum: number, hit: any) => sum + (hit.total_value || 0), 0);
          default:
            return 0;
        }
      } catch (e) {
        return 0;
      }
    }
    return 0;
  } else if (COMBAT_METRICS.includes(trigger.metric)) {
    if (start_date && end_date) {
      try {
        const blackboxes = await fetchBlackBoxesWithinTimeframe(start_date, end_date);
        console.log('[OrgGoalProgress] Fetched blackboxes:', blackboxes);
        switch (trigger.metric) {
          case "puShipKills":
            // count every blackbox where .ship_killed !== FPS, and .game_mode === PU
            return blackboxes.filter(bb => bb.ship_killed !== "FPS" && bb.game_mode === "PU").length;
          case "acShipKills": {
            // count every blackbox where .ship_killed !== FPS, and .game_mode === AC
            const filtered = blackboxes.filter(bb => bb.ship_killed !== "FPS" && bb.game_mode === "AC");
            console.log('[OrgGoalProgress] acShipKills filtered:', filtered);
            return filtered.length;
          }
          case "puShipDamages":
            // sum every blackbox entry's .value value where .ship_killed !== FPS, and .game_mode === PU
            return blackboxes.filter(bb => bb.ship_killed !== "FPS" && bb.game_mode === "PU").reduce((sum, bb) => sum + (bb.value || 0), 0);
          case "acShipDamages":
            // sum every blackbox entry's .value value where .ship_killed !== FPS, and .game_mode === AC
            return blackboxes.filter(bb => bb.ship_killed !== "FPS" && bb.game_mode === "AC").reduce((sum, bb) => sum + (bb.value || 0), 0);
          case "puFPSKills":
            // count every blackbox where .ship_killed === FPS, and .game_mode === PU
            return blackboxes.filter(bb => bb.ship_killed === "FPS" && bb.game_mode === "PU").length;
          case "acFPSKills":
            // count every blackbox where .ship_killed === FPS, and .game_mode === AC
            return blackboxes.filter(bb => bb.ship_killed === "FPS" && bb.game_mode === "AC").length;
          default:
            return 0;
        }
      } catch (e) {
        console.error('[OrgGoalProgress] Error fetching blackboxes:', e);
        return 0;
      }
    }
    return 0;
  } else if (FLEET_METRICS.includes(trigger.metric)) {
    if (trigger.metric === "fleetOperations" && start_date && end_date) {
      try {
        // Dynamically import to avoid circular dependency if any
        const logs = await fetchShipLogsByTimeframe(start_date, end_date);
        return logs.length;
      } catch (e) {
        return 0;
      }
    }
    return 0;
  } else if (ITEM_METRICS.includes(trigger.metric)) {
    if (trigger.metric === "itemCollected" && trigger.item) {
      try {
        // If fetchAllWarehouseItems requires an argument, pass undefined or suitable default
        const items = await fetchAllWarehouseItems();
        // Sum .total_scu for all items where .commodity_name matches trigger.item
        return items
          .filter((witem: any) => witem.commodity_name === trigger.item)
          .reduce((sum: number, witem: any) => sum + (witem.total_scu || 0), 0);
      } catch (e) {
        return 0;
      }
    }
    return 0;
  } else if (LEADERBOARD_METRICS.includes(trigger.metric)) {
    // Leaderboard standing logic for IRONPOINT: compare IRONPOINT's total_rating to the org at the position specified by trigger.value
    if (orgSummaries && Array.isArray(orgSummaries) && orgSummaries.length > 0) {
      // Sort orgs by total_rating descending
      const sorted = orgSummaries.slice().sort((a, b) => Number(b.total_rating) - Number(a.total_rating));
      // Find IRONPOINT's total_rating
      const ironpoint = sorted.find(org => org.symbol === "IRONPOINT");
      // Use trigger.value as the position (1-based)
      let compareIdx = typeof trigger.value === "number" && trigger.value > 0 ? Math.round(trigger.value) - 1 : 9;
      if (compareIdx >= sorted.length) compareIdx = sorted.length - 1;
      const compareOrg = sorted[compareIdx];
      console.log("IronPoint total_rating:", ironpoint?.total_rating, "Compare Org:", compareOrg?.name, "at index:", compareOrg?.total_rating);
      if (ironpoint && compareOrg) {
        // Calculate percentage: IRONPOINT's rating / compareOrg's rating * 100
        const percent = (Number(ironpoint.total_rating) / Number(compareOrg.total_rating)) * 100;
        console.log("Calculated percentage:", percent);
        return percent;
      }
      // If IRONPOINT exists but compareOrg doesn't, compare to last org
      if (ironpoint && sorted.length > 0) {
        const last = sorted[sorted.length - 1];
        const percent = (Number(ironpoint.total_rating) / Number(last.total_rating)) * 100;
        return Math.max(0, Math.min(100, percent));
      }
    }
    return 0;
  }
  // Default/fallback
  return 0;
}


const OrgGoalProgress: React.FC<OrgGoalProgressProps> = ({ triggers, manual_progress, manual_percentage, start_date, end_date, orgSummaries }) => {
  const [percentage, setPercentage] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Helper to determine color based on metric category
  function getBarColors(metric: string) {
    if (PIRACY_METRICS.includes(metric)) {
      return {
        background: 'linear-gradient(90deg, #ff6f61 0%, #f44336 100%)',
        boxShadow: '0 0 8px 1px rgba(255, 111, 97, 0.18)',
        textColor: '#fff',
        textShadow: '0 1px 4px #000',
      };
    } else if (COMBAT_METRICS.includes(metric)) {
      return {
        background: 'linear-gradient(90deg, #2196f3 0%, #1565c0 100%)',
        boxShadow: '0 0 8px 1px rgba(33, 150, 243, 0.18)',
        textColor: '#fff',
        textShadow: '0 1px 4px #000',
      };
    } else if (FLEET_METRICS.includes(metric)) {
      return {
        background: 'linear-gradient(90deg, #43ea7a 0%, #1b5e20 100%)',
        boxShadow: '0 0 8px 1px rgba(67, 234, 122, 0.18)',
        textColor: '#fff',
        textShadow: '0 1px 4px #000',
      };
    } else if (ITEM_METRICS.includes(metric)) {
      return {
        background: 'linear-gradient(90deg, #fff 0%, #e0e0e0 100%)',
        boxShadow: '0 0 8px 1px rgba(255,255,255,0.18)',
        textColor: '#23232a',
        textShadow: '0 1px 4px #fff',
      };
    } else if (LEADERBOARD_METRICS.includes(metric)) {
      return {
        background: 'linear-gradient(90deg, #ffd700 0%, #ffb300 100%)',
        boxShadow: '0 0 8px 1px rgba(255, 215, 0, 0.18)',
        textColor: '#23232a',
        textShadow: '0 1px 4px #fff',
      };
    }
    // Default: red
    return {
      background: 'linear-gradient(90deg, #ff6f61 0%, #f44336 100%)',
      boxShadow: '0 0 8px 1px rgba(255, 111, 97, 0.18)',
      textColor: '#fff',
      textShadow: '0 1px 4px #000',
    };
  }

  // Helper for operator logic
  function compareWithOperator(completion: number, value: number, operator: string): boolean {
    switch (operator) {
      case ">=": return completion >= value;
      case ">": return completion > value;
      case "<=": return completion <= value;
      case "<": return completion < value;
      case "=":
      case "==": return completion === value;
      default: return false;
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function calculate() {
      if (manual_progress) {
        setPercentage(manual_percentage);
        return;
      }
      if (triggers && triggers.length > 0) {
        setLoading(true);
        // Get completions for each trigger
        const completions = await Promise.all(triggers.map(trigger => getMetricCompletionAsync(trigger, start_date, end_date, orgSummaries)));
        // Calculate percentage for each trigger using operator
        const percentages = completions.map((completion, idx) => {
          const trigger = triggers[idx];
          const value = trigger.value;
          const operator = trigger.operator;
          // For orgLeaderboardStanding, use the returned percentage directly
          if (trigger.metric === "orgLeaderboardStanding") {
            return Math.max(0, Math.min(100, completion));
          }
          if (typeof value === "number" && operator) {
            // If the operator condition is met, progress is 100%
            if (compareWithOperator(completion, value, operator)) {
              return 100;
            }
            // For >= and >, show progress up to 100%
            if (operator === ">=" || operator === ">") {
              return Math.max(0, Math.min(100, (completion / value) * 100));
            }
            // For <= and <, show progress as value decreases toward completion
            if (operator === "<=" || operator === "<") {
              return Math.max(0, Math.min(100, (value - completion) / value * 100));
            }
            // For equality, only 100% if met
            if (operator === "=" || operator === "==") {
              return 0;
            }
          }
          return 0;
        });
        if (!cancelled) {
          // Average the percentages if multiple triggers
          const avg = percentages.length > 0 ? percentages.reduce((a, b) => a + b, 0) / percentages.length : 0;
          setPercentage(avg);
          setLoading(false);
        }
      } else {
        setPercentage(null);
      }
    }
    calculate();
    return () => { cancelled = true; };
  }, [triggers, manual_progress, manual_percentage, start_date, end_date]);

  if (percentage === null) {
    return <div>No triggers defined.</div>;
  }
  if (loading) {
    return <div>Loading progress...</div>;
  }


  // Clamp percentage between 0 and 100 for rendering, fallback to 0 if NaN
  const clampedPercentage = typeof percentage === 'number' && !isNaN(percentage)
    ? Math.max(0, Math.min(100, percentage))
    : 0;

  // Determine color based on first trigger's metric
  const metric = triggers && triggers.length > 0 ? triggers[0].metric : '';
  const barColors = getBarColors(metric);

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          height: 40,
          background: 'linear-gradient(90deg, #18181c 0%, #23232a 100%)',
          borderRadius: 20,
          overflow: 'hidden',
          marginBottom: 16,
          marginTop: 10,
          width: '100%',
          boxShadow: '0 2px 12px 2px rgba(60, 60, 80, 0.18)',
          position: 'relative',
          border: '2px solid #33334d',
        }}
      >
        <div
          style={{
            width: `${clampedPercentage}%`,
            height: '100%',
            background: barColors.background,
            borderRadius: 20,
            transition: 'width 0.5s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: clampedPercentage > 10 ? 'flex-end' : 'center',
            position: 'absolute',
            left: 0,
            top: 0,
            zIndex: 1,
            boxShadow: barColors.boxShadow,
          }}
        >
          <span
            style={{
              color: barColors.textColor,
              fontWeight: 800,
              fontSize: 22,
              paddingRight: clampedPercentage > 10 ? 18 : 0,
              paddingLeft: clampedPercentage <= 10 ? 18 : 0,
              textShadow: barColors.textShadow,
              letterSpacing: 2,
              fontFamily: 'Orbitron, monospace',
              transition: 'color 0.3s',
            }}
          >
            {clampedPercentage.toFixed(0)}%
          </span>
        </div>
        {/* Empty bar background for unfilled portion */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
          }}
        />
      </div>
    </div>
  );
};

export default OrgGoalProgress;
