import React from 'react';

export interface DayCellProps {
  date: Date;
  selectedHours: { timestamp: string; type: string }[];
  onToggleHour: (date: Date, hour: number) => void;
}

const DayCell: React.FC<DayCellProps> = ({ date, selectedHours, onToggleHour }) => {
  const dayNumber = date.getDate();

  return (
    <div className="day-cell">
      <div className="day-number">{dayNumber}</div>
      <div className="hours-grid">
        {Array.from({ length: 24 }, (_, hour) => {
          // Generate the timestamp for this cell (in UTC)
          const cellDate = new Date(date);
          cellDate.setHours(hour, 0, 0, 0);
          const cellTimestamp = cellDate.toISOString();

          // Find if this hour is selected
          const selectedEntry = selectedHours.find(h => h.timestamp === cellTimestamp);
          const isSelected = !!selectedEntry;
          const type = selectedEntry?.type || '';

          return (
            <div
              key={hour}
              className={`hour-cell${isSelected ? ` selected ${type.toLowerCase()}` : ''}`}
              onClick={() => onToggleHour(date, hour)}
            >
              {hour}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DayCell;
