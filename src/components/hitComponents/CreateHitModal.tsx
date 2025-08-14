import "./SectionCard.css";

import React, { useState, useRef, useEffect } from "react";
import CargoSection from "./CargoSection";
import { getSummarizedItems } from "../../api/summarizedItemApi";
import { SummarizedItem } from "../../types/items_summary";
import { getAllUsers } from "../../api/userService";
import { User } from "../../types/user";
import { Hit } from "../../types/hittracker";
import { fetchRecentGangsWithinTimeframe } from "../../api/recentGangsApi"
import { RecentGang } from "../../types/recent_gangs";
import GangSelection from "./GangSelection";
import PirateSelection from "./PirateSelection";
import VictimsInput from "./VictimsInput";
import { createHit, updateHit } from "../../api/hittrackerApi";
import { addWarehouseItem } from "../../api/warehouseApi";
import { refreshPlayerStatsView } from "../../api/playerStatsApi";

interface AddHitModal2Props {
  show: boolean;
  onClose: () => void;
  gameVersion?: string | null;
  userId?: string;
  username?: string;
  isEditMode?: boolean;
  hit?: Hit;
  allUsers?: User[];
  onUpdate?: (hit: Hit) => Promise<void>;
  onDelete?: () => Promise<void>;
  onSubmit?: (hit: Hit) => Promise<void>;
  isSubmitting?: boolean;
  formError?: string | null;
  setFormError?: React.Dispatch<React.SetStateAction<string | null>>;
  dbUser?: User;
}

