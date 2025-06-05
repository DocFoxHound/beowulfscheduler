import React, { useEffect, useState, useRef } from "react";
import Modal from "./Modal";
import { FleetLog } from "../types/fleet_log";
import { createShipLog } from "../api/fleetLogApi";
import { getAllUsers } from "../api/userService";
import { User } from "../types/user";
import { UserFleet } from "../types/fleet"; // Add this import
import { fetchLatest100Hits } from "../api/hittrackerApi";
import { Hit } from "../types/hittracker";
import { createPlayerExperience, editPlayerExperience } from "../api/playerExperiencesApi"; // <-- Add this import
import { fetchAllRecentGatherings } from "../api/recentGatheringsApi";
import { RecentGathering } from "../types/recent_gatherings";
import { fetchBlackBoxesBetweenTimestamps } from "../api/blackboxApi";
import { fetchPlayerExperiencesByUserId } from "../api/playerExperiencesApi"; // You need to implement this API call if not present
import { editFleet } from "../api/fleetApi"; // <-- Add this import

const initialForm: Partial<FleetLog> = {
  title: "",
  notes: "",
  commander_id: undefined,
  commander_username: "",
  patch: "",
  crew_usernames: [],
  air_sub_usernames: [],
  fps_sub_usernames: [],
  link: "",
  start_time: "",
  end_time: "",
  total_kills: 0,
  value_stolen: 0,
  damages_value: 0,
  fleet_id: undefined,
  fleet_name: "",
  associated_hits: [], // Added property
  video_link: "", // Optional, if used
  media_links: [], // Optional, if used
};

const parseArray = (str: string) =>
  str.split(",").map(s => s.trim()).filter(Boolean);

type CrewUserWithExperience = User & {
  dogfighter: boolean;
  marine: boolean;
  snare: boolean;
  cargo: boolean;
  multicrew: boolean;
  salvage: boolean;
  air_leadership: boolean;
  ground_leadership: boolean;
  commander: boolean;
  player_experience_id?: string; // <-- Add this
};

interface LogFleetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (fleetLog: FleetLog) => Promise<void>;
  fleets: UserFleet[]; // Use UserFleet[]
  userId: string;
  username: string;
  patch: string;
  allUsers?: any[];
}

