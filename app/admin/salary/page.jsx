"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../../lib/context";
import { useLang } from "../../../lib/LangContext";
import SalarySettingModal from "@/components/SalarySettingModal";

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

const YEARS = Array.from({ length: 10 }, (_, i) => String(2080 + i));

const API = process.env.NEXT_PUBLIC_API_URL || "https://mirmire.onrender.com";

// Approximate AD → BS current month/year (BS months start around these AD dates).
// Used only for the default selection; the user can still change it.
const BS_MONTH_STARTS = [
  [4, 14], [5, 15], [6, 15], [7, 17], [8, 17], [9, 17],
  [10, 18], [11, 17], [12, 16], [1, 14], [2, 12], [3, 14],
];

function getCurrentBS() {
  const now = new Date();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  let idx = 0;
  for (let i = 0; i < 12; i++) {
    const [sm, sd] = BS_MONTH_STARTS[i];
    if (m > sm || (m === sm && d >= sd)) idx = i;
  }
  // Jan 1 → Baishakh 1 falls in BS year (AD + 56) until Apr 14, then AD + 57
  const beforeNewYear = m < 4 || (m === 4 && d < 14);
  let year = now.getFullYear() + (beforeNewYear ? 56 : 57);
  // months Poush..Chaitra that fall in Jan–Apr belong to AD+56
  if (idx >= 8 || idx === 11) year = now.getFullYear() + (m >= 4 && m <= 12 ? 57 : 56);
  const y = String(year);
  return {
    month: MONTHS[idx],
    year: YEARS.includes(y) ? y : YEARS[YEARS.length - 1],
  };
}

const ROLE_COLORS = {
  manager: "bg-amber-100 text-amber-700 border-amber-200",
  collector: "bg-cyan-100 text-cyan-700 border-cyan-200",
  accountant: "bg-emerald-100 text-emerald-700 border-emerald-200",
  helper: "bg-violet-100 text-violet-700 border-violet-200",
  staff: "bg-pink-100 text-pink-700 border-pink-200",
};

const TEXT = {
  en: {
    breadcrumbAdmin: "Admin",
    breadcrumbSalary: "Salary Management",
    pageTitle: "Salary Entry",
    pageDesc: "Set and manage monthly salaries for all staff",
    salarySettings: "Salary Settings",
    viewSheet: "View Salary Sheet",
    payPeriod: "Pay Period",
    monthLabel: "Month (BS)",
    yearLabel: "Year (BS)",
    totalStaff: "Total Staff",
    employees: "employees",
    totalPayroll: "Total Payroll",
    forMonth: (m) => `for ${m}`,
    bonusPool: "Bonus Pool",
    totalOvertime: "Total Overtime",
    disabled: "Disabled",
    tableTitle: "Staff Salary Table",
    tableDesc: "Edit salary, bonus and overtime hours per employee",
    loading: "Loading users…",
    noUsers: "No users found",
    colNum: "#",
    colName: "Name",
    colRole: "Role",
    colBaseSalary: "Base Salary (NPR)",
    colSSF: "Social Security Fund",
    colContribution: "Staff Contribution",
    colBonus: "Bonus (NPR)",
    colOvertimeHrs: "Overtime (hrs)",
    colOvertimePay: "Overtime Pay",
    colTotal: "Total",
    grandTotal: "Grand Total",
    bonus: "Bonus",
    save: "Save",
    receipt: "View Receipt",
    hr: "hr",
  },
  np: {
    breadcrumbAdmin: "एडमिन",
    breadcrumbSalary: "तलब व्यवस्थापन",
    pageTitle: "तलब प्रविष्टि",
    pageDesc: "सबै कर्मचारीको मासिक तलब सेट र व्यवस्थापन गर्नुस्",
    salarySettings: "तलब सेटिङ",
    viewSheet: "तलब पाना हेर्नुस्",
    payPeriod: "भुक्तानी अवधि",
    monthLabel: "महिना (बि.सं.)",
    yearLabel: "वर्ष (बि.सं.)",
    totalStaff: "कुल कर्मचारी",
    employees: "कर्मचारी",
    totalPayroll: "कुल तलब",
    forMonth: (m) => `महिना: ${m}`,
    bonusPool: "बोनस कोष",
    totalOvertime: "कुल ओभरटाइम",
    disabled: "अक्षम",
    tableTitle: "कर्मचारी तलब तालिका",
    tableDesc: "प्रत्येक कर्मचारीको तलब, बोनस र ओभरटाइम घण्टा सम्पादन गर्नुस्",
    loading: "प्रयोगकर्ता लोड हुँदैछ…",
    noUsers: "कुनै प्रयोगकर्ता भेटिएन",
    colNum: "क्र.सं.",
    colName: "नाम",
    colRole: "पद",
    colBaseSalary: "आधार तलब (रु.)",
    colSSF: "सामाजिक सुरक्षा कोष",
    colContribution: "कर्मचारी योगदान",
    colBonus: "बोनस (रु.)",
    colOvertimeHrs: "ओभरटाइम (घण्टा)",
    colOvertimePay: "ओभरटाइम भुक्तानी",
    colTotal: "जम्मा",
    grandTotal: "महाजम्मा",
    bonus: "बोनस",
    save: "सुरक्षित",
    receipt: "रसिद हेर्नुहोस्",
    hr: "घण्टा",
  },
};

