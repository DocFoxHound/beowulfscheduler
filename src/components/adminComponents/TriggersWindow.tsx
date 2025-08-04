import React, { useState, useEffect } from "react";

interface TriggersWindowProps {
  isOpen: boolean;
  onClose: () => void;
  group: ConditionGroup;
  setGroup: (g: ConditionGroup) => void;
  onSave: (trigger: any[] | ConditionGroup) => void;
}


// --- Visual Trigger Builder Types ---
type BountyRankValue = { number: number; rank: string };
type BountyPrestigeValue = { number: number; prestige: string; prestigeLevel: number };
type BountyPlayerValue = { number: number; player: string };
type Metric = {
  metric: string;
  operator: string;
  value: number | BountyRankValue | BountyPrestigeValue | BountyPlayerValue | boolean;
};
export type ConditionGroup = {
  type: "AND" | "OR";
  conditions: (Metric | ConditionGroup)[];
};

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

// Metric options organized by category and subcategory
import { METRIC_CATEGORIES } from "./metricCategories";
const OPERATOR_OPTIONS = [
  { value: ">=", label: ">=" },
  { value: "<=", label: "<=" },
  { value: ">", label: ">" },
  { value: "<", label: "<" },
  { value: "==", label: "==" },
  { value: "!=", label: "!=" },
];

// Helper to check if object is a group
function isGroup(obj: any): obj is ConditionGroup {
  return obj && typeof obj === "object" && (obj.type === "AND" || obj.type === "OR") && Array.isArray(obj.conditions);
}

// Default empty group
const defaultGroup: ConditionGroup = { type: "AND", conditions: [] };

