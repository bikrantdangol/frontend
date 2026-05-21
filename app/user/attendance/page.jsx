"use client";

import { useState, useEffect, useCallback } from "react";
import { useApp } from "../../../lib/context";
import { useLang } from "../../../lib/LangContext";
import { getTodayBS, BS_MONTHS_EN } from "../../../lib/calendar";
import { Calendar, CheckCircle, XCircle, Clock, Printer } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ─── Month name arrays ────────────────────────────────────────────────────────
const BS_MONTHS_NP = [
  "बैशाख","जेठ","असार","साउन","भदौ","असोज",
  "कार्तिक","मंसिर","पुष","माघ","फागुन","चैत",
];

const toNPT = (utcDate) => {
  if (!utcDate) return "—";
  return new Date(utcDate).toLocaleTimeString("en-US", {
    timeZone: "Asia/Kathmandu",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatWorked = (record, lang) => {
  const total = (record.workingMinutes || 0) + (record.overtimeMinutes || 0);
  if (total === 0) return "—";
  const h = Math.floor(total / 60);
  const m = total % 60;
  return lang === "np" ? `${h}घ ${m}मि` : `${h}h ${m}m`;
};

const TEXT = {
  en: {
    pageTitle:       "My Attendance",
    pageDesc:        "Track your daily attendance records",
    downloadPdf:     "Download PDF",
    presentDays:     "Present Days",
    lateDays:        "Late Days",
    absentDays:      "Absent Days",
    dailyRecord:     "Daily Attendance Record",
    dailyRecordDesc: "Your check-in and check-out details (Nepal Time)",
    colDate:         "Date (BS)",
    colDay:          "Day",
    colCheckIn:      "Check In",
    colCheckOut:     "Check Out",
    colWorked:       "Worked",
    colStatus:       "Status",
    colRemarks:      "Remarks",
    loading:         "Loading...",
    noRecords:       "No attendance records found for this month",
    otIn:            "OT In",
    otOut:           "OT Out",
    statusPresent:   "Present",
    statusLate:      "Late",
    statusAbsent:    "Absent",
    statusOnLeave:   "On Leave",
    statusHoliday:   "Holiday",
    statusWeekend:   "Weekend",
    statusHalfDay:   "Half Day",
    remarkLateEarly: "Late in & early out",
    remarkLate:      "Late check-in",
    remarkEarly:     "Early check-out",
    otLabel:         "OT",
    // PDF
    pdfTitle:        "Attendance Report",
    pdfRecords:      (n) => `${n} records`,
    pdfDateLabel:    "Date Generated",
    pdfPresent:      "Present",
    pdfLate:         "Late",
    pdfAbsent:       "Absent",
    pdfTotalDays:    "Total Days",
    pdfSN:           "#",
    pdfDateBS:       "Date (BS)",
    pdfDay:          "Day",
    pdfCheckIn:      "Check In",
    pdfCheckOut:     "Check Out",
    pdfWorked:       "Worked",
    pdfStatus:       "Status",
    pdfRemarks:      "Remarks",
    pdfGenerated:    (date) => `Generated on ${date}`,
    pdfTotal:        (n) => `Total ${n} records`,
    pdfRole:         "Role",
    workedUnit:      (h, m) => `${h}h ${String(m).padStart(2,"0")}m`,
    otUnit:          (h, m) => `OT: ${h}h ${m}m`,
  },
  np: {
    pageTitle:       "मेरो हाजिरी",
    pageDesc:        "आफ्नो दैनिक हाजिरी रेकर्ड ट्र्याक गर्नुस्",
    downloadPdf:     "PDF डाउनलोड गर्नुस्",
    presentDays:     "उपस्थित दिनहरू",
    lateDays:        "ढिलो दिनहरू",
    absentDays:      "अनुपस्थित दिनहरू",
    dailyRecord:     "दैनिक हाजिरी रेकर्ड",
    dailyRecordDesc: "तपाईंको चेक-इन र चेक-आउट विवरण (नेपाल समय)",
    colDate:         "मिति (बि.सं.)",
    colDay:          "दिन",
    colCheckIn:      "चेक इन",
    colCheckOut:     "चेक आउट",
    colWorked:       "काम गरेको",
    colStatus:       "स्थिति",
    colRemarks:      "टिप्पणी",
    loading:         "लोड हुँदैछ...",
    noRecords:       "यो महिनाका लागि कुनै हाजिरी रेकर्ड भेटिएन",
    otIn:            "OT इन",
    otOut:           "OT आउट",
    statusPresent:   "उपस्थित",
    statusLate:      "ढिलो",
    statusAbsent:    "अनुपस्थित",
    statusOnLeave:   "बिदामा",
    statusHoliday:   "बिदा",
    statusWeekend:   "सप्ताहन्त",
    statusHalfDay:   "आधा दिन",
    remarkLateEarly: "ढिलो आउनु र चाँडो जानु",
    remarkLate:      "ढिलो चेक-इन",
    remarkEarly:     "चाँडो चेक-आउट",
    otLabel:         "OT",
    // PDF
    pdfTitle:        "हाजिरी रिपोर्ट",
    pdfRecords:      (n) => `${n} रेकर्डहरू`,
    pdfDateLabel:    "मिति तयार गरिएको",
    pdfPresent:      "उपस्थित",
    pdfLate:         "ढिलो",
    pdfAbsent:       "अनुपस्थित",
    pdfTotalDays:    "कुल दिनहरू",
    pdfSN:           "क्र.सं.",
    pdfDateBS:       "मिति (बि.सं.)",
    pdfDay:          "दिन",
    pdfCheckIn:      "आगमन",
    pdfCheckOut:     "प्रस्थान",
    pdfWorked:       "काम गरेको",
    pdfStatus:       "स्थिति",
    pdfRemarks:      "कैफियत",
    pdfGenerated:    (date) => `तयार गरिएको: ${date}`,
    pdfTotal:        (n) => `जम्मा ${n} रेकर्डहरू`,
    pdfRole:         "भूमिका",
    workedUnit:      (h, m) => `${h}घ ${String(m).padStart(2,"0")}मि`,
    otUnit:          (h, m) => `OT: ${h}घ ${m}मि`,
  },
};

const TH = ({ children }) => (
  <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">
    {children}
  </th>
);

export default function UserAttendancePage() {
  const { user, token } = useApp();
  const { lang }        = useLang();
  const t               = TEXT[lang] || TEXT.en;
  const today           = getTodayBS();

  // Use correct month names based on lang
  const BS_MONTHS = lang === "np" ? BS_MONTHS_NP : BS_MONTHS_EN;

  const [selectedYear,       setSelectedYear]       = useState(today.year);
  const [selectedMonth,      setSelectedMonth]      = useState(today.month);
  const [attendanceRecords,  setAttendanceRecords]  = useState([]);
  const [loading,            setLoading]            = useState(false);
  const [stats,              setStats]              = useState({ present: 0, late: 0, absent: 0 });

  const fetchAttendance = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API}/api/attendance/my/summary?nepaliYear=${selectedYear}&nepaliMonth=${selectedMonth}`,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } },
      );
      if (!res.ok) return;
      const records = (await res.json()).records || [];
      const uniqueMap = {};
      records.forEach((r) => {
        if (!uniqueMap[r.nepaliDate] || (!uniqueMap[r.nepaliDate].checkIn && r.checkIn))
          uniqueMap[r.nepaliDate] = r;
      });
      const sorted = Object.values(uniqueMap).sort((a, b) => new Date(a.date) - new Date(b.date));
      setAttendanceRecords(sorted);
      setStats({
        present: sorted.filter((r) => r.checkIn || r.checkOut).length,
        late:    sorted.filter((r) => r.isLate === true).length,
        absent:  sorted.filter((r) => r.status === "absent").length,
      });
    } catch (e) {
      console.error("Attendance fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [token, selectedYear, selectedMonth]);

  useEffect(() => { fetchAttendance(); }, []);

  const prevMonth = () => {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear((y) => y - 1); }
    else setSelectedMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear((y) => y + 1); }
    else setSelectedMonth((m) => m + 1);
  };

  // ── Remarks (lang-aware) ──────────────────────────────────────────────────
  const getRemarks = (record) => {
    const parts = [];
    if (record.isLate && record.isEarlyLeave) parts.push(t.remarkLateEarly);
    else if (record.isLate)       parts.push(t.remarkLate);
    else if (record.isEarlyLeave) parts.push(t.remarkEarly);
    const ot = record.overtimeMinutes || 0;
    if (ot > 0) parts.push(t.otUnit(Math.floor(ot / 60), ot % 60));
    return parts.length > 0 ? parts.join(" · ") : "—";
  };

  // ── Status badge (lang-aware) ─────────────────────────────────────────────
  const getStatusBadge = (status, isLate) => {
    if (status === "present" && isLate)
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700"><Clock size={12} /> {t.statusLate}</span>;
    const map = {
      present:    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle size={12} /> {t.statusPresent}</span>,
      absent:     <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700"><XCircle size={12} /> {t.statusAbsent}</span>,
      "on-leave": <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"><Clock size={12} /> {t.statusOnLeave}</span>,
      holiday:    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">{t.statusHoliday}</span>,
      weekend:    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">{t.statusWeekend}</span>,
      "half-day": <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">{t.statusHalfDay}</span>,
    };
    return map[status] || <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">—</span>;
  };

  // ── PDF export — landscape, blue header, emp bar, pills, styled table ─────
  const exportPDF = () => {
    const monthName    = BS_MONTHS[selectedMonth - 1];
    const userName     = user?.fullName || user?.name || (lang === "np" ? "अज्ञात" : "Unknown");
    const userRole     = user?.role
      ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
      : "—";
    const generatedDate = new Date().toLocaleDateString(
      lang === "np" ? "ne-NP" : "en-US",
      { year: "numeric", month: "long", day: "numeric" },
    );

    // Status badge for PDF
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
      const label = isLatePresent
        ? t.pdfLate
        : (() => {
            const map = {
              present:    t.pdfPresent,
              absent:     t.pdfAbsent,
              "on-leave": t.statusOnLeave,
              holiday:    t.statusHoliday,
              weekend:    t.statusWeekend,
              "half-day": t.statusHalfDay,
            };
            return map[status] || (status ? status.charAt(0).toUpperCase() + status.slice(1) : "—");
          })();
      const s = styles[key] || { bg: "#F3F4F6", color: "#374151" };
      return `<span style="background:${s.bg};color:${s.color};padding:2px 10px;border-radius:20px;font-size:10.5px;font-weight:600;white-space:nowrap;">${label}</span>`;
    };

    const tableRows = attendanceRecords.map((r, i) => {
      const isOffDay   = r.status === "weekend" || r.status === "holiday";
      const checkInStr = isOffDay
        ? (r.checkIn ? `${t.otIn}: ${toNPT(r.checkIn)}` : "—")
        : toNPT(r.checkIn);
      const checkOutStr = isOffDay
        ? (r.checkOut ? `${t.otOut}: ${toNPT(r.checkOut)}` : "—")
        : toNPT(r.checkOut);

      const total = (r.workingMinutes || 0) + (r.overtimeMinutes || 0);
      const workedStr = total
        ? t.workedUnit(Math.floor(total / 60), total % 60)
        : "—";

      const remarkParts = [];
      if (r.isLate && r.isEarlyLeave) remarkParts.push(t.remarkLateEarly);
      else if (r.isLate)       remarkParts.push(t.remarkLate);
      else if (r.isEarlyLeave) remarkParts.push(t.remarkEarly);
      const ot = r.overtimeMinutes || 0;
      if (ot > 0) remarkParts.push(t.otUnit(Math.floor(ot / 60), ot % 60));
      const remarkStr = remarkParts.join(" · ") || "—";

      const rowBg = i % 2 === 0 ? "#ffffff" : "#f9fafb";
      return `
      <tr style="background:${rowBg};">
        <td style="border:1px solid #e5e7eb;padding:6px 9px;text-align:center;color:#9ca3af;">${i + 1}</td>
        <td style="border:1px solid #e5e7eb;padding:6px 9px;font-weight:600;">${r.nepaliDate || "—"}</td>
        <td style="border:1px solid #e5e7eb;padding:6px 9px;color:#6b7280;">${r.dayName || "—"}</td>
        <td style="border:1px solid #e5e7eb;padding:6px 9px;">${checkInStr}</td>
        <td style="border:1px solid #e5e7eb;padding:6px 9px;">${checkOutStr}</td>
        <td style="border:1px solid #e5e7eb;padding:6px 9px;text-align:center;font-weight:700;color:#1d4ed8;">${workedStr}</td>
        <td style="border:1px solid #e5e7eb;padding:6px 9px;text-align:center;">${statusBadgePDF(r.status, r.isLate)}</td>
        <td style="border:1px solid #e5e7eb;padding:6px 9px;color:#6b7280;font-size:10.5px;">${remarkStr}</td>
      </tr>`;
    }).join("");

    const win = window.open("", "_blank");
    win.document.write(`
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

          <!-- Page header -->
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
            <div class="pill pill-green"><div class="val">${stats.present}</div><div class="lbl">${t.pdfPresent}</div></div>
            <div class="pill pill-orange"><div class="val">${stats.late}</div><div class="lbl">${t.pdfLate}</div></div>
            <div class="pill pill-red"><div class="val">${stats.absent}</div><div class="lbl">${t.pdfAbsent}</div></div>
            <div class="pill pill-blue"><div class="val">${attendanceRecords.length}</div><div class="lbl">${t.pdfTotalDays}</div></div>
          </div>

          <!-- Table -->
          <table>
            <thead>
              <tr>
                <th style="width:32px;">${t.pdfSN}</th>
                <th style="width:88px;">${t.pdfDateBS}</th>
                <th style="width:48px;">${t.pdfDay}</th>
                <th style="width:74px;">${t.pdfCheckIn}</th>
                <th style="width:74px;">${t.pdfCheckOut}</th>
                <th style="width:72px;">${t.pdfWorked}</th>
                <th style="width:86px;">${t.pdfStatus}</th>
                <th>${t.pdfRemarks}</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>

          <!-- Footer -->
          <div class="footer">
            <span>${t.pdfGenerated(generatedDate)}</span>
            <span>${monthName} ${selectedYear} &nbsp;·&nbsp; ${t.pdfTotal(attendanceRecords.length)}</span>
          </div>

        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t.pageTitle}</h1>
          <p className="text-gray-500 text-sm mt-1">{t.pageDesc}</p>
        </div>
        <button
          onClick={exportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
        >
          <Printer size={16} /> {t.downloadPdf}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: t.presentDays, value: stats.present, color: "text-green-600" },
          { label: t.lateDays,    value: stats.late,    color: "text-orange-600" },
          { label: t.absentDays,  value: stats.absent,  color: "text-red-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">◀</button>
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-gray-400" />
          <span className="font-semibold text-gray-800">
            {BS_MONTHS[selectedMonth - 1]} {selectedYear}
          </span>
        </div>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">▶</button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-semibold text-gray-800">{t.dailyRecord}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{t.dailyRecordDesc}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <TH>{t.colDate}</TH>
                <TH>{t.colDay}</TH>
                <TH>{t.colCheckIn}</TH>
                <TH>{t.colCheckOut}</TH>
                <TH>{t.colWorked}</TH>
                <TH>{t.colStatus}</TH>
                <TH>{t.colRemarks}</TH>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-400">{t.loading}</td></tr>
              ) : attendanceRecords.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-400">{t.noRecords}</td></tr>
              ) : (
                attendanceRecords.map((record, idx) => {
                  const isOffDay = record.status === "weekend" || record.status === "holiday";
                  return (
                    <tr key={record._id || idx} className={`transition-colors ${isOffDay ? "bg-red-50/30" : "hover:bg-gray-50"}`}>
                      <td className="p-3 text-sm text-gray-700 font-medium">{record.nepaliDate || "—"}</td>
                      <td className="p-3 text-sm text-gray-500">{record.dayName || "—"}</td>
                      <td className="p-3 text-sm text-gray-700">
                        {isOffDay
                          ? record.checkIn ? `${t.otIn}: ${toNPT(record.checkIn)}` : "—"
                          : toNPT(record.checkIn)}
                      </td>
                      <td className="p-3 text-sm text-gray-700">
                        {isOffDay
                          ? record.checkOut ? `${t.otOut}: ${toNPT(record.checkOut)}` : "—"
                          : toNPT(record.checkOut)}
                      </td>
                      <td className="p-3 text-sm text-gray-700 font-medium">{formatWorked(record, lang)}</td>
                      <td className="p-3">{getStatusBadge(record.status, record.isLate)}</td>
                      <td className="p-3 text-sm text-gray-500">{getRemarks(record)}</td>
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