// ── shared fetch helper ───────────────────────────────────────────────────────
async function apiFetch(path, token, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

// ── build overrides from users + overtime list ────────────────────────────────
function buildOverrides(users, overtimeList, bonusEnabled, bonusAmount) {
  const overrides = {};
  users.forEach((u) => {
    const ot = overtimeList.find((o) => String(o._id) === String(u._id));
    overrides[u._id] = {
      salary: u.baseSalary || 0,
      bonus: bonusEnabled ? bonusAmount : 0,
      overtimeHours: ot ? Number(ot.overtimeHours) : 0,
    };
  });
  return overrides;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function SalaryPage() {
  const router = useRouter();
  const { token } = useApp();
  const { lang } = useLang();
  const t = TEXT[lang] || TEXT.en;

  const [selectedMonth, setSelectedMonth] = useState(() => getCurrentBS().month);
  const [selectedYear, setSelectedYear] = useState(() => getCurrentBS().year);
  const [salaryModal, setSalaryModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [otLoading, setOtLoading] = useState(false);
  const [userOverrides, setUserOverrides] = useState({});
  const [savedRows, setSavedRows] = useState({});
  const [configLoaded, setConfigLoaded] = useState(false);
  const [settings, setSettings] = useState({
    bonusEnabled: false,
    bonusAmount: 0,
    overtimeEnabled: false,
    overtimeRate: 0,
  });

  // stable ref so async callbacks always read latest settings
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // track whether initial load has run
  const initialLoadDone = useRef(false);

  // ── 1. fetch config once on mount ──────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    apiFetch("/api/salary/config", token)
      .then((data) => {
        if (data && !data.message) {
          setSettings({
            bonusEnabled: Boolean(data.bonusEnabled),
            bonusAmount: data.bonusAmount || 0,
            overtimeEnabled: Boolean(data.overtimeEnabled),
            overtimeRate: data.overtimeRate || 0,
          });
        }
      })
      .catch(console.error)
      .finally(() => setConfigLoaded(true)); // data fetch waits for config
  }, [token]);

  // ── 2. fetch users + overtime + saved salaries (after config is loaded) ──
  useEffect(() => {
    if (!token || !configLoaded) return;

    const fetchAll = async () => {
      setLoading(true);
      setOtLoading(true);

      try {
        const monthIndex = MONTHS.indexOf(selectedMonth) + 1;

        const [usersData, overtimeList, savedMonthly] = await Promise.all([
          apiFetch("/api/users", token),
          apiFetch(
            `/api/salary/overtime?nepaliYear=${selectedYear}&nepaliMonth=${monthIndex}`,
            token,
          ).catch(() => []),
          apiFetch(
            `/api/salary/monthly?nepaliYear=${selectedYear}&nepaliMonth=${monthIndex}`,
            token,
          ).catch(() => []),
        ]);

        const fetchedUsers = usersData.users || [];
        const s = settingsRef.current;

        setUsers(fetchedUsers);

        const initialOverrides = buildOverrides(
          fetchedUsers,
          Array.isArray(overtimeList) ? overtimeList : [],
          s.bonusEnabled,
          s.bonusAmount,
        );
        const saved = Array.isArray(savedMonthly) ? savedMonthly : [];
        saved.forEach((record) => {
          initialOverrides[record.employee] = {
            ...initialOverrides[record.employee],
            salary: record.baseSalary,
            bonus: record.bonus,
            overtimeHours: record.overtimeHours,
          };
        });
        setUserOverrides(initialOverrides);
        setSavedRows(
          Object.fromEntries(
            saved.map((record) => [String(record.employee), true]),
          ),
        );

        initialLoadDone.current = true;
      } catch (error) {
        console.error("fetchAll error:", error);
      } finally {
        setLoading(false);
        setOtLoading(false);
      }
    };

    fetchAll();
  }, [token, configLoaded, selectedMonth, selectedYear]);

  // ── handlers ─────────────────────────────────────────────────────────────
  // Keep the raw typed value so empty fields and decimals (e.g. "1.") work while typing.
  const handleOverride = (userId, field, rawValue) => {
    setUserOverrides((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], [field]: rawValue },
    }));
  };

  const computeRow = (user) => {
    const ov = userOverrides[user._id] || {
      salary: user.baseSalary || 0,
      bonus: 0,
      overtimeHours: 0,
    };
    const salary = Number(ov.salary ?? user.baseSalary) || 0;
    const socialSecurityFund = Math.round(salary * 0.2 * 100) / 100;
    const staffContribution = Math.round(salary * 0.11 * 100) / 100;
    const bonus = settings.bonusEnabled
      ? Number(ov.bonus ?? settings.bonusAmount) || 0
      : 0;
    const overtimeHours = settings.overtimeEnabled
      ? Number(ov.overtimeHours) || 0
      : 0;
    const overtime =
      settings.overtimeEnabled && settings.overtimeRate > 0
        ? overtimeHours * settings.overtimeRate
        : 0;
    return {
      salary,
      baseSalary: salary,
      socialSecurityFund,
      staffContribution,
      bonus,
      overtime,
      overtimePay: overtime,
      overtimeHours,
      total: salary - staffContribution + bonus + overtime,
    };
  };

  const grandTotal = users.reduce((s, u) => s + computeRow(u).total, 0);

  const handleViewSheet = () => {
    const payload = {
      month: selectedMonth,
      year: selectedYear,
      nepaliMonth: MONTHS.indexOf(selectedMonth) + 1,
      settings,
      rows: users.map((u) => ({
        id: u._id,
        name: u.fullName,
        role: u.role,
        email: u.email,
        biometricId: u.biometricId,
        employeeId: u.employeeId,
        ...computeRow(u),
      })),
    };
    if (typeof window !== "undefined")
      sessionStorage.setItem("salarySheetData", JSON.stringify(payload));
    router.push("/admin/salary/sheet");
  };

  const handleSaveSettings = async (s) => {
    try {
      await apiFetch("/api/salary/config", token, {
        method: "PUT",
        body: JSON.stringify(s),
      });
    } catch (e) {
      console.error("Failed to save salary config:", e);
    }
    setSettings(s);
  };

  const [saving, setSaving] = useState(false);

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const result = await apiFetch("/api/salary/save-monthly", token, {
        method: "POST",
        body: JSON.stringify({
          nepaliYear: Number(selectedYear),
          nepaliMonth: MONTHS.indexOf(selectedMonth) + 1,
          records: users.map((user) => {
            const row = computeRow(user);
            return {
              employeeId: user._id,
              baseSalary: row.baseSalary,
              bonus: row.bonus,
              overtimeHours: row.overtimeHours,
            };
          }),
        }),
      });
      setSavedRows(
        Object.fromEntries(
          (result.records || []).map((record) => [
            String(record.employee),
            true,
          ]),
        ),
      );
    } catch (error) {
      console.error("Failed to save salaries:", error);
      window.alert("Could not save salaries. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleViewReceipt = async (user) => {
    try {
      const receipt = await apiFetch(
        `/api/salary/receipt/${user._id}?nepaliYear=${selectedYear}&nepaliMonth=${MONTHS.indexOf(selectedMonth) + 1}`,
        token,
      );
      sessionStorage.setItem(
        "salarySheetData",
        JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
          settings,
          nepaliMonth: MONTHS.indexOf(selectedMonth) + 1,
          rows: [
            {
              ...receipt,
              id: receipt.employee,
              name: receipt.name,
              role: receipt.role,
              salary: receipt.baseSalary,
              overtime: receipt.overtimePay,
            },
          ],
        }),
      );
      router.push("/admin/salary/sheet");
    } catch (error) {
      console.error("Could not load receipt:", error);
      window.alert("Save this employee's salary before viewing the receipt.");
    }
  };

  const tableHeaders = [
    t.colNum,
    t.colName,
    t.colRole,
    t.colBaseSalary,
    t.colSSF,
    t.colContribution,
    t.colBonus,
    t.colOvertimeHrs,
    t.colOvertimePay,
    t.colTotal,
    "Action",
  ];

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Breadcrumb */}
      <div className="border-b border-gray-200 px-6 py-4 flex items-center gap-2 text-sm text-gray-400 bg-gray-50">
        <span>{t.breadcrumbAdmin}</span>
        <span>/</span>
        <span className="text-gray-700 font-medium">{t.breadcrumbSalary}</span>
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSalaryModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:text-gray-900 hover:border-gray-400 transition-all shadow-sm"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {t.salarySettings}
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving || loading || users.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold transition-all shadow-md shadow-emerald-200"
            >
              {saving ? "Saving…" : t.save}
            </button>
            <button
              onClick={handleViewSheet}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all shadow-md shadow-blue-200"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {t.viewSheet}
            </button>
          </div>
        </div>

        {/* Month / Year Selector */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-4">
            {t.payPeriod}
          </p>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">
                {t.monthLabel}
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all min-w-[160px] cursor-pointer shadow-sm"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">
                {t.yearLabel}
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all min-w-[120px] cursor-pointer shadow-sm"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {otLoading && (
              <div className="flex items-center gap-2 pb-0.5">
                <div className="w-3 h-3 rounded-full border-2 border-violet-300 border-t-violet-600 animate-spin" />
                <span className="text-xs text-violet-500">
                  Loading overtime…
                </span>
              </div>
            )}

            <div className="flex items-end gap-2 pb-0.5">
              {settings.bonusEnabled && (
                <span className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                  {t.bonus}: NPR {settings.bonusAmount.toLocaleString()}
                </span>
              )}
              {settings.overtimeEnabled && (
                <span className="px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 text-xs font-medium">
                  OT: NPR {settings.overtimeRate}/{t.hr}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: t.totalStaff,
              value: users.length,
              suffix: t.employees,
              color: "text-gray-900",
              bg: "bg-gray-50",
              border: "border-gray-200",
            },
            {
              label: t.totalPayroll,
              value: `NPR ${grandTotal.toLocaleString()}`,
              suffix: t.forMonth(selectedMonth),
              color: "text-blue-600",
              bg: "bg-blue-50",
              border: "border-blue-100",
            },
            {
              label: t.bonusPool,
              value: settings.bonusEnabled
                ? `NPR ${(settings.bonusAmount * users.length).toLocaleString()}`
                : t.disabled,
              suffix: "",
              color: "text-emerald-600",
              bg: "bg-emerald-50",
              border: "border-emerald-100",
            },
            {
              label: t.totalOvertime,
              value: settings.overtimeEnabled
                ? `NPR ${users.reduce((s, u) => s + computeRow(u).overtime, 0).toLocaleString()}`
                : t.disabled,
              suffix: "",
              color: "text-violet-600",
              bg: "bg-violet-50",
              border: "border-violet-100",
            },
          ].map((c) => (
            <div
              key={c.label}
              className={`${c.bg} border ${c.border} rounded-xl p-4`}
            >
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                {c.label}
              </p>
              <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
              {c.suffix && (
                <p className="text-xs text-gray-400 mt-0.5">{c.suffix}</p>
              )}
            </div>
          ))}
        </div>

        {/* Salary Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-800">
              {t.tableTitle}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{t.tableDesc}</p>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <p className="text-gray-400 text-sm">{t.loading}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-gray-400 text-sm">{t.noUsers}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {tableHeaders.map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user, idx) => {
                    const row = computeRow(user);
                    const ov = userOverrides[user._id] || {};
                    return (
                      <tr
                        key={user._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-5 py-4 text-gray-400 text-sm">
                          {idx + 1}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-violet-100 border border-gray-200 flex items-center justify-center text-xs font-bold text-blue-700">
                              {(user.fullName || "?")[0]?.toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-gray-800 whitespace-nowrap">
                              {user.fullName}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${ROLE_COLORS[user.role] || "bg-gray-100 text-gray-600 border-gray-200"}`}
                          >
                            {user.role?.charAt(0).toUpperCase() +
                              user.role?.slice(1)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-400">NPR</span>
                            <input
                              type="number"
                              min="0"
                              value={ov.salary ?? user.baseSalary ?? 0}
                              onChange={(e) =>
                                handleOverride(
                                  user._id,
                                  "salary",
                                  e.target.value,
                                )
                              }
                              className="w-28 bg-white border border-blue-200 rounded-lg px-3 py-1.5 text-gray-800 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                            />
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-700 whitespace-nowrap">
                          NPR {row.socialSecurityFund.toLocaleString()}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-700 whitespace-nowrap">
                          NPR {row.staffContribution.toLocaleString()}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-400">NPR</span>
                            <input
                              type="number"
                              min="0"
                              value={
                                ov.bonus ??
                                (settings.bonusEnabled
                                  ? settings.bonusAmount
                                  : 0)
                              }
                              onChange={(e) =>
                                handleOverride(
                                  user._id,
                                  "bonus",
                                  e.target.value,
                                )
                              }
                              disabled={!settings.bonusEnabled}
                              className="w-28 bg-white border border-emerald-200 rounded-lg px-3 py-1.5 text-gray-800 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                            />
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              value={ov.overtimeHours ?? 0}
                              onChange={(e) =>
                                handleOverride(
                                  user._id,
                                  "overtimeHours",
                                  e.target.value,
                                )
                              }
                              className="w-20 bg-white border border-violet-200 rounded-lg px-3 py-1.5 text-gray-800 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                              min="0"
                              step="0.1"
                              disabled={!settings.overtimeEnabled}
                              style={{
                                borderColor: settings.overtimeEnabled
                                  ? undefined
                                  : "#e5e7eb",
                                color: settings.overtimeEnabled
                                  ? undefined
                                  : "#6b7280",
                              }}
                            />
                            <span className="text-xs text-gray-400">hrs</span>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-violet-600 font-medium whitespace-nowrap">
                          {settings.overtimeEnabled && row.overtime > 0 ? (
                            `NPR ${row.overtime.toLocaleString()}`
                          ) : Number(ov.overtimeHours) > 0 &&
                            !settings.overtimeEnabled ? (
                            <span className="text-xs text-amber-500">
                              Enable OT rate
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-blue-600 font-bold whitespace-nowrap">
                          NPR {row.total.toLocaleString()}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            {savedRows[user._id] && (
                              <button
                                onClick={() => handleViewReceipt(user)}
                                className="px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 text-xs font-semibold hover:bg-blue-50"
                              >
                                {t.receipt}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td
                      colSpan={10}
                      className="px-5 py-4 text-sm font-semibold text-gray-500 text-right"
                    >
                      {t.grandTotal}
                    </td>
                    <td className="px-5 py-4 text-base font-bold text-blue-700 whitespace-nowrap">
                      NPR {grandTotal.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      <SalarySettingModal
        key={JSON.stringify(settings)}
        isOpen={salaryModal}
        onClose={() => setSalaryModal(false)}
        onSave={handleSaveSettings}
        existingSettings={settings}
      />
    </div>
  );
}
// "use client";
// import { useState } from "react";

// const toField = (value) => {
//   const n = Number(value) || 0;
//   return n ? String(n) : "";
// };

// export default function SalarySettingModal({
//   isOpen,
//   onClose,
//   onSave,
//   existingSettings,
// }) {
//   // Amount fields are kept as text while typing so they can be cleared / edited freely.
//   const [settings, setSettings] = useState(() => ({
//     bonusEnabled: Boolean(existingSettings?.bonusEnabled),
//     bonusAmount: toField(existingSettings?.bonusAmount),
//     overtimeEnabled: Boolean(existingSettings?.overtimeEnabled),
//     overtimeRate: toField(existingSettings?.overtimeRate),
//   }));
//   const [saving, setSaving] = useState(false);

//   if (!isOpen) return null;

//   // Negative values are not allowed.
//   const cleanNumber = (raw) => (raw !== "" && Number(raw) < 0 ? "0" : raw);

//   const handleSave = async () => {
//     if (saving) return;
//     setSaving(true);
//     try {
//       // The parent can return false to keep the modal open (e.g. when the server rejects the save).
//       const result = await onSave({
//         bonusEnabled: settings.bonusEnabled,
//         bonusAmount: Math.max(0, Number(settings.bonusAmount) || 0),
//         overtimeEnabled: settings.overtimeEnabled,
//         overtimeRate: Math.max(0, Number(settings.overtimeRate) || 0),
//       });
//       if (result !== false) onClose();
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <div
//       className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
//       role="dialog"
//       aria-modal="true"
//       aria-label="Salary Settings"
//     >
//       <div className="bg-[#0f1623] border border-[#1e2d45] rounded-2xl w-full max-w-md mx-4 shadow-2xl shadow-cyan-900/20">
//         {/* Header */}
//         <div className="flex items-center justify-between p-6 border-b border-[#1e2d45]">
//           <div className="flex items-center gap-3">
//             <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
//               <svg
//                 className="w-4 h-4 text-cyan-400"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
//                 />
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
//                 />
//               </svg>
//             </div>
//             <h2 className="text-white font-semibold text-lg tracking-tight">
//               Salary Settings
//             </h2>
//           </div>
//           <button
//             type="button"
//             onClick={onClose}
//             aria-label="Close"
//             className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
//           >
//             <svg
//               className="w-5 h-5"
//               fill="none"
//               viewBox="0 0 24 24"
//               stroke="currentColor"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M6 18L18 6M6 6l12 12"
//               />
//             </svg>
//           </button>
//         </div>

