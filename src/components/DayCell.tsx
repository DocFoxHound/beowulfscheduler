import React, { useState, RefObject } from 'react';
import { ScheduleEntry } from '../types/schedule';
import { updateSchedule } from '../api/scheduleService'; // Add this import at the top

export interface DayCellProps {
  date: Date;
  selectedHours: ScheduleEntry[];
  onToggleHour: (date: Date, hour: number, options?: { forceAdd?: boolean, removeOwn?: boolean, availabilityId?: string }) => void;
  currentUserId: string;
  currentUsername: string;
  userRoleIds?: string[]; // Pass this from Scheduler if needed
  calendarRef: React.RefObject<HTMLDivElement | null>;
  viewMode: string; 
  onScheduleUpdated?: () => void; // Add this
}

const CollapsibleList: React.FC<{ label: string, items: string[], minimizedLabel?: string }> = ({ label, items, minimizedLabel }) => {
  const [expanded, setExpanded] = useState(false);
  if (!items || items.length === 0) {
    return (
      <div>
        <strong style={{ cursor: "pointer" }} onClick={() => setExpanded(e => !e)}>{label}</strong>
        <ul><li>{minimizedLabel || "None"}</li></ul>
      </div>
    );
  }
  return (
    <div>
      <strong
        style={{ cursor: "pointer", userSelect: "none" }}
        onClick={() => setExpanded(e => !e)}
        title={expanded ? "Click to collapse" : "Click to expand"}
      >
        {label}
        {expanded ? " ▲" : " ▼"}
      </strong>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {expanded
          ? items.map((name, idx) => <li key={idx}>{name}</li>)
          : <li>{items[0]}{items.length > 1 ? ` (+${items.length - 1} more)` : ""}</li>
        }
      </ul>
    </div>
  );
};

// Helper: map type to color (should match your CSS)
const typeToColor = (type: string) => {
  switch (type) {
    case "Dogfighting": return "#00b9e7b8";
    case "Piracy":      return "#8d00adc3";
    case "FPS":         return "#d10000b6";
    case "Fleet":       return "#0b9735";
    case "Poll":       return "#c65900";
    default:            return "#2a2a3c";
  }
};

const CREW_IDS = (import.meta.env.VITE_CREW_ID || "").split(",");
const MARAUDER_IDS = (import.meta.env.VITE_MARAUDER_ID || "").split(",");
const BLOODED_IDS = (import.meta.env.VITE_BLOODED_ID || "").split(",");
const EVENT_CREATOR_IDS = [...CREW_IDS, ...MARAUDER_IDS, ...BLOODED_IDS];

function canCreateEvent(userRoleIds: string[]) {
  return userRoleIds.some(roleId => EVENT_CREATOR_IDS.includes(roleId));
}

