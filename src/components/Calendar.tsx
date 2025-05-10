import React, { useState, useEffect } from 'react';
import DayCell from './DayCell';
import { type Availability } from '../types/schedule';

export interface CalendarProps {
  initialDate?: Date;
  availability: Availability;
  onToggleHour: (date: Date, hour: number) => void;
  onWeekChange: (startOfWeek: Date, endOfWeek: Date) => void;
}

const weekDayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Calendar: React.FC<CalendarProps> = ({ initialDate, availability, onToggleHour, onWeekChange }) => {
  const [currentDate, setCurrentDate] = useState(() =>
    initialDate ? new Date(initialDate) : new Date()
  );
  const [weekDates, setWeekDates] = useState<Date[]>([]);

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

  const getSelectedHours = (date: Date): { timestamp: string; type: string }[] => {
    const isoKey = date.toISOString().split('T')[0];
    return availability.filter(
      (entry) =>
        entry.timestamp.startsWith(isoKey) &&
        entry.action !== "delete" // Ignore deleted entries for UI
    );
  };

  return (
    <div className="calendar">
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
            selectedHours={getSelectedHours(date)} // now includes type info
            onToggleHour={onToggleHour}
          />
        ))}
      </div>
    </div>
  );
};

export default Calendar;