//         {/* Body */}
//         <div className="p-6 space-y-6">
//           {/* Bonus Setting */}
//           <div className="bg-[#1a2535] rounded-xl p-4 border border-[#2a3a55]">
//             <div className="flex items-center justify-between mb-4">
//               <div>
//                 <p className="text-white font-medium text-sm">Staff Bonus</p>
//                 <p className="text-gray-500 text-xs mt-0.5">
//                   Enable monthly bonus for staff
//                 </p>
//               </div>
//               <button
//                 type="button"
//                 role="switch"
//                 aria-checked={settings.bonusEnabled}
//                 aria-label="Toggle staff bonus"
//                 onClick={() =>
//                   setSettings({
//                     ...settings,
//                     bonusEnabled: !settings.bonusEnabled,
//                   })
//                 }
//                 className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${settings.bonusEnabled ? "bg-cyan-500" : "bg-[#2a3a55]"}`}
//               >
//                 <span
//                   className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${settings.bonusEnabled ? "translate-x-5" : "translate-x-0"}`}
//                 />
//               </button>
//             </div>
//             {settings.bonusEnabled && (
//               <div>
//                 <label className="block text-xs text-gray-400 mb-1">
//                   Bonus Amount (NPR)
//                 </label>
//                 <input
//                   type="number"
//                   min="0"
//                   value={settings.bonusAmount}
//                   onChange={(e) =>
//                     setSettings({
//                       ...settings,
//                       bonusAmount: cleanNumber(e.target.value),
//                     })
//                   }
//                   className="w-full bg-[#0f1623] border border-[#2a3a55] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
//                   placeholder="e.g. 5000"
//                 />
//               </div>
//             )}
//           </div>