const DayCell: React.FC<DayCellProps> = ({
  date,
  selectedHours,
  onToggleHour,
  currentUserId,
  currentUsername,
  userRoleIds = [],
  calendarRef,
  viewMode,
  onScheduleUpdated,
}) => {
  const dayNumber = date.getDate();
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [popoverDirection, setPopoverDirection] = useState<'down' | 'up'>('down');
  const [hoveredPopoverEntry, setHoveredPopoverEntry] = useState<number | null>(null);
  const [localRsvp, setLocalRsvp] = useState<{ [eventId: number]: string | undefined }>({});

  // Helper to get the user's RSVP name for this event
  const getUserRsvp = (entry: ScheduleEntry, userId: string) => {
    if (!Array.isArray(entry.event_members)) return undefined;
    const userIdStr = String(userId);
    for (const m of entry.event_members) {
      try {
        const obj = typeof m === "string" ? JSON.parse(m) : m;
        if (obj.user_id === userIdStr) return obj.name;
      } catch {}
    }
    return undefined;
  };

  const handleRsvp = async (entry: ScheduleEntry, rsvpName: string, currentUserId: string) => {
    // Parse event_members as array of { user_id: string, name: string }
    let members: { name: string; user_id: string }[] = [];
    if (Array.isArray(entry.event_members)) {
      members = entry.event_members.map(m => {
        try {
          return typeof m === "string" ? JSON.parse(m) : m;
        } catch {
          return null;
        }
      }).filter(Boolean);
    }
    const userIdStr = String(currentUserId);
    const existingIdx = members.findIndex(m => m.user_id === userIdStr);
    const currentMember = existingIdx !== -1 ? members[existingIdx] : undefined;

    // Check if user is already RSVP'd for this option
    const alreadySelected = currentMember && currentMember.name === rsvpName;

    let updatedMembers = [...members];
    let updatedAttendees: string[] = entry.attendees ? entry.attendees.map(String) : [];

    if (alreadySelected) {
      // Remove user from event_members and attendees
      updatedMembers = updatedMembers.filter(m => m.user_id !== userIdStr);
      updatedAttendees = updatedAttendees.filter(id => String(id) !== userIdStr);
      setLocalRsvp(prev => ({ ...prev, [entry.id]: undefined }));
    } else {
      // Update or add RSVP
      if (currentMember) {
        updatedMembers[existingIdx] = { ...currentMember, name: rsvpName };
      } else {
        updatedMembers.push({ user_id: userIdStr, name: rsvpName });
      }
      // Ensure user is in attendees
      if (!updatedAttendees.map(String).includes(userIdStr)) {
        updatedAttendees.push(userIdStr);
      }
      setLocalRsvp(prev => ({ ...prev, [entry.id]: rsvpName }));
    }

    try {
      await updateSchedule(entry.id, {
        event_members: updatedMembers.map(m => JSON.stringify(m)),
        attendees: updatedAttendees
      }, true);
      if (onScheduleUpdated) onScheduleUpdated(); // <-- Refresh after update
    } catch (error) {
      console.error("Failed to update RSVP", error);
    }
  };

  return (
    <div className="day-cell">
      <div className="day-number">{dayNumber}</div>
      <div className="hours-grid">
        {Array.from({ length: 24 }, (_, hour) => {
          const cellDate = new Date(date);
          cellDate.setHours(hour, 0, 0, 0);

          const dayOfWeek = cellDate.getDay();
          const popoverPosition =
            dayOfWeek === 5 || dayOfWeek === 6
              ? { right: "100%", left: "auto", marginRight: 0 }
              : { left: "100%", right: "auto", marginLeft: 0 };

          const selectedEntry = selectedHours.find(h => {
            const entryDate = new Date(h.timestamp);
            return (
              entryDate.getFullYear() === cellDate.getFullYear() &&
              entryDate.getMonth() === cellDate.getMonth() &&
              entryDate.getDate() === cellDate.getDate() &&
              entryDate.getHours() === cellDate.getHours()
            );
          });

          const hourEventsCount = selectedHours.filter(h => {
            const entryDate = new Date(h.timestamp);
            return (
              entryDate.getFullYear() === cellDate.getFullYear() &&
              entryDate.getMonth() === cellDate.getMonth() &&
              entryDate.getDate() === cellDate.getDate() &&
              entryDate.getHours() === cellDate.getHours()
            );
          }).length;

          const userHasAvailabilityThisHour = selectedHours.some(h => {
            const entryDate = new Date(h.timestamp);
            return (
              entryDate.getFullYear() === cellDate.getFullYear() &&
              entryDate.getMonth() === cellDate.getMonth() &&
              entryDate.getDate() === cellDate.getDate() &&
              entryDate.getHours() === cellDate.getHours() &&
              h.author_id === currentUserId
            );
          });

          const isSelected = !!selectedEntry;
          const type = selectedEntry?.type || '';
          const author = selectedEntry?.author_username || '';
          const attendees = selectedEntry?.attendees_usernames || [];
          const allowedRanksNames = selectedEntry?.allowed_ranks_names || [];
          const allowedRanks = selectedEntry?.allowed_ranks || [];
          const isAuthor = selectedEntry?.author_id === currentUserId;

          // Determine if user can join this availability
          const canJoin = !isSelected || allowedRanks.length === 0 || userRoleIds.some((roleId: any) => allowedRanks.includes(roleId));

          // Find all availabilities for this hour
          const hourEntries = selectedHours.filter(h => {
            const entryDate = new Date(h.timestamp);
            return (
              entryDate.getFullYear() === cellDate.getFullYear() &&
              entryDate.getMonth() === cellDate.getMonth() &&
              entryDate.getDate() === cellDate.getDate() &&
              entryDate.getHours() === cellDate.getHours()
            );
          });

          // Calculate total attendees for all availabilities in this hour
          const totalAttendees = hourEntries.reduce(
            (sum, entry) => sum + (entry.attendees_usernames?.length || 0),
            0
          );

          // New isAttendee: true if user is in any attendee list for this hour
          const isAttendee = hourEntries.some(entry => entry.attendees?.includes(currentUserId));

          // Get unique types for this hour
          const hourTypes = Array.from(new Set(hourEntries.map(e => e.type)));

          // Build gradient if more than one type
          let hourCellBackground: string | undefined = undefined;
          if (hourTypes.length > 1) {
            const colorStops = hourTypes.map((type, idx) => {
              const percent = Math.round((idx / hourTypes.length) * 100);
              const nextPercent = Math.round(((idx + 1) / hourTypes.length) * 100);
              const color = typeToColor(type || "");
              return `${color} ${percent}%, ${color} ${nextPercent}%`;
            }).join(', ');
            hourCellBackground = `linear-gradient(90deg, ${colorStops})`;
          } else if (hourTypes.length === 1) {
            hourCellBackground = typeToColor(hourTypes[0] || "");
          }

          return (
            <div
              style={{ position: "relative" }}
              onMouseEnter={e => {
                setHoveredHour(hour);

                // --- Calculate popover direction based on calendar boundaries ---
                const rect = e.currentTarget.getBoundingClientRect();
                const popoverHeight = 56 + 40 * hourEventsCount; // Estimate or measure your popover height

                let spaceBelow = 0;
                let spaceAbove = 0;
                if (calendarRef?.current) {
                  const calendarRect = calendarRef.current.getBoundingClientRect();
                  spaceBelow = calendarRect.bottom - rect.bottom;
                  spaceAbove = rect.top - calendarRect.top;
                } else {
                  // fallback to window
                  spaceBelow = window.innerHeight - rect.bottom;
                  spaceAbove = rect.top;
                }
                setPopoverDirection(spaceBelow < popoverHeight && spaceAbove > popoverHeight ? 'up' : 'down');
              }}
              onMouseLeave={() => setHoveredHour(null)}
            >
              <div
                key={hour}
                className={`hour-cell${isSelected ? ` selected ${type.toLowerCase()}` : ''}${isAttendee ? ' attendee' : ''}${!canJoin && isSelected ? ' locked' : ''}${isAuthor ? ' author-ring' : ''}${viewMode === "events" && isAttendee ? ' gold-attendee' : ''}${viewMode === "events" && hourEventsCount > 0 ? ' has-event' : ''}`}
                onClick={() => {
                  // Only allow click if user can create event (for events) or can join (for availabilities)
                  if (
                    (viewMode === "events" && canCreateEvent(userRoleIds)) ||
                    (viewMode !== "events" && canJoin)
                  ) {
                    if (canJoin && hourEventsCount <= 1) {
                      onToggleHour(date, hour);
                    }
                  }
                }}
                style={{
                  ...{
                    position: "relative",
                    opacity: !canJoin && isSelected ? 0.5 : 1,
                    cursor:
                      !canJoin && isSelected
                        ? "not-allowed"
                        : hourEventsCount > 1
                          ? "not-allowed"
                          : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2,
                    padding: 0,
                    ...(viewMode === "events" && isAttendee
                      ? { boxShadow: "0 0 0 2px gold, 0 0 8px gold", borderRadius: 6 }
                      : {}),
                  },
                  ...(hourCellBackground ? { background: hourCellBackground } : {}),
                }}
              >
                {/* Add icon space */}
                {isSelected ? (
                  hourEventsCount > 1 && userHasAvailabilityThisHour ? (
                    // Show minus button only if more than one event and user owns one
                    <span style={{ display: "flex", alignItems: "stretch", height: "100%" }}>
                      <button
                        type="button"
                        className="remove-availability-btn"
                        style={{
                          width: 36,
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "none",
                          background: "transparent",
                          cursor: canJoin ? "pointer" : "default",
                          padding: 0,
                          margin: 0,
                          outline: "none",
                          position: "relative",
                        }}
                        onClick={e => {
                          e.stopPropagation();
                          if (canJoin) onToggleHour(date, hour, { removeOwn: true });
                        }}
                        disabled={!canJoin}
                        tabIndex={-1}
                      >
                        <span style={{ color: "#fff", fontWeight: "bold" }} title="Remove your availability">━</span>
                        {/* Vertical divider */}
                        <span
                          className="hour-cell-divider"
                          style={{
                            position: "absolute",
                            right: 0,
                            top: "15%",
                            bottom: "15%",
                            width: 1,
                            background: "#444",
                            height: "70%",
                            zIndex: 1,
                          }}
                        />
                      </button>
                    </span>
                  ) : (
                    // Show add button only if user does NOT have an availability in this hour
                    !userHasAvailabilityThisHour ? (
                      <span style={{ display: "flex", alignItems: "stretch", height: "100%" }}>
                        <button
                          type="button"
                          className="add-availability-btn"
                          style={{
                            width: 36,
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "none",
                            background: "transparent",
                            cursor: canJoin ? "pointer" : "default",
                            padding: 0,
                            margin: 0,
                            outline: "none",
                            position: "relative",
                          }}
                          onClick={e => {
                            e.stopPropagation();
                            // For events, require special roles
                            if (
                              (viewMode === "events" && canCreateEvent(userRoleIds)) ||
                              (viewMode !== "events" && canJoin)
                            ) {
                              onToggleHour(date, hour, { forceAdd: true });
                            }
                          }}
                          disabled={
                            (viewMode === "events" && !canCreateEvent(userRoleIds)) ||
                            (viewMode !== "events" && !canJoin)
                          }
                          tabIndex={-1}
                        >
                          <span
                            style={{ color: "#fff", fontWeight: "bold" }}
                            title={
                              viewMode === "events"
                                ? canCreateEvent(userRoleIds)
                                  ? "Create event"
                                  : "You do not have permission to create events"
                                : canJoin
                                  ? "Join this availability"
                                  : "You do not have permission"
                            }
                          >🞥</span>
                          {/* Vertical divider */}
                          <span
                            className="hour-cell-divider"
                            style={{
                              position: "absolute",
                              right: 0,
                              top: "15%",
                              bottom: "15%",
                              width: 1,
                              background: "#444",
                              height: "70%",
                              zIndex: 1,
                            }}
                          />
                        </button>
                      </span>
                    ) : (
                      // Always render placeholder if no button is shown
                      <span style={{ width: 36, display: "inline-block" }} />
                    )
                  )
                ) : (
                  // Empty space to preserve layout
                  <span style={{ width: 36, display: "inline-block" }} />
                )}
                {/* Attendees icon space */}
                <span style={{ width: 0, display: "inline-block", textAlign: "center" }}>
                  {viewMode === "events" && hourEntries.some(e => (e.attendees?.length ?? 0) > 0) && (
                    <span className="attendees-icon" style={{ fontSize: 14, color: "#fff" }}>
                      𐙞
                    </span>
                  )}
                </span>
                {/* Centered hour number */}
                <span style={{ flex: 1, textAlign: "center" }}>
                  {hour}
                  {isAttendee && <span className="attendee-dot" title="You are an attendee">•</span>}
                </span>
                {/* Event count indicator */}
                <span style={{ width: 28, display: "inline-block", textAlign: "left", marginLeft: 4, color: "#fff" }}>
                  {hourEventsCount > 1 ? `x${hourEventsCount}` : ""}
                </span>
                {/* Locked icon space */}
                <span style={{ width: 18, display: "inline-block", textAlign: "center" }}>
                  {!canJoin && isSelected ? (
                    <span className="lock-icon" style={{ fontSize: 16, pointerEvents: "none", color: "#fff" }}>🔒</span>
                  ) : null}
                </span>
              </div>
              {hourEventsCount > 1 && hoveredHour === hour ? (
                <div
                  className="hour-multi-popover"
                  style={{
                    position: "absolute",
                    zIndex: 1000,
                    background: "#222",
                    border: "1px solid #444",
                    borderRadius: 4,
                    minWidth: 240,
                    padding: 8,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                    pointerEvents: "auto",
                    ...popoverPosition,
                    top: popoverDirection === 'down' ? 0 : undefined,
                    bottom: popoverDirection === 'up' ? 0 : undefined,
                  }}
                  onMouseEnter={() => setHoveredHour(hour)}
                  onMouseLeave={() => setHoveredHour(null)}
                >
                  {selectedHours
                    .filter(h => {
                      const entryDate = new Date(h.timestamp);
                      return (
                        entryDate.getFullYear() === cellDate.getFullYear() &&
                        entryDate.getMonth() === cellDate.getMonth() &&
                        entryDate.getDate() === cellDate.getDate() &&
                        entryDate.getHours() === cellDate.getHours()
                      );
                    })
                    .map((entry, idx) => {
                      const isAuthor = entry.author_id === currentUserId;
                      const isAttendee = entry.attendees?.includes(currentUserId);
                      const canJoin = entry.allowed_ranks?.length === 0 || userRoleIds.some((roleId: any) => entry.allowed_ranks?.includes(roleId));
                      return (
                        <div
                          key={entry.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 4,
                            background: isAuthor ? "#333" : isAttendee ? "#2a3a5a" : "#222",
                            borderRadius: 4,
                            padding: "4px 8px",
                            border: isAuthor ? "1px solid #4a92ff" : isAttendee ? "1px solid #4a92ff55" : "1px solid #444",
                            color: "#fff",
                            cursor: canJoin ? "pointer" : "not-allowed",
                            opacity: canJoin ? 1 : 0.6,
                            position: "relative",
                          }}
                          title={
                            isAuthor
                              ? "You created this availability"
                              : isAttendee
                              ? "Click to leave this availability"
                              : canJoin
                              ? "Click to join this availability"
                              : "You do not have permission to join"
                          }
                          onClick={e => {
                            e.stopPropagation();
                            if (canJoin && !isAuthor) {
                              onToggleHour(date, hour, { availabilityId: entry.id.toString() });
                              setHoveredHour(null); // Close the popover after action
                              setHoveredPopoverEntry(null);
                            }
                          }}
                          onMouseEnter={() => setHoveredPopoverEntry(idx)}
                          onMouseLeave={e => {
                            // Persist tooltip if mouse moves to tooltip
                            setTimeout(() => {
                              if (
                                !e.relatedTarget ||
                                !(e.currentTarget.parentNode as HTMLElement).contains(e.relatedTarget as Node)
                              ) {
                                setHoveredPopoverEntry(null);
                              }
                            }, 10);
                          }}
                        >
                          {/* Type and author */}
                          <span style={{ minWidth: 60, fontWeight: "bold", marginRight: 12 }}>{entry.type}</span>
                          <span style={{ fontSize: 12, opacity: 0.8 }}>by {entry.author_username}</span>
                          {/* Attendees */}
                          <span style={{ marginLeft: 8, fontSize: 14 }}>
                            {(entry.attendees_usernames ?? []).length > 0 && (
                              <span title="Attendees">𐙞 {(entry.attendees_usernames ?? []).length}</span>
                            )}
                            {isAttendee && <span className="attendee-dot" title="You are an attendee" style={{ marginLeft: 2 }}>•</span>}
                          </span>
                          {/* Tooltip */}
                          {hoveredPopoverEntry === idx && (
                            <div
                              className="hour-tooltip"
                              style={{
                                position: "absolute",
                                zIndex: 2000,
                                background: "#222",
                                border: "1px solid #444",
                                borderRadius: 4,
                                minWidth: 200,
                                padding: 8,
                                boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                                pointerEvents: "auto",
                                ...popoverPosition,
                                top: popoverDirection === 'down' ? 0 : undefined,
                                bottom: popoverDirection === 'up' ? 0 : undefined,
                                left: popoverPosition.left,
                                right: popoverPosition.right,
                                marginLeft: popoverPosition.marginLeft,
                                marginRight: popoverPosition.marginRight,
                              }}
                              onMouseEnter={() => setHoveredPopoverEntry(idx)}
                              onMouseLeave={e => {
                                setTimeout(() => {
                                  if (
                                    !e.relatedTarget ||
                                    !(e.currentTarget.parentNode as HTMLElement).contains(e.relatedTarget as Node)
                                  ) {
                                    setHoveredPopoverEntry(null);
                                  }
                                }, 10);
                              }}
                              onClick={e => e.stopPropagation()} // <-- Add this line
                            >
                              <div><strong>Type:</strong> {entry.type}</div>
                              <div><strong>Author:</strong> {entry.author_username}</div>
                              <div>
                                <strong>Attendees:</strong>
                                <ul>
                                  {entry.attendees_usernames.length > 0
                                    ? entry.attendees_usernames.map((name, i) => <li key={i}>{name}</li>)
                                    : <li>None</li>}
                                </ul>
                              </div>
                              <div>
                                <strong>Allowed Ranks:</strong>
                                <CollapsibleList label="Allowed Ranks" items={entry.allowed_ranks_names ?? []} minimizedLabel="All" />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ) : (
                isSelected && hoveredHour === hour && (
                  <div
                    className="hour-tooltip"
                    style={{
                      position: "absolute",
                      zIndex: 1000,
                      background: "#222",
                      border: "1px solid #444",
                      borderRadius: 4,
                      minWidth: 200,
                      padding: 8,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                      pointerEvents: "auto",
                      ...popoverPosition,
                      top: popoverDirection === 'down' ? 0 : undefined,
                      bottom: popoverDirection === 'up' ? 0 : undefined,
                    }}
                    onMouseEnter={() => setHoveredHour(hour)}
                    onMouseLeave={() => setHoveredHour(null)}
                  >
                    {viewMode === "events" ? (
                      <>
                        <div><strong>Title:</strong> {selectedEntry?.title || "No title"}</div>
                        <div><strong>Description:</strong> {selectedEntry?.description || "No description"}</div>
                        {selectedEntry?.appearance?.image && (
                          <div style={{ margin: "8px 0" }}>
                            <img src={selectedEntry.appearance.image} alt="Event" style={{ maxWidth: 180, borderRadius: 4 }} />
                          </div>
                        )}
                        {/* RSVP Buttons */}
                        {(() => {
                          let rsvpOptions = selectedEntry?.rsvp_options;
                          if (typeof rsvpOptions === "string") {
                            try {
                              rsvpOptions = JSON.parse(rsvpOptions);
                            } catch {
                              rsvpOptions = [];
                            }
                          }
                          if (Array.isArray(rsvpOptions) && rsvpOptions.length > 0) {
                            const userRsvp = localRsvp[selectedEntry.id] !== undefined
                              ? localRsvp[selectedEntry.id]
                              : getUserRsvp(selectedEntry, currentUserId);
                            return (
                              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                                {rsvpOptions.map((opt, idx) => {
                                  const isSelected = userRsvp === opt.name;
                                  return (
                                    <button
                                      key={idx}
                                      style={{
                                        padding: "4px 10px",
                                        borderRadius: 4,
                                        border: isSelected ? "2px solid gold" : "1px solid #444",
                                        background: "#333",
                                        color: "#fff",
                                        fontSize: 16,
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        boxShadow: isSelected ? "0 0 8px gold" : undefined,
                                        outline: isSelected ? "2px solid gold" : undefined,
                                      }}
                                      onClick={() => handleRsvp(selectedEntry, opt.name, currentUserId)}
                                    >
                                      <span>{opt.emoji}</span>
                                      <span style={{ fontSize: 13 }}>{opt.name}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </>
                    ) : (
                      <>
                        <div><strong>Type:</strong> {type}</div>
                        <div><strong>Author:</strong> {author}</div>
                        <div>
                          <strong>Attendees:</strong>
                          <ul>
                            {attendees.length > 0 ? attendees.map((name, idx) => (
                              <li key={idx}>{name}</li>
                            )) : <li>None</li>}
                          </ul>
                        </div>
                        <div>
                          <strong>Allowed Ranks:</strong>
                          <CollapsibleList label="Allowed Ranks" items={allowedRanksNames} minimizedLabel="All" />
                        </div>
                      </>
                    )}
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DayCell;
