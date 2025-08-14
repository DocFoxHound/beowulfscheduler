import React, { useEffect, useRef, useState } from "react";
import VictimsInput from "./VictimsInput";
import FleetInvolvedInput from "./FleetInvolvedInput";
import CargoSection from "./CargoSection";
import AssistsSection from "./AssistsSection";
import Modal from "../Modal";
import { Hit } from "../../types/hittracker";
import { SummarizedItem } from "../../types/items_summary";
import { getAllUsers } from "../../api/userService";
import { User } from "../../types/user";
import { fetchAllFleets } from "../../api/fleetApi";
import { UserFleet } from "../../types/fleet";
import { createHit, updateHit, deleteHit } from "../../api/hittrackerApi";
import { addWarehouseItem } from "../../api/warehouseApi";
import { v4 as uuidv4 } from "uuid";
import { fetchAllRecentGatherings } from "../../api/recentGatheringsApi";
import { RecentGathering } from "../../types/recent_gatherings";
import { createPlayerExperience, editPlayerExperience, deletePlayerExperience, fetchPlayerExperiencesByOperationId } from "../../api/playerExperiencesApi";
import { fetchBlackBoxsByUserId } from "../../api/blackboxApi";
import { getSummarizedItems } from "../../api/summarizedItemApi";
import { fetchRecentGangsWithinTimeframe } from "../../api/recentGangsApi"
import { RecentGang } from "../../types/recent_gangs";

interface AddHitModal3Props {
  show: boolean;
  onClose: () => void;
  gameVersion: string | null;
  userId: string;
  username: string;
  onSubmit: (hit: Hit) => Promise<void>;
  isSubmitting: boolean;
  formError: string | null;
  setFormError: React.Dispatch<React.SetStateAction<string | null>>;
  isEditMode?: boolean;
  hit?: Hit;
  onUpdate?: (hit: Hit) => Promise<void>;
  onDelete?: () => Promise<void>;
  allUsers: User[];
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
  air_leadership: boolean;
  ground_leadership: boolean;
  commander: boolean; // <-- Add this line
};

