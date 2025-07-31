import React, { useState } from "react";

// --- Visual Trigger Builder Types ---
type Metric = {
  metric: string;
  operator: string;
  value: number | boolean;
};
export type ConditionGroup = {
  type: "AND" | "OR";
  conditions: (Metric | ConditionGroup)[];
};

interface GoalTriggersProps {
  isOpen: boolean;
  onClose: () => void;
  group: ConditionGroup;
  setGroup: (g: ConditionGroup) => void;
  onSave: (trigger: any[] | ConditionGroup) => void;
}

// Metric option type with optional tooltip
type MetricOption = {
  metric: string;
  label: string;
  tooltip?: string;
};
// Metric category type
type MetricCategory = {
  label: string;
  options: MetricOption[];
};

// --- Goal Metric Categories ---
const GOAL_METRIC_CATEGORIES: MetricCategory[] = [
  {
    label: "Piracy",
    options: [
      { metric: "pirateHits", label: "Pirate Hits" },
      { metric: "scuStolen", label: "SCU Stolen" },
      { metric: "valueStolen", label: "Value Stolen" },
    ],
  },
  {
    label: "Dogfighting",
    options: [
      { metric: "puShipKills", label: "PU Ship Kills" },
      { metric: "acShipKills", label: "AC Ship Kills" },
      { metric: "puShipDamages", label: "PU Ship Damages" },
      { metric: "acShipDamages", label: "AC Ship Damages" },
    ],
  },
  {
    label: "FPS",
    options: [
      { metric: "puFPSKills", label: "PU FPS Kills" },
      { metric: "acFPSKills", label: "AC FPS Kills" },
    ],
  },
  {
    label: "Fleet",
    options: [
      { metric: "fleetOperations", label: "Fleet Operations" },
    ],
  },
  {
    label: "Items",
    options: [
      { metric: "itemCollected", label: "Item Collected" },
    ],
  },
  {
    label: "Leaderboard",
    options: [
      { metric: "orgLeaderboardStanding", label: "Org Leaderboard Standing" },
    ],
  },
];

const OPERATOR_OPTIONS = [
  { value: ">=", label: ">=" },
  { value: "<=", label: "<=" },
  { value: ">", label: ">" },
  { value: "<", label: "<" },
  { value: "==", label: "==" },
  { value: "!=", label: "!=" },
];

function isGroup(obj: any): obj is ConditionGroup {
  return obj && typeof obj === "object" && (obj.type === "AND" || obj.type === "OR") && Array.isArray(obj.conditions);
}

