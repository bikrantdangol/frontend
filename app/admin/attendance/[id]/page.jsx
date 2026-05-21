"use client";
import { useState, useEffect } from "react";
import { useApp, ROLE_META } from "../../../../lib/context";
import { useLang } from "../../../../lib/LangContext";
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

// ─── Month / Day name arrays ──────────────────────────────────────────────────
const BS_MONTHS_NP = [
  "बैशाख","जेठ","असार","साउन","भदौ","असोज",
  "कार्तिक","मंसिर","पुष","माघ","फागुन","चैत",
];
const DAY_NAMES_NP = ["आइत","सोम","मंगल","बुध","बिहि","शुक्र","शनि"];
const DAY_NAMES_EN = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ─── Translations ─────────────────────────────────────────────────────────────
const TEXT = {
  en: {
    pageTitle:        "Attendance Details",
    pageSubtitle:     (name) => `View attendance records for ${name}`,
    downloadPDF:      "Download PDF",
    loading:          "Loading...",
    loadingUser:      "Loading user data...",
    noRecords:        "No attendance records found for this month",
    dailyRecord:      "Daily Attendance Record",
    showing:          (n, month, year) => `Showing ${n} days in ${month} ${year}`,
    showingDays:      (n) => `Showing ${n} days`,
    presentDays:      "Present Days",
    lateDays:         "Late Days",
    absentDays:       "Absent Days",
    attendanceRate:   "Attendance Rate",
    dateBS:           "Date (BS)",
    day:              "Day",
    checkIn:          "Check In",
    checkOut:         "Check Out",
    duration:         "Duration",
    status:           "Status",
    remarks:          "Remarks",
    present:          "Present",
    late:             "Late",
    absent:           "Absent",
    onLeave:          "On Leave",
    holiday:          "Holiday",
    weekend:          "Weekend",
    halfDay:          "Half Day",
    lateIn:           "Late check-in",
    earlyOut:         "Early check-out",
    lateAndEarly:     "Late in & early out",
    legendPresent:    "Present",
    legendLate:       "Late",
    legendAbsent:     "Absent",
    // PDF strings
    pdfTitle:         "Attendance Report",
    pdfRecords:       (n) => `${n} records`,
    pdfDateLabel:     "Date Generated",
    pdfPresent:       "Present",
    pdfLate:          "Late",
    pdfAbsent:        "Absent",
    pdfTotalDays:     "Total Days",
    pdfSN:            "#",
    pdfDateCol:       "Date (BS)",
    pdfDay:           "Day",
    pdfCheckIn:       "Check In",
    pdfCheckOut:      "Check Out",
    pdfDuration:      "Duration",
    pdfStatus:        "Status",
    pdfRemarks:       "Remarks",
    pdfGenerated:     (date) => `Generated on ${date}`,
    pdfTotal:         (n) => `Total ${n} records`,
    durationUnit:     (h, m) => `${h}h ${m}m`,
    overtimeUnit:     (h, m) => `OT: ${h}h ${m}m`,
  },
  np: {
    pageTitle:        "हाजिरी विवरण",
    pageSubtitle:     (name) => `${name} को हाजिरी रेकर्ड हेर्नुहोस्`,
    downloadPDF:      "PDF डाउनलोड",
    loading:          "लोड हुँदैछ...",
    loadingUser:      "प्रयोगकर्ताको जानकारी लोड हुँदैछ...",
    noRecords:        "यस महिनाको लागि कुनै हाजिरी रेकर्ड भेटिएन",
    dailyRecord:      "दैनिक हाजिरी रेकर्ड",
    showing:          (n, month, year) => `${month} ${year} मा ${n} दिनहरू देखाइएको`,
    showingDays:      (n) => `${n} दिनहरू देखाइएको`,
    presentDays:      "उपस्थित दिनहरू",
    lateDays:         "ढिलो आएका दिनहरू",
    absentDays:       "अनुपस्थित दिनहरू",
    attendanceRate:   "हाजिरी दर",
    dateBS:           "मिति (बि.सं.)",
    day:              "बार",
    checkIn:          "आगमन",
    checkOut:         "प्रस्थान",
    duration:         "अवधि",
    status:           "स्थिति",
    remarks:          "कैफियत",
    present:          "उपस्थित",
    late:             "ढिलो",
    absent:           "अनुपस्थित",
    onLeave:          "बिदामा",
    holiday:          "सार्वजनिक बिदा",
    weekend:          "साप्ताहिक बिदा",
    halfDay:          "आधा दिन",
    lateIn:           "ढिलो उपस्थिति",
    earlyOut:         "चाँडो प्रस्थान",
    lateAndEarly:     "ढिलो आगमन र चाँडो प्रस्थान",
    legendPresent:    "उपस्थित",
    legendLate:       "ढिलो",
    legendAbsent:     "अनुपस्थित",
    // PDF strings
    pdfTitle:         "हाजिरी रिपोर्ट",
    pdfRecords:       (n) => `${n} रेकर्डहरू`,
    pdfDateLabel:     "मिति तयार गरिएको",
    pdfPresent:       "उपस्थित",
    pdfLate:          "ढिलो",
    pdfAbsent:        "अनुपस्थित",
    pdfTotalDays:     "कुल दिनहरू",
    pdfSN:            "क्र.सं.",
    pdfDateCol:       "मिति (बि.सं.)",
    pdfDay:           "बार",
    pdfCheckIn:       "आगमन",
    pdfCheckOut:      "प्रस्थान",
    pdfDuration:      "अवधि",
    pdfStatus:        "स्थिति",
    pdfRemarks:       "कैफियत",
    pdfGenerated:     (date) => `तयार गरिएको: ${date}`,
    pdfTotal:         (n) => `जम्मा ${n} रेकर्डहरू`,
    durationUnit:     (h, m) => `${h}घ ${m}मि`,
    overtimeUnit:     (h, m) => `ओटी: ${h}घ ${m}मि`,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toNPT = (utcDate) => {
  if (!utcDate) return "—";
  return new Date(utcDate).toLocaleTimeString("en-US", {
    timeZone: "Asia/Kathmandu",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const calcDuration = (checkIn, checkOut, t) => {
  if (!checkIn || !checkOut) return "—";
  const diffMs = new Date(checkOut) - new Date(checkIn);
  if (diffMs <= 0) return "—";
  const totalMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return t.durationUnit(hours, mins.toString().padStart(2, "0"));
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminUserAttendanceDetail() {
  const params = useParams();
  const userId = params.userId || params.id;
  const { token } = useApp();
  const { lang } = useLang();
  const t = TEXT[lang] || TEXT.en;
  const today = getTodayBS();

  // Month name arrays based on current lang
  const BS_MONTHS = lang === "np" ? BS_MONTHS_NP : BS_MONTHS_EN;
  const DAY_NAMES = lang === "np" ? DAY_NAMES_NP : DAY_NAMES_EN;

  const [user,              setUser]              = useState(null);
  const [selectedYear,      setSelectedYear]      = useState(today.year);
  const [selectedMonth,     setSelectedMonth]     = useState(today.month);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [stats,             setStats]             = useState({ present: 0, late: 0, absent: 0, rate: 0 });

  // 1. Fetch user info
  useEffect(() => {
    if (!token || !userId) return;
    fetch(`${API}/api/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => { if (data.user) setUser(data.user); })
      .catch(console.error);
  }, [token, userId]);

  // 2. Fetch attendance summary
  useEffect(() => {
    if (!token || !userId) return;
    const loadAttendance = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API}/api/attendance/user/${userId}/summary?nepaliYear=${selectedYear}&nepaliMonth=${selectedMonth}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await res.json();
        const records = data.records || [];
        setAttendanceRecords(records);

        const present = records.filter((r) => r.checkIn || r.checkOut).length;
        const late    = records.filter((r) => r.isLate === true).length;
        const absent  = records.filter(
          (r) => !r.checkIn && !r.checkOut &&
            r.status !== "weekend" && r.status !== "holiday" && r.status !== "on-leave",
        ).length;
        const total = present + late + absent;
        setStats({ present, late, absent, rate: total > 0 ? Math.round((present / total) * 100) : 0 });
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
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear((y) => y - 1); }
    else setSelectedMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear((y) => y + 1); }
    else setSelectedMonth((m) => m + 1);
  };

  // ── Status label helper (used by both PDF and UI) ──────────────────────────
  const getStatusLabel = (status, isLate) => {
    if (isLate && status === "present") return t.late;
    const map = {
      present:    t.present,
      absent:     t.absent,
      "on-leave": t.onLeave,
      holiday:    t.holiday,
      weekend:    t.weekend,
      "half-day": t.halfDay,
    };
    return map[status] || status || "—";
  };

  // ── Remarks helper ─────────────────────────────────────────────────────────
  const getRemarks = (record) => {
    const parts = [];
    if (record.isLate && record.isEarlyLeave)       parts.push(t.lateAndEarly);
    else if (record.isLate)                          parts.push(t.lateIn);
    else if (record.isEarlyLeave)                    parts.push(t.earlyOut);
    if (record.overtimeMinutes > 0)
      parts.push(t.overtimeUnit(
        Math.floor(record.overtimeMinutes / 60),
        record.overtimeMinutes % 60,
      ));
    return parts.join(" · ") || "—";
  };

  // ── PDF Export ─────────────────────────────────────────────────────────────
  const exportPDF = () => {
    const printWindow = window.open("", "_blank");
    const userName = user?.fullName || user?.name || (lang === "np" ? "अज्ञात" : "Unknown");
    const userRole = user?.role
      ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
      : "—";
    const generatedDate = new Date().toLocaleDateString(
      lang === "np" ? "ne-NP" : "en-US",
      { year: "numeric", month: "long", day: "numeric" },
    );

    const pdfDayNames = lang === "np" ? DAY_NAMES_NP : DAY_NAMES_EN;

    const presentCount = attendanceRecords.filter((r) => r.checkIn || r.checkOut).length;
    const lateCount    = attendanceRecords.filter((r) => r.isLate).length;
    const absentCount  = attendanceRecords.filter(
      (r) => !r.checkIn && !r.checkOut &&
        r.status !== "weekend" && r.status !== "holiday" && r.status !== "on-leave",
    ).length;

    const statusBadgePDF = (status, isLate) => {
      const styles = {
        present:    { bg: "#D1FAE5", color: "#065F46" },
        absent:     { bg: "#FEE2E2", color: "#991B1B" },
        "on-leave": { bg: "#DBEAFE", color: "#1E40AF" },
        holiday:    { bg: "#EDE9FE", color: "#5B21B6" },
        weekend:    { bg: "#F3F4F6", color: "#6B7280" },
        "half-day": { bg: "#FEF9C3", color: "#854D0E" },
      };
      const isLatePresent = isLate && status === "present";
      const key   = isLatePresent ? "present" : status;
      const label = getStatusLabel(status, isLate);
      const s     = styles[key] || { bg: "#F3F4F6", color: "#374151" };
      return `<span style="background:${s.bg};color:${s.color};padding:2px 10px;border-radius:20px;font-size:10.5px;font-weight:600;white-space:nowrap;">${label}</span>`;
    };

    const tableRows = attendanceRecords.map((record, i) => {
      const dateObj  = record.date ? new Date(record.date) : null;
      const dayName  = dateObj ? pdfDayNames[dateObj.getDay()] : "—";
      const duration = calcDuration(record.checkIn, record.checkOut, t);
      const remarks  = getRemarks(record);
      const rowBg    = i % 2 === 0 ? "#ffffff" : "#f9fafb";

      return `
      <tr style="background:${rowBg};">
        <td style="border:1px solid #e5e7eb;padding:6px 9px;text-align:center;color:#9ca3af;">${i + 1}</td>
        <td style="border:1px solid #e5e7eb;padding:6px 9px;font-weight:600;">${record.nepaliDate || "—"}</td>
        <td style="border:1px solid #e5e7eb;padding:6px 9px;color:#6b7280;">${dayName}</td>
        <td style="border:1px solid #e5e7eb;padding:6px 9px;">${toNPT(record.checkIn)}</td>
        <td style="border:1px solid #e5e7eb;padding:6px 9px;">${toNPT(record.checkOut)}</td>
        <td style="border:1px solid #e5e7eb;padding:6px 9px;text-align:center;font-weight:700;color:#1d4ed8;">${duration}</td>
        <td style="border:1px solid #e5e7eb;padding:6px 9px;text-align:center;">${statusBadgePDF(record.status, record.isLate)}</td>
        <td style="border:1px solid #e5e7eb;padding:6px 9px;color:#6b7280;font-size:10.5px;">${remarks}</td>
      </tr>`;
    }).join("");

    const monthName = BS_MONTHS[selectedMonth - 1];

    printWindow.document.write(`
      <html>
        <head>
          <title>${t.pdfTitle} — ${monthName} ${selectedYear}</title>
          <style>
            @page { size: A4 landscape; margin: 14mm 12mm; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Noto Sans Devanagari','Segoe UI',Arial,sans-serif; font-size: 12px; color: #1f2937; background: #fff; }
            .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px; padding-bottom:12px; border-bottom:2.5px solid #1d4ed8; }
            .page-header-left h1 { font-size:19px; font-weight:700; color:#1d4ed8; }
            .page-header-left p  { font-size:11.5px; color:#6b7280; margin-top:3px; }
            .page-header-right   { text-align:right; font-size:11px; color:#6b7280; line-height:1.8; }
            .page-header-right .date-label { font-size:10px; text-transform:uppercase; letter-spacing:0.5px; color:#9ca3af; }
            .page-header-right .date-value { font-size:12.5px; font-weight:700; color:#1f2937; }
            .emp-bar { display:flex; align-items:center; gap:14px; background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:9px 14px; margin-bottom:14px; }
            .emp-avatar { width:40px; height:40px; background:#1d4ed8; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:17px; font-weight:700; flex-shrink:0; }
            .emp-name { font-size:14px; font-weight:700; color:#1e3a8a; }
            .emp-role { font-size:10.5px; color:#2563eb; background:#dbeafe; padding:2px 10px; border-radius:20px; display:inline-block; margin-top:3px; font-weight:600; }
            .summary { display:flex; gap:10px; margin-bottom:14px; }
            .pill { flex:1; border-radius:8px; padding:7px 12px; text-align:center; }
            .pill .val { font-size:19px; font-weight:700; }
            .pill .lbl { font-size:9.5px; letter-spacing:0.3px; margin-top:2px; }
            .pill-green  { background:#d1fae5; color:#065f46; }
            .pill-orange { background:#ffedd5; color:#9a3412; }
            .pill-red    { background:#fee2e2; color:#991b1b; }
            .pill-blue   { background:#dbeafe; color:#1e40af; }
            table { width:100%; border-collapse:collapse; font-size:11.5px; }
            thead tr { background:#1d4ed8; color:white; }
            th { padding:8px 9px; text-align:left; font-weight:600; font-size:10.5px; border:1px solid #1e40af; }
            td { border:1px solid #e5e7eb; padding:6px 9px; vertical-align:middle; }
            .footer { margin-top:22px; display:flex; justify-content:space-between; font-size:10.5px; color:#9ca3af; border-top:1px solid #e5e7eb; padding-top:8px; }
          </style>
        </head>
        <body>
          <div class="page-header">
            <div class="page-header-left">
              <h1>${t.pdfTitle}</h1>
              <p>${monthName} ${selectedYear} &nbsp;·&nbsp; ${t.pdfRecords(attendanceRecords.length)}</p>
            </div>
            <div class="page-header-right">
              <div class="date-label">${t.pdfDateLabel}</div>
              <div class="date-value">${generatedDate}</div>
            </div>
          </div>

          <div class="emp-bar">
            <div class="emp-avatar">${userName.charAt(0).toUpperCase()}</div>
            <div>
              <div class="emp-name">${userName}</div>
              <div class="emp-role">${userRole}</div>
            </div>
          </div>

          <div class="summary">
            <div class="pill pill-green"><div class="val">${presentCount}</div><div class="lbl">${t.pdfPresent}</div></div>
            <div class="pill pill-orange"><div class="val">${lateCount}</div><div class="lbl">${t.pdfLate}</div></div>
            <div class="pill pill-red"><div class="val">${absentCount}</div><div class="lbl">${t.pdfAbsent}</div></div>
            <div class="pill pill-blue"><div class="val">${attendanceRecords.length}</div><div class="lbl">${t.pdfTotalDays}</div></div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width:32px;">${t.pdfSN}</th>
                <th style="width:88px;">${t.pdfDateCol}</th>
                <th style="width:48px;">${t.pdfDay}</th>
                <th style="width:74px;">${t.pdfCheckIn}</th>
                <th style="width:74px;">${t.pdfCheckOut}</th>
                <th style="width:72px;">${t.pdfDuration}</th>
                <th style="width:86px;">${t.pdfStatus}</th>
                <th>${t.pdfRemarks}</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>

          <div class="footer">
            <span>${t.pdfGenerated(generatedDate)}</span>
            <span>${monthName} ${selectedYear} &nbsp;·&nbsp; ${t.pdfTotal(attendanceRecords.length)}</span>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/admin/attendance" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">{t.pageTitle}</h1>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16">
          <p className="text-gray-500">{t.loadingUser}</p>
        </div>
      </div>
    );
  }

  const rc       = ROLE_META[user.role] || ROLE_META.user;
  const userName = user.fullName || user.name || (lang === "np" ? "अज्ञात" : "Unknown");
  const monthName = BS_MONTHS[selectedMonth - 1];

  // ── On-screen status badge ─────────────────────────────────────────────────
  const statusBadgeUI = (status, isLate) => {
    if (isLate && status === "present")
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700"><Clock size={12} /> {t.late}</span>;
    if (status === "present")
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle size={12} /> {t.present}</span>;
    if (status === "absent")
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700"><XCircle size={12} /> {t.absent}</span>;
    if (status === "on-leave")
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"><Clock size={12} /> {t.onLeave}</span>;
    if (status === "holiday")
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">{t.holiday}</span>;
    if (status === "weekend")
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">{t.weekend}</span>;
    if (status === "half-day")
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">{t.halfDay}</span>;
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">—</span>;
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/attendance" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{t.pageTitle}</h1>
            <p className="text-gray-500 text-sm mt-1">{t.pageSubtitle(userName)}</p>
          </div>
        </div>
        <button
          onClick={exportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
        >
          <Printer size={16} /> {t.downloadPDF}
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
          <p className="text-xs text-gray-500">{t.presentDays}</p>
          <p className="text-2xl font-bold text-green-600">{stats.present}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500">{t.lateDays}</p>
          <p className="text-2xl font-bold text-orange-600">{stats.late}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500">{t.absentDays}</p>
          <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <p className="text-xs text-blue-100">{t.attendanceRate}</p>
          <p className="text-2xl font-bold">{stats.rate}%</p>
          <div className="mt-1 h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full" style={{ width: `${stats.rate}%` }} />
          </div>
        </div>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg">◀</button>
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-gray-400" />
          <span className="font-semibold text-gray-800">{monthName} {selectedYear}</span>
        </div>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">▶</button>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-semibold text-gray-800">{t.dailyRecord}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {t.showing(attendanceRecords.length, monthName, selectedYear)}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {[t.dateBS, t.day, t.checkIn, t.checkOut, t.duration, t.status, t.remarks].map((h) => (
                  <th key={h} className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-400">{t.loading}</td></tr>
              ) : attendanceRecords.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-400">{t.noRecords}</td></tr>
              ) : (
                attendanceRecords.map((record) => {
                  const isWeekend = record.status === "weekend";
                  const isHoliday = record.status === "holiday";
                  const dateObj   = record.date ? new Date(record.date) : null;
                  const dayName   = dateObj ? DAY_NAMES[dateObj.getDay()] : "—";
                  const duration  = calcDuration(record.checkIn, record.checkOut, t);
                  const remarks   = getRemarks(record);

                  return (
                    <tr
                      key={record._id || record.nepaliDate}
                      className={`${isWeekend || isHoliday ? "bg-red-50/30" : "hover:bg-gray-50"} transition-colors`}
                    >
                      <td className="p-3 text-sm text-gray-700 font-medium">{record.nepaliDate || "—"}</td>
                      <td className="p-3 text-sm text-gray-500">{dayName}</td>
                      <td className="p-3 text-sm text-gray-700">{toNPT(record.checkIn)}</td>
                      <td className="p-3 text-sm text-gray-700">{toNPT(record.checkOut)}</td>
                      <td className="p-3 text-sm font-semibold text-blue-600">{duration}</td>
                      <td className="p-3">{statusBadgeUI(record.status, record.isLate)}</td>
                      <td className="p-3 text-sm text-gray-500">{remarks}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <p className="text-xs text-gray-500">{t.showingDays(attendanceRecords.length)}</p>
          <div className="flex gap-3 text-xs text-gray-400">
            <span><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>{t.legendPresent}</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-1"></span>{t.legendLate}</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span>{t.legendAbsent}</span>
          </div>
        </div>
      </div>
    </div>
  );
}