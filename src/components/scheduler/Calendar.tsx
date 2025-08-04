import React, { useState, useMemo, useEffect } from "react";
import CreateEventModal from "../CreateEventModal";
import { getAllUsers, getUserById } from '../../api/userService';
import { fetchFleetActiveOrNot } from '../../api/fleetApi';
import moment from "moment-timezone";
import { createAvailability, getWeekAvailabilities } from '../../api/calendarAvailabilityApi';
import { getWeeklySchedule } from '../../api/scheduleService';

// Updated rank options
const RANKS: string[] = ["All Ranks", "Blooded", "Marauder", "Crew", "Prospect", "Friendly"];
const PRESTIGES: string[] = ["All Prestiges", "CORSAIR", "RAPTOR", "RAIDER"];
const DEFAULT_TEAMS: string[] = ["All Teams", "Ronin", "Alpha", "Bravo", "Charlie", "Delta"];
const RONIN_IDS = ["1392135939119386735", "1401252750083358801"]; // from .env

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Get user's timezone
const getDefaultTimezone = () => {
  // Get user's offset in hours
  const offsetMin = -new Date().getTimezoneOffset();
  const offsetHour = Math.round(offsetMin / 60);
  // Find matching UTC offset in TIMEZONES
  const tz = TIMEZONES.find(tzObj => {
    // Parse offset from label, e.g. "UTC+2"
    const match = tzObj.label.match(/UTC([+-]?)(\d+)?/);
    if (!match) return false;
    const sign = match[1] === '-' ? -1 : 1;
    const hour = match[2] ? parseInt(match[2], 10) : 0;
    return sign * hour === offsetHour;
  });
  return tz ? tz.name : 'Etc/GMT';
};

// List of IANA timezones from moment-timezone with current UTC offset
const TIMEZONES = Array.from({ length: 27 }, (_, i) => {
  const offset = i - 12; // UTC-12 to UTC+14
  const sign = offset >= 0 ? '+' : '-';
  const absOffset = Math.abs(offset);
  const name = `Etc/GMT${offset === 0 ? '' : (offset > 0 ? '-' : '+') + absOffset}`;
  const label = `UTC${offset === 0 ? '' : sign + absOffset}`;
  return { name, label };
});
// Rank IDs from .env
const BLOODED_IDS = ["1347267695707558050", "1034596054529736745"];
const MARAUDER_IDS = ["1347265334448492655", "1191071030421229689"];
const CREW_IDS = ["1347265375103881321", "1134352841985773628"];
const PROSPECT_IDS = ["1347265415989952554", "1134351702431105084"];
const FRIENDLY_IDS = ["1079428984258953237"];

interface CalendarProps {
  dbUser?: any;
}

