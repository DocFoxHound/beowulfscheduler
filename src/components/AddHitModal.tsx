import React, { useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import { Hit } from "../types/hittracker";
import { SummarizedItem } from "../types/items_summary";
import { getAllUsers } from "../api/userService";
import { User } from "../types/user";
import { fetchAllFleets } from "../api/fleetApi";
import { UserFleet } from "../types/fleet";
import { createHit, updateHit, deleteHit } from "../api/hittrackerApi";
import { addWarehouseItem } from "../api/warehouseApi";
import { v4 as uuidv4 } from "uuid";
import { fetchAllRecentGatherings } from "../api/recentGatheringsApi";
import { RecentGathering } from "../types/recent_gatherings";
import { createPlayerExperience, editPlayerExperience, deletePlayerExperience, fetchPlayerExperiencesByOperationId } from "../api/playerExperiencesApi";
import { fetchBlackBoxsByUserId } from "../api/blackboxApi";

interface AddHitModalProps {
  show: boolean;
  onClose: () => void;
  gameVersion: string | null;
  userId: string;
  username: string;
  onSubmit: (hit: Hit) => Promise<void>;
  isSubmitting: boolean;
  formError: string | null;
  setFormError: React.Dispatch<React.SetStateAction<string | null>>;
  summarizedItems: SummarizedItem[];
  isEditMode?: boolean;
  hit?: Hit;
  onUpdate?: (hit: Hit) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const initialForm = {
  assists: "",
  total_scu: "",
  air_or_ground: "MIXED", // Default to MIXED
  title: "",
  story: "",
  assists_usernames: "",
  video_link: "",
  additional_media_links: "",
  type_of_piracy: "Brute Force",
  victims: "",
};

type CargoItem = {
  commodity_name: string;
  scuAmount: number;
  avg_price: number;
};

// Extend User type for assists grid
type AssistUserWithExperience = User & {
  dogfighter: boolean;
  marine: boolean;
  snare: boolean;
  cargo: boolean;
  multicrew: boolean;
  salvage: boolean;
  leadership: boolean;
};

const AddHitModal: React.FC<AddHitModalProps> = (props) => {
  const {
    show,
    onClose,
    gameVersion,
    userId,
    username,
    onSubmit,
    isSubmitting,
    formError,
    setFormError,
    summarizedItems,
  } = props;

  const [form, setForm] = useState(initialForm);

  // Cargo state
  const [cargoList, setCargoList] = useState<CargoItem[]>([]);
  const [warehouseFlags, setWarehouseFlags] = useState<{ toWarehouse: boolean; forOrg: boolean }[]>([]);
  const [showCargoPicker, setShowCargoPicker] = useState(false);
  const [cargoSearch, setCargoSearch] = useState("");
  const [selectedCargo, setSelectedCargo] = useState<SummarizedItem | null>(null);
  const [cargoQuantity, setCargoQuantity] = useState<number>(1);
  const [customCargoName, setCustomCargoName] = useState("");
  const [customCargoAvg, setCustomCargoAvg] = useState<number>(1);
  const [customCargoQty, setCustomCargoQty] = useState<number>(1);
  const [showCustomCargoMenu, setShowCustomCargoMenu] = useState(false);
  const addItemBtnRef = useRef<HTMLButtonElement>(null);

  // Users state
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [assistSuggestions, setAssistSuggestions] = useState<User[]>([]);
  const [assistsUsers, setAssistsUsers] = useState<AssistUserWithExperience[]>([]);

  // Fleets state
  const [allFleets, setAllFleets] = useState<UserFleet[]>([]);
  const [fleetSearch, setFleetSearch] = useState("");
  const [fleetSuggestions, setFleetSuggestions] = useState<UserFleet[]>([]);
  const [selectedFleet, setSelectedFleet] = useState<UserFleet | null>(null);
  const [selectedFleets, setSelectedFleets] = useState<UserFleet[]>([]);

  // Recent gatherings state
  const [recentGatherings, setRecentGatherings] = useState<RecentGathering[]>([]);
  const [showGatheringsMenu, setShowGatheringsMenu] = useState(false);
  const gatheringsMenuRef = useRef<HTMLDivElement | null>(null);

  // New state for input
  const [victimInput, setVictimInput] = useState("");
  // Array of victims
  const [victimsArray, setVictimsArray] = useState<string[]>([]);

  // Helper to parse assists and media links
  const parseArray = (str: string) =>
    str.split(",").map(s => s.trim()).filter(Boolean);

  // State for delete confirmation modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (show) {
      setFormError(null);
    }
  }, [show]);

  useEffect(() => {
    if (show) {
      getAllUsers().then(users => {
        setAllUsers(Array.isArray(users) ? users : users ? [users] : []);
      });
      fetchAllFleets().then(fleets => {
        setAllFleets(Array.isArray(fleets) ? fleets : fleets ? [fleets] : []);
      });
      fetchAllRecentGatherings().then(setRecentGatherings);
    }
  }, [show]);

  useEffect(() => {
    if (!showGatheringsMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        gatheringsMenuRef.current &&
        !gatheringsMenuRef.current.contains(event.target as Node)
      ) {
        setShowGatheringsMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showGatheringsMenu]);

  useEffect(() => {
    if (props.isEditMode && props.hit) {
      const h = props.hit;
      setForm({
        assists: "",
        total_scu: h.total_scu?.toString() ?? "",
        air_or_ground: h.air_or_ground,
        title: h.title,
        story: h.story,
        assists_usernames: "",
        video_link: h.video_link,
        additional_media_links: h.additional_media_links?.join(", ") ?? "",
        type_of_piracy: h.type_of_piracy,
        victims: "",
      });
      setCargoList(h.cargo || []);
      setWarehouseFlags(h.cargo?.map(() => ({ toWarehouse: false, forOrg: false })) || []);
      setVictimsArray(h.victims || []);

      // Fetch player experiences for this operation and map to assistsUsers
      fetchPlayerExperiencesByOperationId(h.id).then((experiences) => {
        setAssistsUsers(
          (h.assists || []).map((id, idx) => {
            const exp = experiences.find(e => e.user_id === String(id));
            return {
              id: String(id),
              username: h.assists_usernames?.[idx] || "",
              nickname: h.assists_usernames?.[idx] || "",
              corsair_level: 0,
              raptor_level: 0,
              radier_level: 0,
              rank: 0,
              roles: [],
              dogfighter: !!exp?.dogfighter,
              marine: !!exp?.marine,
              snare: !!exp?.snare,
              cargo: !!exp?.cargo,
              multicrew: !!exp?.multicrew,
              salvage: !!exp?.salvage,
              leadership: !!exp?.leadership,
            };
          })
        );
      });
      // ...set other fields as needed...
    }
  }, [props.isEditMode, props.hit]);

  useEffect(() => {
    if (show && !props.isEditMode) {
      setAssistsUsers(prev => {
        // Only add if not already present
        if (prev.some(u => String(u.id) === String(userId))) return prev;
        return [
          {
            id: String(userId),
            username: username,
            nickname: username,
            corsair_level: 0,
            raptor_level: 0,
            radier_level: 0,
            rank: 0,
            roles: [],
            dogfighter: false,
            marine: false,
            snare: false,
            cargo: false,
            multicrew: false,
            salvage: false,
            leadership: false,
          },
          ...prev,
        ];
      });
    }
  }, [show, userId, username, props.isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!cargoList.length) {
      setFormError("Cargo is required.");
      return;
    }
    if (!totalValue){
      setFormError("Total Value is required.");
      return;
    }
    if(!form.title){
      setFormError("Title is required.");
      return;
    }

    setSubmitting(true); // <-- Disable submit button

    // Prepare assists arrays
    let assistsArr = assistsUsers.map(u => u.username);
    let assistsIds = assistsUsers.map(u => String(u.id));
    let hitUserId = userId;
    let hitUsername = username;

    // Always ensure the submitting user is in assists
    // if (!assistsIds.includes(userId)) {
    //   assistsIds = [userId, ...assistsIds];
    //   assistsArr = [username, ...assistsArr];
    // }

    // If a fleet is tied, set user_id to fleet.id
    if (selectedFleets.length > 0) {
      hitUserId = selectedFleets[0].id;
    }

    const totalValueNum = totalValue;
    const totalSCUNum = cargoList.reduce((sum, item) => sum + item.scuAmount, 0);

    // Calculate total_cut_value
    const total_cut_value =
      assistsArr.length > 0
        ? Math.round(totalValueNum / (assistsArr.length + 1))
        : totalValueNum;

    const hit: Hit = {
      id: Date.now().toString(),
      user_id: hitUserId,
      cargo: cargoList,
      total_value: totalValueNum,
      patch: gameVersion ?? "",
      total_cut_value,
      assists: assistsIds,
      assists_usernames: assistsArr,
      total_scu: totalSCUNum,
      air_or_ground: form.air_or_ground,
      title: form.title,
      story: form.story,
      timestamp: new Date().toISOString(),
      username: hitUsername,
      video_link: form.video_link,
      additional_media_links: parseArray(form.additional_media_links),
      type_of_piracy: form.type_of_piracy,
      fleet_activity: selectedFleets.length > 0, // <-- true if any fleet selected
      fleet_names: selectedFleets.map(f => f.name),
      fleet_ids: selectedFleets.map(f => f.id),
      victims: victimsArray,
    };
    console.log(hit)

    try {
      await createHit(hit);

      // Add cargo items marked "to warehouse" to the warehouse DB
      await Promise.all(
        cargoList.map((item, idx) => {
          if (warehouseFlags[idx]?.toWarehouse) {
            return addWarehouseItem({
              id: randomBigIntId(), // Use random BIGINT-safe number as string
              user_id: userId,
              commodity_name: item.commodity_name,
              total_scu: item.scuAmount,
              total_value: item.avg_price * item.scuAmount,
              patch: gameVersion ?? "",
              location: "unk",
              for_org: warehouseFlags[idx]?.forOrg || false,
            });
          }
          return null;
        })
      );

      // Save player experiences for each assist user
      await Promise.all(
        assistsUsers.map(user =>
          createPlayerExperience({
            id: randomBigIntId(),
            user_id: String(user.id),
            username: user.username,
            operation_id: hit.id,
            operation_name: hit.title,
            operation_type: hit.type_of_piracy,
            patch: hit.patch,
            dogfighter: !!user.dogfighter,
            marine: !!user.marine,
            snare: !!user.snare,
            cargo: !!user.cargo,
            multicrew: !!user.multicrew,
            salvage: !!user.salvage,
            leadership: !!user.leadership,
          })
        )
      );

      setForm(initialForm);
      setCargoList([]);
      setShowSuccess(true); // <-- Show success popup
      setTimeout(() => setShowSuccess(false), 2000); // Hide after 2s
      onClose();
    } catch (err) {
      setFormError("Failed to submit hit. Please try again.");
    } finally {
      setSubmitting(false); // <-- Re-enable submit button
    }
  };

  const addCargoItem = (item: CargoItem) => {
    setCargoList(list => [...list, item]);
    setWarehouseFlags(flags => [...flags, { toWarehouse: false, forOrg: false }]);
  };

  // Calculate total value
  const totalValue = cargoList.reduce((sum, item) => sum + item.avg_price * item.scuAmount, 0);

  const handleAssistsFocus = () => {
    if (!form.assists.trim()) setShowGatheringsMenu(true);
  };
  const handleAssistsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm(f => ({ ...f, assists: value }));
    setShowGatheringsMenu(false); // Hide menu when typing

    if (value.trim() === "") {
      setAssistSuggestions([]);
      return;
    }
    // Simple case-insensitive substring match
    const suggestions = allUsers.filter(user => {
      const nickname = typeof user.nickname === "string" ? user.nickname : "";
      const username = typeof user.username === "string" ? user.username : "";
      const search = value.toLowerCase();
      return (
        nickname.toLowerCase().includes(search) ||
        username.toLowerCase().includes(search)
      );
    });
    setAssistSuggestions(suggestions.slice(0, 5)); // Show top 5 matches
  };

  const handleFleetSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFleetSearch(value);

    if (value.trim() === "") {
      setFleetSuggestions(
        [...allFleets].sort((a, b) => Number(b.last_active || 0) - Number(a.last_active || 0)).slice(0, 10)
      );
      return;
    }

    const suggestions = allFleets
      .filter(fleet =>
        fleet.name.toLowerCase().includes(value.toLowerCase())
      )
      .sort((a, b) => Number(b.last_active || 0) - Number(a.last_active || 0));
    setFleetSuggestions(suggestions.slice(0, 10));
  };

  // Generate a random BIGINT-safe integer as a string
  const randomBigIntId = () => {
    // 15 digits: 100000000000000 to 999999999999999
    return (
      Math.floor(
        Math.random() * 9_000_000_000_000_000
      ) + 1_000_000_000_000_000
    ).toString();
  };

  // Add this function here:
  const addAssistUser = (user: User) => {
    setAssistsUsers(prev => {
      if (prev.some(u => u.id === user.id)) return prev;
      return [
        ...prev,
        {
          ...user,
          dogfighter: false,
          marine: false,
          snare: false,
          cargo: false,
          multicrew: false,
          salvage: false,
          leadership: false,
        }
      ];
    });
  };

  if (!show) return null;

  return (
    <Modal onClose={onClose}>
      <h2>Add New Hit</h2>
      <form onSubmit={handleSubmit}>
        {/* Air or Ground Toggle - moved here */}
        <div style={{ width: "100%", display: "flex", justifyContent: "center", margin: "16px 0 8px 0" }}>
          <div style={{ display: "flex", gap: 40 }}>
            {/* Air or Ground */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ color: "#fff", marginBottom: 4, fontWeight: 500 }}>Air or Ground:</span>
              <div style={{ display: "flex" }}>
                {["Mixed", "Air", "Ground"].map((option, idx, arr) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, air_or_ground: option }))}
                    style={{
                      width: 100,
                      height: 36,
                      borderRadius: 18,
                      border: "1px solid #888",
                      background: form.air_or_ground === option ? "#2d7aee" : "#444",
                      color: "#fff",
                      fontWeight: "bold",
                      fontSize: 16,
                      marginRight: idx !== arr.length - 1 ? 8 : 0,
                      cursor: "pointer",
                      outline: "none",
                      letterSpacing: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                      boxSizing: "border-box",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                    }}
                    aria-pressed={form.air_or_ground === option}
                    aria-label={`Set to ${option}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            {/* Type of Piracy */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ color: "#fff", marginBottom: 4, fontWeight: 500 }}>Type of Piracy:</span>
              <button
                type="button"
                onClick={() =>
                  setForm(f => ({
                    ...f,
                    type_of_piracy: f.type_of_piracy === "Extortion" ? "Brute Force" : "Extortion"
                  }))
                }
                style={{
                  width: 140,
                  height: 36,
                  borderRadius: 18,
                  border: "1px solid #888",
                  background: form.type_of_piracy === "Extortion" ? "#2d7aee" : "#444",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: 16,
                  position: "relative",
                  transition: "background 0.2s",
                  outline: "none",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  letterSpacing: 1,
                }}
                aria-pressed={form.type_of_piracy === "Extortion"}
                aria-label="Toggle Type of Piracy"
              >
                {form.type_of_piracy === "Extortion" ? "Extortion" : "Brute Force"}
              </button>
            </div>
          </div>
        </div>
        <label>
          Title:
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            disabled={isSubmitting}
          />
        </label>
        <label>
          Cargo:
          <div style={{ marginBottom: "0.5em", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <div
              style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}
              tabIndex={-1}
              onMouseDown={e => {
                // Prevent focus from shifting to the first button when clicking empty space in the cargo area
                if (e.target === e.currentTarget) {
                  e.preventDefault();
                }
              }}
            >
              <button
                ref={addItemBtnRef}
                type="button"
                onClick={() => {
                  setShowCargoPicker(true);
                  setShowCustomCargoMenu(false);
                }}
                style={{
                  background: "#2d7aee",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  padding: "2px 10px",
                  fontSize: 16,
                  cursor: "pointer"
                }}
                aria-label="Add Cargo"
              >
                Add Item
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCustomCargoMenu(true);
                  setShowCargoPicker(false);
                }}
                style={{
                  background: "#2d7aee",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  padding: "2px 10px",
                  fontSize: 16,
                  cursor: "pointer"
                }}
                aria-label="Add Custom Cargo"
              >
                Add Custom
              </button>
              <span style={{ marginLeft: 16, fontWeight: "bold", color: "#fff" }}>
                Total Value: {totalValue.toLocaleString()}
              </span>
            </div>
            {showCustomCargoMenu && (
              <div style={{ background: "#23272e", border: "1px solid #353a40", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                <input
                  type="text"
                  placeholder="Name"
                  value={customCargoName}
                  onChange={e => setCustomCargoName(e.target.value)}
                  style={{ width: 120, marginRight: 8, marginBottom: 4 }}
                />
                <input
                  type="number"
                  min={1}
                  placeholder="Quantity"
                  value={customCargoQty}
                  onChange={e => setCustomCargoQty(Number(e.target.value))}
                  style={{ width: 80, marginRight: 8, marginBottom: 4 }}
                />
                <input
                  type="number"
                  min={1}
                  placeholder="Avg Value"
                  value={customCargoAvg}
                  onChange={e => setCustomCargoAvg(Number(e.target.value))}
                  style={{ width: 100, marginRight: 8, marginBottom: 4 }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!customCargoName.trim()) return;
                    addCargoItem({
                      commodity_name: customCargoName.trim(),
                      scuAmount: customCargoQty,
                      avg_price: customCargoAvg
                    });
                    setCustomCargoName("");
                    setCustomCargoQty(1);
                    setCustomCargoAvg(1);
                    // setShowCustomCargoMenu(false);
                  }}
                  style={{ background: "#2d7aee", color: "#fff", border: "none", borderRadius: 4, padding: "2px 10px", cursor: "pointer" }}
                  disabled={!customCargoName.trim() || customCargoQty < 1 || customCargoAvg < 1}
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowCustomCargoMenu(false);
                    if (addItemBtnRef.current) addItemBtnRef.current.blur();
                  }}
                  style={{ marginLeft: 8, background: "#444", color: "#fff", border: "none", borderRadius: 4, padding: "2px 10px", cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            )}
            <table style={{ width: "100%", marginTop: 8, marginBottom: 8, background: "#23272e", borderRadius: 6 }}>
              {cargoList.length > 0 && (
                <thead>
                  <tr>
                    <th style={{ color: "#ccc", padding: 4, textAlign: "left" }}>Item</th>
                    <th style={{ color: "#ccc", padding: 4, textAlign: "right" }}>Value</th>
                    <th style={{ color: "#ccc", padding: 4, textAlign: "right" }}>Quantity</th>
                    <th style={{ color: "#ccc", padding: 4, textAlign: "center" }}>For Org</th>
                    <th style={{ color: "#ccc", padding: 4, textAlign: "center" }}>To Warehouse</th>
                    <th></th>
                  </tr>
                </thead>
              )}
              <tbody>
                {cargoList.map((cargo, idx) => (
                  <tr key={cargo.commodity_name + idx}>
                    <td style={{ padding: 4 }}>{cargo.commodity_name}</td>
                    <td style={{ padding: 4, textAlign: "right" }}>{cargo.avg_price}</td>
                    <td style={{ padding: 4, textAlign: "right" }}>{cargo.scuAmount}</td>
                    <td style={{ padding: 4, textAlign: "center" }}>
                      <input
                        type="checkbox"
                        className="large-checkbox"
                        checked={warehouseFlags[idx]?.forOrg || false}
                        disabled={!warehouseFlags[idx]?.toWarehouse}
                        onChange={e => {
                          setWarehouseFlags(flags =>
                            flags.map((flag, i) =>
                              i === idx ? { ...flag, forOrg: e.target.checked } : flag
                            )
                          );
                        }}
                      />
                    </td>
                    <td style={{ padding: 4, textAlign: "center" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setWarehouseFlags(flags =>
                            flags.map((flag, i) =>
                              i === idx
                                ? {
                                    ...flag,
                                    toWarehouse: !flag.toWarehouse,
                                    forOrg: !flag.toWarehouse ? false : flag.forOrg,
                                  }
                                : flag
                            )
                          );
                        }}
                        style={{
                          width: 36,
                          height: 20,
                          borderRadius: 12,
                          border: "1px solid #888",
                          background: warehouseFlags[idx]?.toWarehouse ? "#2d7aee" : "#444",
                          position: "relative",
                          transition: "background 0.2s",
                          outline: "none",
                          cursor: "pointer",
                          padding: 0,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: warehouseFlags[idx]?.toWarehouse ? "flex-end" : "flex-start",
                        }}
                        aria-pressed={warehouseFlags[idx]?.toWarehouse}
                        aria-label="Toggle To Warehouse"
                      >
                        <span
                          style={{
                            display: "block",
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            background: "#fff",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                            transition: "transform 0.2s",
                            transform: warehouseFlags[idx]?.toWarehouse ? "translateX(0)" : "translateX(0)",
                          }}
                        />
                      </button>
                    </td>
                    <td style={{ padding: 4 }}>
                      <button
                        type="button"
                        style={{ color: "#ff6b6b", background: "none", border: "none", cursor: "pointer" }}
                        onClick={(e) => {
                          e.preventDefault();
                          setCargoList(list => list.filter((_, i) => i !== idx));
                          setWarehouseFlags(flags => flags.filter((_, i) => i !== idx));
                        }}
                      >✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </label>
        {showCargoPicker && (
          <div style={{ background: "#23272e", border: "1px solid #353a40", borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <input
              type="text"
              placeholder="Search cargo..."
              value={cargoSearch}
              onChange={e => setCargoSearch(e.target.value)}
              style={{ width: "100%", marginBottom: 8 }}
            />
            <div style={{ maxHeight: 120, overflowY: "auto" }}>
              {summarizedItems
                .filter(item => item.commodity_name.toLowerCase().includes(cargoSearch.toLowerCase()))
                .map(item => (
                  <div key={item.commodity_name} style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ flex: 1 }}>{item.commodity_name} (avg: {Math.max(item.price_buy_avg, item.price_sell_avg)})</span>
                    <input
                      type="number"
                      min={1}
                      value={selectedCargo?.commodity_name === item.commodity_name ? cargoQuantity : 1}
                      onFocus={() => {
                        setSelectedCargo(item);
                        setCargoQuantity(1);
                      }}
                      onChange={e => {
                        setSelectedCargo(item);
                        setCargoQuantity(Number(e.target.value));
                      }}
                      style={{ width: 60, marginRight: 8 }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        addCargoItem({ commodity_name: item.commodity_name, scuAmount: cargoQuantity, avg_price: Math.max(item.price_buy_avg, item.price_sell_avg) });
                        // setShowCargoPicker(false);
                        setCargoSearch("");
                        setSelectedCargo(null);
                        setCargoQuantity(1);
                      }}
                      style={{ background: "#2d7aee", color: "#fff", border: "none", borderRadius: 4, padding: "2px 10px", cursor: "pointer" }}
                    >Add</button>
                  </div>
                ))}
              {/* Custom cargo section goes here */}
            </div>
            <button
              type="button"
              onClick={() => setShowCargoPicker(false)}
              style={{ marginTop: 8, background: "#444", color: "#fff", border: "none", borderRadius: 4, padding: "4px 12px", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        )}
        <label style={{ position: "relative", display: "block" }}>
          Assists:
          <input
            type="text"
            value={form.assists}
            onFocus={handleAssistsFocus}
            onChange={handleAssistsChange}
            disabled={isSubmitting}
            autoComplete="off"
            style={{ width: "100%" }}
          />
          {/* Recent Gatherings dropdown, styled like Fleet Involved */}
          {showGatheringsMenu && recentGatherings.length > 0 && assistsUsers.length === 0 && (
            <div 
            ref={gatheringsMenuRef}
            style={{
              background: "#23272e",
              border: "1px solid #353a40",
              borderRadius: 4,
              marginTop: 2,
              position: "absolute",
              zIndex: 10,
              width: 320,
              maxHeight: 220,
              overflowY: "auto"
            }}>
              {recentGatherings.map(g => (
                <div
                  key={g.id}
                  style={{
                    padding: "6px 8px",
                    cursor: "pointer",
                    color: "#fff",
                    borderBottom: "1px solid #353a40",
                    position: "relative"
                  }}
                  title={g.usernames.join(", ")}
                  onMouseDown={async () => {
                    // Add assists as before
                    g.user_ids
                      .map((id, i) => allUsers.find(u => String(u.id) === String(id)))
                      .filter((u): u is User => !!u)
                      .forEach(addAssistUser);
                    setShowGatheringsMenu(false);

                    // --- New: Fetch BlackBox kills and extract victims ---
                    const gatheringTime = new Date(g.timestamp).getTime();
                    const oneHourMs = 60 * 60 * 1000;
                    let allVictims: string[] = [];

                    for (const userId of g.user_ids) {
                      try {
                        // Fetch all kills for this user
                        const kills = await fetchBlackBoxsByUserId(String(userId));
                        // Filter kills within ±1 hour of gathering
                        const relevantKills = kills.filter(kill => {
                          const killTime = new Date(kill.timestamp).getTime();
                          return Math.abs(killTime - gatheringTime) <= oneHourMs;
                        });
                        // Collect all victim names from these kills
                        relevantKills.forEach(kill => {
                          if (Array.isArray(kill.victims)) {
                            allVictims.push(...kill.victims.filter(Boolean));
                          }
                        });
                      } catch (err) {
                        // Handle error if needed
                      }
                    }
                    // Remove duplicates and add to victimsArray
                    setVictimsArray(prev =>
                      Array.from(new Set([...prev, ...allVictims]))
                    );
                  }}
                >
                  <div style={{ fontWeight: 500 }}>
                    {g.channel_name} &mdash; {new Date(g.timestamp).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 13, color: "#bbb" }}>
                    {g.usernames.slice(0, 5).join(", ")}
                    {g.usernames.length > 5 && " ..."}
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Assist suggestions dropdown (unchanged) */}
          {assistSuggestions.length > 0 && (
            <div style={{
              background: "#23272e",
              border: "1px solid #353a40",
              borderRadius: 4,
              marginTop: 2,
              position: "absolute",
              zIndex: 10,
              width: 200
            }}>
              {assistSuggestions.map(user => (
                <div
                  key={user.id}
                  style={{
                    padding: "4px 8px",
                    cursor: "pointer",
                    color: "#fff"
                  }}
                  onMouseDown={() => {
                    addAssistUser(user);
                    setForm(f => ({ ...f, assists: "" }));
                    setAssistSuggestions([]);
                  }}
                >
                  {user.username}
                </div>
              ))}
            </div>
          )}
        </label>
        {assistsUsers.length > 0 && (
          <div style={{ overflowX: "auto", margin: "12px 0" }}>
            <table style={{ width: "100%", background: "#23272e", borderRadius: 6, borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ color: "#ccc", padding: 6, textAlign: "left" }}>Name</th>
                  <th style={{ color: "#ccc", padding: 6 }}>Dogfighter</th>
                  <th style={{ color: "#ccc", padding: 6 }}>Marine</th>
                  <th style={{ color: "#ccc", padding: 6 }}>Snare</th>
                  <th style={{ color: "#ccc", padding: 6 }}>Cargo</th>
                  <th style={{ color: "#ccc", padding: 6 }}>Multicrew</th>
                  <th style={{ color: "#ccc", padding: 6 }}>Salvage</th>
                  <th style={{ color: "#ccc", padding: 6 }}>Leadership</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {assistsUsers.map((user, idx) => (
                  <tr key={user.id} style={{ background: idx % 2 ? "#202226" : "#23272e" }}>
                    <td style={{ color: "#fff", padding: 6 }}>{user.nickname || user.username}</td>
                    {(["dogfighter", "marine", "snare", "cargo", "multicrew", "salvage", "leadership"] as Array<keyof AssistUserWithExperience>).map(field => (
                      <td key={field} style={{ textAlign: "center", padding: 6 }}>
                        <input
                          type="checkbox"
                          className="large-checkbox"
                          checked={Boolean(user[field])}
                          onChange={e => {
                            setAssistsUsers(list =>
                              list.map(u =>
                                u.id === user.id
                                  ? { ...u, [field]: e.target.checked }
                                  : u
                              )
                            );
                          }}
                        />
                      </td>
                    ))}
                    <td style={{ textAlign: "center", padding: 6 }}>
                      <button
                        type="button"
                        onClick={() => setAssistsUsers(list => list.filter(u => u.id !== user.id))}
                        style={{
                          color: "#ff6b6b",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 16,
                          lineHeight: 1,
                        }}
                        aria-label={`Remove ${user.nickname || user.username}`}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "8px 0" }}>
          {assistsUsers.map(user => (
            <span
              key={user.id}
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: "#181a1b",
                color: "#fff",
                borderRadius: 16,
                padding: "4px 12px",
                fontSize: 14,
                marginRight: 4,
                marginBottom: 4,
              }}
            >
              {user.nickname || user.username}
              <button
                type="button"
                onClick={() => setAssistsUsers(list => list.filter(u => u.id !== user.id))}
                style={{
                  marginLeft: 8,
                  color: "#ff6b6b",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 16,
                  lineHeight: 1,
                }}
                aria-label={`Remove ${user.nickname || user.username}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div> */}
        <label>
          Victim Name:
          <input
            type="text"
            value={victimInput}
            onChange={e => setVictimInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && victimInput.trim()) {
                e.preventDefault();
                if (!victimsArray.includes(victimInput.trim())) {
                  setVictimsArray(arr => [...arr, victimInput.trim()]);
                }
                setVictimInput("");
              }
            }}
            disabled={isSubmitting}
            autoComplete="off"
            style={{ width: "100%" }}
            placeholder="Type a victim name and press Enter"
          />
        </label>
        {victimsArray.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "12px 0" }}>
            {victimsArray.map((name, idx) => (
              <span
                key={idx}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  background: "#181a1b",
                  color: "#fff",
                  borderRadius: 16,
                  padding: "4px 12px",
                  fontSize: 14,
                }}
              >
                {name}
                <button
                  type="button"
                  onClick={() => setVictimsArray(arr => arr.filter((_, i) => i !== idx))}
                  style={{
                    marginLeft: 8,
                    color: "#ff6b6b",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 16,
                    lineHeight: 1,
                  }}
                  aria-label={`Remove ${name}`}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
        <label>
          Fleet Involved:
          <input
            type="text"
            value={fleetSearch}
            onChange={handleFleetSearchChange}
            onFocus={() => {
              if (!fleetSearch.trim()) {
                setFleetSuggestions(
                  [...allFleets]
                    .sort((a, b) => Number(b.last_active || 0) - Number(a.last_active || 0))
                    .slice(0, 10)
                );
              }
            }}
            onBlur={() => {
              setTimeout(() => setFleetSuggestions([]), 100);
            }}
            disabled={isSubmitting}
            autoComplete="off"
            placeholder="Search fleet..."
          />
          {fleetSuggestions.length > 0 && (
            <div style={{
              background: "#23272e",
              border: "1px solid #353a40",
              borderRadius: 4,
              marginTop: 2,
              position: "absolute",
              zIndex: 10,
              width: 200
            }}>
              {fleetSuggestions.map(fleet => (
                <div
                  key={fleet.id}
                  style={{
                    padding: "4px 8px",
                    cursor: "pointer",
                    color: "#fff"
                  }}
                  onMouseDown={() => {
                    // Validation: at least 1/3 of allowed_total_members must be present in assists, and assists > 8
                    const assistsIds = assistsUsers.map(u => String(u.id));
                    const fleetMemberIds = fleet.members_ids.map(String);
                    const assistsInFleet = assistsIds.filter(id => fleetMemberIds.includes(id));
                    const minRequired = Math.ceil(fleet.allowed_total_members / 3);

                    if (assistsUsers.length <= 7) {
                      setFormError("At least 7 assists are required to tie a fleet to a hit.");
                      return;
                    }
                    if (assistsInFleet.length < minRequired) {
                      setFormError(
                        `At least 1/3 of this fleet's allowed members (${minRequired}) must be present in assists.`
                      );
                      return;
                    }

                    setFormError(null);
                    if (!selectedFleets.some(f => f.id === fleet.id)) {
                      setSelectedFleets(prev => [...prev, fleet]);
                    }
                    setFleetSearch("");
                    setFleetSuggestions([]);
                  }}
                >
                  {fleet.name}
                  <span style={{ color: "#aaa", fontSize: 12, marginLeft: 8 }}>
                    {fleet.commander_username}
                  </span>
                </div>
              ))}
            </div>
          )}
        </label>
        {selectedFleet && (
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            background: "#181a1b",
            color: "#fff",
            borderRadius: 16,
            padding: "4px 12px",
            fontSize: 14,
            margin: "8px 0"
          }}>
            {selectedFleet.name}
            <button
              type="button"
              onClick={() => {
                setSelectedFleet(null);
                setFleetSearch("");
              }}
              style={{
                marginLeft: 8,
                color: "#ff6b6b",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 16,
                lineHeight: 1,
              }}
              aria-label={`Remove ${selectedFleet.name}`}
            >
              ✕
            </button>
          </div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "8px 0" }}>
          {selectedFleets.map(fleet => (
            <span
              key={fleet.id}
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: "#181a1b",
                color: "#fff",
                borderRadius: 16,
                padding: "4px 12px",
                fontSize: 14,
                marginRight: 4,
                marginBottom: 4,
              }}
            >
              {fleet.name}
              <button
                type="button"
                onClick={() => setSelectedFleets(list => list.filter(f => f.id !== fleet.id))}
                style={{
                  marginLeft: 8,
                  color: "#ff6b6b",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 16,
                  lineHeight: 1,
                }}
                aria-label={`Remove ${fleet.name}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        <label>
          Story:
          <textarea
            value={form.story}
            onChange={e => setForm(f => ({ ...f, story: e.target.value }))}
            disabled={isSubmitting}
            rows={6}
            style={{
              width: "100%",
              minWidth: 0,
              maxWidth: "100%",
              minHeight: 120,
              maxHeight: 120,
              resize: "none",
              marginTop: 4,
              marginBottom: 12,
              fontSize: 15,
              borderRadius: 6,
              border: "1px solid #353a40",
              background: "#181a1b",
              color: "#fff",
              padding: 8,
              boxSizing: "border-box",
            }}
          />
        </label>
        <label>
          Video Link:
          <input
            type="text"
            value={form.video_link}
            onChange={e => setForm(f => ({ ...f, video_link: e.target.value }))}
            disabled={isSubmitting}
          />
        </label>
        <label>
          Additional Media Links (comma-separated):
          <input
            type="text"
            value={form.additional_media_links}
            onChange={e => setForm(f => ({ ...f, additional_media_links: e.target.value }))}
            disabled={isSubmitting}
          />
        </label>
        {formError && (
          <div style={{ color: "#ff6b6b", marginBottom: "1em" }}>{formError}</div>
        )}
        {props.isEditMode ? (
          <>
            <button
              type="button"
              onClick={async () => {
                if (!props.onUpdate || !props.hit) return;

                // Prepare updated hit object as in handleSubmit
                const updatedHit: Hit = {
                  ...props.hit,
                  id: props.hit?.id ?? Date.now().toString(),
                  user_id: props.hit?.user_id ?? userId,
                  cargo: cargoList,
                  total_value: totalValue,
                  patch: gameVersion ?? "",
                  total_cut_value: Math.round(totalValue / (assistsUsers.length + 1)),
                  assists: assistsUsers.map(u => String(u.id)),
                  assists_usernames: assistsUsers.map(u => u.username),
                  total_scu: cargoList.reduce((sum, item) => sum + item.scuAmount, 0),
                  air_or_ground: form.air_or_ground,
                  title: form.title,
                  story: form.story,
                  timestamp: new Date().toISOString(),
                  username: props.hit?.username ?? username,
                  video_link: form.video_link,
                  additional_media_links: parseArray(form.additional_media_links),
                  type_of_piracy: form.type_of_piracy,
                  fleet_activity: selectedFleets.length > 0,
                  fleet_names: selectedFleets.map(f => f.name),
                  fleet_ids: selectedFleets.map(f => f.id),
                  victims: victimsArray,
                };

                try {
                  // 1. Fetch all player experiences for this operation
                  const existingExperiences = await fetchPlayerExperiencesByOperationId(updatedHit.id);

                  // 2. For each assistsUser, update or create experience
                  await Promise.all(
                    assistsUsers.map(async user => {
                      const existing = existingExperiences.find(e => e.user_id === String(user.id));
                      const expPayload = {
                        id: existing?.id ?? randomBigIntId(),
                        user_id: String(user.id),
                        username: user.username,
                        operation_id: updatedHit.id,
                        operation_name: updatedHit.title,
                        operation_type: updatedHit.type_of_piracy,
                        patch: updatedHit.patch,
                        dogfighter: !!user.dogfighter,
                        marine: !!user.marine,
                        snare: !!user.snare,
                        cargo: !!user.cargo,
                        multicrew: !!user.multicrew,
                        salvage: !!user.salvage,
                        leadership: !!user.leadership,
                      };
                      if (existing) {
                        await editPlayerExperience(existing.id, expPayload);
                      } else {
                        await createPlayerExperience(expPayload);
                      }
                    })
                  );

                  // 3. Update the hit
                  await updateHit(updatedHit);

                  // 4. Call parent update handler
                  await props.onUpdate(updatedHit);
                } catch (err) {
                  setFormError("Failed to update hit or player experiences. Please try again.");
                }
              }}
              disabled={isSubmitting}
            >
              Update
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!props.hit) return;
                try {
                  let experiences: any[] = [];
                  try {
                    // Try to fetch player experiences, but don't fail if none are found
                    experiences = await fetchPlayerExperiencesByOperationId(props.hit.id);
                  } catch (err) {
                    // If not found, just continue (no experiences to delete)
                    experiences = [];
                  }

                  // Delete each experience if any
                  if (experiences.length > 0) {
                    await Promise.all(
                      experiences.map(exp => deletePlayerExperience(exp.id))
                    );
                  }

                  // Delete the hit
                  await deleteHit(props.hit.id);

                  // Call parent delete handler if present
                  if (props.onDelete) await props.onDelete();

                  onClose();
                } catch (err) {
                  setFormError("Failed to delete hit or player experiences. Please try again.");
                }
              }}
              disabled={isSubmitting}
              style={{ marginLeft: 8, background: "#ff6b6b", color: "#fff" }}
            >
              Delete
            </button>
          </>
        ) : (
          <button type="submit" disabled={isSubmitting || submitting}>
            {submitting ? "Submitting..." : "Submit"}
          </button>
        )}
        <button type="button" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </button>

        {/* Delete confirmation modal */}
        {showDeleteConfirm && (
          <div
            style={{
              position: "fixed",
              top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(0,0,0,0.6)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <div style={{
              background: "#23272e",
              padding: 32,
              borderRadius: 8,
              boxShadow: "0 2px 16px rgba(0,0,0,0.5)",
              color: "#fff",
              minWidth: 320,
              textAlign: "center"
            }}>
                <button
                  onClick={async () => {
                    if (!props.hit) return;
                    try {
                      // 1. Fetch all player experiences for this operation
                      const experiences = await fetchPlayerExperiencesByOperationId(props.hit.id);

                      // 2. Delete each experience
                      await Promise.all(
                        experiences.map(exp => deletePlayerExperience(exp.id))
                      );

                      // 3. Delete the hit
                      await deleteHit(props.hit.id);

                      // 4. Call parent delete handler if present
                      if (props.onDelete) await props.onDelete();

                      setShowDeleteConfirm(false);
                      onClose();
                    } catch (err) {
                      setFormError("Failed to delete hit or player experiences. Please try again.");
                    }
                  }}
                  style={{ background: "#ff6b6b", color: "#fff", border: "none", borderRadius: 4, padding: "8px 24px", fontWeight: "bold", cursor: "pointer" }}
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{ background: "#444", color: "#fff", border: "none", borderRadius: 4, padding: "8px 24px", cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </div>
        )}
        {showSuccess && (
          <div style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            background: "#28a745",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: 8,
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
            zIndex: 1000,
            transition: "opacity 0.3s",
            opacity: showSuccess ? 1 : 0,
          }}>
            Hit submitted successfully!
          </div>
        )}
      </form>
    </Modal>
  );
};

export default AddHitModal;