const LogFleetModal: React.FC<LogFleetModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  fleets,
  patch,
}) => {
  const [form, setForm] = useState<Partial<FleetLog>>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [crewInput, setCrewInput] = useState("");
  const [crewSuggestions, setCrewSuggestions] = useState<User[]>([]);
  const [crewUsers, setCrewUsers] = useState<CrewUserWithExperience[]>([]);
  const [commanderInput, setCommanderInput] = useState("");
  const [commanderSuggestions, setCommanderSuggestions] = useState<User[]>([]);
  const [fleetInput, setFleetInput] = useState("");
  const [fleetSuggestions, setFleetSuggestions] = useState<typeof fleets>([]);
  const [fleetDropdownOpen, setFleetDropdownOpen] = useState(false);
  const [hitInput, setHitInput] = useState("");
  const [hitSuggestions, setHitSuggestions] = useState<Hit[]>([]);
  const [hitDropdownOpen, setHitDropdownOpen] = useState(false);
  const [recentHits, setRecentHits] = useState<Hit[]>([]);
  const [recentGatherings, setRecentGatherings] = useState<RecentGathering[]>([]);
  const [gatheringSuggestions, setGatheringSuggestions] = useState<RecentGathering[]>([]);
  const [selectedGatherings, setSelectedGatherings] = useState<RecentGathering[]>([]);
  const [gatheringInput, setGatheringInput] = useState("");
  const [showGatheringsMenu, setShowGatheringsMenu] = useState(false);
  const fleetInputRef = useRef<HTMLInputElement>(null);
  const hitInputRef = useRef<HTMLInputElement>(null);
  const gatheringsMenuRef = useRef<HTMLDivElement | null>(null);
  const [selectedFleet, setSelectedFleet] = useState<UserFleet | null>(null);

  // Sort fleets by last_active (most recent first)
  const sortedFleets = [...fleets].sort((a: any, b: any) => {
    if (!a.last_active && !b.last_active) return 0;
    if (!a.last_active) return 1;
    if (!b.last_active) return -1;
    return new Date(b.last_active).getTime() - new Date(a.last_active).getTime();
  });

  useEffect(() => {
    if (isOpen) {
      setForm(f => ({
        ...initialForm,
        patch: patch || "",
      }));
      setFormError(null);
      getAllUsers().then(users => setAllUsers(Array.isArray(users) ? users : users ? [users] : []));
      setCommanderInput(""); // Reset commander input
      setCommanderSuggestions([]);
      setFleetInput(""); // Reset fleet input
      setFleetSuggestions(sortedFleets); // Show all fleets by default
      fetchLatest100Hits().then(setRecentHits);
      fetchAllRecentGatherings().then(setRecentGatherings);
      setHitSuggestions([]);
      setHitInput("");
      setGatheringSuggestions([]);
      setSelectedGatherings([]);
      setGatheringInput("");
    }
  }, [isOpen, patch]);

  useEffect(() => {
    setFleetSuggestions(sortedFleets);
  }, [fleets]);

  // Handle input changes for fleet search
  const handleFleetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFleetInput(value);
    setFleetDropdownOpen(true);
    if (value.trim() === "") {
      setFleetSuggestions(sortedFleets); // Show all fleets if input is empty
    } else {
      const filtered = sortedFleets.filter(f =>
        f.name?.toLowerCase().includes(value.toLowerCase())
      );
      setFleetSuggestions(filtered);
    }
  };

  // Handle fleet selection
  const handleFleetSelect = (fleet: UserFleet) => {
    setFleetInput(fleet.name || "");
    handleChange("fleet_id", fleet.id);
    handleChange("fleet_name", fleet.name || "");
    setFleetDropdownOpen(false);
    addFleetMembersToCrew(fleet);
    setSelectedFleet(fleet);
  };

  const addFleetMembersToCrew = (fleet: UserFleet) => {
    if (!fleet.members_ids) return;
    fleet.members_ids.forEach((memberId: number | string) => {
      const user = allUsers.find(u => String(u.id) === String(memberId));
      if (user) {
        addCrewUser(user);
      }
    });
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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        fleetInputRef.current &&
        !fleetInputRef.current.contains(event.target as Node)
      ) {
        setFleetDropdownOpen(false);
      }
    }
    if (fleetDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [fleetDropdownOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        hitInputRef.current &&
        !hitInputRef.current.contains(event.target as Node)
      ) {
        setHitDropdownOpen(false);
      }
    }
    if (hitDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [hitDropdownOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showGatheringsMenu) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        gatheringsMenuRef.current &&
        !gatheringsMenuRef.current.contains(event.target as Node)
      ) {
        setShowGatheringsMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showGatheringsMenu]);

  if (!isOpen) return null;

  const handleChange = (field: keyof FleetLog, value: any) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const handleCrewChange = (userId: number, checked: boolean) => {
    setForm(f => ({
      ...f,
      crew_ids: checked
        ? [...(f.crew_ids || []), userId]
        : (f.crew_ids || []).filter(id => id !== userId),
      crew_usernames: checked
        ? [...(f.crew_usernames || []), allUsers.find(u => Number(u.id) === userId)?.username || ""]
        : (f.crew_usernames || []).filter((_, idx) => (f.crew_ids || []).map(id => Number(id))[idx] !== userId),
    }));
  };

  // Crew input change handler
  const handleCrewInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCrewInput(value);

    if (value.trim() === "") {
      setCrewSuggestions([]);
      return;
    }
    const suggestions = allUsers.filter(user => {
      const username = user.username?.toLowerCase() || "";
      const nickname = user.nickname?.toLowerCase() || "";
      const search = value.toLowerCase();
      return username.includes(search) || nickname.includes(search);
    });
    setCrewSuggestions(suggestions.slice(0, 5));
  };

  // Crew suggestion select handler
  const addCrewUser = async (user: User, sourceHitId?: string) => {
    setCrewUsers(prev => {
      if (prev.some(u => u.id === user.id)) return prev;
      return prev;
    });

    let experienceFlags = {
      dogfighter: false,
      marine: false,
      snare: false,
      cargo: false,
      multicrew: false,
      salvage: false,
      air_leadership: false,
      ground_leadership: false,
      commander: false,
    };
    let player_experience_id: string | undefined = undefined;

    if (sourceHitId) {
      try {
        const experiences = await fetchPlayerExperiencesByUserId(user.id);
        const hitExp = experiences.find(
          (exp: any) => exp.operation_id === sourceHitId
        );
        if (hitExp) {
          experienceFlags = {
            dogfighter: !!hitExp.dogfighter,
            marine: !!hitExp.marine,
            snare: !!hitExp.snare,
            cargo: !!hitExp.cargo,
            multicrew: !!hitExp.multicrew,
            salvage: !!hitExp.salvage,
            air_leadership: !!hitExp.air_leadership,
            ground_leadership: !!hitExp.ground_leadership,
            commander: !!hitExp.commander,
          };
          player_experience_id = hitExp.id;
        }
      } catch (err) {
        // Optionally handle error
      }
    }

    setCrewUsers(prev => {
      if (prev.some(u => u.id === user.id)) return prev;
      return [
        ...prev,
        {
          ...user,
          ...experienceFlags,
          ...(player_experience_id ? { player_experience_id } : {}),
        }
      ];
    });
    setCrewInput("");
    setCrewSuggestions([]);
  };

  // Remove crew member handler
  const removeCrewUser = (userId: number) => {
    setCrewUsers(list => list.filter(u => Number(u.id) !== Number(userId)));
  };

  const handleCommanderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCommanderInput(value);

    if (value.trim() === "") {
      setCommanderSuggestions([]);
      return;
    }
    const suggestions = allUsers.filter(user => {
      const username = user.username?.toLowerCase() || "";
      const nickname = user.nickname?.toLowerCase() || "";
      const search = value.toLowerCase();
      return username.includes(search) || nickname.includes(search);
    });
    setCommanderSuggestions(suggestions.slice(0, 5));
  };

  const selectCommander = (user: User) => {
    handleChange("commander_id", user.id);
    handleChange("commander_username", user.username || "");
    setCommanderInput(user.username || "");
    setCommanderSuggestions([]);
    addCrewUser(user);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // --- Custom validation for crew size and overlap ---
    if (crewUsers.length < 8) {
      setFormError("You must have at least 8 crew members.");
      return;
    }
    // Only check overlap if a fleet is selected
    if (selectedFleet) {
      const fleetMemberIds = (selectedFleet.members_ids || []).map(String);
      const overlapCount = crewUsers.filter(u => fleetMemberIds.includes(String(u.id))).length;
      if (overlapCount < 3) {
        setFormError("At least 3 crew members must also be members of the selected fleet.");
        return;
      }
    }
    // --- End custom validation ---

    if (!form.title) {
      setFormError("Title is required.");
      return;
    }
    if (!form.commander_id) {
      setFormError("Commander is required.");
      return;
    }
    if (!form.start_time) {
      setFormError("Start Time is required.");
      return;
    }
    if (!form.end_time) {
      setFormError("End Time is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Build air/ground leadership arrays
      const airSubUsers = crewUsers.filter(u => u.air_leadership);
      const fpsSubUsers = crewUsers.filter(u => u.ground_leadership);

      const air_sub_usernames = airSubUsers.map(u => u.username || "");
      const air_sub_ids = airSubUsers.map(u => Number(u.id));
      const fps_sub_usernames = fpsSubUsers.map(u => u.username || "");
      const fps_sub_ids = fpsSubUsers.map(u => Number(u.id));

      // --- Set fleet_id and fleet_name if no fleet is selected ---
      const fleet_id = selectedFleet ? selectedFleet.id : undefined;
      const fleet_name = selectedFleet ? selectedFleet.name : "Unassociated";

      const fleetLog: FleetLog = {
        ...form,
        crew_ids: crewUsers.map(u => Number(u.id)),
        crew_usernames: crewUsers.map(u => u.username || ""),
        air_sub_usernames,
        air_sub_ids,
        fps_sub_usernames,
        fps_sub_ids,
        total_cargo: Number(form.total_cargo) || 0,
        id: Date.now(),
        created_at: new Date().toISOString(),
        fleet_id,
        fleet_name,
      } as FleetLog;

      // Save player experiences for each crew member
      await Promise.all(
        crewUsers.map(user => {
          const payload = {
            id: user.player_experience_id || randomBigIntId(),
            user_id: String(user.id),
            username: user.username,
            operation_id: String(fleetLog.id),
            operation_name: fleetLog.title || "",
            operation_type: "Fleet",
            patch: fleetLog.patch || "",
            dogfighter: !!user.dogfighter,
            marine: !!user.marine,
            snare: !!user.snare,
            cargo: !!user.cargo,
            multicrew: !!user.multicrew,
            salvage: !!user.salvage,
            air_leadership: !!user.air_leadership,
            ground_leadership: !!user.ground_leadership,
            commander: !!user.commander,
            type_of_experience: "Fleet",
          };
          if (user.player_experience_id) {
            return editPlayerExperience(user.player_experience_id, payload);
          } else {
            return createPlayerExperience(payload);
          }
        })
      );

      // --- Fleet stats update logic ---
      if (selectedFleet) {
        // Patch values (if undefined, treat as 0)
        const kills = Number(form.total_kills) || 0;
        const valueStolen = Number(form.value_stolen) || 0;
        const damages = Number(form.damages_value) || 0;
        const cargo =
          (form.associated_hits || [])
            .map((id: string) => recentHits.find(h => h.id === id))
            .filter(Boolean)
            .reduce((sum, hit) => sum + Number(hit?.total_scu || 0), 0);

        const updatedFleet = {
          ...selectedFleet,
          total_kills: (selectedFleet.total_kills || 0) + kills,
          patch_kills: (selectedFleet.patch_kills || 0) + kills,
          total_value_stolen: (selectedFleet.total_value_stolen || 0) + valueStolen,
          total_value_stolen_patch: (selectedFleet.total_value_stolen_patch || 0) + valueStolen,
          total_cargo_stolen: (selectedFleet.total_cargo_stolen || 0) + cargo,
          total_cargo_stolen_patch: (selectedFleet.total_cargo_stolen_patch || 0) + cargo,
          total_damages: (selectedFleet.total_damages || 0) + damages,
          total_damages_patch: (selectedFleet.total_damages_patch || 0) + damages,
          last_active: new Date().toISOString(), // <-- Set last_active to now
          total_events: Number(selectedFleet.total_events || 0) + 1, // <-- Increment as number
          total_events_patch: Number(selectedFleet.total_events_patch || 0) + 1, // <-- Increment as number
          active: true, // <-- Set active to true
        };

        await editFleet(String(selectedFleet.id), {
        ...updatedFleet,
        action: "log_fleet_activity",
        changed_user_id: String(form.commander_id),
      });
      }
      // --- End fleet stats update ---

      await createShipLog(fleetLog);
      await onSubmit(fleetLog);
      setForm(initialForm);
      setCrewUsers([]);
      onClose();
    } catch (err) {
      setFormError("Failed to submit fleet log.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // New handlers for hit input
  const handleHitInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHitInput(value);
    setHitDropdownOpen(true);
    if (value.trim() === "") {
      setHitSuggestions(recentHits);
    } else {
      setHitSuggestions(
        recentHits.filter(hit =>
          hit.title?.toLowerCase().includes(value.toLowerCase()) ||
          hit.username?.toLowerCase().includes(value.toLowerCase())
        )
      );
    }
  };

  const handleHitSelect = (hit: Hit) => {
    console.log("Selected hit:", hit);
    // Add hit.id to associated_hits if not already present
    if (!Array.isArray(form.associated_hits)) {
      handleChange("associated_hits", [hit.id]);
    } else if (!form.associated_hits.includes(hit.id)) {
      handleChange("associated_hits", [...form.associated_hits, hit.id]);
    }
    
    // Add assists to crew if possible
    if (Array.isArray(hit.assists)) {
      hit.assists.forEach((assist: any) => {
        // Try to match by id or username
        let user: User | undefined;
        console.log("Assist:", assist);
        if (assist !== undefined) {
          user = allUsers.find(u => String(u.id) === String(assist));
        }
        if (user) {
          addCrewUser(user, hit.id); // Pass hit.id as sourceHitId
        }
      });
    }

    setHitInput("");
    setHitDropdownOpen(false);
  };

  const removeAssociatedHit = (id: string) => {
    handleChange(
      "associated_hits",
      (form.associated_hits || []).filter((hitId: string) => hitId !== id)
    );
  };

  // Gathering input change handler
  const handleGatheringInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGatheringInput(value);
    setShowGatheringsMenu(true);

    if (value.trim() === "") {
      setGatheringSuggestions(recentGatherings.slice(0, 8));
      return;
    }
    const suggestions = recentGatherings.filter(g =>
      g.channel_name.toLowerCase().includes(value.toLowerCase())
      || g.usernames.some(u => u.toLowerCase().includes(value.toLowerCase()))
    );
    setGatheringSuggestions(suggestions.slice(0, 8));
  };

  // Add gathering chip
  const addGathering = (g: RecentGathering) => {
    if (!selectedGatherings.some(sel => sel.id === g.id)) {
      setSelectedGatherings(prev => [...prev, g]);
      // Add all users from the gathering to the crew
      if (Array.isArray(g.user_ids)) {
        g.user_ids.forEach(uid => {
          const user = allUsers.find(u => String(u.id) === String(uid));
          if (user) {
            addCrewUser(user);
          }
        });
      }
    }
    setGatheringInput("");
    setShowGatheringsMenu(false);
  };

  // Remove gathering chip
  const removeGathering = (id: string) => {
    setSelectedGatherings(list => list.filter(g => g.id !== id));
  };

  useEffect(() => {
    // Only run if both times and at least one crew member
    if (
      form.start_time &&
      form.end_time &&
      crewUsers.length > 0
    ) {
      (async () => {
        try {
          if (typeof form.start_time === "string" && typeof form.end_time === "string") {
            console.log("Start Time: ", form.start_time);
            console.log("End Time: ", form.end_time);
            const blackboxes = await fetchBlackBoxesBetweenTimestamps(
              form.start_time,
              form.end_time
            );
            // Filter by crew user IDs
            const crewIds = crewUsers.map(u => String(u.id));
            const relevant = blackboxes.filter(bb => crewIds.includes(String(bb.user_id)));
            // Sum kills and damage
            const totalKills = relevant.reduce((sum, bb) => sum + (bb.kill_count || 0), 0);
            const totalDamage = relevant.reduce((sum, bb) => sum + (bb.value || 0), 0);
            setForm(f => ({
              ...f,
              total_kills: totalKills,
              damages_value: totalDamage,
            }));
          }
        } catch (err) {
          // Optionally handle error
        }
      })();
    }
    // Optionally, reset if not enough info
    else if (form.start_time && form.end_time) {
      setForm(f => ({
        ...f,
        total_kills: 0,
        damages_value: 0,
      }));
    }
    // eslint-disable-next-line
  }, [form.start_time, form.end_time, crewUsers.map(u => u.id).join(",")]);

  // Auto-update Value Stolen and Total Cargo when associated_hits changes
  useEffect(() => {
    if (!form.associated_hits || form.associated_hits.length === 0) {
      setForm(f => ({
        ...f,
        value_stolen: 0,
        total_cargo: 0,
      }));
      return;
    }
    const hits = form.associated_hits
      .map((id: string) => recentHits.find(h => h.id === id))
      .filter(Boolean);

    const valueStolen = hits.reduce((sum, hit) => sum + (hit?.total_value || 0), 0);
    const totalCargo = hits.reduce((sum, hit) => sum + (hit?.total_scu || 0), 0);

    setForm(f => ({
      ...f,
      value_stolen: valueStolen,
      total_cargo: totalCargo,
    }));
  }, [form.associated_hits, recentHits]);

  return (
    <Modal onClose={onClose}>
      <h2>Log Fleet Activity</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Title:
          <input
            type="text"
            value={form.title || ""}
            onChange={e => handleChange("title", e.target.value)}
            disabled={isSubmitting}
          />
        </label>
        {/* Commander Autocomplete */}
          <label style={{ flex: 1, minWidth: 0, position: "relative" }}>
            <input
              type="text"
              value={commanderInput}
              onChange={handleCommanderInputChange}
              disabled={isSubmitting}
              autoComplete="off"
              style={{ width: "100%" }}
              placeholder="Select Commander"
            />
            {commanderSuggestions.length > 0 && (
              <div style={{
                background: "#23272e",
                border: "1px solid #353a40",
                borderRadius: 4,
                marginTop: 2,
                position: "absolute",
                zIndex: 10,
                width: "100%"
              }}>
                {commanderSuggestions.map(user => (
                  <div
                    key={user.id}
                    style={{
                      padding: "4px 8px",
                      cursor: "pointer",
                      color: "#fff"
                    }}
                    onMouseDown={() => selectCommander(user)}
                  >
                    {user.username}
                  </div>
                ))}
              </div>
            )}
          </label>
        {/* Flex row for Fleet and Commander */}
        <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
          {/* Fleet Autocomplete */}
          <label style={{ flex: 1, minWidth: 0, position: "relative" }}>
            <input
              ref={fleetInputRef}
              type="text"
              value={fleetInput}
              onChange={handleFleetInputChange}
              onFocus={() => {
                setFleetDropdownOpen(true);
                setFleetSuggestions(sortedFleets);
              }}
              disabled={isSubmitting}
              autoComplete="off"
              style={{ width: "100%" }}
              placeholder="Select Fleet"
            />
            {fleetDropdownOpen && fleetSuggestions.length > 0 && (
              <div style={{
                background: "#23272e",
                border: "1px solid #353a40",
                borderRadius: 4,
                marginTop: 2,
                position: "absolute",
                zIndex: 20,
                width: "100%",
                maxHeight: 200,
                overflowY: "auto"
              }}>
                {fleetSuggestions.map(fleet => (
                  <div
                    key={fleet.id}
                    style={{
                      padding: "6px 10px",
                      cursor: "pointer",
                      color: "#fff",
                      borderBottom: "1px solid #353a40",
                      background: fleet.id === Number(form.fleet_id) ? "#2d7aee" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                    onMouseDown={() => handleFleetSelect(fleet)}
                  >
                    {/* Fleet image */}
                    {fleet.avatar && (
                      <img
                        src={fleet.avatar}
                        alt={fleet.name}
                        style={{
                          width: 32,
                          height: 32,
                          objectFit: "cover",
                          borderRadius: 4,
                          marginRight: 8,
                          background: "#181a1b",
                          border: "1px solid #353a40"
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "bold" }}>{fleet.name}</div>
                      {fleet.commander_id && (
                        <div style={{ fontSize: 12, color: "#aaa" }}>
                          Commander: {allUsers.find(u => String(u.id) === String(fleet.commander_id))?.username || ""}
                        </div>
                      )}
                      {fleet.last_active && (
                        <div style={{ fontSize: 12, color: "#aaa" }}>
                          Last Active: {new Date(fleet.last_active).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </label>
          {/* Player Experience Autocomplete */}
          <label style={{ flex: 1, minWidth: 0, position: "relative" }}>
            <input
              type="text"
              value={gatheringInput}
              onChange={handleGatheringInputChange}
              onFocus={() => {
                setShowGatheringsMenu(true);
                setGatheringSuggestions(recentGatherings.slice(0, 8));
              }}
              disabled={isSubmitting}
              autoComplete="off"
              style={{ width: "100%" }}
              placeholder="Recent Gathering"
            />
            {showGatheringsMenu && gatheringSuggestions.length > 0 && (
              <div
                ref={gatheringsMenuRef}
                style={{
                  background: "#23272e",
                  border: "1px solid #353a40",
                  borderRadius: 4,
                  marginTop: 2,
                  position: "absolute",
                  zIndex: 10,
                  width: "100%",
                  maxHeight: 220,
                  overflowY: "auto"
                }}>
                {gatheringSuggestions.map(g => (
                  <div
                    key={g.id}
                    style={{
                      padding: "6px 8px",
                      cursor: "pointer",
                      color: "#fff",
                      borderBottom: "1px solid #353a40",
                    }}
                    onMouseDown={() => addGathering(g)}
                  >
                    <div style={{ fontWeight: 500 }}>
                      {g.channel_name} &mdash; {new Date(g.timestamp).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 13, color: "#bbb" }}>
                      {g.usernames.length} players
                    </div>
                  </div>
                ))}
              </div>
            )}
          </label>
          {/* Associated Hits */}
          <label style={{ flex: 1, minWidth: 0, position: "relative" }}>
            <input
              ref={hitInputRef}
              type="text"
              value={hitInput}
              onChange={handleHitInputChange}
              onFocus={() => {
                setHitDropdownOpen(true);
                setHitSuggestions(recentHits);
              }}
              disabled={isSubmitting}
              autoComplete="off"
              style={{ width: "100%" }}
              placeholder="Associated Hits"
            />
            {hitDropdownOpen && hitSuggestions.length > 0 && (
              <div style={{
                background: "#23272e",
                border: "1px solid #353a40",
                borderRadius: 4,
                marginTop: 2,
                position: "absolute",
                zIndex: 20,
                width: "100%",
                maxHeight: 200,
                overflowY: "auto"
              }}>
                {hitSuggestions.map(hit => (
                  <div
                    key={hit.id}
                    style={{
                      padding: "6px 10px",
                      cursor: "pointer",
                      color: "#fff",
                      borderBottom: "1px solid #353a40",
                      background: (form.associated_hits || []).includes(hit.id) ? "#2d7aee" : "transparent",
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                    onMouseDown={() => handleHitSelect(hit)}
                  >
                    <span style={{ fontWeight: "bold" }}>{hit.title}</span>
                    <span style={{ fontSize: 12, color: "#aaa" }}>
                      By: {hit.username} | {new Date(hit.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </label>
        </div>
        {/* Fleet Card */}
        {(selectedFleet || selectedGatherings.length > 0 || (form.associated_hits && form.associated_hits.length > 0)) && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              background: "#23272e",
              border: "1px solid #353a40",
              borderRadius: 6,
              padding: 12,
              marginBottom: 16,
              gap: 16,
              width: "100%",
              minWidth: 0,
              boxSizing: "border-box",
            }}
          >
            {/* Fleet info (left third) */}
            {selectedFleet && (
              <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center" }}>
                {selectedFleet.avatar && (
                  <img
                    src={selectedFleet.avatar}
                    alt={selectedFleet.name}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 6,
                      objectFit: "cover",
                      border: "1px solid #353a40",
                      marginRight: 12,
                    }}
                  />
                )}
                <div>
                  <div style={{ fontWeight: "bold", fontSize: 18 }}>{selectedFleet.name}</div>
                  {selectedFleet.commander_id && (
                    <div style={{ color: "#aaa" }}>Commander: {allUsers.find(u => String(u.id) === String(selectedFleet.commander_id))?.username || ""}</div>
                  )}
                  {selectedFleet.primary_mission && (
                    <div style={{ color: "#aaa" }}>Mission: {selectedFleet.primary_mission}</div>
                  )}
                  {selectedFleet.total_kills !== undefined && (
                    <div style={{ color: "#aaa" }}>
                      Total Kills: {selectedFleet.total_kills.toLocaleString()}
                    </div>
                  )}
                  {selectedFleet.total_damages !== undefined && (
                    <div style={{ color: "#aaa" }}>
                      Total Damages Done: {selectedFleet.total_damages.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
                    </div>
                  )}
                  {selectedFleet.total_value_stolen !== undefined && (
                    <div style={{ color: "#aaa" }}>
                      Total Value Stolen: {selectedFleet.total_value_stolen.toLocaleString()} aUEC
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Selected Gatherings chips (middle third) */}
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "flex-start" }}>
              {selectedGatherings.map(g => (
                <span
                  key={g.id}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    background: "#181a1b",
                    color: "#fff",
                    borderRadius: 16,
                    padding: "2px 10px",
                    fontSize: 13,
                    marginRight: 2,
                    marginBottom: 2,
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{g.channel_name}</span>
                  <span style={{ margin: "0 6px", color: "#bbb" }}>
                    {new Date(g.timestamp).toLocaleString()}
                  </span>
                  <span style={{ color: "#bbb" }}>
                    {g.usernames.length} people
                  </span>
                  <button
                    type="button"
                    onClick={() => removeGathering(g.id)}
                    style={{
                      marginLeft: 6,
                      color: "#ff6b6b",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 14,
                      lineHeight: 1,
                    }}
                    aria-label={`Remove ${g.channel_name}`}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
            {/* Selected hits chips (right third) */}
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "flex-start" }}>
              {(form.associated_hits || []).map((id: string) => {
                const hit = recentHits.find(h => h.id === id);
                return (
                  <span
                    key={id}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      background: "#181a1b",
                      color: "#fff",
                      borderRadius: 16,
                      padding: "2px 10px",
                      fontSize: 13,
                      marginRight: 2,
                      marginBottom: 2,
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{hit?.title || id}</span>
                    {hit?.total_value !== undefined && (
                      <span style={{ margin: "0 6px", color: "#bbb" }}>
                        {Number(hit.total_value).toLocaleString()} aUEC
                      </span>
                    )}
                    <span style={{ color: "#bbb" }}>
                      {Array.isArray(hit?.assists) ? hit.assists.length : 0} assists
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAssociatedHit(id)}
                      style={{
                        marginLeft: 6,
                        color: "#ff6b6b",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 14,
                        lineHeight: 1,
                      }}
                      aria-label={`Remove ${hit?.title || id}`}
                    >
                      ✕
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}
        {/* Start Time and End Time on the same line */}
        <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
          <label style={{ flex: 1, minWidth: 0 }}>
            Start Time:
            <input
              type="datetime-local"
              value={form.start_time || ""}
              onChange={e => handleChange("start_time", e.target.value)}
              disabled={isSubmitting}
              style={{ width: "100%" }}
            />
          </label>
          <label style={{ flex: 1, minWidth: 0 }}>
            End Time:
            <input
              type="datetime-local"
              value={form.end_time || ""}
              onChange={e => handleChange("end_time", e.target.value)}
              disabled={isSubmitting}
              style={{ width: "100%" }}
            />
          </label>
        </div>
        {/* Crew field with experience table */}
        <label style={{ position: "relative", display: "block" }}>
          Crew:
          <input
            type="text"
            value={crewInput}
            onChange={handleCrewInputChange}
            disabled={isSubmitting}
            autoComplete="off"
            style={{ width: "100%" }}
            placeholder="Type to search and add crew members"
          />
          {crewSuggestions.length > 0 && (
            <div style={{
              background: "#23272e",
              border: "1px solid #353a40",
              borderRadius: 4,
              marginTop: 2,
              position: "absolute",
              zIndex: 10,
              width: 200
            }}>
              {crewSuggestions.map(user => (
                <div
                  key={user.id}
                  style={{
                    padding: "4px 8px",
                    cursor: "pointer",
                    color: "#fff"
                  }}
                  onMouseDown={() => addCrewUser(user)}
                >
                  {user.username}
                </div>
              ))}
            </div>
          )}
        </label>
        {crewUsers.length > 0 && (
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
                  <th style={{ color: "#ccc", padding: 6 }}>Air Leadership</th>
                  <th style={{ color: "#ccc", padding: 6 }}>Ground Leadership</th>
                  <th style={{ color: "#ccc", padding: 6 }}>Commander</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {crewUsers.map((user, idx) => (
                  <tr key={user.id} style={{ background: idx % 2 ? "#202226" : "#23272e" }}>
                    <td style={{ color: "#fff", padding: 6 }}>{user.nickname || user.username}</td>
                    {([
                      "dogfighter",
                      "marine",
                      "snare",
                      "cargo",
                      "multicrew",
                      "salvage",
                      "air_leadership",
                      "ground_leadership",
                      "commander"
                    ] as Array<keyof CrewUserWithExperience>).map(field => (
                      <td key={field} style={{ textAlign: "center", padding: 6 }}>
                        <input
                          type="checkbox"
                          className="large-checkbox"
                          checked={Boolean(user[field])}
                          onChange={e => {
                            setCrewUsers(list =>
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
                        onClick={() => removeCrewUser(Number(user.id))}
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
        {/* Story as a large textarea */}
        <label style={{ width: "100%", display: "block" }}>
          Story:
          <textarea
            value={form.notes || ""}
            onChange={e => handleChange("notes", e.target.value)}
            disabled={isSubmitting}
            style={{
              width: "100%",
              minHeight: 120,
              resize: "vertical",
              marginBottom: 16,
              fontSize: 16,
              boxSizing: "border-box"
            }}
          />
        </label>
        {/* Totals row: Total Kills, Value Stolen, Damages Value */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 12,
            justifyContent: "space-between",
            alignItems: "stretch",
          }}
        >
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <label style={{ width: "100%", textAlign: "center" }}>
              Total Kills:
            </label>
            <input
              type="number"
              min={0}
              value={form.total_kills ?? 0}
              onChange={e => handleChange("total_kills", Number(e.target.value))}
              disabled={isSubmitting}
              style={{
                width: "100%",
                background: "#23272b",
                borderRadius: 4,
                padding: "8px 12px",
                marginTop: 4,
                color: "#fff",
                border: "1px solid #353a40",
                textAlign: "center",
                fontSize: 16,
              }}
            />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <label style={{ width: "100%", textAlign: "center" }}>
              Value Stolen:
            </label>
            <input
              type="number"
              min={0}
              value={form.value_stolen ?? 0}
              onChange={e => handleChange("value_stolen", Number(e.target.value))}
              disabled={isSubmitting}
              style={{
                width: "100%",
                background: "#23272b",
                borderRadius: 4,
                padding: "8px 12px",
                marginTop: 4,
                color: "#fff",
                border: "1px solid #353a40",
                textAlign: "center",
                fontSize: 16,
              }}
            />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <label style={{ width: "100%", textAlign: "center" }}>
              Total Cargo:
            </label>
            <input
              type="number"
              min={0}
              value={form.total_cargo ?? 0}
              onChange={e => handleChange("total_cargo", Number(e.target.value))}
              disabled={isSubmitting}
              style={{
                width: "100%",
                background: "#23272b",
                borderRadius: 4,
                padding: "8px 12px",
                marginTop: 4,
                color: "#fff",
                border: "1px solid #353a40",
                textAlign: "center",
                fontSize: 16,
              }}
            />
            {/* <input
              type="number"
              min={0}
              value={
                (form.associated_hits || [])
                  .map((id: string) => recentHits.find(h => h.id === id))
                  .filter(Boolean)
                  .reduce((sum, hit) => sum + (hit?.total_scu || 0), 0)
              }
              readOnly
              disabled={isSubmitting}
              style={{
                width: "100%",
                background: "#23272b",
                borderRadius: 4,
                padding: "8px 12px",
                marginTop: 4,
                color: "#fff",
                border: "1px solid #353a40",
                textAlign: "center",
                fontSize: 16,
              }}
            /> */}
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <label style={{ width: "100%", textAlign: "center" }}>
              Damages Value:
            </label>
            <input
              type="number"
              min={0}
              value={form.damages_value ?? 0}
              onChange={e => handleChange("damages_value", Number(e.target.value))}
              disabled={isSubmitting}
              style={{
                width: "100%",
                background: "#23272b",
                borderRadius: 4,
                padding: "8px 12px",
                marginTop: 4,
                color: "#fff",
                border: "1px solid #353a40",
                textAlign: "center",
                fontSize: 16,
              }}
            />
          </div>
        </div>
        {/* Video Link field */}
        <label>
          Video Link:
          <input
            type="text"
            value={form.video_link || ""}
            onChange={e => handleChange("video_link", e.target.value)}
            disabled={isSubmitting}
          />
        </label>
        {/* Media Links field (comma separated) */}
        <label>
          Media Links:
          <input
            type="text"
            value={form.media_links ? form.media_links.join(", ") : ""}
            onChange={e =>
              handleChange(
                "media_links",
                e.target.value
                  .split(",")
                  .map(link => link.trim())
                  .filter(link => link.length > 0)
              )
            }
            disabled={isSubmitting}
            placeholder="Enter multiple links separated by commas"
          />
        </label>
        {formError && <div style={{ color: "#ff6b6b", marginBottom: "1em" }}>{formError}</div>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
        <button type="button" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </button>
      </form>
    </Modal>
  );
};

export default LogFleetModal;