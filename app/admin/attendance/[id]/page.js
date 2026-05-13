"use client";
import { useState, useEffect, useCallback } from "react";
import { useApp, ROLE_META } from "../../../../lib/context";
import { getTodayBS, BS_MONTHS_EN } from "../../../../lib/calendar";
import {
  Calendar, ArrowLeft, CheckCircle, XCircle, Clock, Printer,
} from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─── helpers ──────────────────────────────────────────────────────────────────

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

const StatusBadge = ({ status, isLate }) => {
  if (status === "present" && isLate)
    return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700"><Clock size={12} /> Late</span>;
  if (status === "present")
    return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle size={12} /> Present</span>;
  if (status === "absent")
    return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700"><XCircle size={12} /> Absent</span>;
  if (status === "on-leave")
    return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"><Clock size={12} /> On Leave</span>;
  if (status === "holiday")
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">Holiday</span>;
  if (status === "weekend")
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Weekend</span>;
  if (status === "half-day")
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Half Day</span>;
  return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">—</span>;
};

/**
 * Build full calendar for the month from raw backend records:
 * - Skip days before user joined
 * - Skip future days
 * - Use real backend record where available (deduped, prefer checkIn)
 * - Working days with no record → absent
 * - Saturday with no record → weekend
 * - Backend holiday records preserved
 */