const AddHitModal3: React.FC<AddHitModal3Props> = (props) => {
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
    allUsers
  } = props;

  const [form, setForm] = useState(initialForm);

  // Summarized items state
  const [summarizedItems, setSummarizedItems] = useState<SummarizedItem[]>([]);

  // Cargo state
  const [cargoList, setCargoList] = useState<any[]>([]);
  const [warehouseFlags, setWarehouseFlags] = useState<{ toWarehouse: boolean; intent: 'LTB' | 'LTS' | 'N/A' }[]>([]);
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
  const [allUsersState, setAllUsersState] = useState<User[]>([]);
  const [assistSuggestions, setAssistSuggestions] = useState<User[]>([]);
  const [assistsUsers, setAssistsUsers] = useState<AssistUserWithExperience[]>([]);
  // Guests state
  const [guests, setGuests] = useState<string[]>([]);

  // Fleets state
  const [allFleets, setAllFleets] = useState<UserFleet[]>([]);
  const [fleetSearch, setFleetSearch] = useState("");
  const [fleetSuggestions, setFleetSuggestions] = useState<UserFleet[]>([]);
  const [selectedFleet, setSelectedFleet] = useState<UserFleet | null>(null);
  const [selectedFleets, setSelectedFleets] = useState<UserFleet[]>([]);

  // Recent gatherings state
  const [recentGatherings, setRecentGatherings] = useState<RecentGathering[]>([]);
  const [showGatheringsMenu, setShowGatheringsMenu] = useState(false);
  const gatheringsMenuRef = useRef<HTMLDivElement>(null);

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
        setAllUsersState(Array.isArray(users) ? users : users ? [users] : []);
      });
      fetchAllFleets().then(fleets => {
        setAllFleets(Array.isArray(fleets) ? fleets : fleets ? [fleets] : []);
      });
      fetchAllRecentGatherings().then(setRecentGatherings);
      getSummarizedItems().then(items => {
        setSummarizedItems(Array.isArray(items) ? items : []);
      });
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
    if (show && props.isEditMode && props.hit) {
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
      setWarehouseFlags(h.cargo?.map(() => ({ toWarehouse: false, intent: 'N/A' })) || []);
      setVictimsArray(h.victims || []);
      setGuests(h.guests || []);

      // Prepare guest assists
      const guestAssists: AssistUserWithExperience[] = Array.isArray(h.guests) && h.guests.length > 0
        ? h.guests.map(guestName => ({
            id: `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            username: '',
            nickname: guestName,
            corsair_level: 0,
            raptor_level: 0,
            raider_level: 0,
            rank: 0,
            roles: [],
            dogfighter: false,
            marine: false,
            snare: false,
            cargo: false,
            multicrew: false,
            salvage: false,
            air_leadership: false,
            ground_leadership: false,
            commander: false,
            guest: true,
            fleet: '', // Ensure this property exists
          }))
        : [];

      // Fetch player experiences for this operation and map to assistsUsers
      fetchPlayerExperiencesByOperationId(h.id).then((experiences) => {
        const assistsArr = (h.assists || []).map((id, idx) => {
          const exp = experiences.find(e => e.user_id === String(id));
          return {
            id: String(id),
            username: h.assists_usernames?.[idx] || "",
            nickname: h.assists_usernames?.[idx] || "",
            corsair_level: 0,
            raptor_level: 0,
            raider_level: 0,
            rank: 0,
            roles: [],
            dogfighter: !!exp?.dogfighter,
            marine: !!exp?.marine,
            snare: !!exp?.snare,
            cargo: !!exp?.cargo,
            multicrew: !!exp?.multicrew,
            salvage: !!exp?.salvage,
            air_leadership: !!exp?.air_leadership,
            ground_leadership: !!exp?.ground_leadership,
            commander: !!exp?.commander,
            guest: false,
            fleet: '', // Fix: use empty string instead of null
          };
        });
        setAssistsUsers([...assistsArr, ...guestAssists]);
      });
      // ...set other fields as needed...
    }
    // Optionally, reset form when closing modal
    if (!show) {
      setForm(initialForm);
      setCargoList([]);
      setWarehouseFlags([]);
      setVictimsArray([]);
    }
  }, [show, props.isEditMode, props.hit]);

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
            raider_level: 0,
            rank: 0,
            roles: [],
            dogfighter: false,
            marine: false,
            snare: false,
            cargo: false,
            multicrew: false,
            salvage: false,
            air_leadership: false,
            ground_leadership: false,
            commander: false,
            fleet: '', // Add missing fleet property
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
    if(!form.story){
      setFormError("Story is required.");
      return;
    }

    setSubmitting(true);


    // Prepare assists arrays, filtering out guests
    let filteredAssists = assistsUsers.filter(u => !u.id.startsWith("guest-"));
    let assistsArr = filteredAssists.map(u => u.username);
    let assistsIds = filteredAssists.map(u => String(u.id));
    let hitUserId = userId;
    let hitUsername = username;

    // Always ensure the submitting user is in assists
    // if (!assistsIds.includes(userId)) {
    //   assistsIds = [userId, ...assistsIds];
    //   assistsArr = [username, ...assistsArr];
    // }

    // If a fleet is tied, set user_id to fleet.id
    if (selectedFleets.length > 0) {
      hitUserId = String(selectedFleets[0].id);
    }

    const totalValueNum = totalValue;
    const totalSCUNum = cargoList.reduce((sum, item) => sum + item.scuAmount, 0);

    // Calculate total_cut_value
    const total_cut_value =
      assistsArr.length > 0 || guests.length > 0
        ? Math.round(totalValueNum / (assistsArr.length + guests.length))
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
      fleet_names: selectedFleets.map(f => f.name).filter((name): name is string => typeof name === "string"),
      fleet_ids: selectedFleets.map(f => String(f.id)),
      victims: victimsArray,
      guests: guests,
    };

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
              for_org: false,
              intent: warehouseFlags[idx]?.intent || "N/A",
            });
          }
          return null;
        })
      );

      // Save player experiences for each assist user, skipping guests
      await Promise.all(
        assistsUsers
          .filter(user => typeof user.id === "string" && !user.id.startsWith("guest-"))
          .map(user =>
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
              air_leadership: !!user.air_leadership,
              ground_leadership: !!user.ground_leadership,
              commander: !!user.commander,
              type_of_experience: "Piracy",
            })
          )
      );

      setForm(initialForm);
      setCargoList([]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      onClose();

      // Force page refresh after successful submit
      window.location.reload();
    } catch (err) {
      setFormError("Failed to submit hit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const addCargoItem = (item: CargoItem) => {
    setCargoList(list => [...list, item]);
    setWarehouseFlags(flags => [...flags, { toWarehouse: false, intent: 'N/A' }]);
  };

  // Calculate total value
  const totalValue = cargoList.reduce((sum, item) => sum + (item.avg_price * item.scuAmount), 0);

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
    const suggestions = allUsersState.filter(user => {
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
        typeof fleet.name === "string" && fleet.name.toLowerCase().includes(value.toLowerCase())
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
          air_leadership: false,
          ground_leadership: false,
          commander: false, // <-- Add this line
        },
      ];
    });
  };

  // ...rest of your component logic...

  return (
    <Modal onClose={onClose}>
      <div>
        <style>{`
          .section-card {
            background: #23272b;
            border: 1px solid #353a40;
            border-radius: 12px;
            padding: 24px 20px 20px 20px;
            margin: 28px 0 28px 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          }
          .section-title {
            color: #7ec0fa;
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: 12px;
            letter-spacing: 1px;
          }
        `}</style>
        <h2>Add New Hit</h2>
        <form onSubmit={handleSubmit}>
          {/* Air or Ground Toggle - moved here */}
          <div style={{ width: "100%", display: "flex", justifyContent: "center", margin: "16px 0 8px 0" }}>
            <div style={{ display: "flex", gap: 40 }}>
              {/* Air or Ground */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ color: "#fff", marginBottom: 4, fontWeight: 500 }}>Air or Ground:</span>
                <div style={{ display: "flex" }}>
                  {[
                    "Mixed",
                    "Air",
                    "Ground"
                  ].map((option, idx, arr) => (
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
              maxLength={98}
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              disabled={isSubmitting}
            />
          </label>

          {/* Cargo Section */}
          <div className="section-card">
            <div className="section-title">Cargo</div>
            <CargoSection
              cargoList={cargoList}
              setCargoList={setCargoList}
              warehouseFlags={warehouseFlags}
              setWarehouseFlags={setWarehouseFlags}
              summarizedItems={summarizedItems}
              showCargoPicker={showCargoPicker}
              setShowCargoPicker={setShowCargoPicker}
              cargoSearch={cargoSearch}
              setCargoSearch={setCargoSearch}
              selectedCargo={selectedCargo}
              setSelectedCargo={setSelectedCargo}
              cargoQuantity={cargoQuantity}
              setCargoQuantity={setCargoQuantity}
              customCargoName={customCargoName}
              setCustomCargoName={setCustomCargoName}
              customCargoAvg={customCargoAvg}
              setCustomCargoAvg={setCustomCargoAvg}
              customCargoQty={customCargoQty}
              setCustomCargoQty={setCustomCargoQty}
              showCustomCargoMenu={showCustomCargoMenu}
              setShowCustomCargoMenu={setShowCustomCargoMenu}
              addItemBtnRef={addItemBtnRef}
              totalValue={totalValue}
            />
          </div>

          {/* Assists Section */}
          <div className="section-card">
            <div className="section-title">Pirates</div>
            <AssistsSection
              form={form}
              setForm={setForm}
              isSubmitting={isSubmitting}
              handleAssistsFocus={handleAssistsFocus}
              handleAssistsChange={handleAssistsChange}
              showGatheringsMenu={showGatheringsMenu}
              recentGatherings={recentGatherings}
              assistsUsers={assistsUsers}
              gatheringsMenuRef={gatheringsMenuRef}
              allUsersState={allUsersState}
              addAssistUser={addAssistUser}
              setShowGatheringsMenu={setShowGatheringsMenu}
              setVictimsArray={setVictimsArray}
              fetchBlackBoxsByUserId={fetchBlackBoxsByUserId}
              assistSuggestions={assistSuggestions}
              setAssistSuggestions={setAssistSuggestions}
              setAssistsUsers={setAssistsUsers}
              setGuestNames={setGuests}
            />
          </div>

          {/* Victims Section */}
          <div className="section-card">
            <div className="section-title">Victims</div>
            <VictimsInput
              victimInput={victimInput}
              setVictimInput={setVictimInput}
              victimsArray={victimsArray}
              setVictimsArray={setVictimsArray}
              isSubmitting={isSubmitting}
            />
          </div>

          {/* Fleet Involved Section */}
          <div className="section-card">
            <div className="section-title">Fleet Involved</div>
            <FleetInvolvedInput
              fleetSearch={fleetSearch}
              setFleetSearch={setFleetSearch}
              fleetSuggestions={fleetSuggestions}
              setFleetSuggestions={setFleetSuggestions}
              allFleets={allFleets}
              assistsUsers={assistsUsers}
              setFormError={setFormError}
              selectedFleet={selectedFleet}
              setSelectedFleet={setSelectedFleet}
              selectedFleets={selectedFleets}
              setSelectedFleets={setSelectedFleets}
              isSubmitting={isSubmitting}
              allUsers={allUsers}
              handleFleetSearchChange={handleFleetSearchChange}
            />
          </div>

          <label>
            Story:
            <textarea
              value={form.story}
              maxLength={1024}
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

                  // Filter out assists whose id starts with 'guest-'
                  const filteredAssists = assistsUsers.filter(u => !(typeof u.id === "string" && u.id.startsWith("guest-")));
                  const updatedHit: Hit = {
                    ...props.hit,
                    id: props.hit?.id ?? Date.now().toString(),
                    user_id: props.hit?.user_id ?? userId,
                    cargo: cargoList,
                    total_value: totalValue,
                    patch: gameVersion ?? "",
                    total_cut_value: Math.round(totalValue / (filteredAssists.length + guests.length)),
                    assists: filteredAssists.map(u => String(u.id)),
                    assists_usernames: filteredAssists.map(u => u.username),
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
                    fleet_names: selectedFleets.map(f => f.name).filter((name): name is string => typeof name === "string"),
                    fleet_ids: selectedFleets.map(f => String(f.id)),
                    victims: victimsArray,
                    guests: guests, // Save the actual guests array
                  };

                  try {
                    // 1. Fetch all player experiences for this operation
                    const existingExperiences = await fetchPlayerExperiencesByOperationId(updatedHit.id);

                    // 2. For each assistsUser, update or create experience (skip guests)
                    await Promise.all(
                      assistsUsers
                        .filter(user => typeof user.id === "string" && !user.id.startsWith("guest-"))
                        .map(async user => {
                          const existing = existingExperiences.find(
                            exp => String(exp.user_id) === String(user.id)
                          );
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
                            air_leadership: !!user.air_leadership,
                            ground_leadership: !!user.ground_leadership,
                            commander: !!user.commander,
                            type_of_experience: "Piracy",
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

                    // Force page refresh after successful update
                    window.location.reload();
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
                    await deleteHit(props.hit);
                    window.location.reload()
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
      </div>
    </Modal>
  );
};

export default AddHitModal3;