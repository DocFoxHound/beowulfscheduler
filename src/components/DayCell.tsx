import React, { useState } from 'react';

export interface DayCellProps {
  date: Date;
  selectedHours: { timestamp: string; type: string; author_username?: string; attendees_usernames?: string[], attendees?: number[], author_id?: number }[];
  onToggleHour: (date: Date, hour: number) => void;
  currentUserId: number;
  currentUsername: string;
}

const DayCell: React.FC<DayCellProps> = ({ date, selectedHours, onToggleHour, currentUserId, currentUsername }) => {
  const dayNumber = date.getDate();
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  return (
    <div className="day-cell">
      <div className="day-number">{dayNumber}</div>
      <div className="hours-grid">
        {Array.from({ length: 24 }, (_, hour) => {
          // Local time for this cell
          const cellDate = new Date(date);
          cellDate.setHours(hour, 0, 0, 0);

          // Find if this hour is selected by comparing local time
          const selectedEntry = selectedHours.find(h => {
            const entryDate = new Date(h.timestamp); // UTC from DB
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

          return (
            <div
              key={hour}
              className={`hour-cell${isSelected ? ` selected ${type.toLowerCase()}` : ''}${isAttendee ? ' attendee' : ''}`}
              onClick={() => onToggleHour(date, hour)}
              onMouseEnter={() => setHoveredHour(hour)}
              onMouseLeave={() => setHoveredHour(null)}
              style={{ position: "relative" }}
            >
              {hour}
              {isAttendee && <span className="attendee-dot" title="You are an attendee">•</span>}
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
