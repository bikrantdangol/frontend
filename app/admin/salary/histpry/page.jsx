"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "../../../../lib/context";
import { useLang } from "../../../../lib/LangContext";

const MONTHS = [
  "बैशाख",
  "जेठ",
  "असार",
  "श्रावण",
  "भाद्र",
  "आश्विन",
  "कार्तिक",
  "मंसिर",
  "पुष",
  "माघ",
  "फाल्गुन",
  "चैत्र",
];

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const TEXT = {
  en: {
    breadcrumbAdmin: "Admin",
    breadcrumbSalary: "Salary Management",
    breadcrumbHistory: "Salary History",
    pageTitle: "Salary History",
    pageDesc: "Monthly salary records saved from Salary Entry",
    back: "Back to Salary Entry",
    monthsSaved: "Months Saved",
    totalRecords: "Salary Records",
    latestPeriod: "Latest Pay Period",
    totalSaved: "Total Saved Payroll",
    periodsTitle: "Saved Pay Periods",
    periodsDesc: "Each saved month is kept as one history entry",
    loading: "Loading salary history…",
    error: "Could not load salary history.",
    noHistory: "No salary history yet",
    noHistoryDesc: "Save a month from Salary Entry and it will appear here.",
    payPeriod: "Pay Period",
    savedOn: "Saved",
    employees: "employees",
    viewSheet: "View Salary Sheet",
    viewDetails: "View Details",
    hideDetails: "Hide Details",
    receipt: "View Receipt",
    colNum: "#",
    colName: "Name",
    colRole: "Role",
    colBase: "Base Salary",
    colSSF: "Social Security Fund",
    colContribution: "Staff Contribution",
    colBonus: "Bonus",
    colOvertime: "Overtime (hrs)",
    colOvertimePay: "Overtime Pay",
    colTotal: "Total",
  },
  np: {
    breadcrumbAdmin: "एडमिन",
    breadcrumbSalary: "तलब व्यवस्थापन",
    breadcrumbHistory: "तलब इतिहास",
    pageTitle: "तलब इतिहास",
    pageDesc: "तलब प्रविष्टिबाट सुरक्षित गरिएको मासिक तलब विवरण",
    back: "तलब प्रविष्टिमा फर्कनुहोस्",
    monthsSaved: "सुरक्षित महिना",
    totalRecords: "तलब रेकर्ड",
    latestPeriod: "पछिल्लो भुक्तानी अवधि",
    totalSaved: "कुल सुरक्षित तलब",
    periodsTitle: "सुरक्षित भुक्तानी अवधि",
    periodsDesc: "सुरक्षित गरिएको प्रत्येक महिना एक इतिहास प्रविष्टि हो",
    loading: "तलब इतिहास लोड हुँदैछ…",
    error: "तलब इतिहास लोड गर्न सकिएन।",
    noHistory: "अहिलेसम्म कुनै तलब इतिहास छैन",
    noHistoryDesc: "तलब प्रविष्टिबाट कुनै महिना सुरक्षित गर्नुहोस्, यो यहाँ देखा पर्नेछ।",
    payPeriod: "भुक्तानी अवधि",
    savedOn: "सुरक्षित",
    employees: "कर्मचारी",
    viewSheet: "तलब पाना हेर्नुहोस्",
    viewDetails: "विवरण हेर्नुहोस्",
    hideDetails: "विवरण लुकाउनुहोस्",
    receipt: "रसिद हेर्नुहोस्",
    colNum: "क्र.सं.",
    colName: "नाम",
    colRole: "पद",
    colBase: "आधार तलब",
    colSSF: "सामाजिक सुरक्षा कोष",
    colContribution: "कर्मचारी योगदान",
    colBonus: "बोनस",
    colOvertime: "ओभरटाइम (घण्टा)",
    colOvertimePay: "ओभरटाइम भुक्तानी",
    colTotal: "जम्मा",
  },
};

const fmt = (value) =>
  Number(value || 0).toLocaleString("en-NP", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const monthLabel = (month) => MONTHS[Number(month) - 1] || String(month);

const formatSavedAt = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
};

async function apiFetch(path, token) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export default function SalaryHistoryPage() {
  const router = useRouter();
  const { token } = useApp();
  const { lang } = useLang();
  const t = TEXT[lang] || TEXT.en;

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedKey, setExpandedKey] = useState(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    apiFetch("/api/salary/history", token)
      .then((data) => {
        if (cancelled) return;
        setHistory(Array.isArray(data?.history) ? data.history : []);
      })
      .catch((err) => {
        console.error("Salary history load failed:", err);
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const openSheet = (period, singleRecord = null) => {
    const rows = (singleRecord ? [singleRecord] : period.records).map((r) => ({
      ...r,
      id: r.employee,
      name: r.name,
      role: r.role,
      salary: r.baseSalary,
      overtime: r.overtimePay,
      totalSalary: r.totalSalary,
    }));
    sessionStorage.setItem(
      "salarySheetData",
      JSON.stringify({
        month: monthLabel(period.nepaliMonth),
        year: String(period.nepaliYear),
        nepaliMonth: period.nepaliMonth,
        settings: {},
        rows,
      }),
    );
    router.push("/admin/salary/sheet");
  };

  const totalPayroll = history.reduce((sum, p) => sum + (p.totalPayroll || 0), 0);
  const totalRecords = history.reduce((sum, p) => sum + (p.totalEmployees || 0), 0);
  const latest = history[0];

  const cards = [
    { label: t.monthsSaved, value: history.length, color: "text-gray-900", bg: "bg-gray-50", border: "border-gray-200" },
    { label: t.totalRecords, value: totalRecords, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    {
      label: t.latestPeriod,
      value: latest ? `${monthLabel(latest.nepaliMonth)} ${latest.nepaliYear}` : "—",
      color: "text-violet-600",
      bg: "bg-violet-50",
      border: "border-violet-100",
    },
    {
      label: t.totalSaved,
      value: `NPR ${fmt(totalPayroll)}`,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Breadcrumb */}
      <div className="border-b border-gray-200 px-6 py-4 flex items-center gap-2 text-sm text-gray-400 bg-gray-50">
        <span>{t.breadcrumbAdmin}</span>
        <span>/</span>
        <span>{t.breadcrumbSalary}</span>
        <span>/</span>
        <span className="text-gray-700 font-medium">{t.breadcrumbHistory}</span>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {t.pageTitle}
            </h1>
            <p className="text-gray-500 text-sm mt-1">{t.pageDesc}</p>
          </div>
          <Link
            href="/admin/salary"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:text-gray-900 hover:border-gray-400 transition-all shadow-sm no-underline"
          >
            {t.back}
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {cards.map((card) => (
            <div
              key={card.label}
              className={`${card.bg} border ${card.border} rounded-xl p-4`}
            >
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                {card.label}
              </p>
              <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* History List */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-800">
              {t.periodsTitle}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{t.periodsDesc}</p>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <p className="text-gray-400 text-sm">{t.loading}</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center">
              <p className="text-red-500 text-sm">{t.error}</p>
            </div>
          ) : history.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-gray-700 text-sm font-medium">{t.noHistory}</p>
              <p className="text-gray-400 text-xs mt-1">{t.noHistoryDesc}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {history.map((period) => {
                const key = `${period.nepaliYear}-${period.nepaliMonth}`;
                const expanded = expandedKey === key;
                return (
                  <div key={key}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">
                            {monthLabel(period.nepaliMonth)} {period.nepaliYear}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {period.totalEmployees} {t.employees} · {t.savedOn}{" "}
                            {formatSavedAt(period.savedAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold">
                          NPR {fmt(period.totalPayroll)}
                        </span>
                        <button
                          onClick={() => setExpandedKey(expanded ? null : key)}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50"
                        >
                          {expanded ? t.hideDetails : t.viewDetails}
                        </button>
                        <button
                          onClick={() => openSheet(period)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-200"
                        >
                          {t.viewSheet}
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <div className="overflow-x-auto border-t border-gray-100">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                              {[
                                t.colNum,
                                t.colName,
                                t.colRole,
                                t.colBase,
                                t.colSSF,
                                t.colContribution,
                                t.colBonus,
                                t.colOvertime,
                                t.colOvertimePay,
                                t.colTotal,
                                "",
                              ].map((header, i) => (
                                <th
                                  key={i}
                                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {(period.records || []).map((record, idx) => (
                              <tr key={record._id || record.employee} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-gray-400 text-sm">{idx + 1}</td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-800 whitespace-nowrap">
                                  {record.name}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 border border-gray-200 text-xs font-medium">
                                    {record.role}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">NPR {fmt(record.baseSalary)}</td>
                                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">NPR {fmt(record.socialSecurityFund)}</td>
                                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">NPR {fmt(record.staffContribution)}</td>
                                <td className="px-4 py-3 text-sm text-emerald-600 whitespace-nowrap">NPR {fmt(record.bonus)}</td>
                                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{fmt(record.overtimeHours)}</td>
                                <td className="px-4 py-3 text-sm text-violet-600 whitespace-nowrap">NPR {fmt(record.overtimePay)}</td>
                                <td className="px-4 py-3 text-sm text-blue-600 font-bold whitespace-nowrap">NPR {fmt(record.totalSalary)}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <button
                                    onClick={() => openSheet(period, record)}
                                    className="px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 text-xs font-semibold hover:bg-blue-50"
                                  >
                                    {t.receipt}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}