const TriggersWindow: React.FC<TriggersWindowProps> = ({ isOpen, onClose, group, setGroup, onSave }) => {

// --- Visual Builder Handlers ---
  // Add a metric to a group
  const addMetric = (parent: ConditionGroup, metricKey: string) => {
    // Deep copy group to avoid mutating state directly
    const newGroup = JSON.parse(JSON.stringify(group));
    // Find the parent in the newGroup tree
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
    let defaultValue: any = 1;
    let operator = ">=";
    if (["shipbountyrank", "fpsbountyrank"].includes(metricKey)) {
      defaultValue = { number: 1, rank: "Prospect" };
    } else if (["shipbountyprestige", "fpsbountyprestige"].includes(metricKey)) {
      defaultValue = { number: 1, prestige: "RAPTOR", prestigeLevel: 1 };
    } else if (["shipbountyplayer", "fpsbountyplayer"].includes(metricKey)) {
      defaultValue = { number: 1, player: "" };
    }
    parentCopy.conditions.push({ metric: metricKey, operator, value: defaultValue });
    setGroup(newGroup);
  };

  // State for metric dropdown and submenu
  const [metricDropdownOpen, setMetricDropdownOpen] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  // Remove a condition (metric or group)
  const removeCondition = (parent: ConditionGroup, idx: number) => {
    // Deep copy group to avoid mutating state directly
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
// Update a metric
const updateMetric = (parent: ConditionGroup, idx: number, field: keyof Metric, value: any) => {
  // Deep copy group to avoid mutating state directly
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
  // Special handling for bounty metrics
  if (["shipbountyrank", "fpsbountyrank"].includes(metric.metric)) {
    if (field === "value") {
      if (typeof metric.value === "object" && metric.value !== null) {
        newValue = { ...metric.value, ...value };
      } else {
        newValue = { number: 1, rank: "Prospect", ...value };
      }
    } else if (field === "operator") {
      newValue = value;
    }
    parentCopy.conditions[idx] = { ...metric, [field]: newValue };
    setGroup(newGroup);
    return;
  }
  if (["shipbountyprestige", "fpsbountyprestige"].includes(metric.metric)) {
    if (field === "value") {
      if (typeof metric.value === "object" && metric.value !== null) {
        newValue = { ...metric.value, ...value };
      } else {
        newValue = { number: 1, prestige: "RAPTOR", prestigeLevel: 1, ...value };
      }
    } else if (field === "operator") {
      newValue = value;
    }
    parentCopy.conditions[idx] = { ...metric, [field]: newValue };
    setGroup(newGroup);
    return;
  }
  if (["shipbountyplayer", "fpsbountyplayer"].includes(metric.metric)) {
    if (field === "value") {
      if (typeof metric.value === "object" && metric.value !== null) {
        newValue = { ...metric.value, ...value };
      } else {
        newValue = { number: 1, player: "", ...value };
      }
    } else if (field === "operator") {
      newValue = value;
    }
    parentCopy.conditions[idx] = { ...metric, [field]: newValue };
    setGroup(newGroup);
    return;
  }
  // Default logic
  if (field === "value") {
    // Find the selected metric's category
    let selectedCat = null;
    for (const cat of METRIC_CATEGORIES) {
      if (cat.options.some(opt => opt.metric === metric.metric)) {
        selectedCat = cat.label;
        break;
      }
    }
    if (selectedCat === "Role" || selectedCat === "Rank") {
      // Keep as boolean
      newValue = value === true || value === "true";
    } else {
      newValue = Number(value);
    }
  }
  parentCopy.conditions[idx] = { ...metric, [field]: newValue };
  setGroup(newGroup);
};
  // Change group type (AND/OR)
  // No-op: Only AND groups allowed
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const changeGroupType = (grp: ConditionGroup, type: "AND" | "OR") => {
    // Only AND allowed, do nothing
  };

  // Recursive render for group
  const renderGroup = (grp: ConditionGroup, parent?: ConditionGroup) => (
    <div style={{ border: "1px solid #3bbca9", borderRadius: 6, padding: 12, marginBottom: 12, background: "#181818" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
      </div>
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
                    {METRIC_CATEGORIES.map(cat => (
                      <optgroup key={cat.label} label={cat.label}>
                        {cat.options.map(opt => (
                          <option key={opt.metric} value={opt.metric}>{opt.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {/* If Role metric, show TRUE/FALSE, else show operator/value, with custom UI for bounty metrics */}
                  {(() => {
                    const metricKey = (cond as Metric).metric;
                    // Bounty (Rank)
                    if (["shipbountyrank", "fpsbountyrank"].includes(metricKey)) {
                      const val = (cond as Metric).value;
                      const safeVal: BountyRankValue = (typeof val === "object" && val !== null && "number" in val && "rank" in val)
                        ? val as BountyRankValue
                        : { number: 1, rank: "Prospect" };
                      return (<>
                        <select value={(cond as Metric).operator} onChange={e => updateMetric(grp, idx, "operator", e.target.value)}
                          style={{ background: "#222", color: "#fff", border: "1px solid #3bbca9", borderRadius: 4, padding: "2px 8px" }}>
                          {OPERATOR_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                        <input type="number" value={safeVal.number} min={0} onChange={e => updateMetric(grp, idx, "value", { number: Number(e.target.value) })}
                          style={{ width: 70, background: "#222", color: "#fff", border: "1px solid #3bbca9", borderRadius: 4, padding: "2px 8px" }} />
                        <select value={safeVal.rank} onChange={e => updateMetric(grp, idx, "value", { rank: e.target.value })}
                          style={{ background: "#222", color: "#fff", border: "1px solid #3bbca9", borderRadius: 4, padding: "2px 8px" }}>
                          <option value="Prospect">Prospect</option>
                          <option value="Crew">Crew</option>
                          <option value="Marauder">Marauder</option>
                          <option value="Blooded">Blooded</option>
                        </select>
                      </>);
                    }
                    // Bounty (Prestige)
                    if (["shipbountyprestige", "fpsbountyprestige"].includes(metricKey)) {
                      const val = (cond as Metric).value;
                      const safeVal: BountyPrestigeValue = (typeof val === "object" && val !== null && "number" in val && "prestige" in val && "prestigeLevel" in val)
                        ? val as BountyPrestigeValue
                        : { number: 1, prestige: "RAPTOR", prestigeLevel: 1 };
                      return (<>
                        <select value={(cond as Metric).operator} onChange={e => updateMetric(grp, idx, "operator", e.target.value)}
                          style={{ background: "#222", color: "#fff", border: "1px solid #3bbca9", borderRadius: 4, padding: "2px 8px" }}>
                          {OPERATOR_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                        <input type="number" value={safeVal.number} min={0} onChange={e => updateMetric(grp, idx, "value", { number: Number(e.target.value) })}
                          style={{ width: 70, background: "#222", color: "#fff", border: "1px solid #3bbca9", borderRadius: 4, padding: "2px 8px" }} />
                        <select value={safeVal.prestige} onChange={e => updateMetric(grp, idx, "value", { prestige: e.target.value })}
                          style={{ background: "#222", color: "#fff", border: "1px solid #3bbca9", borderRadius: 4, padding: "2px 8px" }}>
                          <option value="RAPTOR">RAPTOR</option>
                          <option value="RAIDER">RAIDER</option>
                          <option value="CORSAIR">CORSAIR</option>
                        </select>
                        <input type="number" value={safeVal.prestigeLevel} min={1} onChange={e => updateMetric(grp, idx, "value", { prestigeLevel: Number(e.target.value) })}
                          style={{ width: 70, background: "#222", color: "#fff", border: "1px solid #3bbca9", borderRadius: 4, padding: "2px 8px", marginLeft: 4 }}
                          placeholder="Prestige Level" />
                      </>);
                    }
                    // Bounty (Player)
                    if (["shipbountyplayer", "fpsbountyplayer"].includes(metricKey)) {
                      const val = (cond as Metric).value;
                      const safeVal: BountyPlayerValue = (typeof val === "object" && val !== null && "number" in val && "player" in val)
                        ? val as BountyPlayerValue
                        : { number: 1, player: "" };
                      return (<>
                        <select value={(cond as Metric).operator} onChange={e => updateMetric(grp, idx, "operator", e.target.value)}
                          style={{ background: "#222", color: "#fff", border: "1px solid #3bbca9", borderRadius: 4, padding: "2px 8px" }}>
                          {OPERATOR_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                        <input type="number" value={safeVal.number} min={0} onChange={e => updateMetric(grp, idx, "value", { number: Number(e.target.value) })}
                          style={{ width: 70, background: "#222", color: "#fff", border: "1px solid #3bbca9", borderRadius: 4, padding: "2px 8px" }} />
                        <input type="text" value={safeVal.player} onChange={e => updateMetric(grp, idx, "value", { player: e.target.value })}
                          style={{ width: 140, background: "#222", color: "#fff", border: "1px solid #3bbca9", borderRadius: 4, padding: "2px 8px", marginLeft: 4 }}
                          placeholder="RSI Handle (exact)" />
                      </>);
                    }
                    // Find the selected metric's category
                    let selectedCat = null;
                    for (const cat of METRIC_CATEGORIES) {
                      if (cat.options.some(opt => opt.metric === (cond as Metric).metric)) {
                        selectedCat = cat.label;
                        break;
                      }
                    }
                    if (selectedCat === "Role" || selectedCat === "Rank") {
                      return (
                        <select value={String((cond as Metric).value)} onChange={e => updateMetric(grp, idx, "value", e.target.value === "true")}
                          style={{ background: "#222", color: "#fff", border: "1px solid #3bbca9", borderRadius: 4, padding: "2px 8px" }}>
                          <option value="true">TRUE</option>
                          <option value="false">FALSE</option>
                        </select>
                      );
                    } else {
                      const metricVal = (cond as Metric).value;
                      return (<>
                        <select value={(cond as Metric).operator} onChange={e => updateMetric(grp, idx, "operator", e.target.value)}
                          style={{ background: "#222", color: "#fff", border: "1px solid #3bbca9", borderRadius: 4, padding: "2px 8px" }}>
                          {OPERATOR_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                        <input
                          type="number"
                          value={typeof metricVal === "number" ? metricVal : 0}
                          min={0}
                          onChange={e => updateMetric(grp, idx, "value", e.target.value)}
                          style={{ width: 70, background: "#222", color: "#fff", border: "1px solid #3bbca9", borderRadius: 4, padding: "2px 8px" }}
                        />
                      </>);
                    }
                  })()}
                  <button type="button" onClick={() => removeCondition(grp, idx)} style={{ background: "#e02323", color: "#fff", border: "none", borderRadius: 4, padding: "2px 10px", fontWeight: 700, cursor: "pointer" }}>×</button>
                </div>
                {/* Helper text/tooltips below each metric row, only if the selected metric option has a tooltip */}
                {(() => {
                  const metricKey = (cond as Metric).metric;
                  let tooltip: string | undefined = undefined;
                  for (const cat of METRIC_CATEGORIES) {
                    const found = cat.options.find(opt => opt.metric === metricKey);
                    if (found && (found as MetricOption).tooltip) {
                      tooltip = (found as MetricOption).tooltip;
                      break;
                    }
                  }
                  if (tooltip) {
                    return (
                      <div style={{ minHeight: 18, marginTop: 2, marginLeft: 2, display: "flex", alignItems: "flex-start" }}>
                        <span style={{ color: "#aaa", fontSize: 12 }}>{tooltip}</span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )
        )}
      </div>
    </div>
  );


  // Helper to normalize a metric to { metric, operator, value }
  function normalizeMetric(metric: any) {
    // Find the category for this metric
    let category = undefined;
    for (const cat of METRIC_CATEGORIES) {
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

  // Recursively normalize a group or array of metrics
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

  // Save handler: flatten to array if top-level is AND and all children are metrics (for compatibility), always normalized
  const handleSave = () => {
    const result = normalizeGroup(group.conditions);
    onSave(result);
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
      <div style={{ background: "#222", color: "#fff", padding: "2rem", borderRadius: "8px", minWidth: 350, maxWidth: 600, position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>Triggers</h3>
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
                  {METRIC_CATEGORIES.sort((a, b) => a.label.localeCompare(b.label)).map(cat => (
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
                      {/* Submenu */}
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
          <p style={{ color: "#aaa" }}>Build the trigger logic for this badge:</p>
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
}

export default TriggersWindow;
