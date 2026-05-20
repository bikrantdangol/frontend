"use client";
import { useState, useEffect } from "react";
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
import { useParams } from "next/navigation";

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

// Calculate duration between check-in and check-out
const calcDuration = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return "—";
  const diffMs = new Date(checkOut) - new Date(checkIn);
  if (diffMs <= 0) return "—";
  const totalMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return `${hours}h ${mins.toString().padStart(2, "0")}m`;
};

export default function AdminUserAttendanceDetail() {
  const params = useParams();
  const userId = params.userId || params.id;
  const { token } = useApp();
  const today = getTodayBS();

  const [user, setUser] = useState(null);
  const [selectedYear, setSelectedYear] = useState(today.year);
  const [selectedMonth, setSelectedMonth] = useState(today.month);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    present: 0,
    late: 0,
    absent: 0,
    rate: 0,
  });

  // 1. Fetch user info
  useEffect(() => {
    if (!token || !userId) return;
    fetch(`${API}/api/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(console.error);
  }, [token, userId]);

  // 2. Fetch attendance summary for the selected month
  useEffect(() => {
    if (!token || !userId) return;

    const loadAttendance = async () => {
      setLoading(true);

      try {
        const res = await fetch(
          `${API}/api/attendance/user/${userId}/summary?nepaliYear=${selectedYear}&nepaliMonth=${selectedMonth}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await res.json();

        const records = data.records || [];
        setAttendanceRecords(records);

        const present = records.filter((r) => r.checkIn || r.checkOut).length;
        const late = records.filter((r) => r.isLate === true).length;
        const absent = records.filter(
          (r) =>
            !r.checkIn &&
            !r.checkOut &&
            r.status !== "weekend" &&
            r.status !== "holiday" &&
            r.status !== "on-leave",
        ).length;
        const total = present + late + absent;
        setStats({
          present,
          late,
          absent,
          rate: total > 0 ? Math.round((present / total) * 100) : 0,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadAttendance();
  }, [token, userId, selectedYear, selectedMonth]);

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

  // ── PDF Export ─────────────────────────────────────────────────────────────
  const exportPDF = () => {
    const printWindow = window.open("", "_blank");
    const userName = user?.fullName || user?.name || "Unknown";
    const userRole = user?.role
      ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
      : "—";
    const generatedDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Summary counts for PDF header pills
    const presentCount = attendanceRecords.filter(
      (r) => r.checkIn || r.checkOut,
    ).length;
    const lateCount = attendanceRecords.filter((r) => r.isLate).length;
    const absentCount = attendanceRecords.filter(
      (r) =>
        !r.checkIn &&
        !r.checkOut &&
        r.status !== "weekend" &&
        r.status !== "holiday" &&
        r.status !== "on-leave",
    ).length;

    // Status badge HTML helper
    const statusBadge = (status, isLate) => {
      const styles = {
        present:    { bg: "#D1FAE5", color: "#065F46" },
        absent:     { bg: "#FEE2E2", color: "#991B1B" },
        "on-leave": { bg: "#DBEAFE", color: "#1E40AF" },
        holiday:    { bg: "#EDE9FE", color: "#5B21B6" },
        weekend:    { bg: "#F3F4F6", color: "#6B7280" },
        "half-day": { bg: "#FEF9C3", color: "#854D0E" },
      };
      const isLatePresent = isLate && status === "present";
      const key = isLatePresent ? "present" : status;
      const label = isLatePresent
        ? "Late"
        : status
          ? status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")
          : "—";
      const s = styles[key] || { bg: "#F3F4F6", color: "#374151" };
      return `<span style="background:${s.bg};color:${s.color};padding:2px 10px;border-radius:20px;font-size:10.5px;font-weight:600;white-space:nowrap;">${label}</span>`;
    };

    const tableRows = attendanceRecords
      .map((record, i) => {
        const dateObj = record.date ? new Date(record.date) : null;
        const dayName = dateObj ? dayNames[dateObj.getDay()] : "—";
        const duration = calcDuration(record.checkIn, record.checkOut);

        const remarks =
          [
            record.isLate && record.isEarlyLeave
              ? "Late in & early out"
              : record.isLate
                ? "Late check-in"
                : record.isEarlyLeave
                  ? "Early check-out"
                  : null,
            record.overtimeMinutes > 0 &&
              `OT: ${Math.floor(record.overtimeMinutes / 60)}h ${record.overtimeMinutes % 60}m`,
          ]
            .filter(Boolean)
            .join(" · ") || "—";

        const rowBg = i % 2 === 0 ? "#ffffff" : "#f9fafb";

        return `
        <tr style="background:${rowBg};">
          <td style="border:1px solid #e5e7eb;padding:6px 9px;text-align:center;color:#9ca3af;">${i + 1}</td>
          <td style="border:1px solid #e5e7eb;padding:6px 9px;font-weight:600;">${record.nepaliDate || "—"}</td>
          <td style="border:1px solid #e5e7eb;padding:6px 9px;color:#6b7280;">${dayName}</td>
          <td style="border:1px solid #e5e7eb;padding:6px 9px;">${toNPT(record.checkIn)}</td>
          <td style="border:1px solid #e5e7eb;padding:6px 9px;">${toNPT(record.checkOut)}</td>
          <td style="border:1px solid #e5e7eb;padding:6px 9px;text-align:center;font-weight:700;color:#1d4ed8;">${duration}</td>
          <td style="border:1px solid #e5e7eb;padding:6px 9px;text-align:center;">${statusBadge(record.status, record.isLate)}</td>
          <td style="border:1px solid #e5e7eb;padding:6px 9px;color:#6b7280;font-size:10.5px;">${remarks}</td>
        </tr>`;
      })
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Attendance Report — ${BS_MONTHS_EN[selectedMonth - 1]} ${selectedYear}</title>
          <style>
            @page { size: A4 landscape; margin: 14mm 12mm; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1f2937; background: #fff; }

            /* ── Page header ── */
            .page-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 14px;
              padding-bottom: 12px;
              border-bottom: 2.5px solid #1d4ed8;
            }
            .page-header-left h1 {
              font-size: 19px;
              font-weight: 700;
              color: #1d4ed8;
              letter-spacing: 0.3px;
            }
            .page-header-left p {
              font-size: 11.5px;
              color: #6b7280;
              margin-top: 3px;
            }
            .page-header-right {
              text-align: right;
              font-size: 11px;
              color: #6b7280;
              line-height: 1.8;
            }
            .page-header-right .date-label {
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #9ca3af;
            }
            .page-header-right .date-value {
              font-size: 12.5px;
              font-weight: 700;
              color: #1f2937;
            }

            /* ── Employee info bar ── */
            .emp-bar {
              display: flex;
              align-items: center;
              gap: 14px;
              background: #eff6ff;
              border: 1px solid #bfdbfe;
              border-radius: 10px;
              padding: 9px 14px;
              margin-bottom: 14px;
            }
            .emp-avatar {
              width: 40px;
              height: 40px;
              background: #1d4ed8;
              color: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 17px;
              font-weight: 700;
              flex-shrink: 0;
            }
            .emp-name { font-size: 14px; font-weight: 700; color: #1e3a8a; }
            .emp-role {
              font-size: 10.5px;
              color: #2563eb;
              background: #dbeafe;
              padding: 2px 10px;
              border-radius: 20px;
              display: inline-block;
              margin-top: 3px;
              font-weight: 600;
            }

            /* ── Summary pills ── */
            .summary { display: flex; gap: 10px; margin-bottom: 14px; }
            .pill {
              flex: 1;
              border-radius: 8px;
              padding: 7px 12px;
              text-align: center;
            }
            .pill .val { font-size: 19px; font-weight: 700; }
            .pill .lbl { font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
            .pill-green  { background: #d1fae5; color: #065f46; }
            .pill-orange { background: #ffedd5; color: #9a3412; }
            .pill-red    { background: #fee2e2; color: #991b1b; }
            .pill-blue   { background: #dbeafe; color: #1e40af; }

            /* ── Table ── */
            table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
            thead tr { background: #1d4ed8; color: white; }
            th {
              padding: 8px 9px;
              text-align: left;
              font-weight: 600;
              font-size: 10.5px;
              text-transform: uppercase;
              letter-spacing: 0.4px;
              border: 1px solid #1e40af;
            }
            td { border: 1px solid #e5e7eb; padding: 6px 9px; vertical-align: middle; }

            /* ── Footer ── */
            .footer {
              margin-top: 22px;
              display: flex;
              justify-content: space-between;
              font-size: 10.5px;
              color: #9ca3af;
              border-top: 1px solid #e5e7eb;
              padding-top: 8px;
            }
          </style>
        </head>
        <body>

          <!-- Page header -->
          <div class="page-header">
            <div class="page-header-left">
              <h1>Attendance Report</h1>
              <p>${BS_MONTHS_EN[selectedMonth - 1]} ${selectedYear} &nbsp;·&nbsp; ${attendanceRecords.length} records</p>
            </div>
            <div class="page-header-right">
              <div class="date-label">Date Generated</div>
              <div class="date-value">${generatedDate}</div>
            </div>
          </div>

          <!-- Employee bar -->
          <div class="emp-bar">
            <div class="emp-avatar">${userName.charAt(0).toUpperCase()}</div>
            <div>
              <div class="emp-name">${userName}</div>
              <div class="emp-role">${userRole}</div>
            </div>
          </div>

          <!-- Summary pills -->
          <div class="summary">
            <div class="pill pill-green">
              <div class="val">${presentCount}</div>
              <div class="lbl">Present</div>
            </div>
            <div class="pill pill-orange">
              <div class="val">${lateCount}</div>
              <div class="lbl">Late</div>
            </div>
            <div class="pill pill-red">
              <div class="val">${absentCount}</div>
              <div class="lbl">Absent</div>
            </div>
            <div class="pill pill-blue">
              <div class="val">${attendanceRecords.length}</div>
              <div class="lbl">Total Days</div>
            </div>
          </div>

          <!-- Attendance table -->
          <table>
            <thead>
              <tr>
                <th style="width:32px;">#</th>
                <th style="width:88px;">Date (BS)</th>
                <th style="width:44px;">Day</th>
                <th style="width:74px;">Check In</th>
                <th style="width:74px;">Check Out</th>
                <th style="width:68px;">Duration</th>
                <th style="width:80px;">Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <!-- Footer -->
          <div class="footer">
            <span>Generated on ${generatedDate}</span>
            <span>${BS_MONTHS_EN[selectedMonth - 1]} ${selectedYear} &nbsp;·&nbsp; Total ${attendanceRecords.length} records</span>
          </div>

        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // While user data is loading
  if (!user) {
    return (
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/attendance"
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            Attendance Details
          </h1>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16">
          <p className="text-gray-500">Loading user data...</p>
        </div>
      </div>
    );
  }

  const rc = ROLE_META[user.role] || ROLE_META.user;
  const userName = user.fullName || user.name || "Unknown";

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
            <h1 className="text-2xl font-bold text-gray-800">
              Attendance Details
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              View attendance records for {userName}
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
            <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium bg-white/20">
              {rc.label}
            </span>
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
              className="h-full bg-white rounded-full"
              style={{ width: `${stats.rate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg"
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
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          ▶
        </button>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-semibold text-gray-800">
            Daily Attendance Record
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Showing {attendanceRecords.length} days in{" "}
            {BS_MONTHS_EN[selectedMonth - 1]} {selectedYear}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Date (BS)
                </th>
                <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Day
                </th>
                <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Check In
                </th>
                <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Check Out
                </th>
                <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Duration
                </th>
                <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>
                <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Remarks
                </th>
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
                attendanceRecords.map((record) => {
                  const isWeekend = record.status === "weekend";
                  const isHoliday = record.status === "holiday";
                  const dateObj = record.date ? new Date(record.date) : null;
                  const dayNames = [
                    "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
                  ];
                  const dayName = dateObj ? dayNames[dateObj.getDay()] : "—";
                  const duration = calcDuration(record.checkIn, record.checkOut);

                  return (
                    <tr
                      key={record._id || record.nepaliDate}
                      className={`${isWeekend || isHoliday ? "bg-red-50/30" : "hover:bg-gray-50"} transition-colors`}
                    >
                      <td className="p-3 text-sm text-gray-700 font-medium">
                        {record.nepaliDate || "—"}
                      </td>
                      <td className="p-3 text-sm text-gray-500">{dayName}</td>
                      <td className="p-3 text-sm text-gray-700">
                        {toNPT(record.checkIn)}
                      </td>
                      <td className="p-3 text-sm text-gray-700">
                        {toNPT(record.checkOut)}
                      </td>
                      <td className="p-3 text-sm font-semibold text-blue-600">
                        {duration}
                      </td>
                      <td className="p-3">
                        {record.status === "present" && record.isLate ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                            <Clock size={12} /> Late
                          </span>
                        ) : record.status === "present" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle size={12} /> Present
                          </span>
                        ) : record.status === "absent" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <XCircle size={12} /> Absent
                          </span>
                        ) : record.status === "on-leave" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            <Clock size={12} /> On Leave
                          </span>
                        ) : record.status === "holiday" ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                            Holiday
                          </span>
                        ) : record.status === "weekend" ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                            Weekend
                          </span>
                        ) : record.status === "half-day" ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                            Half Day
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            —
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-sm text-gray-500">
                        {record.isLate && record.isEarlyLeave
                          ? "Late in & early out"
                          : record.isLate
                            ? "Late check-in"
                            : record.isEarlyLeave
                              ? "Early check-out"
                              : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <p className="text-xs text-gray-500">
            Showing {attendanceRecords.length} days
          </p>
          <div className="flex gap-3 text-xs text-gray-400">
            <span>
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>{" "}
              Present
            </span>
            <span>
              <span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-1"></span>{" "}
              Late
            </span>
            <span>
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span>{" "}
              Absent
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}