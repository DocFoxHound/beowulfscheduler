import { notifyAward } from "../../api/notifyAwardApi";
import React, { useState, useRef } from "react";
import EmojiPicker from "../EmojiPicker";
import TriggersWindow, { ConditionGroup } from "./TriggersWindow";
import { BadgeReusable } from "../../types/badgeReusable";
import SelectSeriesModal from "./SelectSeriesModal";
import { type User } from "../../types/user";
import { createBadge as createBadgeRecord } from "../../api/badgeRecordApi";
import { getLatestPatch } from "../../api/patchApi";
import { createBadgeAccolade } from "../../api/badgeAccoladeRecordApi";
import { editRecentFleet } from "../../api/recentGangsApi";
import { createBadge, updateBadge } from "../../api/badgeRecordApi";
import { fetchAllBadgeReusables } from "../../api/badgeReusableApi";


interface CreateBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (badge: any) => Promise<void>;
  initialData?: Partial<BadgeReusable>;
  mode?: "create" | "edit";
  submitLabel?: string;
  users: User[];
  fleet?: any;
  emojis: any[];
  badgeType: "player" | "accolade";
}

const emptyForm = {
  badge_name: "",
  badge_description: "",
  badge_weight: "1", // always string in form
  prestige: false,
  prestige_name: "",
  prestige_level: 1,
  subject: "",
  progression: false,
  progression_rank: "",
  reusable: false,
  series: false, // <-- new toggle for Series
  image_url: "", // <-- add image_url to form
  series_name: "",
  series_position: "",
  series_id: "",
};