//           {/* Overtime Setting */}
//           <div className="bg-[#1a2535] rounded-xl p-4 border border-[#2a3a55]">
//             <div className="flex items-center justify-between mb-4">
//               <div>
//                 <p className="text-white font-medium text-sm">Overtime Pay</p>
//                 <p className="text-gray-500 text-xs mt-0.5">
//                   Enable overtime calculation
//                 </p>
//               </div>
//               <button
//                 type="button"
//                 role="switch"
//                 aria-checked={settings.overtimeEnabled}
//                 aria-label="Toggle overtime pay"
//                 onClick={() =>
//                   setSettings({
//                     ...settings,
//                     overtimeEnabled: !settings.overtimeEnabled,
//                   })
//                 }
//                 className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${settings.overtimeEnabled ? "bg-violet-500" : "bg-[#2a3a55]"}`}
//               >
//                 <span
//                   className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${settings.overtimeEnabled ? "translate-x-5" : "translate-x-0"}`}
//                 />
//               </button>
//             </div>
//             {settings.overtimeEnabled && (
//               <div>
//                 <label className="block text-xs text-gray-400 mb-1">
//                   Rate per Hour (NPR)
//                 </label>
//                 <input
//                   type="number"
//                   min="0"
//                   value={settings.overtimeRate}
//                   onChange={(e) =>
//                     setSettings({
//                       ...settings,
//                       overtimeRate: cleanNumber(e.target.value),
//                     })
//                   }
//                   className="w-full bg-[#0f1623] border border-[#2a3a55] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
//                   placeholder="e.g. 150"
//                 />
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Footer */}
//         <div className="flex gap-3 p-6 pt-0">
//           <button
//             type="button"
//             onClick={onClose}
//             disabled={saving}
//             className="flex-1 px-4 py-2.5 rounded-xl border border-[#2a3a55] text-gray-400 hover:text-white hover:border-gray-500 transition-all text-sm font-medium disabled:opacity-50"
//           >
//             Cancel
//           </button>
//           <button
//             type="button"
//             onClick={handleSave}
//             disabled={saving}
//             className="flex-1 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-60"
//           >
//             {saving ? "Saving…" : "Save Settings"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }