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

        // Count any day with a punch as present (like user attendance page)
        const present = records.filter((r) => r.checkIn || r.checkOut).length;
        const late = records.filter((r) => r.isLate === true).length;
        const absent = records.filter((r) => r.status === "absent").length;
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

  // PDF export (using real data)
  const exportPDF = () => {
    const printWindow = window.open("", "_blank");
    const title = `Attendance Report - ${BS_MONTHS_EN[selectedMonth - 1]} ${selectedYear}`;

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const tableRows = attendanceRecords
      .map((record) => {
        const dateObj = record.date ? new Date(record.date) : null;
        const dayName = dateObj ? dayNames[dateObj.getDay()] : "—";
        const status = record.status || "absent";
        const remarks =
          [
            record.isLate && "Late check-in",
            record.isEarlyLeave && "Early check-out",
            record.overtimeMinutes > 0 &&
              `OT: ${Math.floor(record.overtimeMinutes / 60)}h ${record.overtimeMinutes % 60}m`,
          ]
            .filter(Boolean)
            .join(" · ") || "—";

        return `
        <tr>
          <td style="border:1px solid #ddd;padding:8px;">${record.nepaliDate || "—"}</td>
          <td style="border:1px solid #ddd;padding:8px;">${dayName}</td>
          <td style="border:1px solid #ddd;padding:8px;">${toNPT(record.checkIn)}</td>
          <td style="border:1px solid #ddd;padding:8px;">${toNPT(record.checkOut)}</td>
          <td style="border:1px solid #ddd;padding:8px;">
            <span style="background:${
              status === "present"
                ? "#D1FAE5"
                : status === "absent"
                  ? "#FEE2E2"
                  : "#FEF3C7"
            };color:${
              status === "present"
                ? "#065F46"
                : status === "absent"
                  ? "#991B1B"
                  : "#92400E"
            };padding:2px 8px;border-radius:20px;">
              ${status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </td>
          <td style="border:1px solid #ddd;padding:8px;">${remarks}</td>
        </tr>`;
      })
      .join("");

    printWindow.document.write(`
      <html>
        <head><title>${title}</title>
        <style>
          body{font-family:Arial;margin:40px} h1{color:#1F2937}
          table{width:100%;border-collapse:collapse;margin-top:20px}
          th{background:#F9FAFB;border:1px solid #ddd;padding:10px;text-align:left}
          td{border:1px solid #ddd;padding:8px}
        </style></head>
        <body>
          <h1>${title}</h1>
          <p>Employee: ${user?.fullName || user?.name} (${user?.email})</p>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <table>
            <thead><tr><th>Date (BS)</th><th>Day</th><th>Check In</th><th>Check Out</th><th>Status</th><th>Remarks</th></tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
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
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    No attendance records found for this month
                  </td>
                </tr>
              ) : (
                attendanceRecords.map((record) => {
                  const isWeekend = record.status === "weekend";
                  const isHoliday = record.status === "holiday";
                  const dateObj = record.date ? new Date(record.date) : null;
                  const dayNames = [
                    "Sun",
                    "Mon",
                    "Tue",
                    "Wed",
                    "Thu",
                    "Fri",
                    "Sat",
                  ];
                  const dayName = dateObj ? dayNames[dateObj.getDay()] : "—";

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