const Calendar: React.FC<CalendarProps> = ({ dbUser }) => {
  // State for CreateEventModal
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  // Filter bar is always visible now
  // State for new filters
  const [selectedRank, setSelectedRank] = useState<string>(RANKS[0]);
  const [selectedPrestige, setSelectedPrestige] = useState<string>(PRESTIGES[0]);
  const [selectedTeam, setSelectedTeam] = useState<string>(DEFAULT_TEAMS[0]);
  // Teams state (populated from fleets)
  const [teams, setTeams] = useState<string[]>(DEFAULT_TEAMS);
  // State for users with availabilities and selected user filter
  const [users, setUsers] = useState<any[]>([]);
  // Fetch active fleets and populate teams
  useEffect(() => {
    fetchFleetActiveOrNot(true)
      .then((fleets) => {
        const fleetNames = fleets
          .map(f => f.name)
          .filter((name): name is string => typeof name === 'string')
          .sort((a, b) => a.localeCompare(b));
        // Always put All Teams first, then Ronin, then fleets
        setTeams(["All Teams", "Ronin", ...fleetNames]);
      })
      .catch(() => {
        setTeams(DEFAULT_TEAMS);
      });
  }, []);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  // Track if it's the first load for the current week
  const firstLoadRef = React.useRef(true);
  // Track if user owns any availabilities for the current week
  const [userOwnsAny, setUserOwnsAny] = useState(false);
  // Use user's actual timezone as default
  const [timezone, setTimezone] = useState(getDefaultTimezone());

  // State for week availabilities heatmap
  const [heatmap, setHeatmap] = useState<{ [cellId: string]: number }>({});
  const [loadingHeatmap, setLoadingHeatmap] = useState(false);
  // Track user's owned availabilities: cellId -> availability object
  const [ownedAvailabilities, setOwnedAvailabilities] = useState<{ [cellId: string]: any }>({});

  // State for weekly schedules (events)
  const [weeklySchedules, setWeeklySchedules] = useState<any[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  // Get start of current week (Sunday)
  // Week navigation state
  const [weekOffset, setWeekOffset] = useState(0);
  const startOfWeek = useMemo(() => {
    // Calculate start of week in selected timezone
    const now = moment.tz(timezone);
    const weekStart = now.clone().startOf('week').add(weekOffset * 7, 'days');
    weekStart.hour(0).minute(0).second(0).millisecond(0);
    return weekStart;
  }, [weekOffset, timezone]);

  // Calculate start and end ISO strings for week
  const weekRange = useMemo(() => {
    // Calculate week start and end in selected timezone
    const start = startOfWeek.clone();
    const end = startOfWeek.clone().add(6, 'days').hour(23).minute(59).second(59).millisecond(999);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, [startOfWeek]);

  // Generate dates for the week
  const weekDates = useMemo(() => {
    // Generate week dates in selected timezone
    return WEEKDAYS.map((_, i) => {
      return startOfWeek.clone().add(i, 'days').toDate();
    });
  }, [startOfWeek]);

  // Fetch only users with availabilities for the current week
  useEffect(() => {
    let isMounted = true;
    getWeekAvailabilities(weekRange.startDate, weekRange.endDate)
      .then(async (availabilities) => {
        // Get unique user_ids from availabilities
        const userIds: string[] = Array.from(new Set(availabilities.map((a: any) => a.user_id)));
        // Fetch user details for each user_id
        const userPromises = userIds.map((id) => getUserById(id).catch(() => null));
        const userResults = await Promise.all(userPromises);
        let filteredUsers = userResults.filter(Boolean);

        // Filter users by selected rank
        if (selectedRank !== "All Ranks") {
          let rankIds: string[] = [];
          if (selectedRank === "Blooded") rankIds = BLOODED_IDS;
          else if (selectedRank === "Marauder") rankIds = MARAUDER_IDS;
          else if (selectedRank === "Crew") rankIds = CREW_IDS;
          else if (selectedRank === "Prospect") rankIds = PROSPECT_IDS;
          else if (selectedRank === "Friendly") rankIds = FRIENDLY_IDS;
          filteredUsers = filteredUsers.filter(u =>
            u && Array.isArray(u.roles) && u.roles.some((roleId: string) => rankIds.includes(roleId))
          );
        }

        // Filter users by selected prestige
        if (selectedPrestige !== "All Prestiges") {
          if (selectedPrestige === "CORSAIR") {
            filteredUsers = filteredUsers.filter(u => u && u.corsair_level > 0);
          } else if (selectedPrestige === "RAPTOR") {
            filteredUsers = filteredUsers.filter(u => u && u.raptor_level > 0);
          } else if (selectedPrestige === "RAIDER") {
            filteredUsers = filteredUsers.filter(u => u && u.raider_level > 0);
          }
        }

        // Filter users by selected team
        if (selectedTeam === "Ronin") {
          filteredUsers = filteredUsers.filter(u =>
            u && Array.isArray(u.roles) && u.roles.some((roleId: string) => RONIN_IDS.includes(roleId))
          );
        } else if (selectedTeam !== "All Teams") {
          // Fetch active fleets and find the selected fleet
          let fleets: any[] = [];
          try {
            fleets = await fetchFleetActiveOrNot(true);
          } catch {}
          const selectedFleet = fleets.find(f => f.name === selectedTeam);
          let teamUserIds: string[] = [];
          if (selectedFleet) {
            if (selectedFleet.commander_id) teamUserIds.push(selectedFleet.commander_id);
            if (Array.isArray(selectedFleet.members_ids)) teamUserIds.push(...selectedFleet.members_ids);
          }
          filteredUsers = filteredUsers.filter(u => u && teamUserIds.includes(u.id));
        }

        if (isMounted) {
          setUsers(filteredUsers);
          // Default to current user if present
          setSelectedUserId(dbUser?.id || '');
        }
      })
      .catch(() => {
        if (isMounted) setUsers([]);
      });
    return () => { isMounted = false; };
  }, [dbUser?.id, weekRange.startDate, weekRange.endDate, selectedRank, selectedPrestige, selectedTeam]);

  // Fetch week availabilities and build heatmap, filtered by selected user
  useEffect(() => {
    setLoadingHeatmap(true);
    getWeekAvailabilities(weekRange.startDate, weekRange.endDate)
      .then((availabilities) => {
        // Show all availabilities for the week
        const map: { [cellId: string]: number } = {};
        const owned: { [cellId: string]: any } = {};
        const userId = dbUser?.id;
        availabilities.forEach((a: any) => {
          // Parse timestamp in selected timezone
          const dt = moment.tz(a.timestamp, timezone);
          for (let dayIdx = 0; dayIdx < weekDates.length; dayIdx++) {
            const wd = weekDates[dayIdx];
            if (
              dt.year() === wd.getFullYear() &&
              dt.month() === wd.getMonth() &&
              dt.date() === wd.getDate()
            ) {
              const hour = dt.hour();
              const cellId = getCellId(dayIdx, hour);
              map[cellId] = (map[cellId] || 0) + 1;
              // Track owned availabilities for current user only
              if (a.user_id === userId) {
                owned[cellId] = a;
              }
              break;
            }
          }
        });
        setHeatmap(map);
        setOwnedAvailabilities(owned);
        // Always set selectedCells to owned cells when week changes
        setSelectedCells(new Set(Object.keys(owned)));
        firstLoadRef.current = false;
        setUserOwnsAny(Object.keys(owned).length > 0);
      })
      .catch(() => {
        setHeatmap({});
        setOwnedAvailabilities({});
        setSelectedCells(new Set());
      })
      .finally(() => setLoadingHeatmap(false));
    // Reset firstLoadRef when week changes or user changes
  }, [weekRange.startDate, weekRange.endDate, weekDates.length, dbUser?.id, timezone, selectedUserId, users]);

  // Fetch weekly schedules (events) when week changes
  useEffect(() => {
    setLoadingSchedules(true);
    getWeeklySchedule(weekRange.startDate, weekRange.endDate)
      .then((schedules) => {
        setWeeklySchedules(Array.isArray(schedules) ? schedules : []);
      })
      .catch(() => {
        setWeeklySchedules([]);
      })
      .finally(() => setLoadingSchedules(false));
  }, [weekRange.startDate, weekRange.endDate]);
  React.useEffect(() => {
    firstLoadRef.current = true;
  }, [weekRange.startDate, dbUser?.id]);

  // Selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState<'add' | 'remove' | null>(null);

  // Helper to get cell id
  const getCellId = (dayIdx: number, hour: number) => `${dayIdx}-${hour}`;

  // Mouse event handlers
  const handleMouseDown = (dayIdx: number, hour: number) => {
    const cellId = getCellId(dayIdx, hour);
    setIsSelecting(true);
    setSelectionMode(selectedCells.has(cellId) ? 'remove' : 'add');
    setSelectedCells(prev => {
      const newSet = new Set(prev);
      if (selectedCells.has(cellId)) {
        newSet.delete(cellId);
      } else {
        newSet.add(cellId);
      }
      return newSet;
    });
  };

  const handleMouseEnter = (dayIdx: number, hour: number) => {
    if (isSelecting && selectionMode) {
      setSelectedCells(prev => {
        const cellId = getCellId(dayIdx, hour);
        const newSet = new Set(prev);
        if (selectionMode === 'add') {
          newSet.add(cellId);
        } else if (selectionMode === 'remove') {
          newSet.delete(cellId);
        }
        return newSet;
      });
    }
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
    setSelectionMode(null);
  };

  // Listen for mouseup outside table
  React.useEffect(() => {
    const handleUp = () => setIsSelecting(false);
    window.addEventListener("mouseup", handleUp);
    return () => window.removeEventListener("mouseup", handleUp);
  }, []);

  // Helper to generate random serial id
  const generateId = () => {
    return Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
  };

  // Use dbUser for user info
  const user_id = dbUser?.id || "";
  const username = dbUser?.username || "";
  const nickname = dbUser?.nickname || "";

  // Save handler
  const handleSave = async () => {
    // Find which owned availabilities were deselected (to delete)
    const toDelete: any[] = [];
    Object.entries(ownedAvailabilities).forEach(([cellId, availability]) => {
      if (!selectedCells.has(cellId)) {
        toDelete.push(availability);
      }
    });

    // Find which cells are newly selected (not previously owned)
    const toCreate: string[] = [];
    selectedCells.forEach(cellId => {
      if (!ownedAvailabilities[cellId]) {
        toCreate.push(cellId);
      }
    });

    // Prepare create promises
    const createPromises = toCreate.map(cellId => {
      const [dayIdx, hour] = cellId.split('-').map(Number);
      const date = new Date(weekDates[dayIdx]);
      date.setHours(hour, 0, 0, 0);
      const timestamp = moment.tz(date, timezone).toISOString();
      const availability = {
        id: generateId(),
        timestamp,
        user_id,
        username,
        nickname,
      };
      return createAvailability(availability);
    });

    // Prepare delete promises
    const deletePromises = toDelete.map(a => {
      return import('../../api/calendarAvailabilityApi').then(api => api.deleteAvailability(a.id));
    });

    try {
      await Promise.all([...createPromises, ...deletePromises]);
      alert('Availabilities saved!');
      setSelectedCells(new Set());
      // Refetch heatmap after save
      setLoadingHeatmap(true);
      getWeekAvailabilities(weekRange.startDate, weekRange.endDate)
        .then((availabilities) => {
          const map: { [cellId: string]: number } = {};
          const owned: { [cellId: string]: any } = {};
          const userId = dbUser?.id;
          availabilities.forEach((a: any) => {
            const dt = moment.utc(a.timestamp).local();
            for (let dayIdx = 0; dayIdx < weekDates.length; dayIdx++) {
              const wd = weekDates[dayIdx];
              if (
                dt.year() === wd.getFullYear() &&
                dt.month() === wd.getMonth() &&
                dt.date() === wd.getDate()
              ) {
                const hour = dt.hour();
                const cellId = getCellId(dayIdx, hour);
                map[cellId] = (map[cellId] || 0) + 1;
                if (a.user_id === userId) {
                  owned[cellId] = a;
                }
                break;
              }
            }
          });
          setHeatmap(map);
          setOwnedAvailabilities(owned);
          setSelectedCells(prev => {
            const newSet = new Set(prev);
            Object.keys(owned).forEach(cellId => newSet.add(cellId));
            return newSet;
          });
        })
        .catch(() => {
          setHeatmap({});
          setOwnedAvailabilities({});
        })
        .finally(() => setLoadingHeatmap(false));
    } catch (err) {
      alert('Error saving availabilities.');
    }
  };

  return (
    <div style={{ padding: "1.5rem", borderRadius: 8, background: "#23272a", color: "#fff", textAlign: "center" }}>
      {/* Header: three columns for filters, navigation, timezone */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16, width: "100%" }}>
        {/* Left column: Filters */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-start", minWidth: 0 }}>
          <div style={{ minWidth: 80 }}>
            <label htmlFor="rank-filter" style={{ fontWeight: 500, marginRight: 4, fontSize: 12 }}>Filters:</label>
            <select
              id="rank-filter"
              value={selectedRank}
              onChange={e => setSelectedRank(e.target.value)}
              style={{ padding: "2px 6px", borderRadius: 5, border: "1px solid #444", background: "#181a1b", color: "#fff", fontWeight: 500, minWidth: 60, fontSize: 12 }}
            >
              {RANKS.map(rank => (
                <option key={rank} value={rank}>{rank}</option>
              ))}
            </select>
          </div>
          <div style={{ minWidth: 80 }}>
            <select
              id="prestige-filter"
              value={selectedPrestige}
              onChange={e => setSelectedPrestige(e.target.value)}
              style={{ padding: "2px 6px", borderRadius: 5, border: "1px solid #444", background: "#181a1b", color: "#fff", fontWeight: 500, minWidth: 60, fontSize: 12 }}
            >
              {PRESTIGES.map(prestige => (
                <option key={prestige} value={prestige}>{prestige}</option>
              ))}
            </select>
          </div>
          <div style={{ minWidth: 80 }}>
            <select
              id="team-filter"
              value={selectedTeam}
              onChange={e => setSelectedTeam(e.target.value)}
              style={{ padding: "2px 6px", borderRadius: 5, border: "1px solid #444", background: "#181a1b", color: "#fff", fontWeight: 500, minWidth: 60, fontSize: 12 }}
            >
              {teams.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>
        </div>
        {/* Center column: Navigation tools */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minWidth: 0 }}>
          <div style={{ minWidth: 420, display: "flex", alignItems: "center", justifyContent: "center", gap: 32, padding: "0 24px" }}>
            <button
              style={{
                padding: "6px 24px",
                background: "#181a1b",
                color: "#fff",
                border: "1px solid #444",
                borderRadius: 6,
                fontWeight: 500,
                cursor: "pointer"
              }}
              onClick={() => setWeekOffset(weekOffset - 1)}
            >
              &#8592; Previous
            </button>
            <span style={{ color: "#fff", fontWeight: 500, fontSize: 18, minWidth: 220, textAlign: "center" }}>
              {weekDates[0].toLocaleDateString()} - {weekDates[6].toLocaleDateString()}
            </span>
            <button
              style={{
                padding: "6px 24px",
                background: "#181a1b",
                color: "#fff",
                border: "1px solid #444",
                borderRadius: 6,
                fontWeight: 500,
                cursor: "pointer"
              }}
              onClick={() => setWeekOffset(weekOffset + 1)}
            >
              Next &#8594;
            </button>
          </div>
        </div>
        {/* Right column: Timezone selector */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", minWidth: 0 }}>
          <div>
            <label htmlFor="timezone-select" style={{ fontWeight: 500, marginRight: 8, fontSize: 13 }}>Timezone:</label>
            <select
              id="timezone-select"
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #444", background: "#181a1b", color: "#fff", fontWeight: 500 }}
            >
              {TIMEZONES.map(tz => (
                <option key={tz.name} value={tz.name}>{tz.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div style={{ overflowX: "auto", margin: "0 auto", maxWidth: "100%", overflowY: "visible" }}>
        <div style={{ position: "relative", width: "100%", overflow: "visible" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 900, userSelect: "none" }}>
            <thead>
              <tr>
                {weekDates.map((date, i) => {
                  // Check if this column is today (local time)
                  const now = new Date();
                  const isToday =
                    date.getFullYear() === now.getFullYear() &&
                    date.getMonth() === now.getMonth() &&
                    date.getDate() === now.getDate();
                  return (
                    <th key={i} style={{ background: "#181a1b", color: "#fff", padding: "8px 4px", border: "1px solid #444", width: "12.5%", minWidth: 120, position: "relative" }}>
                      {WEEKDAYS[i]}
                      {isToday && (
                        <span
                          title="Today"
                          style={{
                            marginLeft: 6,
                            fontSize: 18,
                            verticalAlign: "middle",
                            color: "gold",
                            filter: "drop-shadow(0 0 2px #bfa700)"
                          }}
                        >
                          ★
                        </span>
                      )}
                      <br />
                      <span style={{ fontSize: 13, color: "#aaa" }}>{date.toLocaleDateString()}</span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(hour => (
                <tr key={hour}>
                  {weekDates.map((date, i) => {
                    const cellId = getCellId(i, hour);
                    const isSelected = selectedCells.has(cellId);
                    const count = heatmap[cellId] || 0;
                    let bgColor = "#23272a";
                    if (count > 0) {
                      const t = Math.min(count, 10) / 10;
                      const r = Math.round(187 + (255 - 187) * t);
                      const g = Math.round(187 + (255 - 187) * t);
                      const b = Math.round(187 + (255 - 187) * t);
                      bgColor = `rgb(${r},${g},${b})`;
                    }
                    if (isSelected) {
                      bgColor = "#3a7bd5";
                    }

                    const cellEvents = weeklySchedules.filter(ev => {
                      const eventTime = ev.start_time || ev.timestamp;
                      if (!eventTime) return false;
                      const dt = moment.tz(eventTime, timezone);
                      return (
                        dt.year() === weekDates[i].getFullYear() &&
                        dt.month() === weekDates[i].getMonth() &&
                        dt.date() === weekDates[i].getDate() &&
                        Math.round(dt.hour()) === hour
                      );
                    });

                    let eventBgColor = "";
                    if (cellEvents.length > 0) {
                      if (cellEvents.some(ev => ev.type === "RoninFleet")) {
                        eventBgColor = "linear-gradient(90deg, gold 0%, #43b581 100%)";
                      } else if (cellEvents.some(ev => ev.type === "Ronin")) {
                        eventBgColor = "gold";
                      } else if (cellEvents.some(ev => ev.type === "Fleet")) {
                        eventBgColor = "#43b581";
                      } else if (cellEvents.some(ev => ev.type === "Event")) {
                        eventBgColor = "red";
                      }
                    }

                    const finalBgColor = eventBgColor || bgColor;

                    // Tooltip logic
                    const [showTooltip, setShowTooltip] = useState(false);
                    const tooltipTimeoutRef = React.useRef<any>(null);

                    // Only show tooltip if there is at least one event
                    const tooltipContent = cellEvents.length > 0 ? (
                      <div style={{
                        background: "#23272a",
                        color: "#fff",
                        border: "1px solid #444",
                        borderRadius: 8,
                        padding: "10px 16px",
                        boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
                        fontSize: 14,
                        maxWidth: 320,
                        zIndex: 9999,
                        position: "absolute",
                        left: 0,
                        top: 28,
                        pointerEvents: "none"
                      }}>
                        {cellEvents.map((ev, idx) => (
                          <div key={idx} style={{ marginBottom: idx < cellEvents.length - 1 ? 12 : 0 }}>
                            <div><b>Type:</b> {ev.type === "RoninFleet" ? "Fleet & Ronin" : ev.type}</div>
                            <div><b>Title:</b> {ev.title}</div>
                            <div><b>Description:</b> {ev.description}</div>
                          </div>
                        ))}
                      </div>
                    ) : null;

                    // Custom cell component to handle tooltip state
                    const CellWithTooltip: React.FC = () => {
                      const [showTooltip, setShowTooltip] = useState(false);
                      const tooltipTimeoutRef = React.useRef<any>(null);
                      return (
                        <td
                          key={i}
                          style={{
                            border: "1px solid #444",
                            height: 22,
                            background: finalBgColor,
                            cursor: "pointer",
                            padding: 0,
                            width: "12.5%",
                            minWidth: 120,
                            transition: "background 0.1s",
                            userSelect: "none",
                            position: "relative"
                          }}
                          onMouseDown={e => { e.preventDefault(); handleMouseDown(i, hour); }}
                          onMouseEnter={e => {
                            handleMouseEnter(i, hour);
                            if (cellEvents.length > 0) {
                              tooltipTimeoutRef.current = setTimeout(() => setShowTooltip(true), 250);
                            }
                          }}
                          onMouseLeave={() => {
                            if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
                            setShowTooltip(false);
                          }}
                          onMouseUp={handleMouseUp}
                        >
                          {/* Show hour time in each block */}
                          <span
                            style={{
                              position: "absolute",
                              left: "50%",
                              top: "6px",
                              transform: "translateX(-50%)",
                              fontSize: 11,
                              color: isSelected || eventBgColor ? "#fff" : "#888",
                              fontWeight: 500,
                              pointerEvents: "none"
                            }}
                          >
                            {hour}:00
                          </span>
                          {/* Show count if at least 1 availability */}
                          {count > 0 && (
                            <span
                              style={{
                                position: "absolute",
                                right: "10px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                fontSize: 13,
                                fontWeight: 600,
                                color: isSelected || eventBgColor ? "#fff" : "#222",
                                textShadow: isSelected || eventBgColor ? "0 0 2px #3a7bd5" : "0 0 2px #fff",
                                pointerEvents: "none",
                                textAlign: "right"
                              }}
                            >
                              {count}
                            </span>
                          )}
                          {/* Tooltip */}
                          {showTooltip && tooltipContent}
                        </td>
                      );
                    };

                    return <CellWithTooltip />;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {/* Spacer to reserve space for Save/Create Event buttons */}
          <div style={{ height: 40 }} />
          {/* Save and Create Event buttons, always visible */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "-40px", position: "relative" }}>
            <button
              style={{
                padding: "10px 24px",
                background: "#43b581",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 16,
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                cursor: "pointer"
              }}
              onClick={() => setShowCreateEvent(true)}
            >
              + Create Event
            </button>
            <button
              style={{
                padding: "10px 24px",
                background: "#3a7bd5",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 16,
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                cursor: "pointer"
              }}
              onClick={handleSave}
            >
              Save
            </button>
          </div>

          {/* CreateEventModal integration */}
          {showCreateEvent && (
            <CreateEventModal
              open={showCreateEvent}
              onClose={() => setShowCreateEvent(false)}
              onCreate={() => setShowCreateEvent(false)}
              defaultDate={weekDates[0]}
              defaultHour={12}
              currentUserId={dbUser?.id}
              currentUsername={dbUser?.username}
              userRoleIds={dbUser?.roles || []}
              dbUser={dbUser}
              RONIN_IDS={RONIN_IDS}
              timezone={timezone}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