const CreateBadgeModal: React.FC<CreateBadgeModalProps> = ({ isOpen, onClose, onSubmit, initialData, mode = "create", submitLabel, users, emojis, badgeType, fleet }) => {
  // State for selected series badge (from SelectSeriesModal)
  const [selectedSeriesBadge, setSelectedSeriesBadge] = useState<import("../../types/badgeReusable").BadgeReusable | null>(null);
  // State to store all badge reusables
  const [badgeReusables, setBadgeReusables] = useState<BadgeReusable[]>([]);
  // State to control SelectSeriesModal visibility
  const [showSeriesModal, setShowSeriesModal] = useState(false);
  // Fetch all badge reusables when modal opens
  React.useEffect(() => {
    if (isOpen) {
      fetchAllBadgeReusables()
        .then((data) => {
          if (Array.isArray(data)) {
            setBadgeReusables(data);
          } else {
            setBadgeReusables([]);
          }
        })
        .catch(() => setBadgeReusables([]));
    }
  }, [isOpen]);
  // Ensure badge_weight is always a string in form state
  const [form, setForm] = useState(() => {
    let defaultEmoji = null;
    if (emojis && emojis.length > 0) {
      defaultEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    }
    return {
      ...emptyForm,
      ...initialData,
      badge_weight: initialData && initialData.badge_weight !== undefined ? String(initialData.badge_weight) : "1",
      image_url: initialData && initialData.image_url ? initialData.image_url : (defaultEmoji ? defaultEmoji.url : ""),
    };
  });
  // Emoji selection state
  const [selectedEmoji, setSelectedEmoji] = useState<import("../../types/emoji").Emoji | null>(null);
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);
  const weightInputRef = useRef<HTMLInputElement>(null);


  // Triggers modal state (must be inside the component)
  const [showTriggers, setShowTriggers] = useState(false);
  // Triggers state: always a ConditionGroup for the builder
  const defaultGroup: ConditionGroup = { type: "AND", conditions: [] };
  const [triggerGroup, setTriggerGroup] = useState<ConditionGroup>(() => {
    if (initialData && initialData.trigger && Array.isArray(initialData.trigger)) {
      return { type: "AND", conditions: initialData.trigger as (any)[] };
    } else if (initialData && initialData.trigger && typeof initialData.trigger === "object" && 'type' in initialData.trigger && 'conditions' in initialData.trigger) {
      return initialData.trigger as ConditionGroup;
    } else {
      return { ...defaultGroup };
    }
  });
  // Always use the latest trigger value from the menu
  const triggerRef = useRef<ConditionGroup>(triggerGroup);
  React.useEffect(() => { triggerRef.current = triggerGroup; }, [triggerGroup]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weightError, setWeightError] = useState<string | null>(null);
  // State to control recipient input visibility
  const [showRecipientInput, setShowRecipientInput] = useState(false);
  const [recipientValue, setRecipientValue] = useState("");
  const [recipientSuggestions, setRecipientSuggestions] = useState<User[]>([]);
  const [recipientArray, setRecipientArray] = useState<User[]>([]);

  // Helper to get display name
  const getDisplayName = (user: User) => user.nickname || user.username;

  // Filter suggestions as user types
  React.useEffect(() => {
    if (!showRecipientInput || !recipientValue) {
      setRecipientSuggestions([]);
      return;
    }
    const val = recipientValue.toLowerCase();
    setRecipientSuggestions(
      users.filter((u: User) => getDisplayName(u).toLowerCase().includes(val))
    );
  }, [recipientValue, showRecipientInput, users]);


  React.useEffect(() => {
    if (isOpen) {
      let defaultEmoji = null;
      if (emojis && emojis.length > 0) {
        defaultEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      }
      setForm(prev => {
        const base = {
          ...emptyForm,
          ...initialData,
          badge_weight: initialData && initialData.badge_weight !== undefined ? String(initialData.badge_weight) : "1",
          image_url: initialData && initialData.image_url ? initialData.image_url : (defaultEmoji ? defaultEmoji.url : ""),
        };
        // If editing, always set reusable to true
        if (mode === "edit") {
          return { ...base, reusable: true };
        }
        return base;
      });
      if (initialData && initialData.trigger && Array.isArray(initialData.trigger)) {
        setTriggerGroup({ type: "AND", conditions: initialData.trigger as (any)[] });
      } else if (initialData && initialData.trigger && typeof initialData.trigger === "object" && 'type' in initialData.trigger && 'conditions' in initialData.trigger) {
        setTriggerGroup(initialData.trigger as ConditionGroup);
      } else {
        setTriggerGroup({ ...defaultGroup });
      }
      setError(null);
      setWeightError(null);
      // Set selectedEmoji: if editing and initialData.image_url, use that emoji, else randomize
      if (mode === "edit" && initialData && initialData.image_url && emojis && emojis.length > 0) {
        const found = emojis.find(e => e.url === initialData.image_url);
        setSelectedEmoji(found || null);
      } else if (emojis && emojis.length > 0) {
        setSelectedEmoji(emojis[Math.floor(Math.random() * emojis.length)]);
      } else {
        setSelectedEmoji(null);
      }
    }
  }, [isOpen, initialData, mode, emojis]);


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = e.target;
    const { name, value, type } = target;
    if (name === "badge_weight") {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
      // Do not setWeightError here; only validate on blur or submit
      return;
    }
    if (name === "prestige") {
      const checked = (target as HTMLInputElement).checked;
      setForm((prev) => ({
        ...prev,
        prestige: checked,
        reusable: checked ? true : prev.reusable,
        // If prestige is turned on, turn off series
        series: checked ? false : prev.series,
      }));
      return;
    }
    if (name === "series") {
      const checked = (target as HTMLInputElement).checked;
      setForm((prev) => ({
        ...prev,
        series: checked,
        // If series is turned on, force reusable on and prestige off
        reusable: checked ? true : prev.reusable,
        prestige: checked ? false : prev.prestige,
      }));
      return;
    }
    if (name === "reusable") {
      const checked = (target as HTMLInputElement).checked;
      setForm((prev) => ({
        ...prev,
        reusable: checked,
        // If reusable is turned off, turn off series
        series: checked ? prev.series : false,
      }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox"
        ? (target as HTMLInputElement).checked
        : name.includes("level")
        ? Number(value)
        : value,
    }));
  };

  // Validate badge_weight on blur
  const handleWeightBlur = () => {
    const value = form.badge_weight;
    if (value === "" || value === "-") {
      setWeightError("Weight is required.");
      return;
    }
    const num = Number(value);
    if (isNaN(num)) {
      setWeightError("Weight must be a number.");
      return;
    }
    if (num < -100 || num > 100) {
      setWeightError("Weight must be between -100 and 100.");
      return;
    }
    setWeightError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const value = form.badge_weight;
    if (value === "" || value === "-") {
      setWeightError("Weight is required.");
      return;
    }
    const num = Number(value);
    if (isNaN(num)) {
      setWeightError("Weight must be a number.");
      return;
    }
    if (num < -100 || num > 100) {
      setWeightError("Weight must be between -100 and 100.");
      return;
    }
    setLoading(true);

    try {
      // Fetch latest patch version and select the highest
      let patchVersion = undefined;
      try {
        const patchData = await getLatestPatch();
        let versions: number[] = [];
        if (Array.isArray(patchData)) {
          versions = patchData
            .map(p => {
              if (typeof p.version === "string") {
                const num = parseFloat(p.version);
                return isNaN(num) ? null : num;
              }
              return null;
            })
            .filter(v => v !== null);
        } else if (patchData && typeof patchData.version === "string") {
          const num = parseFloat(patchData.version);
          if (!isNaN(num)) versions = [num];
        }
        if (versions.length > 0) {
          const maxVersion = Math.max(...versions);
          patchVersion = maxVersion.toString();
        }
      } catch (e) {
        patchVersion = undefined;
      }

      if (!form.reusable) {
        if (badgeType === "accolade" && fleet && fleet.id) {
          try {
            // 1. Create badgeAccolade for the fleet
            const accoladePayload = {
              id: String(BigInt(Date.now()) * BigInt(1000)) + BigInt(Math.floor(Math.random() * 1000)),
              badge_name: form.badge_name,
              badge_description: form.badge_description,
              badge_weight: Number(form.badge_weight),
              patch: patchVersion,
              badge_icon: selectedEmoji ? selectedEmoji.name : "",
              badge_url: form.image_url,
              fleet_id: fleet.id,
              accolade: true
            };
            const newAccolade = await createBadgeAccolade(accoladePayload);
            // 2. Update fleet's accolades array
            if (newAccolade && newAccolade.id) {
              // const updatedAccolades = Array.isArray(fleet.accolades)
              //   ? [...fleet.accolades.map(String), String(newAccolade.id)]
              //   : [String(newAccolade.id)];
              // await editFleet(fleet.id, {
              //   accolades: updatedAccolades,
              //   updated_at: fleet.updated_at,
              // });
              await editRecentFleet(fleet.id, {
                accolade: newAccolade.id,
                icon_url: fleet.icon_url || "",
                id: fleet.id,
                channel_id: fleet.channel_id,
                channel_name: fleet.channel_name,
                timestamp: fleet.timestamp,
                created_at: fleet.created_at,
                users: fleet.users,
                pu_shipkills: fleet.pu_shipkills,
                pu_fpskills: fleet.pu_fpskills,
                ac_shipkills: fleet.ac_shipkills,
                ac_fpskills: fleet.ac_fpskills,
                stolen_cargo: fleet.stolen_cargo,
                stolen_value: fleet.stolen_value,
                damages: fleet.damages,
                patch: fleet.patch,
              });
            }
            // 3. Award badgeRecord to every user in the users array
            if (Array.isArray(users) && users.length > 0) {
              for (const user of users) {
                console.log("User: ", user)
                if (!user.id || isNaN(Number(user.id))) continue;
                const badgeRecordPayload = {
                  id: (String(BigInt(Date.now()) * BigInt(1000)) + BigInt(Math.floor(Math.random() * 1000))).toString(),
                  user_id: String(user.id),
                  badge_name: form.badge_name,
                  badge_description: form.badge_description,
                  badge_weight: Number(form.badge_weight),
                  patch: patchVersion,
                  badge_icon: selectedEmoji ? selectedEmoji.name : "",
                  badge_url: form.image_url,
                  accolade: true
                };
                await createBadge(badgeRecordPayload);
              }
            }
            // Also award badge to all fleet members and commander
            let fleetUserIds: string[] = [];
            if (Array.isArray(fleet?.members_ids)) {
              fleetUserIds = fleet.members_ids.map(String);
            }
            if (fleet?.commander_id) {
              fleetUserIds.push(String(fleet.commander_id));
            }
            fleetUserIds = Array.from(new Set(fleetUserIds)); // Remove duplicates
            for (const userId of fleetUserIds) {
              if (!userId || isNaN(Number(userId))) continue;
              // Ensure unique ID per user by adding userId and random
              const uniqueId = (BigInt(Date.now()) * BigInt(1000) + BigInt(Math.floor(Math.random() * 1000)) + BigInt(userId)).toString();
              const badgeRecordPayload = {
                id: uniqueId,
                user_id: userId,
                badge_name: form.badge_name,
                badge_description: form.badge_description,
                badge_weight: Number(form.badge_weight),
                patch: patchVersion,
                badge_icon: selectedEmoji ? selectedEmoji.name : "",
                badge_url: form.image_url,
              };
              await createBadge(badgeRecordPayload);
            }
            setForm(emptyForm);
            setTriggerGroup({ type: "AND", conditions: [] });
            if (typeof fleet?.onActionComplete === "function") {
              fleet.onActionComplete();
            }
            onClose();
            return;
          } catch (err) {
            console.error("Accolade badge creation error:", err);
            setError("Failed to create accolade badge.");
            setLoading(false);
            return;
          }
        } else {
          // Save as BadgeRecord for each recipient
          if (recipientArray.length === 0) {
            setError("Please add at least one recipient.");
            setLoading(false);
            return;
          }
          for (const user of recipientArray) {
            if (!user.id || isNaN(Number(user.id))) {
              console.error("Invalid user id for badge record:", user);
              continue;
            }
            // Generate a unique BigInt ID (timestamp + random)
            const uniqueId = (BigInt(Date.now()) * BigInt(1000)) + BigInt(Math.floor(Math.random() * 1000));
            const badgeRecord = {
              id: uniqueId.toString(),
              user_id: String(user.id),
              badge_name: form.badge_name,
              badge_description: form.badge_description,
              badge_weight: String(num),
              patch: patchVersion,
            };
            await createBadgeRecord(badgeRecord as any);
            // Notify Discord bot about the award
            try {
              await notifyAward(
                form.badge_name,
                form.badge_description,
                getDisplayName(user),
                String(user.id)
              );
            } catch (notifyErr) {
            }
          }
          setForm(emptyForm);
          setRecipientArray([]);
          setRecipientValue("");
          setShowRecipientInput(false);
          setTriggerGroup({ type: "AND", conditions: [] });
          onClose();
          return;
        }
      }
      // If 'Reusable' is toggled on, save as BadgeReusable
      if (form.reusable) {
        // Use updateBadgeReusable if editing, otherwise createBadgeReusable
        const isEdit = mode === "edit" && initialData && initialData.id;
        // Use the latest trigger JSON from the trigger menu
        const triggerValue = triggerRef.current;

        // --- SUBJECT LOGIC ---
        // Always flatten and normalize to array of metric objects
        let triggerArray: any[] = [];
        if (Array.isArray(triggerValue)) {
          triggerArray = flattenTriggerConditions(triggerValue);
        } else if (triggerValue && typeof triggerValue === 'object' && 'conditions' in triggerValue && Array.isArray(triggerValue.conditions)) {
          triggerArray = flattenTriggerConditions(triggerValue.conditions);
        }
        // Extract categories
        const categories = triggerArray.map(obj => obj && typeof obj === 'object' && 'category' in obj ? obj.category : undefined).filter(Boolean);
        let subject = "General";
        if (categories.length === 0) {
          subject = "General";
        } else {
          const unique = Array.from(new Set(categories));
          if (unique.length === 1) {
            subject = unique[0];
          } else {
            subject = "Mixed";
          }
        }

        // If prestige is toggled, override subject to 'Prestige'
        if (form.prestige) {
          subject = "Prestige";
        }

        // Prepare badgeReusable object (exclude series_name)
        const {
          series_name, // exclude from save
          ...formToSave
        } = form;
        // Only set series_id and series_position if series toggle is on
        let series_id = undefined;
        let series_position = undefined;
        if (form.series) {
          if (!form.series_id) {
            // No series selected, generate new series_id and set position to 1
            series_id = Date.now().toString();
            series_position = "1";
          } else if (form.series_id && form.series_position !== "") {
            series_id = form.series_id;
            series_position = form.series_position;
          }
        }
        const badgeReusable = {
          ...formToSave,
          series_id,
          series_position,
          id: isEdit ? initialData.id : (BigInt(Date.now()) * BigInt(1000) + BigInt(Math.floor(Math.random() * 1000))).toString(),
          badge_weight: String(num),
          trigger: triggerArray,
          deleted: false,
          prestige_name: form.prestige ? (form.prestige_name ? form.prestige_name : null) : null,
          prestige_level: form.prestige ? (form.prestige_level ? form.prestige_level : null) : null,
          progression_rank: null,
          progression: null,
          subject,
          image_url: form.image_url,
          emoji_name: selectedEmoji ? selectedEmoji.name : null,
        };
        try {
          // @ts-ignore: dynamic import for code-splitting or if not imported
          const badgeReusableApi = await import('../../api/badgeReusableApi');
          if (isEdit) {
            await badgeReusableApi.updateBadgeReusable(String(initialData.id), badgeReusable as any);
          } else {
            await badgeReusableApi.createBadgeReusable(badgeReusable as any);
          }
        } catch (err) {
          console.error('Failed to save badge reusable:', err);
          setError('Failed to save reusable badge.');
          setLoading(false);
          return;
        }
        setForm(emptyForm);
        setTriggerGroup({ type: "AND", conditions: [] });
        onClose();
        return;
      }



// Helper function as arrow function at top-level to avoid ES5 strict mode error

      // Otherwise, use the original onSubmit logic (for non-reusable badges)
      const badgeToSubmit = { ...form, badge_weight: BigInt(num), trigger: triggerGroup };
      await onSubmit(badgeToSubmit);
      setForm(emptyForm);
      setTriggerGroup({ type: "AND", conditions: [] });
      onClose();
    } catch (err) {
      console.error("Badge creation error:", err);
      setError(`Failed to ${mode === "edit" ? "edit" : "create"} badge.`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
  style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000 }}
      onClick={() => {
        if (showEmojiMenu) {
          setShowEmojiMenu(false);
        } else {
          onClose();
        }
      }}
    >
      <div
        style={{ background: "#222", color: "#fff", padding: "2rem", borderRadius: "8px", minWidth: 350, maxWidth: 400 }}
        onClick={e => e.stopPropagation()}
      >
        <h3>{mode === "edit" ? (badgeType === "accolade" ? "Edit Accolade" : "Edit Badge") : (badgeType === "accolade" ? "Create Accolade" : "Create Badge")}</h3>
        {/* Hide prestige/reusable for accolade type */}
        {badgeType !== "accolade" && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            {/* Prestige toggle (left) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 90 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <span>Prestige:</span>
                <span style={{ position: 'relative', display: 'inline-block', width: 44, height: 24 }}>
                  <input
                    type="checkbox"
                    name="prestige"
                    checked={form.prestige}
                    onChange={handleChange}
                    style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                    id="prestige-toggle"
                  />
                  <span
                    style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: form.prestige ? '#3bbca9' : '#888',
                      borderRadius: 24,
                      transition: 'background 0.2s',
                    }}
                  ></span>
                  <span
                    style={{
                      position: 'absolute',
                      left: form.prestige ? 22 : 2,
                      top: 2,
                      width: 20,
                      height: 20,
                      background: '#fff',
                      borderRadius: '50%',
                      transition: 'left 0.2s',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    }}
                  ></span>
                </span>
              </label>
              <div style={{ fontSize: '0.85em', color: '#aaa', marginTop: 2, width: 90, textAlign: 'center' }}>
                Required for prestige level
              </div>
            </div>
            {/* Reusable toggle (middle) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 90 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <span>Reusable:</span>
                <span style={{ position: 'relative', display: 'inline-block', width: 44, height: 24 }}>
                  <input
                    type="checkbox"
                    name="reusable"
                    checked={form.reusable}
                    onChange={handleChange}
                    disabled={form.prestige}
                    style={{ opacity: 0, width: 0, height: 0, position: 'absolute', cursor: form.prestige ? 'not-allowed' : 'pointer' }}
                    id="reusable-toggle"
                  />
                  <span
                    style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: form.reusable ? '#3bbca9' : '#888',
                      borderRadius: 24,
                      transition: 'background 0.2s',
                    }}
                  ></span>
                  <span
                    style={{
                      position: 'absolute',
                      left: form.reusable ? 22 : 2,
                      top: 2,
                      width: 20,
                      height: 20,
                      background: '#fff',
                      borderRadius: '50%',
                      transition: 'left 0.2s',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    }}
                  ></span>
                </span>
              </label>
              <div style={{ fontSize: '0.85em', color: '#aaa', marginTop: 2, width: 90, textAlign: 'center' }}>
                Can award multiple times
              </div>
            </div>
            {/* Series toggle (right) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 90 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <span>Series:</span>
                <span style={{ position: 'relative', display: 'inline-block', width: 44, height: 24 }}>
                  <input
                    type="checkbox"
                    name="series"
                    checked={form.series}
                    onChange={handleChange}
                    style={{ opacity: 0, width: 0, height: 0, position: 'absolute', cursor: 'pointer' }}
                    id="series-toggle"
                  />
                  <span
                    style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: form.series ? '#3bbca9' : '#888',
                      borderRadius: 24,
                      transition: 'background 0.2s',
                    }}
                  ></span>
                  <span
                    style={{
                      position: 'absolute',
                      left: form.series ? 22 : 2,
                      top: 2,
                      width: 20,
                      height: 20,
                      background: '#fff',
                      borderRadius: '50%',
                      transition: 'left 0.2s',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    }}
                  ></span>
                </span>
              </label>
              <div style={{ fontSize: '0.85em', color: '#aaa', marginTop: 2, width: 90, textAlign: 'center' }}>
                Part of a badge series.
              </div>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', marginBottom: '1rem' }}>
        {/* Emoji display and picker trigger */}
        <div style={{ minWidth: 60, position: 'relative' }}>
          <button
            type="button"
            style={{
              background: 'transparent',
              border: '1px solid #3bbca9',
              borderRadius: 8,
              padding: 6,
              minWidth: 60,
              minHeight: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            onClick={e => { e.stopPropagation(); setShowEmojiMenu(true); }}
            title={selectedEmoji ? selectedEmoji.name : 'Select emoji'}
          >
            {selectedEmoji ? (
              <img src={selectedEmoji.url} alt={selectedEmoji.name} style={{ width: 40, height: 40, borderRadius: 4 }} />
            ) : (
              <span style={{ color: '#aaa' }}>?</span>
            )}
          </button>
          {/* Emoji selection modal using EmojiPicker */}
          {showEmojiMenu && (
            <div
              style={{
                position: 'absolute',
                zIndex: 2000,
                background: '#222',
                border: '2px solid #3bbca9',
                borderRadius: 12,
                padding: 16,
                top: '60px',
                left: '0',
                boxShadow: '0 2px 16px rgba(0,0,0,0.25)',
                minWidth: 320,
                maxHeight: 400,
                overflowY: 'auto',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Use EmojiPicker for emoji selection */}
              <EmojiPicker
                emojis={emojis}
                selectedEmoji={selectedEmoji}
                onSelect={(emoji) => {
                  setSelectedEmoji(emoji);
                  setForm(prev => ({
                    ...prev,
                    image_url: emoji.url,
                  }));
                  setShowEmojiMenu(false);
                }}
              />
              <button
                type="button"
                style={{ marginTop: 16, background: '#444', color: '#fff', border: 'none', borderRadius: 4, padding: '0.5rem 1rem' }}
                onClick={() => setShowEmojiMenu(false)}
              >Cancel</button>
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <label>Badge Name:<br />
            <input name="badge_name" value={form.badge_name} onChange={handleChange} required style={{ width: "100%" }} />
          </label>
        </div>
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label>Description:<br />
          <textarea
            name="badge_description"
            value={form.badge_description}
            onChange={e => {
              if (e.target.value.length <= 200) handleChange(e);
            }}
            required
            maxLength={200}
            style={{ width: "100%" }}
          />
        </label>
        <div style={{ color: form.badge_description.length === 200 ? "#e02323" : "#aaa", fontSize: "0.9em", marginTop: 2, textAlign: "right" }}>
          {form.badge_description.length}/200 characters
        </div>
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label>Weight:<br />
          <input
            ref={weightInputRef}
            type="text"
            name="badge_weight"
            value={form.badge_weight}
            onChange={handleChange}
            onBlur={handleWeightBlur}
            onFocus={e => e.target.select()}
            inputMode="numeric"
            pattern="-?[0-9]*"
            required
            style={{ width: "100%" }}
            placeholder="-100 to 100"
            autoComplete="off"
          />
        </label>
        {weightError && (
          <div style={{ color: "#e02323", fontSize: "0.9em", marginTop: 2 }}>{weightError}</div>
        )}
        {/* Additional warnings for weight value */}
        {!weightError && (() => {
          const num = Number(form.badge_weight);
          if (form.badge_weight !== "" && !isNaN(num)) {
            if (num > 50) {
              return <div style={{ color: "#e02323", fontSize: "0.9em", marginTop: 2 }}>Badges over 50 should be awarded seldomly.</div>;
            }
            if (num < 0) {
              return <div style={{ color: "#e02323", fontSize: "0.9em", marginTop: 2 }}>This will harm a player's Badge Score.</div>;
            }
          }
          return null;
        })()}
      </div>
      {/* Show series fields if series toggle is on */}
      {form.series && (
        <div style={{ marginBottom: "1rem", display: "flex", gap: "1rem" }}>
          <div style={{ flex: 1 }}>
            <label>Series Name:<br />
              <input
                type="text"
                name="series_name"
                value={selectedSeriesBadge ? selectedSeriesBadge.badge_name || "" : form.series_name || ""}
                readOnly
                style={{ width: "100%", background: "#181818", color: "#fff", border: "1px solid #888", borderRadius: 4, padding: "0.5rem" }}
              />
            </label>
          </div>
          <div style={{ flex: 1 }}>
            <label>Series Position:<br />
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  type="button"
                  style={{ background: "#3bbca9", color: "#fff", border: "none", borderRadius: 4, padding: "0.25rem 0.75rem", fontWeight: 600, fontSize: "1rem", cursor: "pointer" }}
                  onClick={() => {
                    setForm(prev => {
                      let val = Number(prev.series_position) || 0;
                      return { ...prev, series_position: String(val - 1) };
                    });
                  }}
                  aria-label="Decrement series position"
                >-</button>
                <input
                  type="number"
                  name="series_position"
                  value={form.series_position}
                  onChange={e => {
                    const value = e.target.value;
                    setForm(prev => ({ ...prev, series_position: value }));
                  }}
                  style={{ width: "100%", background: "#181818", color: "#fff", border: "1px solid #888", borderRadius: 4, padding: "0.5rem" }}
                />
                <button
                  type="button"
                  style={{ background: "#3bbca9", color: "#fff", border: "none", borderRadius: 4, padding: "0.25rem 0.75rem", fontWeight: 600, fontSize: "1rem", cursor: "pointer" }}
                  onClick={() => {
                    setForm(prev => {
                      let val = Number(prev.series_position) || 0;
                      return { ...prev, series_position: String(val + 1) };
                    });
                  }}
                  aria-label="Increment series position"
                >+</button>
              </div>
            </label>
          </div>
          <div style={{ flex: 1 }}>
            <label>Series ID:<br />
              <input
                type="text"
                name="series_id"
                value={selectedSeriesBadge ? selectedSeriesBadge.series_id || "" : form.series_id || ""}
                readOnly
                style={{ width: "100%", background: "#181818", color: "#fff", border: "1px solid #888", borderRadius: 4, padding: "0.5rem" }}
              />
            </label>
          </div>
        </div>
      )}
          {badgeType !== "accolade" && form.prestige && (
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <label style={{ flex: 1 }}>Prestige Name:<br />
                <select name="prestige_name" value={form.prestige_name} onChange={handleChange} style={{ width: "100%" }}>
                  <option value="">Select...</option>
                  <option value="RAPTOR">RAPTOR</option>
                  <option value="RAIDER">RAIDER</option>
                  <option value="CORSAIR">CORSAIR</option>
                </select>
              </label>
              <label style={{ flex: 1 }}>Prestige Level:<br />
                <select name="prestige_level" value={form.prestige_level} onChange={handleChange} style={{ width: "100%" }}>
                  {[1,2,3,4,5].map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </label>
            </div>
          )}
          {/* Hide recipients for accolade type */}
          {badgeType !== "accolade" && !form.reusable && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: '1.5rem' }}>
              <button
                type="button"
                style={{
                  background: '#3bbca9',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  padding: '0.5rem 1rem',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.12)'
                }}
                onClick={() => setShowRecipientInput(true)}
              >
                + Add Recipient
              </button>
              {showRecipientInput && (
                <div style={{ position: 'relative', width: '100%' }}>
                  {/* Chips for selected recipients */}
                  {recipientArray.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: '1rem', marginBottom: 4 }}>
                      {recipientArray.map((user, idx) => (
                        <span key={user.id || getDisplayName(user) + idx} style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          background: '#3bbca9',
                          color: '#222',
                          borderRadius: 16,
                          padding: '0.25rem 0.75rem',
                          fontWeight: 600,
                          fontSize: '0.95em',
                          marginRight: 4,
                          marginBottom: 4,
                        }}>
                          {getDisplayName(user)}
                          <button
                            type="button"
                            onClick={() => setRecipientArray(arr => arr.filter((u, i) => i !== idx))}
                            style={{
                              marginLeft: 8,
                              background: 'none',
                              border: 'none',
                              color: '#222',
                              fontWeight: 700,
                              fontSize: '1em',
                              cursor: 'pointer',
                              lineHeight: 1,
                            }}
                            aria-label={`Remove ${getDisplayName(user)}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder="Enter recipient name or ID"
                    value={recipientValue}
                    onChange={e => setRecipientValue(e.target.value)}
                    style={{ marginTop: recipientArray.length > 0 ? 0 : '1rem', width: '100%', padding: '0.5rem', borderRadius: 4, border: '1px solid #888', background: '#181818', color: '#fff' }}
                    autoFocus
                    autoComplete="off"
                    onKeyDown={e => {
                      if (e.key === 'Backspace' && recipientValue === '' && recipientArray.length > 0) {
                        setRecipientArray(arr => arr.slice(0, -1));
                      }
                    }}
                  />
                  {recipientSuggestions.length > 0 && (
                    <ul style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      right: 0,
                      background: '#222',
                      border: '1px solid #3bbca9',
                      borderRadius: 4,
                      zIndex: 10,
                      listStyle: 'none',
                      margin: 0,
                      padding: 0,
                      maxHeight: 180,
                      overflowY: 'auto',
                    }}>
                      {recipientSuggestions.map((user, idx) => (
                        <li
                          key={user.id || getDisplayName(user) + idx}
                          style={{
                            padding: '0.5rem 1rem',
                            cursor: 'pointer',
                            borderBottom: idx !== recipientSuggestions.length - 1 ? '1px solid #333' : 'none',
                          }}
                          onMouseDown={e => {
                            e.preventDefault();
                            // Only add if not already present
                            setRecipientArray(arr => arr.find(u => u.id === user.id) ? arr : [...arr, user]);
                            setRecipientValue("");
                            setRecipientSuggestions([]);
                          }}
                        >
                          {getDisplayName(user)}
                          {user.nickname && (
                            <span style={{ color: '#aaa', fontSize: '0.9em', marginLeft: 8 }}>
                              ({user.username})
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
          <br />
          {/* <div style={{ marginBottom: "1rem" }}>
            <label>Progression:
              <input type="checkbox" name="progression" checked={form.progression} onChange={handleChange} style={{ marginLeft: 8 }} />
                <div style={{ fontSize: '0.85em', color: '#aaa', marginTop: 2 }}>
                Required to achieve the following Rank
                </div>
            </label>
          </div>
          {form.progression && (
            <div style={{ marginBottom: "1rem" }}>
              <label>Progression Rank:<br />
                <input name="progression_rank" value={form.progression_rank} onChange={handleChange} style={{ width: "100%" }} />
              </label>
            </div>
          )} */}
          {error && <div style={{ color: "#e02323", marginBottom: "1rem" }}>{error}</div>}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
            <div style={{ display: "flex", gap: "1rem" }}>
              {/* Hide triggers for accolade type */}
              {badgeType !== "accolade" && form.reusable && (
                <>
                  <button
                    type="button"
                    style={{ background: "#3bbca9", color: "#fff", border: "none", borderRadius: 4, padding: "0.5rem 1rem", fontWeight: 600 }}
                    onClick={() => setShowTriggers(true)}
                  >
                    Triggers
                  </button>
                  {form.series && (
                    <button
                      type="button"
                      style={{ background: "#3bbca9", color: "#fff", border: "none", borderRadius: 4, padding: "0.5rem 1rem", fontWeight: 600 }}
                      onClick={() => setShowSeriesModal(true)}
                    >
                      Series
                    </button>
                  )}
                </>
              )}
              {/* Cancel and Save buttons should always be visible */}
              <button type="button" onClick={onClose} style={{ background: "#444", color: "#fff", border: "none", borderRadius: 4, padding: "0.5rem 1rem" }}>Cancel</button>
              <button type="submit" disabled={loading} style={{ background: "#3bbca9", color: "#fff", border: "none", borderRadius: 4, padding: "0.5rem 1rem" }}>{submitLabel || (mode === "edit" ? "Save" : "Create")}</button>
            </div>
          </div>

        {/* SelectSeriesModal should be rendered here, outside the button group */}
        {showSeriesModal && (
          <SelectSeriesModal
            isOpen={showSeriesModal}
            onClose={() => setShowSeriesModal(false)}
            badgeReusables={badgeReusables}
            onSelect={async (series: import("../../types/badgeReusable").BadgeReusable) => {
              // If the selected badge has no series_id, generate one and update it
              let newSeriesId = series.series_id;
              if (!series.series_id) {
                newSeriesId = Date.now().toString();
                try {
                  // Ensure badge_weight is a number for updateBadge
                  const updatePayload = {
                    ...series,
                    series_id: newSeriesId,
                    series_position: "1",
                    badge_weight: typeof series.badge_weight === "bigint" ? Number(series.badge_weight) : series.badge_weight
                  };
                  await updateBadge(String(series.id), updatePayload);
                } catch (err) {
                  // Optionally handle error
                  console.error("Failed to update selected badge with new series_id", err);
                }
              }
              setForm(prev => ({
                ...prev,
                series_id: String(newSeriesId ?? series.id ?? ""),
                series_name: series.badge_name || "",
                series_position: series.series_position || "",
              }));
              setShowSeriesModal(false);
            }}
          />
        )}

          {/* Triggers Modal */}
          <TriggersWindow
            isOpen={showTriggers}
            onClose={() => setShowTriggers(false)}
            group={triggerGroup}
            setGroup={setTriggerGroup}
            onSave={(newTrigger) => {
              // Accepts either array or group, always store as group
              if (Array.isArray(newTrigger)) {
                setTriggerGroup({ type: "AND", conditions: newTrigger });
                triggerRef.current = { type: "AND", conditions: newTrigger };
              } else {
                setTriggerGroup(newTrigger as ConditionGroup);
                triggerRef.current = newTrigger as ConditionGroup;
              }
            }}
          />
        </form>
      </div>
    </div>
  );
};

const flattenTriggerConditions = (arr: any[]): any[] => {
  let out: any[] = [];
  for (const item of arr) {
    if (item && typeof item === 'object' && 'conditions' in item && Array.isArray(item.conditions)) {
      out = out.concat(flattenTriggerConditions(item.conditions));
    } else {
      out.push(item);
    }
  }
  return out;
};

export default CreateBadgeModal;