const AddHitModal2: React.FC<AddHitModal2Props> = (props) => {
  const {
    dbUser,
    show,
    onClose,
    gameVersion,
    userId,
    username,
    isEditMode,
    hit,
    allUsers,
    onUpdate,
    onDelete,
    onSubmit,
    isSubmitting,
    formError,
    setFormError
  } = props;


  // Cargo state and related fields (mirroring CreateHitModa3)
  const [cargoList, setCargoList] = useState<any[]>([]);
  const [warehouseFlags, setWarehouseFlags] = useState<{ toWarehouse: boolean; intent: 'LTB' | 'LTS' | 'N/A' }[]>([]);
  const [blackBoxes, setBlackBoxes] = useState<any[]>([]);
  const [gangVictims, setGangVictims] = useState<string[]>([]);
  const [showCargoPicker, setShowCargoPicker] = useState(false);
  const [cargoSearch, setCargoSearch] = useState("");
  const [selectedCargo, setSelectedCargo] = useState<SummarizedItem | null>(null);
  const [cargoQuantity, setCargoQuantity] = useState<number>(1);
  const [customCargoName, setCustomCargoName] = useState("");
  const [customCargoAvg, setCustomCargoAvg] = useState<number>(1);
  const [customCargoQty, setCustomCargoQty] = useState<number>(1);
  const [showCustomCargoMenu, setShowCustomCargoMenu] = useState(false);
  const addItemBtnRef = useRef<HTMLButtonElement>(null);
  // For demo, summarizedItems can be empty or mocked
  const [summarizedItems, setSummarizedItems] = useState<SummarizedItem[]>([]);
  // Local isSubmitting state if not provided by parent
  const [localIsSubmitting, setLocalIsSubmitting] = useState(false);
  const [cargoError, setCargoError] = useState<string | null>(null);

  //user stats
  const [allUsersState, setAllUsersState] = useState<User[]>([]);
  // Selected pirates state for PirateSelection
  const [selectedPirates, setSelectedPirates] = useState<User[]>([]);

  //gangs stats
  const [allGangs, setAllGangs] = useState<RecentGang[]>([]);
  const [selectedGangs, setSelectedGangs] = useState<RecentGang[]>([]);

  // Victims state
  const [victimInput, setVictimInput] = useState("");
  const [victimsArray, setVictimsArray] = useState<string[]>([]);

  // Local refs for basic fields (for prefill in edit mode)
  const titleInputRef = useRef<HTMLInputElement>(null);
  const storyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Set cargoList and basic fields from hit if in edit mode
  useEffect(() => {
    if (show && isEditMode && hit) {
      setCargoList(hit.cargo || []);
  setWarehouseFlags(hit.cargo?.map(() => ({ toWarehouse: false, intent: 'N/A' })) || []);
  setVictimsArray(Array.isArray(hit.victims) ? hit.victims : []);
      // Prefill basic fields
      if (titleInputRef.current) titleInputRef.current.value = hit.title || "";
      if (storyTextareaRef.current) storyTextareaRef.current.value = hit.story || "";
      if (videoInputRef.current) videoInputRef.current.value = hit.video_link || "";
      // Prefill selected pirates from assists/guests if we have allUsers
      if (allUsers && Array.isArray(allUsers)) {
        const assistUsers = hit.assists?.map(id => allUsers.find(u => String(u.id) === String(id))).filter(Boolean) as User[];
        const guestUsers: User[] = (hit.guests || []).map(g => ({
          id: `guest-${g}`,
          username: g,
          nickname: g,
          corsair_level: 0,
          raptor_level: 0,
          raider_level: 0,
          rank: 0,
          roles: [],
          fleet: '',
          rsi_handle: '',
        } as User));
        setSelectedPirates([...
          assistUsers,
          ...guestUsers
        ]);
      }
      // Prefill selected gangs from hit.fleet_ids when possible
      if (hit.fleet_activity && Array.isArray(hit.fleet_ids) && hit.fleet_ids.length > 0) {
        // We'll try to map to RecentGang items after allGangs is fetched
        // Defer actual setSelectedGangs to the allGangs load effect below
      } else {
        setSelectedGangs([]);
      }
      // Optionally, set summarizedItems if you want to prefill with hit data (if available)
      // setSummarizedItems(hit.summarizedItems || []);
      setShowCargoPicker(false);
      setCargoSearch("");
      setSelectedCargo(null);
      setCargoQuantity(1);
      setCustomCargoName("");
      setCustomCargoAvg(1);
      setCustomCargoQty(1);
      setShowCustomCargoMenu(false);
      if (addItemBtnRef.current) addItemBtnRef.current.blur();
    }
    if (!show) {
      setCargoList([]);
      setWarehouseFlags([]);
      // setSummarizedItems([]); // Only if you want to clear summarizedItems
      setShowCargoPicker(false);
      setCargoSearch("");
      setSelectedCargo(null);
      setCargoQuantity(1);
      setCustomCargoName("");
      setCustomCargoAvg(1);
      setCustomCargoQty(1);
      setShowCustomCargoMenu(false);
      if (addItemBtnRef.current) addItemBtnRef.current.blur();
    }
  }, [show, isEditMode, hit]);

  useEffect(() => {
      if (show) {
        getAllUsers().then(users => {
          setAllUsersState(Array.isArray(users) ? users : users ? [users] : []);
        });
        const end = new Date();
        const start = new Date(end.getTime() - 48 * 60 * 60 * 1000); // 48 hours ago
        fetchRecentGangsWithinTimeframe(start.toISOString(), end.toISOString()).then(fleets => {
          const gangs = Array.isArray(fleets) ? fleets : fleets ? [fleets] : [];
          setAllGangs(gangs);
          // If editing, try to preselect gangs that match hit.fleet_ids
          if (isEditMode && hit && hit.fleet_activity && Array.isArray(hit.fleet_ids)) {
            const selected = gangs.filter(g => hit.fleet_ids.includes(String(g.id)));
            if (selected.length > 0) setSelectedGangs(selected);
          }
        });
        getSummarizedItems().then(items => {
          setSummarizedItems(Array.isArray(items) ? items : []);
        });
      }
    }, [show]);

    // Detect changes in selectedGangs and fetch black boxes within timeframe
  useEffect(() => {
    if (selectedGangs.length > 0) {
      const createdAts = selectedGangs.map(g => new Date(g.created_at));
      const timestamps = selectedGangs.map(g => new Date(g.timestamp));
      const start = new Date(Math.min(...createdAts.map(d => d.getTime()))).toISOString();
      const end = new Date(Math.max(...timestamps.map(d => d.getTime()))).toISOString();
      import("../../api/blackboxApi").then(api => {
        api.fetchBlackBoxesWithinTimeframe(start, end).then(setBlackBoxes);
      });
    } else {
      setBlackBoxes([]);
    }
  }, [selectedGangs]);

  useEffect(() => {
      if (blackBoxes.length > 0) {
        const allVictims = blackBoxes.flatMap(bb => Array.isArray(bb.victims) ? bb.victims : []);
        const uniqueVictims = Array.from(new Set(allVictims.map(v => v.trim()).filter(Boolean)));
        setGangVictims(uniqueVictims);
      } else {
        setGangVictims([]);
      }
    }, [blackBoxes]);

  // Watch cargoList and set error if empty
  useEffect(() => {
    if (show && cargoList.length === 0) {
      setCargoError("At least one cargo item is required.");
    } else {
      setCargoError(null);
    }
  }, [show, cargoList]);

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#23272a',
        borderRadius: 10,
        padding: '2rem',
        minWidth: 350,
        boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
        color: '#fff',
        position: 'relative',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: 'transparent',
            border: 'none',
            color: '#fff',
            fontSize: 22,
            cursor: 'pointer',
          }}
          aria-label="Close"
        >
          &times;
        </button>
  <h2 style={{marginTop: 0}}>{isEditMode ? 'Edit Hit' : 'Add Hit'}</h2>
        {dbUser && <p style={{marginBottom: '1.5rem'}}>Logged in as: <b>{dbUser.username}</b></p>}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!cargoList.length) {
              setCargoError("At least one cargo item is required.");
              return;
            }
            if (setFormError) setFormError(null);
            setCargoError(null);
            setLocalIsSubmitting(true);
            try {
              // Get title, story, video link from form fields
              const title = (document.getElementById("hitType") as HTMLInputElement)?.value || titleInputRef.current?.value || "";
              const story = (document.getElementById("details") as HTMLTextAreaElement)?.value || storyTextareaRef.current?.value || "";
              const video_link = (document.getElementById("videoLink") as HTMLInputElement)?.value || videoInputRef.current?.value || "";

              // 1. Selected gangs to fleet_ids and fleet_activity
              const fleet_ids = selectedGangs.map(g => String(g.id));
              const fleet_activity = fleet_ids.length > 0;

              // 3. Victims array
              // victimsArray is already correct

              // 4. Cargo
              // cargoList is already correct

              // Calculate total value
              const total_value = cargoList.reduce((sum, item) => sum + (item.avg_price * item.scuAmount), 0);
              const total_scu = cargoList.reduce((sum, item) => sum + item.scuAmount, 0);

              // Determine air_or_ground based on selectedGangs
              let air_or_ground: "Air" | "Ground" | "Mixed" = "Mixed";
              if (selectedGangs.length > 0) {
                const hasShipKills = selectedGangs.some(g => Number(g.pu_shipkills) > 0);
                const hasFPSKills = selectedGangs.some(g => Number(g.pu_fpskills) > 0);
                if (hasShipKills && !hasFPSKills) air_or_ground = "Air";
                else if (!hasShipKills && hasFPSKills) air_or_ground = "Ground";
                else air_or_ground = "Mixed";
              }

              const filteredAssists = selectedPirates.filter(u => !(typeof u.id === "string" && u.id.startsWith("guest-")));
              const guests = selectedPirates
                .filter(u => typeof u.id === "string" && u.id.startsWith("guest-"))
                .map(u => u.username);

               // Calculate total_cut_value
              const total_cut_value =
                selectedPirates.length > 0
                  ? Math.round(total_value / (selectedPirates.length + guests.length))
                  : total_value;

              // Compose Hit object (reuse id on edit)
              const hitPayload: Hit = {
                id: isEditMode && hit ? hit.id : Date.now().toString(),
                user_id: userId || hit?.user_id || "",
                cargo: cargoList,
                total_value,
                patch: gameVersion || hit?.patch || "",
                total_cut_value: total_cut_value, 
                total_cut_scu: Math.round(total_scu / (filteredAssists.length + guests.length)),
                assists: filteredAssists.map(p => String(p.id)),
                assists_usernames: filteredAssists.map(p => p.nickname || p.username),
                total_scu,
                air_or_ground,
                title,
                story,
                timestamp: isEditMode && hit ? hit.timestamp : new Date().toISOString(),
                username: username || hit?.username || "",
                video_link,
                additional_media_links: hit?.additional_media_links || [],
                type_of_piracy: hit?.type_of_piracy || "Brute Force",
                fleet_activity,
                fleet_names: selectedGangs.map(g => g.channel_name || ""),
                fleet_ids,
                victims: victimsArray,
                guests,
              };

              // Create or Update
              const savedHit = isEditMode ? await updateHit(hitPayload) : await createHit(hitPayload);

              // Only add to warehouse on create
              if (!isEditMode) {
                await Promise.all(
                  cargoList.map((item, idx) => {
                    if (warehouseFlags[idx]?.toWarehouse) {
                      const randomBigIntId = () => (
                        Math.floor(Math.random() * 9_000_000_000_000_000) + 1_000_000_000_000_000
                      ).toString();
                      return addWarehouseItem({
                        id: randomBigIntId(),
                        user_id: userId || "",
                        commodity_name: item.commodity_name,
                        total_scu: item.scuAmount,
                        total_value: item.avg_price * item.scuAmount,
                        patch: gameVersion || "",
                        location: "unk",
                        for_org: false,
                        intent: warehouseFlags[idx]?.intent || "N/A",
                      });
                    }
                    return null;
                  })
                );
              }

              await refreshPlayerStatsView();
              if (isEditMode && onUpdate) {
                await onUpdate(savedHit);
              } else if (!isEditMode && onSubmit) {
                await onSubmit(savedHit);
              } else {
                onClose();
              }
              setLocalIsSubmitting(false);
            } catch (error) {
              if (setFormError) setFormError(isEditMode ? "Failed to update hit log. Please try again." : "Failed to create hit log. Please try again.");
              setLocalIsSubmitting(false);
              return;
            }
          }}
        >
          
          {/* ...other form fields can go here... */}
          <div style={{marginBottom: '1rem'}}>
            <label htmlFor="hitType" style={{display: 'block', marginBottom: 4}}>Title</label>
            <input ref={titleInputRef} id="hitType" name="hitType" type="text" style={{width: '100%', padding: 8, borderRadius: 4, border: '1px solid #444', background: '#181a1b', color: '#fff'}} defaultValue={isEditMode && hit ? hit.title : ''} />
          </div>
          {/* Gang & Pirate Section */}
          <div className="section-card">
            <div className="section-title">Gang</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <GangSelection
                allGangs={allGangs}
                selectedGangs={selectedGangs}
                onChange={setSelectedGangs}
              />
                <PirateSelection
                  allUsers={allUsersState}
                  selectedGangs={selectedGangs}
                  selectedPirates={selectedPirates}
                  setSelectedPirates={setSelectedPirates}
                />
            </div>
            <div>
              <VictimsInput
              victimInput={victimInput}
              setVictimInput={setVictimInput}
              victimsArray={victimsArray}
              setVictimsArray={setVictimsArray}
              isSubmitting={!!isSubmitting}
              gangVictims={gangVictims}
            />
            </div>
          </div>

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
              addItemBtnRef={addItemBtnRef}
              totalValue={cargoList.reduce((sum, item) => sum + (item.avg_price * item.scuAmount), 0)} 
              showCustomCargoMenu={showCustomCargoMenu}
              setShowCustomCargoMenu={setShowCustomCargoMenu}
            />
          </div>




          <div style={{marginBottom: '1rem'}}>
            <label htmlFor="details" style={{display: 'block', marginBottom: 4}}>Story</label>
            <textarea ref={storyTextareaRef} id="details" name="details" rows={4} style={{width: '100%', padding: 8, borderRadius: 4, border: '1px solid #444', background: '#181a1b', color: '#fff'}} defaultValue={isEditMode && hit ? hit.story : ''} />
          </div>
          <div style={{marginBottom: '1rem'}}>
            <label htmlFor="videoLink" style={{display: 'block', marginBottom: 4}}>Video Link</label>
            <input ref={videoInputRef} id="videoLink" name="videoLink" type="text" style={{width: '100%', padding: 8, borderRadius: 4, border: '1px solid #444', background: '#181a1b', color: '#fff'}} placeholder="Paste video URL here" defaultValue={isEditMode && hit ? hit.video_link : ''} />
          </div>
          {(cargoError || formError) && (
            <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{cargoError || formError}</div>
          )}
          <div style={{display: 'flex', justifyContent: 'flex-end', gap: 8}}>
            <button type="button" onClick={onClose} style={{padding: '0.5rem 1.2rem', borderRadius: 4, border: 'none', background: '#888', color: '#fff', cursor: 'pointer'}}>Cancel</button>
            <button type="submit" style={{padding: '0.5rem 1.2rem', borderRadius: 4, border: 'none', background: '#2d7aee', color: '#fff', cursor: 'pointer'}}
              disabled={localIsSubmitting || !!cargoError}>
              {localIsSubmitting ? (isEditMode ? 'Updating...' : 'Submitting...') : (isEditMode ? 'Update' : 'Submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddHitModal2;