const buildFullMonthRecords = (rawRecords, joinDate) => {
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  const joinDt = joinDate ? new Date(joinDate) : null;
  if (joinDt) joinDt.setHours(0, 0, 0, 0);

  // Dedup backend records by AD date, prefer record with checkIn
  const byDate = {};
  rawRecords.forEach((r) => {
    if (!r.date) return;
    const key = new Date(r.date).toISOString().slice(0, 10);
    if (!byDate[key] || (!byDate[key].checkIn && r.checkIn)) byDate[key] = r;
  });

  const keys = Object.keys(byDate).sort();
  if (keys.length === 0) return [];

  const firstDt = new Date(keys[0]);
  const lastDt  = new Date(keys[keys.length - 1]);

  const result  = [];
  const cursor  = new Date(firstDt);

  while (cursor <= lastDt) {
    const key    = cursor.toISOString().slice(0, 10);
    const dayIdx = cursor.getDay();

    // Skip future
    if (cursor > now) { cursor.setDate(cursor.getDate() + 1); continue; }

    // Skip before joining
    if (joinDt && cursor < joinDt) { cursor.setDate(cursor.getDate() + 1); continue; }

    if (byDate[key]) {
      result.push({ ...byDate[key] });
    } else {
      // Saturday = weekend; all other days = working → absent
      result.push({
        _synthetic:      true,
        date:            cursor.toISOString(),
        nepaliDate:      null,
        dayName:         DAY_NAMES[dayIdx],
        status:          dayIdx === 6 ? "weekend" : "absent",
        checkIn:         null,
        checkOut:        null,
        isLate:          false,
        isEarlyLeave:    false,
        workingMinutes:  0,
        overtimeMinutes: 0,
      });
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
};

// ─── component ────────────────────────────────────────────────────────────────

export default function AdminUserAttendanceDetail() {
  const params       = useParams();
  const userId       = params.userId;           // route: /admin/attendance/[userId]
  const searchParams = useSearchParams();
  const { token }    = useApp();
  const today        = getTodayBS();

  const initYear  = parseInt(searchParams.get("year")  || String(today.year),  10);
  const initMonth = parseInt(searchParams.get("month") || String(today.month), 10);

  const [user,              setUser]              = useState(null);
  const [userLoading,       setUserLoading]       = useState(true);
  const [userError,         setUserError]         = useState(false);
  const [selectedYear,      setSelectedYear]      = useState(initYear);
  const [selectedMonth,     setSelectedMonth]     = useState(initMonth);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading,           setLoading]           = useState(false);
  const [stats, setStats] = useState({ present: 0, late: 0, absent: 0, rate: 0 });

  // ── 1. Fetch user once ────────────────────────────────────────
  useEffect(() => {
    if (!token || !userId) return;
    setUserLoading(true);
    setUserError(false);

    fetch(`${API}/api/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        // Handle both { user: {...} } and the user object directly
        const u = json.user || json.data || json;
        if (u && (u._id || u.id)) {
          setUser(u);
        } else {
          throw new Error("No user in response");
        }
      })
      .catch((err) => {
        console.error("User fetch error:", err);
        setUserError(true);
      })
      .finally(() => setUserLoading(false));
  }, [token, userId]);

  // ── 2. Fetch attendance when user + month ready ───────────────
  const fetchAttendance = useCallback(async () => {
    if (!token || !userId || userLoading) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API}/api/attendance/user/${userId}/summary?nepaliYear=${selectedYear}&nepaliMonth=${selectedMonth}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const joinDate = user?.joinedDate || user?.createdAt || null;
      const records  = buildFullMonthRecords(data.records || [], joinDate);

      setAttendanceRecords(records);

      const present = records.filter((r) => r.checkIn || r.checkOut).length;
      const late    = records.filter((r) => r.isLate === true).length;
      const absent  = records.filter((r) => r.status === "absent").length;
      const total   = present + absent;
      setStats({
        present,
        late,
        absent,
        rate: total > 0 ? Math.round((present / total) * 100) : 0,
      });
    } catch (err) {
      console.error("Attendance fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [token, userId, selectedYear, selectedMonth, user, userLoading]);

  useEffect(() => {
    if (!userLoading) fetchAttendance();
  }, [fetchAttendance, userLoading]);

  const prevMonth = () => {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear((y) => y - 1); }
    else setSelectedMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear((y) => y + 1); }
    else setSelectedMonth((m) => m + 1);
  };

  // ── PDF export ────────────────────────────────────────────────
  const exportPDF = () => {
    const title = `Attendance Report - ${BS_MONTHS_EN[selectedMonth - 1]} ${selectedYear}`;
    const rows = attendanceRecords.map((r) => {
      const s      = r.status || "absent";
      const bg     = s === "present" ? "#D1FAE5" : s === "absent" ? "#FEE2E2" : "#FEF3C7";
      const color  = s === "present" ? "#065F46" : s === "absent" ? "#991B1B" : "#92400E";
      const dayLbl = r.date ? DAY_NAMES[new Date(r.date).getDay()] : (r.dayName || "—");
      const dateLbl = r.nepaliDate || r.date?.slice(0, 10) || "—";
      return `<tr>
        <td>${dateLbl}</td><td>${dayLbl}</td>
        <td>${toNPT(r.checkIn)}</td><td>${toNPT(r.checkOut)}</td>
        <td>${formatWorked(r)}</td>
        <td><span style="background:${bg};color:${color};padding:2px 8px;border-radius:20px">
          ${s.charAt(0).toUpperCase() + s.slice(1)}</span></td>
        <td>${getRemarks(r)}</td>
      </tr>`;
    }).join("");

    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>${title}</title><style>
      body{font-family:Arial;margin:40px}h1{color:#1F2937;font-size:22px}
      .stats{display:flex;gap:20px;margin:20px 0}.stat{padding:12px 20px;border:1px solid #E5E7EB;border-radius:12px}
      .stat-val{font-size:24px;font-weight:bold}.stat-lbl{font-size:12px;color:#6B7280;margin-top:4px}
      table{width:100%;border-collapse:collapse;margin-top:20px}
      th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#F9FAFB;font-weight:600}
      footer{margin-top:30px;padding-top:15px;border-top:1px solid #E5E7EB;font-size:11px;color:#9CA3AF;text-align:center}
    </style></head><body>
      <h1>${title}</h1>
      <p>Employee: ${user?.fullName || user?.name} (${user?.email})</p>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <div class="stats">
        <div class="stat"><div class="stat-val" style="color:#059669">${stats.present}</div><div class="stat-lbl">Present Days</div></div>
        <div class="stat"><div class="stat-val" style="color:#D97706">${stats.late}</div><div class="stat-lbl">Late Days</div></div>
        <div class="stat"><div class="stat-val" style="color:#DC2626">${stats.absent}</div><div class="stat-lbl">Absent Days</div></div>
        <div class="stat"><div class="stat-val" style="color:#2563EB">${stats.rate}%</div><div class="stat-lbl">Attendance Rate</div></div>
      </div>
      <table><thead><tr>
        <th>Date</th><th>Day</th><th>Check In</th><th>Check Out</th><th>Worked</th><th>Status</th><th>Remarks</th>
      </tr></thead><tbody>${rows}</tbody></table>
      <footer>MirmiraHRMS - Attendance Report</footer>
    </body></html>`);
    win.document.close();
    win.print();
  };

  // ── Loading state ─────────────────────────────────────────────
  if (userLoading) {
    return (
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/admin/attendance" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Attendance Details</h1>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-20">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading employee data…</p>
        </div>
      </div>
    );
  }

  // ── Error / not found ─────────────────────────────────────────
  if (userError || !user) {
    return (
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/admin/attendance" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Attendance Details</h1>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-20">
          <p className="text-gray-500 text-sm mb-4">Could not load employee data.</p>
          <Link href="/admin/attendance" className="text-blue-600 text-sm hover:underline">
            ← Back to Attendance
          </Link>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────
  const rc       = ROLE_META[user.role] || { label: user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Unknown" };
  const userName = user.fullName || user.name || "Unknown";
  const joinDate = user.joinedDate || user.createdAt;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/attendance" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Attendance Details</h1>
            <p className="text-gray-500 text-sm mt-1">
              {userName}
              {joinDate && (
                <span className="ml-2 text-xs text-blue-500">
                  · Joined {new Date(joinDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
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

      {/* User info card */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-bold shrink-0">
            {userName[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold">{userName}</h2>
            <p className="text-blue-100 text-sm">{user.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/20">{rc.label}</span>
              {joinDate && (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/20">
                  Since {new Date(joinDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Present Days",     value: stats.present, cls: "text-green-600"  },
          { label: "Late Days",        value: stats.late,    cls: "text-orange-600" },
          { label: "Absent Days",      value: stats.absent,  cls: "text-red-600"    },
        ].map(({ label, value, cls }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-2xl font-bold ${cls}`}>{value}</p>
          </div>
        ))}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <p className="text-xs text-blue-100">Attendance Rate</p>
          <p className="text-2xl font-bold">{stats.rate}%</p>
          <div className="mt-1 h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${stats.rate}%` }} />
          </div>
        </div>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">◀</button>
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-gray-400" />
          <span className="font-semibold text-gray-800">{BS_MONTHS_EN[selectedMonth - 1]} {selectedYear}</span>
        </div>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">▶</button>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-semibold text-gray-800">Daily Attendance Record</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {attendanceRecords.length} record{attendanceRecords.length !== 1 ? "s" : ""} · {BS_MONTHS_EN[selectedMonth - 1]} {selectedYear}
            {joinDate && <span className="ml-1 text-blue-400">· from joining date</span>}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Date", "Day", "Check In", "Check Out", "Worked", "Status", "Remarks"].map((h) => (
                  <th key={h} className="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
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
                  const isOffDay  = record.status === "weekend" || record.status === "holiday";
                  const isAbsent  = record.status === "absent";
                  const dayLabel  = record.date
                    ? DAY_NAMES[new Date(record.date).getDay()]
                    : (record.dayName || "—");
                  const dateLabel = record.nepaliDate || record.date?.slice(0, 10) || "—";

                  return (
                    <tr
                      key={record._id || dateLabel + idx}
                      className={`transition-colors ${
                        isOffDay  ? "bg-gray-50/80" :
                        isAbsent  ? "bg-red-50/40"  :
                        "hover:bg-gray-50"
                      }`}
                    >
                      <td className="p-3 text-sm text-gray-700 font-medium">{dateLabel}</td>
                      <td className="p-3 text-sm text-gray-500">{dayLabel}</td>
                      <td className="p-3 text-sm text-gray-700">
                        {isOffDay
                          ? record.checkIn  ? `OT In: ${toNPT(record.checkIn)}`  : "—"
                          : toNPT(record.checkIn)}
                      </td>
                      <td className="p-3 text-sm text-gray-700">
                        {isOffDay
                          ? record.checkOut ? `OT Out: ${toNPT(record.checkOut)}` : "—"
                          : toNPT(record.checkOut)}
                      </td>
                      <td className="p-3 text-sm text-gray-700 font-medium">{formatWorked(record)}</td>
                      <td className="p-3"><StatusBadge status={record.status} isLate={record.isLate} /></td>
                      <td className="p-3 text-sm text-gray-500">{getRemarks(record)}</td>
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
            <span><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />Present</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-1" />Late</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" />Absent</span>
          </div>
        </div>
      </div>
    </div>
  );
}