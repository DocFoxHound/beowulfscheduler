import React, { useState, RefObject } from 'react';

export interface DayCellProps {
  date: Date;
  selectedHours: { timestamp: string; type: string; author_username?: string; attendees_usernames?: string[], attendees?: number[], author_id?: number, allowed_ranks_names?: string[], allowed_ranks?: string[] }[];
  onToggleHour: (date: Date, hour: number, options?: { forceAdd?: boolean, removeOwn?: boolean }) => void;
  currentUserId: number;
  currentUsername: string;
  userRoleIds?: string[]; // Pass this from Scheduler if needed
  calendarRef?: RefObject<HTMLDivElement> | null; // Change to allow null
}

const DayCell: React.FC<DayCellProps> = ({ date, selectedHours, onToggleHour, currentUserId, currentUsername, userRoleIds = [], calendarRef }) => {
  const dayNumber = date.getDate();
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [popoverDirection, setPopoverDirection] = useState<'down' | 'up'>('down');

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
          const isAttendee = selectedEntry?.attendees?.includes(currentUserId);
          const allowedRanksNames = selectedEntry?.allowed_ranks_names || [];
          const allowedRanks = selectedEntry?.allowed_ranks || [];
          const isAuthor = selectedEntry?.author_id === currentUserId;

          // Determine if user can join this availability
          const canJoin = !isSelected || allowedRanks.length === 0 || userRoleIds.some((roleId: string) => allowedRanks.includes(roleId));

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
                className={`hour-cell${isSelected ? ` selected ${type.toLowerCase()}` : ''}${isAttendee ? ' attendee' : ''}${!canJoin && isSelected ? ' locked' : ''}${isAuthor ? ' author-ring' : ''}`}
                onClick={() => canJoin ? onToggleHour(date, hour) : undefined}
                style={{
                  position: "relative",
                  opacity: !canJoin && isSelected ? 0.5 : 1,
                  cursor: !canJoin && isSelected ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  padding: 0,
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
                            if (canJoin) onToggleHour(date, hour, { forceAdd: true });
                          }}
                          disabled={!canJoin}
                          tabIndex={-1}
                        >
                          <span style={{ color: "#fff", fontWeight: "bold" }} title="Join this availability">🞥</span>
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
                  {attendees.length > 0 ? (
                    <span className="attendees-icon" style={{ fontSize: 14, color: "#fff" }}>𐙞</span>
                  ) : null}
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
                      const canJoin = entry.allowed_ranks?.length === 0 || userRoleIds.some((roleId: string) => entry.allowed_ranks?.includes(roleId));
                      return (
                        <div
                          key={idx}
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
                          {/* Join/Leave as attendee */}
                          {!isAuthor && (
                            <button
                              style={{
                                background: "none",
                                border: "none",
                                color: isAttendee ? "#ff4a4a" : "#4a92ff",
                                cursor: canJoin ? "pointer" : "not-allowed",
                                fontWeight: "bold",
                                marginLeft: 8,
                              }}
                              disabled={!canJoin}
                              onClick={e => {
                                e.stopPropagation();
                                onToggleHour(date, hour, { forceAdd: !isAttendee });
                              }}
                            >
                              {isAttendee ? "Leave" : "Join"}
                            </button>
                          )}
                          {/* Remove if author */}
                          {isAuthor && (
                            <button
                              style={{
                                background: "none",
                                border: "none",
                                color: "#ff4a4a",
                                cursor: "pointer",
                                fontWeight: "bold",
                                marginLeft: 8,
                              }}
                              onClick={e => {
                                e.stopPropagation();
                                onToggleHour(date, hour, { removeOwn: true });
                              }}
                            >
                              Delete
                            </button>
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
                    {/* <div>
                      <strong>Allowed Ranks:</strong>
                      <ul>
                        {allowedRanksNames.length > 0 ? allowedRanksNames.map((name, idx) => (
                          <li key={idx}>{name}</li>
                        )) : <li>All</li>}
                      </ul>
                    </div> */}
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
