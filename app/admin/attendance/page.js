"use client";
import { useState, useEffect, useRef } from "react";
import { useApp, ROLE_META } from "../../../lib/context";
import { useLang } from "../../../lib/LangContext";
import { getTodayBS, BS_MONTHS_EN } from "../../../lib/calendar";
import { Calendar, Users, TrendingUp, Clock, Search, Eye, Printer } from "lucide-react";
import Link from "next/link";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const ROLE_COLOR = {
  admin:      "bg-blue-100   text-blue-700",
  staff:      "bg-green-100  text-green-700",
  accountant: "bg-purple-100 text-purple-700",
  helper:     "bg-yellow-100 text-yellow-700",
  user:       "bg-gray-100   text-gray-600",
};

const TEXT = {
  en: {
    pageTitle:       "Attendance Management",
    pageDesc:        "Track and manage employee attendance records",
    monthly:         "Monthly",
    yearly:          "Yearly",
    officialReport:  "Official Report",
    totalEmployees:  "Total Employees",
    totalPresent:    "Total Present",
    totalLate:       "Total Late",
    tableTitle:      "Employee Attendance Summary",
    tableSubtitle:   (type, month, year) => `${type} overview · ${month} ${year} BS`,
    employees:       (n) => `${n} employees`,
    colEmployee:     "Employee",
    colRole:         "Role",
    colPresent:      "Present",
    colLate:         "Late",
    colAbsent:       "Absent",
    colDetail:       "Detail",
    noEmployees:     "No employees found",
    noEmployeesHint: "Try a different search term",
    showing:         (n) => `Showing ${n} employees`,
    legendPresent:   "Present",
    legendLate:      "Late",
    legendAbsent:    "Absent",
    searchPlaceholder: "Search by name, email or role...",
    viewBtn:         "View",
    bsLabel:         "BS",
    yearLabel:       "Year",
    reportFailed:    "Failed to generate or download report.",
  },
  np: {
    pageTitle:       "हाजिरी व्यवस्थापन",
    pageDesc:        "कर्मचारी हाजिरी रेकर्डहरू ट्र्याक र व्यवस्थापन गर्नुस्",
    monthly:         "मासिक",
    yearly:          "वार्षिक",
    officialReport:  "आधिकारिक रिपोर्ट",
    totalEmployees:  "कुल कर्मचारी",
    totalPresent:    "कुल उपस्थित",
    totalLate:       "कुल ढिलो",
    tableTitle:      "कर्मचारी हाजिरी सारांश",
    tableSubtitle:   (type, month, year) => `${type} अवलोकन · ${month} ${year} बि.सं.`,
    employees:       (n) => `${n} कर्मचारी`,
    colEmployee:     "कर्मचारी",
    colRole:         "पद",
    colPresent:      "उपस्थित",
    colLate:         "ढिलो",
    colAbsent:       "अनुपस्थित",
    colDetail:       "विवरण",
    noEmployees:     "कुनै कर्मचारी भेटिएन",
    noEmployeesHint: "फरक खोजी शब्द प्रयास गर्नुस्",
    showing:         (n) => `${n} कर्मचारी देखाइँदैछ`,
    legendPresent:   "उपस्थित",
    legendLate:      "ढिलो",
    legendAbsent:    "अनुपस्थित",
    searchPlaceholder: "नाम, इमेल वा पदले खोज्नुस्...",
    viewBtn:         "हेर्नुस्",
    bsLabel:         "बि.सं.",
    yearLabel:       "वर्ष",
    reportFailed:    "रिपोर्ट उत्पन्न वा डाउनलोड गर्न असफल।",
  },
};

