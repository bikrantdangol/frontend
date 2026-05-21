"use client";

import { useState, useEffect, useCallback } from "react";
import { useApp } from "../../../lib/context";
import { useLang } from "../../../lib/LangContext";
import { getTodayBS, BS_MONTHS_EN, fmtDate } from "../../../lib/calendar";
import NepaliCalendar from "../../../components/shared/NepaliCalendar";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const toNPT = (utcDate) => {
  if (!utcDate) return "—";
  return new Date(utcDate).toLocaleTimeString("en-US", {
    timeZone: "Asia/Kathmandu",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const STATUS_STYLES = {
  Present:   "bg-green-100 text-green-700",
  Late:      "bg-amber-100 text-amber-700",
  Absent:    "bg-red-100 text-red-700",
};

const TEXT = {
  en: {
    hello:              (name) => `Hello, ${name}`,
    pendingLeaves:      "Pending Leaves",
    leaveBalance:       "Leave Balance",
    upcomingCelebrations: "Upcoming Celebrations",
    upcomingHolidays:   "Upcoming Holidays",
    noCelebrations:     "No celebrations found",
    noHolidays:         "No upcoming holidays",
    colCelebration:     "Celebration",
    colDate:            "Date",
    colPerson:          "Person",
    colHoliday:         "Holiday",
    colRemaining:       "Remaining",
    attendanceTitle:    "Monthly Attendance Summary",
    shift:              "Shift: 7:00 AM – 2:00 PM",
    colAttDate:         "Date",
    colDay:             "Day",
    colCheckIn:         "Check In",
    colCheckOut:        "Check Out",
    colRemarks:         "Remarks",
    colTotalHours:      "Total Hours",
    colStatus:          "Status",
    loading:            "Loading...",
    noAttendance:       "No attendance records this month",
    selected:           "Selected",
    // status labels
    statusPresent:      "Present",
    statusLate:         "Late",
    statusAbsent:       "Absent",
    statusHalfDay:      "Half Day",
    statusOnLeave:      "On Leave",
    statusHoliday:      "Holiday",
    statusWeekend:      "Weekend",
    // remarks
    remarkLateEarly:    "Late in / Early out",
    remarkLate:         "Late check-in",
    remarkEarly:        "Early check-out",
    // days
    days:               ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    // remaining
    nextYear:           "Next year",
    today:              "Today",
    passed:             "Passed",
    daysLeft:           (n) => `${n} days`,
  },
  np: {
    hello:              (name) => `नमस्ते, ${name}`,
    pendingLeaves:      "बाँकी बिदाहरू",
    leaveBalance:       "बिदा ब्यालेन्स",
    upcomingCelebrations: "आगामी उत्सवहरू",
    upcomingHolidays:   "आगामी बिदाहरू",
    noCelebrations:     "कुनै उत्सव भेटिएन",
    noHolidays:         "कुनै आगामी बिदा छैन",
    colCelebration:     "उत्सव",
    colDate:            "मिति",
    colPerson:          "व्यक्ति",
    colHoliday:         "बिदा",
    colRemaining:       "बाँकी",
    attendanceTitle:    "मासिक हाजिरी सारांश",
    shift:              "सिफ्ट: बिहान ७:०० – दिउँसो २:००",
    colAttDate:         "मिति",
    colDay:             "दिन",
    colCheckIn:         "चेक इन",
    colCheckOut:        "चेक आउट",
    colRemarks:         "टिप्पणी",
    colTotalHours:      "कुल घण्टा",
    colStatus:          "स्थिति",
    loading:            "लोड हुँदैछ...",
    noAttendance:       "यो महिना कुनै हाजिरी रेकर्ड छैन",
    selected:           "छनोट गरियो",
    // status labels
    statusPresent:      "उपस्थित",
    statusLate:         "ढिलो",
    statusAbsent:       "अनुपस्थित",
    statusHalfDay:      "आधा दिन",
    statusOnLeave:      "बिदामा",
    statusHoliday:      "बिदा",
    statusWeekend:      "सप्ताहन्त",
    // remarks
    remarkLateEarly:    "ढिलो आउनु / चाँडो जानु",
    remarkLate:         "ढिलो चेक-इन",
    remarkEarly:        "चाँडो चेक-आउट",
    // days
    days:               ["आइत", "सोम", "मंगल", "बुध", "बिही", "शुक्र", "शनि"],
    // remaining
    nextYear:           "अर्को वर्ष",
    today:              "आज",
    passed:             "बितिसक्यो",
    daysLeft:           (n) => `${n} दिन`,
  },
};

export default function UserDashboard() {
  const { user, token } = useApp();
  const { lang }        = useLang();
  const t               = TEXT[lang] || TEXT.en;

  const [selectedDate,      setSelectedDate]      = useState(null);
  const [myLeaves,          setMyLeaves]          = useState([]);
  const [leaveBalance,      setLeaveBalance]      = useState(null);
  const [upcomingHolidays,  setUpcomingHolidays]  = useState([]);
  const [occasions,         setOccasions]         = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading,           setLoading]           = useState(true);

  const today = getTodayBS();

  const pending         = myLeaves.filter((r) => r.status === "pending").length;
  const availableLeaves = leaveBalance?.availableNow ?? 12 - (leaveBalance?.used || 0);

  const fetchDashboard = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [leavesRes, balanceRes, holidaysRes, occasionsRes, attendanceRes] = await Promise.all([
        fetch(`${API}/api/leave/my`,       { headers }),
        fetch(`${API}/api/leave/balance`,  { headers }),
        fetch(`${API}/api/holidays/upcoming`, { headers }),
        fetch(`${API}/api/occasions`,      { headers }),
        fetch(`${API}/api/attendance/my/summary?nepaliYear=${today.year}&nepaliMonth=${today.month}`, { headers }),
      ]);
      if (leavesRes.ok)     setMyLeaves((await leavesRes.json()).leaves || []);
      if (balanceRes.ok)    setLeaveBalance((await balanceRes.json()).balance);
      if (holidaysRes.ok)   setUpcomingHolidays((await holidaysRes.json()).holidays || []);
      if (occasionsRes.ok)  setOccasions((await occasionsRes.json()).occasions || []);
      if (attendanceRes.ok) setAttendanceRecords((await attendanceRes.json()).records || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [token, today.year, today.month]);

  useEffect(() => { fetchDashboard(); }, []);

  const statusMap = {
    present:   t.statusPresent,
    late:      t.statusLate,
    absent:    t.statusAbsent,
    "half-day":t.statusHalfDay,
    "on-leave":t.statusOnLeave,
    holiday:   t.statusHoliday,
    weekend:   t.statusWeekend,
  };

  // Status styles keyed by translated label
  const STATUS_STYLES_T = {
    [t.statusPresent]: "bg-green-100 text-green-700",
    [t.statusLate]:    "bg-amber-100 text-amber-700",
    [t.statusAbsent]:  "bg-red-100 text-red-700",
  };

  const attendanceRows = attendanceRecords.map((record) => {
    const dateObj  = record.date ? new Date(record.date) : null;
    const dayIndex = dateObj ? dateObj.getDay() : null;
    const dayName  = dayIndex !== null ? t.days[dayIndex] : "—";

    const totalMins   = record.workingMinutes || 0;
    const totalHourStr = totalMins > 0
      ? `${Math.floor(totalMins / 60)} ${lang === "np" ? "घण्टा" : "hrs"} ${totalMins % 60} ${lang === "np" ? "मिनेट" : "min"}`
      : "—";

    const statusLabel = statusMap[record.isLate ? "late" : record.status] || "—";

    let remarks = "—";
    if (record.isLate && record.isEarlyLeave) remarks = t.remarkLateEarly;
    else if (record.isLate)        remarks = t.remarkLate;
    else if (record.isEarlyLeave)  remarks = t.remarkEarly;

    return {
      date:      record.nepaliDate || "—",
      day:       dayName,
      checkIn:   toNPT(record.checkIn),
      checkOut:  toNPT(record.checkOut),
      remarks,
      totalHour: totalHourStr,
      status:    statusLabel,
    };
  });

  const getRemainingDays = (holiday) => {
    if (!holiday?.nepaliDate) return "—";
    const [y, m, d] = holiday.nepaliDate.split("-").map(Number);
    if (y > today.year) return t.nextYear;
    if (y === today.year && m > today.month) return t.daysLeft(d - today.day + (m - today.month) * 30);
    if (y === today.year && m === today.month && d >= today.day) {
      const diff = d - today.day;
      return diff === 0 ? t.today : t.daysLeft(diff);
    }
    return t.passed;
  };

  const thClass  = "border border-gray-200 px-3 py-2 text-left font-bold text-gray-700 text-sm";
  const tdClass  = "border border-gray-200 px-3 py-2 text-sm";
  const emptyRow = (cols, msg) => (
    <tr><td colSpan={cols} className={`${tdClass} text-center text-gray-400 py-4`}>{msg}</td></tr>
  );

  return (
    <div className="w-full px-4 py-4">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t.hello(user?.fullName || user?.name || "")}</h1>
          <p className="text-sm text-gray-500 mt-1">{fmtDate(today.year, today.month, today.day, lang === "np" ? "np" : "en")}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-amber-50 rounded-xl p-4">
            <p className="text-sm text-amber-600">{t.pendingLeaves}</p>
            <p className="text-3xl font-bold text-amber-900">{pending}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-sm text-green-600">{t.leaveBalance}</p>
            <p className="text-3xl font-bold text-green-900">{availableLeaves}</p>
          </div>
        </div>

        {/* Calendar + Upcoming panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Calendar */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
            <NepaliCalendar
              holidays={[]}
              onDateSelect={setSelectedDate}
              selectedDate={selectedDate}
              showWeekends
              hideLegend
              hideTodayText
            />
            {selectedDate && (
              <div className="mt-2 p-2 bg-green-50 rounded-md text-center">
                <p className="text-sm text-green-700 font-medium">
                  {t.selected}: {selectedDate.day} {BS_MONTHS_EN[selectedDate.month - 1]} {selectedDate.year} BS
                </p>
              </div>
            )}
          </div>

          {/* Celebrations & Holidays */}
          <div className="flex flex-col gap-4">
            {/* Celebrations */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
              <h2 className="text-base font-semibold text-gray-800 mb-2">{t.upcomingCelebrations}</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className={thClass}>{t.colCelebration}</th>
                      <th className={thClass}>{t.colDate}</th>
                      <th className={`${thClass} hidden sm:table-cell`}>{t.colPerson}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {occasions.length === 0
                      ? emptyRow(3, t.noCelebrations)
                      : occasions.map((occ) => (
                          <tr key={occ._id} className="hover:bg-gray-50">
                            <td className={`${tdClass} font-medium text-gray-800`}>{occ.title}</td>
                            <td className={`${tdClass} text-gray-600`}>{occ.nepaliDate || occ.date?.slice(0, 10)}</td>
                            <td className={`${tdClass} text-gray-500 hidden sm:table-cell`}>{occ.user?.fullName || "—"}</td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Holidays */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
              <h2 className="text-base font-semibold text-gray-800 mb-2">{t.upcomingHolidays}</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className={thClass}>{t.colHoliday}</th>
                      <th className={thClass}>{t.colDate}</th>
                      <th className={thClass}>{t.colRemaining}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingHolidays.length === 0
                      ? emptyRow(3, t.noHolidays)
                      : upcomingHolidays.map((item) => (
                          <tr key={item._id} className="hover:bg-gray-50">
                            <td className={`${tdClass} font-medium text-gray-800`}>{item.title}</td>
                            <td className={`${tdClass} text-gray-600`}>{item.nepaliDate}</td>
                            <td className={tdClass}>
                              <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-xs font-medium">
                                {getRemainingDays(item)}
                              </span>
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Attendance Summary */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50">
            <h2 className="text-base font-semibold text-gray-800">{t.attendanceTitle}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{t.shift}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[t.colAttDate, t.colDay, t.colCheckIn, t.colCheckOut, t.colRemarks, t.colTotalHours, t.colStatus].map((h, i) => (
                    <th key={h} className={`border border-gray-200 px-3 py-2 text-left font-bold text-gray-700 text-xs${i === 4 ? " hidden lg:table-cell" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading
                  ? emptyRow(7, t.loading)
                  : attendanceRows.length === 0
                    ? emptyRow(7, t.noAttendance)
                    : attendanceRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="border border-gray-200 px-3 py-2 font-mono text-gray-700 text-xs">{row.date}</td>
                          <td className="border border-gray-200 px-3 py-2 text-gray-600 text-sm">{row.day}</td>
                          <td className="border border-gray-200 px-3 py-2 font-mono text-gray-800 text-sm font-medium">{row.checkIn}</td>
                          <td className="border border-gray-200 px-3 py-2 font-mono text-gray-800 text-sm font-medium">{row.checkOut}</td>
                          <td className="border border-gray-200 px-3 py-2 text-gray-500 text-xs hidden lg:table-cell">{row.remarks}</td>
                          <td className="border border-gray-200 px-3 py-2 text-gray-700 text-sm font-medium">{row.totalHour}</td>
                          <td className="border border-gray-200 px-3 py-2">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES_T[row.status] || "bg-gray-100 text-gray-600"}`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}