const GoalTriggers: React.FC<GoalTriggersProps> = ({ isOpen, onClose, group, setGroup, onSave }) => {
  // Add a metric to a group
  const addMetric = (parent: ConditionGroup, metricKey: string) => {
    const newGroup = JSON.parse(JSON.stringify(group));
    function findParent(current: ConditionGroup, target: ConditionGroup): ConditionGroup | null {
      if (current === parent) return current;
      for (const cond of current.conditions) {
        if (isGroup(cond)) {
          const found = findParent(cond, target);
          if (found) return found;
        }
      }
      return null;
    }
    const parentCopy = findParent(newGroup, parent) || newGroup;
    if (!Array.isArray(parentCopy.conditions)) parentCopy.conditions = [];
    parentCopy.conditions.push({ metric: metricKey, operator: ">=", value: 1 });
    setGroup(newGroup);
  };

  const [metricDropdownOpen, setMetricDropdownOpen] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const removeCondition = (parent: ConditionGroup, idx: number) => {
    const newGroup = JSON.parse(JSON.stringify(group));
    function findParent(current: ConditionGroup, target: ConditionGroup): ConditionGroup | null {
      if (current === parent) return current;
      for (const cond of current.conditions) {
        if (isGroup(cond)) {
          const found = findParent(cond, target);
          if (found) return found;
        }
      }
      return null;
    }
    const parentCopy = findParent(newGroup, parent) || newGroup;
    if (!Array.isArray(parentCopy.conditions)) parentCopy.conditions = [];
    parentCopy.conditions.splice(idx, 1);
    setGroup(newGroup);
  };

  const updateMetric = (parent: ConditionGroup, idx: number, field: keyof Metric, value: any) => {
    const newGroup = JSON.parse(JSON.stringify(group));
    function findParent(current: ConditionGroup, target: ConditionGroup): ConditionGroup | null {
      if (current === parent) return current;
      for (const cond of current.conditions) {
        if (isGroup(cond)) {
          const found = findParent(cond, target);
          if (found) return found;
        }
      }
      return null;
    }
    const parentCopy = findParent(newGroup, parent) || newGroup;
    const metric = parentCopy.conditions[idx] as Metric;
    let newValue = value;
    if (field === "value") {
      newValue = Number(value);
    }
    parentCopy.conditions[idx] = { ...metric, [field]: newValue };
    setGroup(newGroup);
  };

  // Only AND allowed
  const changeGroupType = (grp: ConditionGroup, type: "AND" | "OR") => {};

  const renderGroup = (grp: ConditionGroup, parent?: ConditionGroup) => (
    <div style={{ border: "1px solid #3bbca9", borderRadius: 6, padding: 12, marginBottom: 12, background: "#181818" }}>
      <div style={{ marginLeft: 12 }}>
        {(!Array.isArray(grp.conditions) || grp.conditions.length === 0) && <div style={{ color: "#aaa", marginBottom: 8 }}>No conditions yet.</div>}
        {Array.isArray(grp.conditions) && grp.conditions.map((cond, idx) =>
          isGroup(cond)
            ? (
              <div key={idx} style={{ marginBottom: 8 }}>
                {renderGroup(cond as ConditionGroup, grp)}
              </div>
            )
            : (
              <div key={idx} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <select value={(cond as Metric).metric} onChange={e => updateMetric(grp, idx, "metric", e.target.value)}
                    style={{ background: "#222", color: "#fff", border: "1px solid #3bbca9", borderRadius: 4, padding: "2px 8px" }}>
                    {GOAL_METRIC_CATEGORIES.map(cat => (
                      <optgroup key={cat.label} label={cat.label}>
                        {cat.options.map(opt => (
                          <option key={opt.metric} value={opt.metric}>{opt.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <select value={(cond as Metric).operator} onChange={e => updateMetric(grp, idx, "operator", e.target.value)}
                    style={{ background: "#222", color: "#fff", border: "1px solid #3bbca9", borderRadius: 4, padding: "2px 8px" }}>
                    {OPERATOR_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <input
                    type="number"
                    value={Number((cond as Metric).value)}
                    min={0}
                    onChange={e => updateMetric(grp, idx, "value", e.target.value)}
                    style={{ width: 70, background: "#222", color: "#fff", border: "1px solid #3bbca9", borderRadius: 4, padding: "2px 8px" }}
                  />
                  <button type="button" onClick={() => removeCondition(grp, idx)} style={{ background: "#e02323", color: "#fff", border: "none", borderRadius: 4, padding: "2px 10px", fontWeight: 700, cursor: "pointer" }}>×</button>
                </div>
              </div>
            )
        )}
      </div>
    </div>
  );

  function normalizeMetric(metric: any) {
    let category = undefined;
    for (const cat of GOAL_METRIC_CATEGORIES) {
      if (cat.options.some(opt => opt.metric === metric.metric)) {
        category = cat.label;
        break;
      }
    }
    return {
      metric: metric.metric,
      operator: metric.operator,
      value: metric.value,
      category
    };
  }

  function normalizeGroup(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(m => isGroup(m) ? normalizeGroup(m) : normalizeMetric(m));
    } else if (isGroup(obj)) {
      return {
        type: obj.type,
        conditions: obj.conditions.map((c: any) => isGroup(c) ? normalizeGroup(c) : normalizeMetric(c))
      };
    } else {
      return normalizeMetric(obj);
    }
  }

  const handleSave = () => {
    const result = normalizeGroup(group.conditions);
    console.log("[Goal Trigger JSON]", JSON.stringify(result, null, 2));
    onSave(result);
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
      <div style={{ background: "#222", color: "#fff", padding: "2rem", borderRadius: "8px", minWidth: 350, maxWidth: 600, position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>Goal Triggers</h3>
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={e => {
                setMetricDropdownOpen(v => !v);
              }}
              style={{ background: "#3bbca9", color: "#fff", border: "none", borderRadius: 4, padding: "0.5rem 1rem", fontWeight: 600, cursor: "pointer" }}
            >
              + Metric
            </button>
            {metricDropdownOpen && (
              <div style={{ position: "absolute", right: 0, top: "110%", background: "#222", border: "1px solid #3bbca9", borderRadius: 6, zIndex: 10, minWidth: 200, boxShadow: "0 2px 8px #000a", display: "flex" }}
                onMouseLeave={() => { setOpenCategory(null); }}>
                <div style={{ minWidth: 160 }}>
                  {GOAL_METRIC_CATEGORIES.sort((a, b) => a.label.localeCompare(b.label)).map(cat => (
                    <div key={cat.label} style={{ position: "relative" }}>
                      <button
                        type="button"
                        style={{ background: "none", color: "#3bbca9", border: "none", width: "100%", textAlign: "left", padding: "8px 16px", cursor: "pointer", fontWeight: 700, fontSize: 14 }}
                        onMouseEnter={() => setOpenCategory(cat.label)}
                        onFocus={() => setOpenCategory(cat.label)}
                        onClick={() => setOpenCategory(cat.label)}
                      >
                        {cat.label} ▶
                      </button>
                      {openCategory === cat.label && (
                        <div style={{
                          position: "absolute",
                          left: "100%",
                          top: 0,
                          background: "#222",
                          border: "1px solid #3bbca9",
                          borderRadius: 6,
                          minWidth: 180,
                          zIndex: 20,
                          boxShadow: "0 2px 8px #000a"
                        }}>
                          {cat.options.map(opt => (
                            <button
                              key={opt.metric}
                              type="button"
                              style={{ background: "none", color: "#fff", border: "none", width: "100%", textAlign: "left", padding: "8px 20px", cursor: "pointer", fontSize: 14 }}
                              onClick={() => {
                                addMetric(group, opt.metric);
                                setMetricDropdownOpen(false);
                                setOpenCategory(null);
                              }}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div style={{ margin: "1.5rem 0" }}>
          <p style={{ color: "#aaa" }}>Build the trigger logic for this org goal:</p>
          {renderGroup(group)}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "#444", color: "#fff", border: "none", borderRadius: 4, padding: "0.5rem 1rem", fontWeight: 600, cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{ background: "#3bbca9", color: "#fff", border: "none", borderRadius: 4, padding: "0.5rem 1rem", fontWeight: 600, cursor: "pointer" }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoalTriggers;