export default function AdminAttendancePage() {
  const { token }  = useApp();
  const { lang }   = useLang();
  const t          = TEXT[lang] || TEXT.en;
  const today      = getTodayBS();

  const [users,         setUsers]         = useState([]);
  const [selectedYear,  setSelectedYear]  = useState(today.year);
  const [selectedMonth, setSelectedMonth] = useState(today.month);
  const [searchTerm,    setSearchTerm]    = useState("");
  const [reportType,    setReportType]    = useState("monthly");
  const [loading,       setLoading]       = useState(true);
  const [userStats,     setUserStats]     = useState({});
  const [overallStats,  setOverallStats]  = useState({ present: 0, late: 0, absent: 0 });
  const [reportLoading, setReportLoading] = useState(false);
  const fetchingRef = useRef(false);

  useEffect(() => {
    if (!token) return;
    const loadData = async () => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      let userList = [];
      try {
        const { data } = await axios.get(`${API}/api/users`, { headers });
        userList = (data.users || []).filter(u => !u.isAdmin);
        setUsers(userList);
      } catch (err) {
        console.error("Failed to fetch users:", err?.message);
        fetchingRef.current = false;
        setLoading(false);
        return;
      }
      const statsMap = {};
      let totalPresent = 0, totalLate = 0, totalAbsent = 0;
      await Promise.allSettled(
        userList.map(async u => {
          const userId = u._id || u.id;
          try {
            const { data } = await axios.get(`${API}/api/attendance/user/${userId}/summary`, {
              headers, params: { nepaliYear: selectedYear, nepaliMonth: selectedMonth },
            });
            const records = data.records || [];
            const present = records.filter(r => r.checkIn || r.checkOut).length;
            const late    = data.summary?.lateDays   || 0;
            const absent  = data.summary?.absentDays || 0;
            statsMap[userId] = { present, late, absent };
            totalPresent += present; totalLate += late; totalAbsent += absent;
          } catch { statsMap[userId] = { present: 0, late: 0, absent: 0 }; }
        })
      );
      setUserStats(statsMap);
      setOverallStats({ present: totalPresent, late: totalLate, absent: totalAbsent });
      setLoading(false);
      fetchingRef.current = false;
    };
    loadData();
  }, [token, selectedYear, selectedMonth]);

  const filteredUsers = users.filter(u => {
    const q = searchTerm.toLowerCase();
    return (u.fullName || "").toLowerCase().includes(q) ||
           (u.email    || "").toLowerCase().includes(q) ||
           (u.role     || "").toLowerCase().includes(q);
  });

  const getStats = userId => userStats[userId] || { present: 0, late: 0, absent: 0 };

  const prevPeriod = () => {
    if (reportType === "monthly") {
      if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1); }
      else setSelectedMonth(m => m - 1);
    } else setSelectedYear(y => y - 1);
  };

  const nextPeriod = () => {
    if (reportType === "monthly") {
      if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1); }
      else setSelectedMonth(m => m + 1);
    } else setSelectedYear(y => y + 1);
  };

  const handleOfficialReport = async () => {
    if (!token) return;
    setReportLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const { data } = await axios.post(`${API}/api/reports/official/monthly`, {}, { headers, params: { nepaliYear: selectedYear, nepaliMonth: selectedMonth } });
      if (!data.downloadUrl) { alert("Failed to generate report"); return; }
      const blobRes = await axios.get(`${API}${data.downloadUrl}`, { headers, responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([blobRes.data]));
      const a   = Object.assign(document.createElement("a"), { href: url, download: `Attendance_Report_${BS_MONTHS_EN[selectedMonth - 1]}_${selectedYear}.pdf` });
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); a.remove();
    } catch (err) {
      console.error("Report error:", err?.message);
      alert(t.reportFailed);
    } finally { setReportLoading(false); }
  };

  const STAT_CARDS = [
    { icon: Users,      label: t.totalEmployees, value: filteredUsers.length, iconCls: "text-blue-500",   valCls: "text-gray-800"   },
    { icon: TrendingUp, label: t.totalPresent,   value: overallStats.present, iconCls: "text-green-500",  valCls: "text-green-600"  },
    { icon: Clock,      label: t.totalLate,      value: overallStats.late,    iconCls: "text-orange-500", valCls: "text-orange-600" },
  ];

  const periodLabel = reportType === "monthly"
    ? `${BS_MONTHS_EN[selectedMonth - 1]} ${selectedYear} ${t.bsLabel}`
    : `${t.yearLabel} ${selectedYear} ${t.bsLabel}`;

  const tableSubtitle = t.tableSubtitle(
    reportType === "monthly" ? t.monthly : t.yearly,
    BS_MONTHS_EN[selectedMonth - 1],
    selectedYear
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{t.pageTitle}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.pageDesc}</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex bg-gray-100 rounded-xl p-1">
            {[["monthly", t.monthly], ["yearly", t.yearly]].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setReportType(val)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  reportType === val ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={handleOfficialReport}
            disabled={reportLoading}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-sm font-semibold border border-red-100 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {reportLoading
              ? <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"/>
              : <Printer size={15}/>
            }
            {t.officialReport}
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STAT_CARDS.map(({ icon: Icon, label, value, iconCls, valCls }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={15} className={iconCls}/>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
            </div>
            <p className={`text-3xl font-extrabold leading-none ${valCls}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Period nav + Search */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3 py-2 shadow-sm w-fit">
          <button onClick={prevPeriod} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="flex items-center gap-2 px-2">
            <Calendar size={16} className="text-gray-400"/>
            <span className="font-bold text-gray-800 text-sm min-w-36 text-center">{periodLabel}</span>
          </div>
          <button onClick={nextPeriod} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all bg-white"
          />
        </div>
      </div>

      {/* Attendance table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-800">{t.tableTitle}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{tableSubtitle}</p>
          </div>
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full font-medium">{t.employees(filteredUsers.length)}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {[
                  { label: t.colEmployee, align: "left"   },
                  { label: t.colRole,     align: "left"   },
                  { label: t.colPresent,  align: "center" },
                  { label: t.colLate,     align: "center" },
                  { label: t.colAbsent,   align: "center" },
                  { label: t.colDetail,   align: "center" },
                ].map(h => (
                  <th key={h.label} className={`px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-${h.align}`}>{h.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: j === 0 ? "70%" : "50%" }}/>
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="text-3xl mb-2 opacity-20">👥</div>
                    <p className="text-sm font-semibold text-gray-400">{t.noEmployees}</p>
                    <p className="text-xs text-gray-300 mt-1">{t.noEmployeesHint}</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  const userId  = u._id || u.id;
                  const stats   = getStats(userId);
                  const rc      = ROLE_META[u.role] || { label: u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : "Unknown" };
                  const roleCls = ROLE_COLOR[u.role] || ROLE_COLOR.user;
                  const initial = (u.fullName || u.name || "?")[0].toUpperCase();
                  return (
                    <tr key={userId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">{initial}</div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800 leading-tight">{u.fullName || u.name}</p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${roleCls}`}>{rc.label}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center"><span className="text-green-600 font-bold text-sm">{stats.present}</span></td>
                      <td className="px-4 py-3.5 text-center"><span className="text-orange-500 font-bold text-sm">{stats.late}</span></td>
                      <td className="px-4 py-3.5 text-center"><span className="text-red-500 font-bold text-sm">{stats.absent}</span></td>
                      <td className="px-4 py-3.5 text-center">
                        <Link href={`/admin/attendance/${userId}?year=${selectedYear}&month=${selectedMonth}&type=${reportType}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors">
                          <Eye size={13}/> {t.viewBtn}
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex flex-wrap justify-between items-center gap-2">
          <p className="text-xs text-gray-400">{t.showing(filteredUsers.length)}</p>
          <div className="flex gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"/> {t.legendPresent}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block"/> {t.legendLate}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"/> {t.legendAbsent}</span>
          </div>
        </div>
      </div>
    </div>
  );
}