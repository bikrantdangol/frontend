"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SalarySettingModal from "@/components/SalarySettingModal";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const YEARS = ["2080","2081","2082","2083"]; // Nepali BS years — adjust as needed

// --------------- Mock user data (replace with your real API/DB fetch) ---------------
const MOCK_USERS = [
  { id: 1, name: "Anjali Maharjan",  role: "Manager",          baseSalary: 45000 },
  { id: 2, name: "Bikram Dangol",    role: "Senior Developer", baseSalary: 55000 },
  { id: 3, name: "Sita Shrestha",    role: "Accountant",       baseSalary: 35000 },
  { id: 4, name: "Ram Tamang",       role: "Designer",         baseSalary: 38000 },
  { id: 5, name: "Priya Karki",      role: "HR Executive",     baseSalary: 32000 },
  { id: 6, name: "Dev Rai",          role: "Support Staff",    baseSalary: 28000 },
];

const ROLE_COLORS = {
  Manager:           "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Senior Developer":"bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  Accountant:        "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Designer:          "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "HR Executive":    "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "Support Staff":   "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export default function SalaryPage() {
  const router = useRouter();
  const currentMonth = new Date().getMonth(); // 0-indexed
  const currentYear  = new Date().getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(MONTHS[currentMonth]);
  const [selectedYear,  setSelectedYear]  = useState(String(currentYear));
  const [salaryModal,   setSalaryModal]   = useState(false);
  const [settings, setSettings] = useState({
    bonusEnabled: false, bonusAmount: 0,
    overtimeEnabled: false, overtimeRate: 0,
    taxRate: 1,
  });

  // Per-user overrides: { [userId]: { salary, overtimeHours } }
  const [userOverrides, setUserOverrides] = useState(() =>
    Object.fromEntries(MOCK_USERS.map((u) => [u.id, { salary: u.baseSalary, overtimeHours: 0 }]))
  );

  const handleOverride = (userId, field, value) => {
    setUserOverrides((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], [field]: parseFloat(value) || 0 },
    }));
  };

  const computeRow = (user) => {
    const override = userOverrides[user.id];
    const salary   = override.salary;
    const bonus    = settings.bonusEnabled ? settings.bonusAmount : 0;
    const overtime = settings.overtimeEnabled ? override.overtimeHours * settings.overtimeRate : 0;
    const total    = salary + bonus + overtime;
    return { salary, bonus, overtime, total };
  };

  const handleViewSheet = () => {
    const payload = {
      month: selectedMonth,
      year: selectedYear,
      settings,
      rows: MOCK_USERS.map((u) => ({
        ...u,
        ...computeRow(u),
        overtimeHours: userOverrides[u.id].overtimeHours,
        salary: userOverrides[u.id].salary,
      })),
    };
    if (typeof window !== "undefined") {
      sessionStorage.setItem("salarySheetData", JSON.stringify(payload));
    }
    router.push("/admin/salary/sheet");
  };

  return (
    <div className="min-h-screen bg-[#070d18] text-white font-sans">
      {/* ── Sidebar placeholder breadcrumb ── */}
      <div className="border-b border-[#1e2d45] px-6 py-4 flex items-center gap-2 text-sm text-gray-500">
        <span>Admin</span>
        <span>/</span>
        <span className="text-white">Salary Management</span>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Salary Entry</h1>
            <p className="text-gray-500 text-sm mt-1">Set and manage monthly salaries for all staff</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSalaryModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a2535] border border-[#2a3a55] text-sm font-medium text-gray-300 hover:text-white hover:border-cyan-500/50 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Salary Settings
            </button>
            <button
              onClick={handleViewSheet}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-bold transition-all shadow-lg shadow-cyan-500/25"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View Salary Sheet
            </button>
          </div>
        </div>

        {/* ── Month / Year Selector ── */}
        <div className="bg-[#0f1623] border border-[#1e2d45] rounded-2xl p-5 mb-6">
          <p className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-4">Pay Period</p>
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-[#1a2535] border border-[#2a3a55] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors min-w-[160px] cursor-pointer"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Year (BS)</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-[#1a2535] border border-[#2a3a55] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors min-w-[120px] cursor-pointer"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Active settings badges */}
            <div className="flex items-end gap-2 pb-0.5">
              {settings.bonusEnabled && (
                <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                  Bonus: NPR {settings.bonusAmount.toLocaleString()}
                </span>
              )}
              {settings.overtimeEnabled && (
                <span className="px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium">
                  OT: NPR {settings.overtimeRate}/hr
                </span>
              )}
              <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
                Tax: {settings.taxRate}%
              </span>
            </div>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Staff",     value: MOCK_USERS.length,  suffix: "employees", color: "text-white" },
            { label: "Total Payroll",   value: `NPR ${MOCK_USERS.reduce((s, u) => s + computeRow(u).total, 0).toLocaleString()}`, suffix: `for ${selectedMonth}`, color: "text-cyan-400" },
            { label: "Bonus Pool",      value: settings.bonusEnabled ? `NPR ${(settings.bonusAmount * MOCK_USERS.length).toLocaleString()}` : "Disabled", suffix: "", color: "text-emerald-400" },
            { label: "Total Overtime",  value: settings.overtimeEnabled ? `NPR ${MOCK_USERS.reduce((s, u) => s + computeRow(u).overtime, 0).toLocaleString()}` : "Disabled", suffix: "", color: "text-violet-400" },
          ].map((c) => (
            <div key={c.label} className="bg-[#0f1623] border border-[#1e2d45] rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{c.label}</p>
              <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
              {c.suffix && <p className="text-xs text-gray-600 mt-0.5">{c.suffix}</p>}
            </div>
          ))}
        </div>

        {/* ── Salary Table ── */}
        <div className="bg-[#0f1623] border border-[#1e2d45] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[#1e2d45]">
            <h2 className="text-sm font-semibold text-white">Staff Salary Table</h2>
            <p className="text-xs text-gray-500 mt-0.5">Edit salary and overtime hours per employee</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e2d45]">
                  {["#","Name","Role","Base Salary (NPR)","Overtime (hrs)","Bonus","Overtime Pay","Total"].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2d45]">
                {MOCK_USERS.map((user, idx) => {
                  const row = computeRow(user);
                  return (
                    <tr key={user.id} className="hover:bg-[#1a2535]/40 transition-colors group">
                      <td className="px-5 py-4 text-gray-600 text-sm">{idx + 1}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border border-[#2a3a55] flex items-center justify-center text-xs font-bold text-white">
                            {user.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-white whitespace-nowrap">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${ROLE_COLORS[user.role] || "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-500">NPR</span>
                          <input
                            type="number"
                            value={userOverrides[user.id].salary}
                            onChange={(e) => handleOverride(user.id, "salary", e.target.value)}
                            className="w-28 bg-[#1a2535] border border-[#2a3a55] rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                          />
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {settings.overtimeEnabled ? (
                          <input
                            type="number"
                            value={userOverrides[user.id].overtimeHours}
                            onChange={(e) => handleOverride(user.id, "overtimeHours", e.target.value)}
                            className="w-20 bg-[#1a2535] border border-[#2a3a55] rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
                            min="0"
                          />
                        ) : (
                          <span className="text-gray-600 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-emerald-400 font-medium whitespace-nowrap">
                        {row.bonus > 0 ? `NPR ${row.bonus.toLocaleString()}` : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-5 py-4 text-sm text-violet-400 font-medium whitespace-nowrap">
                        {row.overtime > 0 ? `NPR ${row.overtime.toLocaleString()}` : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-5 py-4 text-sm text-cyan-400 font-bold whitespace-nowrap">
                        NPR {row.total.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Footer total */}
              <tfoot>
                <tr className="border-t-2 border-[#2a3a55] bg-[#1a2535]/50">
                  <td colSpan={7} className="px-5 py-4 text-sm font-semibold text-gray-400 text-right">Grand Total</td>
                  <td className="px-5 py-4 text-base font-bold text-cyan-400 whitespace-nowrap">
                    NPR {MOCK_USERS.reduce((s, u) => s + computeRow(u).total, 0).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* ── Modal ── */}
      <SalarySettingModal
        isOpen={salaryModal}
        onClose={() => setSalaryModal(false)}
        onSave={(s) => setSettings(s)}
        existingSettings={settings}
      />
    </div>
  );
}