"use client";
import { useState, useEffect, useCallback } from "react";
import { useApp, ROLE_META } from "../../../../lib/context";
import { getTodayBS, BS_MONTHS_EN } from "../../../../lib/calendar";
import {
  Calendar,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Printer,
} from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Convert UTC to Nepal Time for display
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

// Filter records to only those on or after the user's joining date
const filterFromJoinDate = (records, joinDate) => {
  if (!joinDate) return records;
  const join = new Date(joinDate);
  join.setHours(0, 0, 0, 0);
  return records.filter((r) => {
    if (!r.date) return true;
    return new Date(r.date) >= join;
  });
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AdminUserAttendanceDetail() {
  const params = useParams();
  // Route is /admin/attendance/[userId] — params.userId is correct
  const userId = params.userId;
  const searchParams = useSearchParams();
  const { token } = useApp();
  const today = getTodayBS();

  // Read year/month/type from query params (passed by the View link), fall back to today
  const initYear  = parseInt(searchParams.get("year")  || today.year,  10);
  const initMonth = parseInt(searchParams.get("month") || today.month, 10);

  const [user,              setUser]              = useState(null);
  const [userLoading,       setUserLoading]       = useState(true);
  const [selectedYear,      setSelectedYear]      = useState(initYear);
  const [selectedMonth,     setSelectedMonth]     = useState(initMonth);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading,           setLoading]           = useState(false);
  const [stats,             setStats]             = useState({
    present: 0,
    late:    0,
    absent:  0,
    rate:    0,
  });

  // 1. Fetch user info once
  useEffect(() => {
    if (!token || !userId) return;
    setUserLoading(true);
    fetch(`${API}/api/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setUser(data.user || data || null);
      })
      .catch((err) => console.error("User fetch error:", err))
      .finally(() => setUserLoading(false));
  }, [token, userId]);

  // 2. Fetch attendance whenever year/month/user changes
  const fetchAttendance = useCallback(async () => {
    if (!token || !userId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API}/api/attendance/user/${userId}/summary?nepaliYear=${selectedYear}&nepaliMonth=${selectedMonth}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Filter from joining date
      const joinDate = user?.joinedDate || user?.createdAt;
      const records  = filterFromJoinDate(data.records || [], joinDate);

      setAttendanceRecords(records);

      const present = records.filter((r) => r.checkIn || r.checkOut).length;
      const late    = records.filter((r) => r.isLate === true).length;
      const absent  = records.filter((r) => r.status === "absent").length;
      const total   = present + absent; // late is a subset of present
      setStats({
        present,
        late,
        absent,
        rate: total > 0 ? Math.round((present / total) * 100) : 0,
      });
    } catch (error) {
      console.error("Attendance fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [token, userId, selectedYear, selectedMonth, user]);

  useEffect(() => {
    // Don't fetch until user object is loaded (we need joinDate)
    if (!userLoading) {
      fetchAttendance();
    }
  }, [fetchAttendance, userLoading]);

  // Month navigation
  const prevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };
  const nextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  // PDF export
  const exportPDF = () => {
    const title = `Attendance Report - ${BS_MONTHS_EN[selectedMonth - 1]} ${selectedYear}`;
    const tableRows = attendanceRecords
      .map((record) => {
        const dayName = record.date ? DAY_NAMES[new Date(record.date).getDay()] : "—";
        const status  = record.status || "absent";
        const worked  = formatWorked(record);
        const remarks = [
          record.isLate       && "Late check-in",
          record.isEarlyLeave && "Early check-out",
          record.overtimeMinutes > 0 &&
            `OT: ${Math.floor(record.overtimeMinutes / 60)}h ${record.overtimeMinutes % 60}m`,
        ].filter(Boolean).join(" · ") || "—";

        const bg    = status === "present" ? "#D1FAE5" : status === "absent" ? "#FEE2E2" : "#FEF3C7";
        const color = status === "present" ? "#065F46" : status === "absent" ? "#991B1B" : "#92400E";

        return `<tr>
          <td style="border:1px solid #ddd;padding:8px;">${record.nepaliDate || "—"}</td>
          <td style="border:1px solid #ddd;padding:8px;">${dayName}</td>
          <td style="border:1px solid #ddd;padding:8px;">${toNPT(record.checkIn)}</td>
          <td style="border:1px solid #ddd;padding:8px;">${toNPT(record.checkOut)}</td>
          <td style="border:1px solid #ddd;padding:8px;">${worked}</td>
          <td style="border:1px solid #ddd;padding:8px;">
            <span style="background:${bg};color:${color};padding:2px 8px;border-radius:20px;">
              ${status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </td>
          <td style="border:1px solid #ddd;padding:8px;">${remarks}</td>
        </tr>`;
      })
      .join("");

    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>${title}</title>
    <style>
      body{font-family:Arial;margin:40px} h1{color:#1F2937}
      .stats{display:flex;gap:20px;margin:20px 0}
      .stat{padding:12px 20px;border:1px solid #E5E7EB;border-radius:12px}
      .stat-val{font-size:24px;font-weight:bold}
      .stat-lbl{font-size:12px;color:#6B7280;margin-top:4px}
      table{width:100%;border-collapse:collapse;margin-top:20px}
      th{background:#F9FAFB;border:1px solid #ddd;padding:10px;text-align:left}
      td{border:1px solid #ddd;padding:8px}
      footer{margin-top:30px;padding-top:15px;border-top:1px solid #E5E7EB;font-size:11px;color:#9CA3AF;text-align:center}
    </style></head>
    <body>
      <h1>${title}</h1>
      <p>Employee: ${user?.fullName || user?.name} (${user?.email})</p>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <div class="stats">
        <div class="stat"><div class="stat-val" style="color:#059669">${stats.present}</div><div class="stat-lbl">Present Days</div></div>
        <div class="stat"><div class="stat-val" style="color:#D97706">${stats.late}</div><div class="stat-lbl">Late Days</div></div>
        <div class="stat"><div class="stat-val" style="color:#DC2626">${stats.absent}</div><div class="stat-lbl">Absent Days</div></div>
        <div class="stat"><div class="stat-val" style="color:#2563EB">${stats.rate}%</div><div class="stat-lbl">Attendance Rate</div></div>
      </div>
      <table>
        <thead><tr><th>Date (BS)</th><th>Day</th><th>Check In</th><th>Check Out</th><th>Worked</th><th>Status</th><th>Remarks</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      <footer>MirmiraHRMS - Attendance Report</footer>
    </body></html>`);
    win.document.close();
    win.print();
  };

  // ── Loading state ──────────────────────────────────────────────
  if (userLoading) {
    return (
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/attendance"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Attendance Details</h1>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading employee data...</p>
        </div>
      </div>
    );
  }

  // ── User not found ─────────────────────────────────────────────
  if (!user) {
    return (
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/attendance"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Attendance Details</h1>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16">
          <p className="text-gray-500 text-sm">Employee not found.</p>
          <Link
            href="/admin/attendance"
            className="mt-4 inline-block text-blue-600 text-sm hover:underline"
          >
            ← Back to Attendance
          </Link>
        </div>
      </div>
    );
  }

  const rc       = ROLE_META[user.role] || { label: user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Unknown" };
  const userName = user.fullName || user.name || "Unknown";
  const joinDate = user.joinedDate || user.createdAt;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/attendance"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Attendance Details</h1>
            <p className="text-gray-500 text-sm mt-1">
              Viewing records for {userName}
              {joinDate && (
                <span className="ml-2 text-xs text-blue-500">
                  · Joined{" "}
                  {new Date(joinDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={exportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
        >
          <Printer size={16} /> Download PDF
        </button>
      </div>

      {/* User Info Card */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-bold">
            {userName[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold">{userName}</h2>
            <p className="text-blue-100">{user.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/20">
                {rc.label}
              </span>
              {joinDate && (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/20">
                  Since {new Date(joinDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Present Days</p>
          <p className="text-2xl font-bold text-green-600">{stats.present}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Late Days</p>
          <p className="text-2xl font-bold text-orange-600">{stats.late}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Absent Days</p>
          <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <p className="text-xs text-blue-100">Attendance Rate</p>
          <p className="text-2xl font-bold">{stats.rate}%</p>
          <div className="mt-1 h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${stats.rate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          ◀
        </button>
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-gray-400" />
          <span className="font-semibold text-gray-800">
            {BS_MONTHS_EN[selectedMonth - 1]} {selectedYear}
          </span>
        </div>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          ▶
        </button>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-semibold text-gray-800">Daily Attendance Record</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Showing {attendanceRecords.length} record{attendanceRecords.length !== 1 ? "s" : ""} in{" "}
            {BS_MONTHS_EN[selectedMonth - 1]} {selectedYear}
            {joinDate && (
              <span className="ml-1 text-blue-400">· from joining date</span>
            )}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Date (BS)", "Day", "Check In", "Check Out", "Worked", "Status", "Remarks"].map((h) => (
                  <th key={h} className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400 text-sm">
                    No attendance records found for this month
                  </td>
                </tr>
              ) : (
                attendanceRecords.map((record, idx) => {
                  const isOffDay = record.status === "weekend" || record.status === "holiday";
                  const dayName  = record.date ? DAY_NAMES[new Date(record.date).getDay()] : (record.dayName || "—");

                  const statusBadge = (() => {
                    if (record.status === "present" && record.isLate)
                      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700"><Clock size={12}/> Late</span>;
                    if (record.status === "present")
                      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle size={12}/> Present</span>;
                    if (record.status === "absent")
                      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700"><XCircle size={12}/> Absent</span>;
                    if (record.status === "on-leave")
                      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"><Clock size={12}/> On Leave</span>;
                    if (record.status === "holiday")
                      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">Holiday</span>;
                    if (record.status === "weekend")
                      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Weekend</span>;
                    if (record.status === "half-day")
                      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Half Day</span>;
                    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">—</span>;
                  })();

                  const remarks = [
                    record.isLate && record.isEarlyLeave ? "Late in & early out"
                      : record.isLate ? "Late check-in"
                      : record.isEarlyLeave ? "Early check-out"
                      : null,
                    record.overtimeMinutes > 0 &&
                      `OT: ${Math.floor(record.overtimeMinutes / 60)}h ${record.overtimeMinutes % 60}m`,
                  ].filter(Boolean).join(" · ") || "—";

                  return (
                    <tr
                      key={record._id || record.nepaliDate || idx}
                      className={`transition-colors ${isOffDay ? "bg-red-50/30" : "hover:bg-gray-50"}`}
                    >
                      <td className="p-3 text-sm text-gray-700 font-medium">{record.nepaliDate || "—"}</td>
                      <td className="p-3 text-sm text-gray-500">{dayName}</td>
                      <td className="p-3 text-sm text-gray-700">
                        {isOffDay
                          ? record.checkIn ? `OT In: ${toNPT(record.checkIn)}` : "—"
                          : toNPT(record.checkIn)}
                      </td>
                      <td className="p-3 text-sm text-gray-700">
                        {isOffDay
                          ? record.checkOut ? `OT Out: ${toNPT(record.checkOut)}` : "—"
                          : toNPT(record.checkOut)}
                      </td>
                      <td className="p-3 text-sm text-gray-700 font-medium">{formatWorked(record)}</td>
                      <td className="p-3">{statusBadge}</td>
                      <td className="p-3 text-sm text-gray-500">{remarks}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex flex-wrap justify-between items-center gap-2">
          <p className="text-xs text-gray-500">
            Showing {attendanceRecords.length} record{attendanceRecords.length !== 1 ? "s" : ""}
          </p>
          <div className="flex gap-3 text-xs text-gray-400">
            <span><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"/>Present</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-1"/>Late</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"/>Absent</span>
          </div>
        </div>
      </div>
    </div>
  );
}