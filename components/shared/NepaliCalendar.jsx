"use client";
import { useState, useEffect } from "react";

// Nepali months in English
const BS_MONTHS_EN = [
  "Baisakh",
  "Jestha",
  "Ashadh",
  "Shrawan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
];

// Get current Nepali date dynamically
const getCurrentNepaliDate = () => {
  const now = new Date();
  // This is a simplified conversion - in production, use a proper Nepali date library
  // For now, we'll use a reference point
  const refAD = new Date(2026, 3, 14); // April 14, 2026 (Baisakh 1, 2083)
  const refBS = { year: 2083, month: 1, day: 1 };

  const diffDays = Math.floor((now - refAD) / (1000 * 60 * 60 * 24));

  let year = refBS.year;
  let month = refBS.month;
  let day = refBS.day + diffDays;

  const daysInMonth = (y, m) => {
    const daysMap = {
      1: 31,
      2: 31,
      3: 32,
      4: 31,
      5: 31,
      6: 31,
      7: 30,
      8: 29,
      9: 30,
      10: 29,
      11: 30,
      12: 30,
    };
    return daysMap[m] || 30;
  };

  while (day > daysInMonth(year, month)) {
    day -= daysInMonth(year, month);
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  while (day < 1) {
    month--;
    if (month < 1) {
      month = 12;
      year--;
    }
    day += daysInMonth(year, month);
  }

  return { year, month, day };
};

// Days in each month for any BS year (dynamic)
const getDaysInMonth = (year, month) => {
  // Nepali months have varying days
  const daysMap = {
    1: 31,
    2: 31,
    3: 32,
    4: 31,
    5: 31,
    6: 31,
    7: 30,
    8: 29,
    9: 30,
    10: 29,
    11: 30,
    12: 30,
  };
  return daysMap[month] || 30;
};

// Get first day of month (0 = Sunday, 6 = Saturday)
const getFirstDayOfMonth = (year, month) => {
  // Reference: Baisakh 1, 2083 was Tuesday (2)
  const refYear = 2083;
  const refMonth = 1;
  const refDayOfWeek = 2; // Tuesday

  let totalDays = 0;

  // Calculate days from reference to target
  if (year > refYear) {
    for (let y = refYear; y < year; y++) {
      for (let m = 1; m <= 12; m++) {
        totalDays += getDaysInMonth(y, m);
      }
    }
    for (let m = 1; m < month; m++) {
      totalDays += getDaysInMonth(year, m);
    }
  } else if (year === refYear) {
    for (let m = refMonth; m < month; m++) {
      totalDays += getDaysInMonth(year, m);
    }
  } else {
    // For past years (if needed)
    for (let y = year; y < refYear; y++) {
      for (let m = 1; m <= 12; m++) {
        totalDays -= getDaysInMonth(y, m);
      }
    }
    for (let m = month; m < refMonth; m++) {
      totalDays -= getDaysInMonth(year, m);
    }
  }

  return (refDayOfWeek + totalDays) % 7;
};

export default function NepaliCalendar({
  year: propYear,
  month: propMonth,
  onDateSelect,
  selectedDate,
  holidays = [],
  showWeekends = true,
  minDate = null,
  maxDate = null,
}) {
  const currentDate = getCurrentNepaliDate();
  const [currentYear, setCurrentYear] = useState(propYear || currentDate.year);
  const [currentMonth, setCurrentMonth] = useState(
    propMonth || currentDate.month,
  );
  const [today, setToday] = useState(currentDate);

  const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Update today's date every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const newDate = getCurrentNepaliDate();
      setToday(newDate);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Update when props change
  useEffect(() => {
    Promise.resolve().then(() => {
      if (propYear) setCurrentYear(propYear);
      if (propMonth) setCurrentMonth(propMonth);
    });
  }, [propYear, propMonth]);

  const days = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const isHoliday = (day) => {
    return holidays.some(
      (h) =>
        h.year === currentYear && h.month === currentMonth && h.day === day,
    );
  };

  const isSaturday = (day) => {
    const dayOfWeek = (firstDay + day - 1) % 7;
    return dayOfWeek === 6;
  };

  const isSelected = (day) => {
    return (
      selectedDate &&
      selectedDate.year === currentYear &&
      selectedDate.month === currentMonth &&
      selectedDate.day === day
    );
  };

  const isToday = (day) => {
    return (
      currentYear === today.year &&
      currentMonth === today.month &&
      day === today.day
    );
  };

  const isPast = (day) => {
    if (minDate) {
      if (currentYear < minDate.year) return true;
      if (currentYear === minDate.year && currentMonth < minDate.month)
        return true;
      if (
        currentYear === minDate.year &&
        currentMonth === minDate.month &&
        day < minDate.day
      )
        return true;
    }
    return false;
  };

  const isFuture = (day) => {
    if (maxDate) {
      if (currentYear > maxDate.year) return true;
      if (currentYear === maxDate.year && currentMonth > maxDate.month)
        return true;
      if (
        currentYear === maxDate.year &&
        currentMonth === maxDate.month &&
        day > maxDate.day
      )
        return true;
    }
    return false;
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }
  for (let i = 1; i <= days; i++) {
    cells.push(i);
  }

  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    setCurrentYear(today.year);
    setCurrentMonth(today.month);
    if (onDateSelect) {
      onDateSelect(today);
    }
  };

  const handleDateClick = (day) => {
    if (onDateSelect && !isPast(day) && !isFuture(day)) {
      onDateSelect({ year: currentYear, month: currentMonth, day });
    }
  };

  return (
    <div className="w-full">
      {/* Header with Today button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ▶
          </button>
        </div>
        <span className="font-semibold text-gray-800">
          {BS_MONTHS_EN[currentMonth - 1]} {currentYear} BS
        </span>
        <button
          type="button"
          onClick={goToToday}
          className="px-3 py-1 text-xs bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
        >
          Today
        </button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 mb-2">
        {WD.map((d, i) => (
          <div
            key={d}
            className={`text-center text-xs font-semibold py-1 ${i === 6 ? "text-red-500" : "text-gray-500"}`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="w-10 h-10" />;
          }

          const hol = isHoliday(day);
          const sat = showWeekends && isSaturday(day);
          const selected = isSelected(day);
          const today_date = isToday(day);
          const past = isPast(day);
          const future = isFuture(day);
          const disabled = past || future;

          let bgColor = "";
          let textColor = "text-gray-700";

          if (hol) {
            bgColor = "bg-red-100 ring-2 ring-red-300";
            textColor = "text-red-700";
          } else if (sat) {
            bgColor = "bg-red-50";
            textColor = "text-red-500";
          } else if (selected) {
            bgColor = "bg-green-500";
            textColor = "text-white";
          } else if (today_date) {
            bgColor = "ring-2 ring-green-500 bg-green-50";
            textColor = "text-green-700 font-bold";
          } else if (disabled) {
            bgColor = "bg-gray-100";
            textColor = "text-gray-400";
          } else {
            bgColor = "hover:bg-gray-100";
          }

          return (
            <button
              type="button"
              key={`${currentYear}-${currentMonth}-${day}`}
              onClick={() => handleDateClick(day)}
              disabled={disabled}
              className={`
                w-10 h-10 mx-auto rounded-xl text-sm font-medium transition-all
                ${bgColor} ${textColor}
                ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Current Date Display */}
      <div className="mt-4 pt-3 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-500">
          Today: {today.day} {BS_MONTHS_EN[today.month - 1]} {today.year} BS
        </p>
      </div>

      {/* Legend */}
      <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-3 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-100 rounded-full ring-1 ring-red-300"></div>
          <span>Holiday</span>
        </div>
        {showWeekends && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-50 rounded-full"></div>
            <span>Saturday</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-50 rounded-full ring-1 ring-green-500"></div>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
