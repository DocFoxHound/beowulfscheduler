import React, { useState, useEffect, useRef } from 'react';
import DayCell from './DayCell';
import { type Availability } from '../types/schedule';

export interface CalendarProps {
  initialDate?: Date;
  availability: Availability;
  onToggleHour: (date: Date, hour: number, options?: { forceAdd?: boolean, removeOwn?: boolean, availabilityId?: string }) => void;
  onWeekChange: (startOfWeek: Date, endOfWeek: Date) => void;
  currentUserId: number;
  currentUsername: string;
  userRoleIds: string[]; // Fix type here
}

const weekDayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Calendar: React.FC<CalendarProps> = ({ initialDate, availability, onToggleHour, onWeekChange, currentUserId, currentUsername, userRoleIds }) => {
  const [currentDate, setCurrentDate] = useState(() =>
    initialDate ? new Date(initialDate) : new Date()
  );
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Initial load: set currentDate if initialDate changes
  useEffect(() => {
    if (initialDate) {
      setCurrentDate(new Date(initialDate));
    }
  }, [initialDate]);

  // Whenever currentDate changes, update weekDates and notify parent
  useEffect(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const dates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
    setWeekDates(dates);

    // onWeekChange(startOfWeek, endOfWeek);
    // Only depend on currentDate (not onWeekChange) to avoid infinite loop
    // If you get a React warning, wrap handleWeekChange in useCallback in the parent
  }, [currentDate]);

  const goPrevWeek = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() - 7); // Move back one week
      return newDate;
    });
  };

  const goNextWeek = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + 7); // Move forward one week
      return newDate;
    });
  };

  const getSelectedHours = (date: Date) => {
    return availability.filter(entry => {
      const entryDate = new Date(entry.timestamp); // UTC from DB
      return (
        entryDate.getFullYear() === date.getFullYear() &&
        entryDate.getMonth() === date.getMonth() &&
        entryDate.getDate() === date.getDate() &&
        entry.action !== "delete"
      );
    });
  };

  return (
    <div className="calendar" ref={calendarRef}>
      <div className="calendar-header">
        <button onClick={goPrevWeek}>&lt;</button>
        <h2>
          Week of {weekDates[0]?.toLocaleDateString()} - {weekDates[6]?.toLocaleDateString()}
        </h2>
        <button onClick={goNextWeek}>&gt;</button>
      </div>
      <div className="calendar-weekdays">
        {weekDayLabels.map((label) => (
          <div key={label} className="weekday-label">{label}</div>
        ))}
      </div>
      <div className="calendar-grid">
        {weekDates.map((date, idx) => (
          <DayCell
            key={idx}
            date={date}
            selectedHours={getSelectedHours(date)}
            onToggleHour={onToggleHour}
            currentUserId={currentUserId}
            currentUsername={currentUsername}
            userRoleIds={userRoleIds}
            calendarRef={calendarRef}
          />
        ))}
      </div>
    </div>
  );
};

export default Calendar;