"use client";

import { useState, useEffect, useCallback } from "react";
import { useApp } from "../../../lib/context";
import { getTodayBS, BS_MONTHS_EN } from "../../../lib/calendar";
import { Calendar, CheckCircle, XCircle, Clock, Printer } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const toNPT = (utcDate) => {
  if (!utcDate) return "—";
  return new Date(utcDate).toLocaleTimeString("en-US", {
    timeZone: "Asia/Kathmandu",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatWorked = (record) => {
  const total = (record.workingMinutes || 0) + (record.overtimeMinutes || 0);
  if (total === 0) return "—";
  return `${Math.floor(total / 60)}h ${total % 60}m`;
};

const getRemarks = (record) => {
  const parts = [];
  if (record.isLate && record.isEarlyLeave) parts.push("Late in & early out");
  else if (record.isLate) parts.push("Late check-in");
  else if (record.isEarlyLeave) parts.push("Early check-out");
  const ot = record.overtimeMinutes || 0;
  if (ot > 0) parts.push(`OT: ${Math.floor(ot / 60)}h ${ot % 60}m`);
  return parts.length > 0 ? parts.join(" · ") : "—";
};

const getStatusBadge = (status, isLate) => {
  if (status === "present" && isLate)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
        <Clock size={12} /> Late
      </span>
    );
  const map = {
    present: (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <CheckCircle size={12} /> Present
      </span>
    ),
    absent: (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
        <XCircle size={12} /> Absent
      </span>
    ),
    "on-leave": (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        <Clock size={12} /> On Leave
      </span>
    ),
    holiday: (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
        Holiday
      </span>
    ),
    weekend: (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
        Weekend
      </span>
    ),
    "half-day": (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        Half Day
      </span>
    ),
  };
  return (
    map[status] || (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        —
      </span>
    )
  );
};

const TH = ({ children }) => (
  <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">
    {children}
  </th>
);

// Filter records to only those on or after the user's joining date
const filterFromJoinDate = (records, joinDate) => {
  if (!joinDate) return records;
  const join = new Date(joinDate);
  join.setHours(0, 0, 0, 0);
  return records.filter((r) => {
    if (!r.date) return true; // keep if no date info
    return new Date(r.date) >= join;
  });
};

export default function UserAttendancePage() {
  const { user, token } = useApp();
  const today = getTodayBS();
  const [selectedYear, setSelectedYear] = useState(today.year);
  const [selectedMonth, setSelectedMonth] = useState(today.month);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ present: 0, late: 0, absent: 0 });

  const fetchAttendance = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API}/api/attendance/my/summary?nepaliYear=${selectedYear}&nepaliMonth=${selectedMonth}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!res.ok) return;

      const records = (await res.json()).records || [];

      // Deduplicate by nepali date, preferring records with a checkIn
      const uniqueMap = {};
      records.forEach((r) => {
        if (
          !uniqueMap[r.nepaliDate] ||
          (!uniqueMap[r.nepaliDate].checkIn && r.checkIn)
        )
          uniqueMap[r.nepaliDate] = r;
      });

      // Sort and filter from joining date
      const joinDate = user?.joinedDate || user?.createdAt;
      const sorted = filterFromJoinDate(
        Object.values(uniqueMap).sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        ),
        joinDate
      );

      setAttendanceRecords(sorted);
      setStats({
        present: sorted.filter((r) => r.checkIn || r.checkOut).length,
        late: sorted.filter((r) => r.isLate === true).length,
        absent: sorted.filter((r) => r.status === "absent").length,
      });
    } catch (e) {
      console.error("Attendance fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [token, selectedYear, selectedMonth, user]);

  // Re-fetch whenever year or month changes
  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const prevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else setSelectedMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else setSelectedMonth((m) => m + 1);
  };

  const exportPDF = () => {
    const title = `Attendance Report - ${BS_MONTHS_EN[selectedMonth - 1]} ${selectedYear}`;
    const tableRows = attendanceRecords
      .map((r) => {
        const s = r.status || "absent";
        const bg =
          s === "present" ? "#D1FAE5" : s === "absent" ? "#FEE2E2" : "#FEF3C7";
        const color =
          s === "present" ? "#065F46" : s === "absent" ? "#991B1B" : "#92400E";
        return `<tr>
        <td>${r.nepaliDate || "—"}</td>
        <td>${r.dayName || "—"}</td>
        <td>${toNPT(r.checkIn)}</td>
        <td>${toNPT(r.checkOut)}</td>
        <td>${formatWorked(r)}</td>
        <td><span style="background:${bg};color:${color};padding:2px 8px;border-radius:20px">
          ${s.charAt(0).toUpperCase() + s.slice(1)}</span></td>
        <td>${getRemarks(r)}</td>
      </tr>`;
      })
      .join("");

    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>${title}</title><style>
      body{font-family:Arial;margin:40px}
      h1{color:#1F2937;font-size:24px;margin-bottom:8px}
      .stats{display:flex;gap:20px;margin:20px 0}
      .stat{padding:12px 20px;border:1px solid #E5E7EB;border-radius:12px}
      .stat-val{font-size:24px;font-weight:bold}
      .stat-lbl{font-size:12px;color:#6B7280;margin-top:4px}
      table{width:100%;border-collapse:collapse;margin-top:20px}
      th,td{border:1px solid #ddd;padding:8px;text-align:left}
      th{background:#F9FAFB;font-weight:600}
      footer{margin-top:30px;padding-top:15px;border-top:1px solid #E5E7EB;font-size:11px;color:#9CA3AF;text-align:center}
    </style></head><body>
      <h1>${title}</h1>
      <p>Employee: ${user?.fullName || user?.name} (${user?.email})</p>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <div class="stats">
        <div class="stat"><div class="stat-val" style="color:#059669">${stats.present}</div><div class="stat-lbl">Present Days</div></div>
        <div class="stat"><div class="stat-val" style="color:#D97706">${stats.late}</div><div class="stat-lbl">Late Days</div></div>
        <div class="stat"><div class="stat-val" style="color:#DC2626">${stats.absent}</div><div class="stat-lbl">Absent Days</div></div>
      </div>
      <table><thead><tr>
        <th>Date (BS)</th><th>Day</th><th>Check In</th><th>Check Out</th><th>Worked</th><th>Status</th><th>Remarks</th>
      </tr></thead><tbody>${tableRows}</tbody></table>
      <footer>MirmiraHRMS - Attendance Report</footer>
    </body></html>`);
    win.document.close();
    win.print();
  };

  // Determine if current month/year is before the user's joining month
  const joinDate = user?.joinedDate || user?.createdAt;
  const isBeforeJoining = (() => {
    if (!joinDate) return false;
    const join = new Date(joinDate);
    // Compare with selected BS year/month roughly via AD date
    // We'll just show a notice if records are empty due to join date
    return false; // handled via filtered records being empty
  })();

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Attendance</h1>
          <p className="text-gray-500 text-sm mt-1">
            Track your daily attendance records
            {joinDate && (
              <span className="ml-2 text-xs text-blue-500">
                (from{" "}
                {new Date(joinDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
                )
              </span>
            )}
          </p>
        </div>
        <button
          onClick={exportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
        >
          <Printer size={16} /> Download PDF
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: "Present Days",
            value: stats.present,
            color: "text-green-600",
          },
          { label: "Late Days", value: stats.late, color: "text-orange-600" },
          { label: "Absent Days", value: stats.absent, color: "text-red-600" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
          >
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ◀
        </button>
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-gray-400" />
          <span className="font-semibold text-gray-800">
            {BS_MONTHS_EN[selectedMonth - 1]} {selectedYear}
          </span>
        </div>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ▶
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-semibold text-gray-800">
            Daily Attendance Record
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Your check-in and check-out details (Nepal Time)
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <TH>Date (BS)</TH>
                <TH>Day</TH>
                <TH>Check In</TH>
                <TH>Check Out</TH>
                <TH>Worked</TH>
                <TH>Status</TH>
                <TH>Remarks</TH>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    No attendance records found for this month
                  </td>
                </tr>
              ) : (
                attendanceRecords.map((record, idx) => {
                  const isOffDay =
                    record.status === "weekend" || record.status === "holiday";
                  return (
                    <tr
                      key={record._id || idx}
                      className={`transition-colors ${isOffDay ? "bg-red-50/30" : "hover:bg-gray-50"}`}
                    >
                      <td className="p-3 text-sm text-gray-700 font-medium">
                        {record.nepaliDate || "—"}
                      </td>
                      <td className="p-3 text-sm text-gray-500">
                        {record.dayName || "—"}
                      </td>
                      <td className="p-3 text-sm text-gray-700">
                        {isOffDay
                          ? record.checkIn
                            ? `OT In: ${toNPT(record.checkIn)}`
                            : "—"
                          : toNPT(record.checkIn)}
                      </td>
                      <td className="p-3 text-sm text-gray-700">
                        {isOffDay
                          ? record.checkOut
                            ? `OT Out: ${toNPT(record.checkOut)}`
                            : "—"
                          : toNPT(record.checkOut)}
                      </td>
                      <td className="p-3 text-sm text-gray-700 font-medium">
                        {formatWorked(record)}
                      </td>
                      <td className="p-3">
                        {getStatusBadge(record.status, record.isLate)}
                      </td>
                      <td className="p-3 text-sm text-gray-500">
                        {getRemarks(record)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}