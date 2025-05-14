import React, { useState } from 'react';

export interface DayCellProps {
  date: Date;
  selectedHours: { timestamp: string; type: string; author_username?: string; attendees_usernames?: string[], attendees?: number[], author_id?: number, allowed_ranks_names?: string[], allowed_ranks?: string[] }[];
  onToggleHour: (date: Date, hour: number) => void;
  currentUserId: number;
  currentUsername: string;
  userRoleIds?: string[]; // Pass this from Scheduler if needed
}

const DayCell: React.FC<DayCellProps> = ({ date, selectedHours, onToggleHour, currentUserId, currentUsername, userRoleIds = [] }) => {
  const dayNumber = date.getDate();
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  return (
    <div className="day-cell">
      <div className="day-number">{dayNumber}</div>
      <div className="hours-grid">
        {Array.from({ length: 24 }, (_, hour) => {
          const cellDate = new Date(date);
          cellDate.setHours(hour, 0, 0, 0);

          const selectedEntry = selectedHours.find(h => {
            const entryDate = new Date(h.timestamp);
            return (
              entryDate.getFullYear() === cellDate.getFullYear() &&
              entryDate.getMonth() === cellDate.getMonth() &&
              entryDate.getDate() === cellDate.getDate() &&
              entryDate.getHours() === cellDate.getHours()
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
              key={hour}
              className={`hour-cell${isSelected ? ` selected ${type.toLowerCase()}` : ''}${isAttendee ? ' attendee' : ''}${!canJoin && isSelected ? ' locked' : ''}${isAuthor ? ' author-ring' : ''}`}
              onClick={() => canJoin ? onToggleHour(date, hour) : undefined}
              onMouseEnter={() => setHoveredHour(hour)}
              onMouseLeave={() => setHoveredHour(null)}
              style={{ position: "relative", opacity: !canJoin && isSelected ? 0.5 : 1, cursor: !canJoin && isSelected ? "not-allowed" : "pointer" }}
            >
              {/* Show people icon if there are attendees */}
              {attendees.length > 0 && (
                <span className="attendees-icon" title={`${attendees.length} attendee${attendees.length > 1 ? 's' : ''}`} style={{ marginRight: 4, fontSize: 14 }}>
                  👤
                </span>
              )}
              {hour}
              {isAttendee && <span className="attendee-dot" title="You are an attendee">•</span>}
              {!canJoin && isSelected && (
                <span className="lock-icon" title="You do not have permission" style={{ position: "absolute", right: 4, top: 2, fontSize: 16, pointerEvents: "none" }}>
                  {/* Unicode lock icon */}
                  🔒
                </span>
              )}
              {isSelected && hoveredHour === hour && (
                <div className="hour-tooltip">
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
                    <ul>
                      {allowedRanksNames.length > 0 ? allowedRanksNames.map((name, idx) => (
                        <li key={idx}>{name}</li>
                      )) : <li>All</li>}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DayCell;
