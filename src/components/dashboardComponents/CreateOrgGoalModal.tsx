import React, { useState, useEffect } from "react";
import GoalTriggersWindow, { ConditionGroup } from "./GoalTriggers";
import { createOrgGoal, updateOrgGoal } from '../../api/orgGoalsApi';

interface CreateOrgGoalModalProps {
  open: boolean;
  mode: "create" | "edit";
  goal: any;
  position: number | null;
  overGoal: any;
  latestPatch?: any; // Optional prop for latest patch data
  onClose: () => void;
  onSaved?: () => void;
}

const CreateOrgGoalModal: React.FC<CreateOrgGoalModalProps> = ({ open, mode, goal, position, overGoal, latestPatch, onClose, onSaved }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [priority, setPriority] = useState<number>(position || 1);
  // Trigger modal state and group
  const [showTriggers, setShowTriggers] = useState(false);
  const defaultGroup: ConditionGroup = { type: "AND", conditions: [] };
  const [triggerGroup, setTriggerGroup] = useState<ConditionGroup>(defaultGroup);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Manual progression state
  const [manualProgress, setManualProgress] = useState(false);
  const [manualPercentage, setManualPercentage] = useState(0);

  useEffect(() => {
    if (mode === "edit" && goal) {
      setName(goal.goal_name || "");
      setDescription(goal.goal_description || "");
      setStartDate(goal.start_date ? new Date(goal.start_date).toISOString().slice(0, 10) : "");
      setEndDate(goal.end_date ? new Date(goal.end_date).toISOString().slice(0, 10) : "");
      setPriority(goal.priority || position || 1);
      // Robustly set trigger group if editing
      let trigger = goal.goal_trigger || goal.trigger;
      if (trigger && Array.isArray(trigger)) {
        setTriggerGroup({ type: "AND", conditions: trigger });
      } else if (trigger && typeof trigger === "object" && 'type' in trigger && 'conditions' in trigger) {
        setTriggerGroup(trigger);
      } else {
        setTriggerGroup({ ...defaultGroup });
      }
      setManualProgress(!!goal.manual_progress);
      setManualPercentage(typeof goal.manual_percentage === 'number' ? goal.manual_percentage : 0);
    } else if (mode === "create") {
      setName("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setPriority(position || 1);
      setTriggerGroup({ ...defaultGroup });
      setManualProgress(false);
      setManualPercentage(0);
    }
    setError(null);
    setSubmitting(false);
  }, [mode, goal, position]);


  // Validation for enabling Save
  const canSave = name && description && startDate && endDate && !submitting && (
    (manualProgress || (triggerGroup && triggerGroup.conditions.length > 0))
  );

  // Save handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSubmitting(true);
    setError(null);
    try {
      if (mode === 'create') {
        // If overGoal is provided, mark it as deleted first
        if (overGoal && overGoal.id) {
          await updateOrgGoal(overGoal.id, { deleted: true });
        }
        // Now create the new goal
        await createOrgGoal({
          id: Date.now().toString(), // Milliseconds since epoch
          goal_name: name,
          goal_description: description,
          goal_trigger: manualProgress ? [] : triggerGroup.conditions.map(c => JSON.parse(JSON.stringify(c))),
          start_date: new Date(startDate),
          end_date: new Date(endDate),
          priority,
          deleted: false,
          patch: latestPatch,
          created_at: new Date(),
          completed_on: null,
          manual_percentage: manualProgress ? manualPercentage : 0,
          manual_progress: manualProgress
        });
      } else if (mode === 'edit' && goal && goal.id) {
        // Update the existing goal with new values and trigger
        await updateOrgGoal(goal.id, {
          goal_name: name,
          goal_description: description,
          goal_trigger: manualProgress ? [] : triggerGroup.conditions.map(c => JSON.parse(JSON.stringify(c))),
          start_date: new Date(startDate),
          end_date: new Date(endDate),
          priority,
          patch: latestPatch,
          manual_percentage: manualProgress ? manualPercentage : 0,
          manual_progress: manualProgress
        });
      }
      if (typeof onSaved === 'function') onSaved();
      else onClose();
    } catch (err: any) {
      setError("Failed to save goal. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(40, 40, 40, 0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#39393cff',
        borderRadius: 8,
        padding: 24,
        minWidth: 320,
        maxWidth: 400,
        boxShadow: '0 2px 16px rgba(12, 12, 12, 0.2)'
      }}>
        <h3>{mode === 'create' ? 'Create New Org Goal' : 'Edit Org Goal'}</h3>
        <form style={{ display: 'flex', flexDirection: 'column', gap: 12 }} onSubmit={handleSave}>
          <label style={{ marginBottom: 6 }}>
            Name
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ width: '100%', padding: 6, borderRadius: 4, border: '1px solid #555', marginTop: 2, background: '#23272e', color: 'white' }}
              placeholder="Goal name"
              required
            />
          </label>
          <label style={{ marginBottom: 6 }}>
            Description
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ width: '100%', padding: 6, borderRadius: 4, border: '1px solid #555', marginTop: 2, background: '#23272e', color: 'white', minHeight: 60 }}
              placeholder="Goal description"
              required
            />
          </label>
          <label style={{ marginBottom: 6 }}>
            Start Date
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={{ width: '100%', padding: 6, borderRadius: 4, border: '1px solid #555', marginTop: 2, background: '#23272e', color: 'white' }}
              required
            />
          </label>
          <label style={{ marginBottom: 6 }}>
            End Date
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              style={{ width: '100%', padding: 6, borderRadius: 4, border: '1px solid #555', marginTop: 2, background: '#23272e', color: 'white' }}
              required
            />
          </label>
          <label style={{ marginBottom: 6 }}>
            Priority
            <input
              type="number"
              value={priority}
              min={1}
              readOnly
              style={{ width: '100%', padding: 6, borderRadius: 4, border: '1px solid #555', marginTop: 2, background: '#23272e', color: 'white', opacity: 0.7, cursor: 'not-allowed' }}
              required
            />
          </label>
          {/* Manual Progression Toggle */}
          <label style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>Manual Progression</span>
            <input
              type="checkbox"
              checked={manualProgress}
              onChange={e => setManualProgress(e.target.checked)}
              style={{ width: 20, height: 20, accentColor: '#4caf50', cursor: 'pointer' }}
            />
          </label>

          {/* Percentage slider, only if manualProgress is on */}
          {manualProgress && (
            <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
              <label style={{ marginBottom: 4, fontWeight: 500, color: '#fff' }}>Manual Progress (%)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={manualPercentage}
                  onChange={e => setManualPercentage(Number(e.target.value))}
                  style={{ flex: 1, accentColor: '#4caf50', height: 4 }}
                />
                <span style={{ minWidth: 40, textAlign: 'right', color: '#4caf50', fontWeight: 600 }}>{manualPercentage}%</span>
              </div>
            </div>
          )}

          {/* Triggers button, only if manualProgress is off */}
          {!manualProgress && (
            <label style={{ marginBottom: 6 }}>
              Trigger
              <button
                type="button"
                style={{ width: '100%', padding: 6, borderRadius: 4, border: '1px solid #555', marginTop: 2, background: '#23272e', color: 'white', cursor: 'pointer' }}
                onClick={() => setShowTriggers(true)}
              >
                {triggerGroup && triggerGroup.conditions && triggerGroup.conditions.length > 0 ? 'Edit Trigger' : 'Set Trigger'}
              </button>
            </label>
          )}
          {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button type="button" onClick={onClose} style={{ padding: '6px 16px', borderRadius: 4, border: 'none', background: '#222', color: 'white', cursor: 'pointer' }}>Close</button>
            <button type="submit" style={{ padding: '6px 16px', borderRadius: 4, border: 'none', background: '#4caf50', color: 'white', cursor: canSave ? 'pointer' : 'not-allowed', opacity: canSave ? 1 : 0.6 }} disabled={!canSave}>{submitting ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
        {/* GoalTriggersWindow modal */}
        <GoalTriggersWindow
          isOpen={showTriggers}
          onClose={() => setShowTriggers(false)}
          group={triggerGroup}
          setGroup={setTriggerGroup}
          onSave={newTrigger => {
            // Accepts either array or group, always store as group
            if (Array.isArray(newTrigger)) {
              setTriggerGroup({ type: "AND", conditions: newTrigger });
            } else {
              setTriggerGroup(newTrigger as ConditionGroup);
            }
            setShowTriggers(false);
          }}
        />
      </div>
    </div>
  );
};

export default CreateOrgGoalModal;
