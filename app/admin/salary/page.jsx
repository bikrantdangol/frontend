"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../../lib/context";
import SalarySettingModal from "@/components/SalarySettingModal";

const MONTHS = [
  "बैशाख", "जेठ", "असार", "श्रावण", "भाद्र", "आश्विन",
  "कार्तिक", "मंसिर", "पुष", "माघ", "फाल्गुन", "चैत्र"
];

const YEARS = Array.from({ length: 10 }, (_, i) => String(2080 + i)); // 2080–2089

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const ROLE_COLORS = {
  manager:    "bg-amber-100 text-amber-700 border-amber-200",
  collector:  "bg-cyan-100 text-cyan-700 border-cyan-200",
  accountant: "bg-emerald-100 text-emerald-700 border-emerald-200",
  helper:     "bg-violet-100 text-violet-700 border-violet-200",
  staff:      "bg-pink-100 text-pink-700 border-pink-200",
};

export default function SalaryPage() {
  const router = useRouter();
  const { token } = useApp();

  const [selectedMonth, setSelectedMonth] = useState(MONTHS[0]);
  const [selectedYear,  setSelectedYear]  = useState("2081");
  const [salaryModal,   setSalaryModal]   = useState(false);
  const [users,         setUsers]         = useState([]);
  const [loading,       setLoading]       = useState(true);

  const [settings, setSettings] = useState({
    bonusEnabled: false, bonusAmount: 0,
    overtimeEnabled: false, overtimeRate: 0,
    taxRate: 1,
  });

  // Per-user overrides: { [userId]: { salary, bonus, overtimeHours } }
  const [userOverrides, setUserOverrides] = useState({});

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const fetchedUsers = data.users || [];
      setUsers(fetchedUsers);

      const initialOverrides = {};
      fetchedUsers.forEach((u) => {
        initialOverrides[u._id] = {
          salary: u.baseSalary || 0,
          bonus: settings.bonusEnabled ? settings.bonusAmount : 0,
          overtimeHours: 0,
        };
      });
      setUserOverrides(initialOverrides);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // When global bonus settings change, sync per-user bonus if bonusEnabled
  useEffect(() => {
    if (settings.bonusEnabled) {
      setUserOverrides((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((id) => {
          updated[id] = { ...updated[id], bonus: settings.bonusAmount };
        });
        return updated;
      });
    }
  }, [settings.bonusEnabled, settings.bonusAmount]);

  const handleOverride = (userId, field, value) => {
    setUserOverrides((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], [field]: parseFloat(value) || 0 },
    }));
  };

  const computeRow = (user) => {
    const override = userOverrides[user._id] || { salary: 0, bonus: 0, overtimeHours: 0 };
    const salary   = override.salary;
    const bonus    = settings.bonusEnabled ? (override.bonus ?? settings.bonusAmount) : 0;
    const overtime = settings.overtimeEnabled ? override.overtimeHours * settings.overtimeRate : 0;
    const total    = salary + bonus + overtime;
    return { salary, bonus, overtime, total };
  };

  const handleViewSheet = () => {
    const payload = {
      month: selectedMonth,
      year: selectedYear,
      settings,
      rows: users.map((u) => ({
        id: u._id,
        name: u.fullName,
        role: u.role,
        email: u.email,
        biometricId: u.biometricId,
        employeeId: u.employeeId,
        ...computeRow(u),
        overtimeHours: userOverrides[u._id]?.overtimeHours || 0,
        salary: userOverrides[u._id]?.salary || 0,
        bonus: userOverrides[u._id]?.bonus || 0,
      })),
    };
    if (typeof window !== "undefined") {
      sessionStorage.setItem("salarySheetData", JSON.stringify(payload));
    }
    router.push("/admin/salary/sheet");
  };

  const grandTotal = users.reduce((s, u) => s + (computeRow(u).total || 0), 0);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Breadcrumb */}
      <div className="border-b border-gray-200 px-6 py-4 flex items-center gap-2 text-sm text-gray-400 bg-gray-50">
        <span>Admin</span>
        <span>/</span>
        <span className="text-gray-700 font-medium">Salary Management</span>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Salary Entry</h1>
            <p className="text-gray-500 text-sm mt-1">Set and manage monthly salaries for all staff</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSalaryModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:text-gray-900 hover:border-gray-400 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Salary Settings
            </button>
            <button
              onClick={handleViewSheet}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all shadow-md shadow-blue-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View Salary Sheet
            </button>
          </div>
        </div>

        {/* Month / Year + Badges */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-4">Pay Period</p>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Month (BS)</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all min-w-[160px] cursor-pointer shadow-sm"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Year (BS)</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all min-w-[120px] cursor-pointer shadow-sm"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Active settings badges */}
            <div className="flex items-end gap-2 pb-0.5">
              {settings.bonusEnabled && (
                <span className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                  Bonus: NPR {settings.bonusAmount.toLocaleString()}
                </span>
              )}
              {settings.overtimeEnabled && (
                <span className="px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 text-xs font-medium">
                  OT: NPR {settings.overtimeRate}/hr
                </span>
              )}
              <span className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
                Tax: {settings.taxRate}%
              </span>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Staff",    value: users.length,                                                                                          suffix: "employees",       color: "text-gray-900",    bg: "bg-gray-50",    border: "border-gray-200" },
            { label: "Total Payroll",  value: `NPR ${grandTotal.toLocaleString()}`,                                                                  suffix: `for ${selectedMonth}`, color: "text-blue-600",   bg: "bg-blue-50",  border: "border-blue-100" },
            { label: "Bonus Pool",     value: settings.bonusEnabled ? `NPR ${(settings.bonusAmount * users.length).toLocaleString()}` : "Disabled", suffix: "",                color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
            { label: "Total Overtime", value: settings.overtimeEnabled ? `NPR ${users.reduce((s, u) => s + computeRow(u).overtime, 0).toLocaleString()}` : "Disabled", suffix: "", color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100" },
          ].map((c) => (
            <div key={c.label} className={`${c.bg} border ${c.border} rounded-xl p-4`}>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{c.label}</p>
              <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
              {c.suffix && <p className="text-xs text-gray-400 mt-0.5">{c.suffix}</p>}
            </div>
          ))}
        </div>

        {/* Salary Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-800">Staff Salary Table</h2>
            <p className="text-xs text-gray-400 mt-0.5">Edit salary, bonus and overtime hours per employee</p>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <p className="text-gray-400 text-sm">Loading users…</p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-gray-400 text-sm">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["#", "Name", "Role", "Base Salary (NPR)", "Bonus (NPR)", "Overtime (hrs)", "Overtime Pay", "Total"].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user, idx) => {
                    const row = computeRow(user);
                    return (
                      <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 text-gray-400 text-sm">{idx + 1}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-violet-100 border border-gray-200 flex items-center justify-center text-xs font-bold text-blue-700">
                              {(user.fullName || "?")[0]?.toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-gray-800 whitespace-nowrap">{user.fullName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${ROLE_COLORS[user.role] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                            {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                          </span>
                        </td>

                        {/* Base Salary input */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-400">NPR</span>
                            <input
                              type="number"
                              value={userOverrides[user._id]?.salary || 0}
                              onChange={(e) => handleOverride(user._id, "salary", e.target.value)}
                              className="w-28 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-gray-800 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                            />
                          </div>
                        </td>

                        {/* Bonus input — always shown, styled same as salary */}
                        <td className="px-5 py-4">
                          {settings.bonusEnabled ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-gray-400">NPR</span>
                              <input
                                type="number"
                                value={userOverrides[user._id]?.bonus ?? settings.bonusAmount}
                                onChange={(e) => handleOverride(user._id, "bonus", e.target.value)}
                                className="w-28 bg-white border border-emerald-200 rounded-lg px-3 py-1.5 text-gray-800 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                              />
                            </div>
                          ) : (
                            <span className="text-gray-300 text-sm">—</span>
                          )}
                        </td>

                        {/* Overtime hours input */}
                        <td className="px-5 py-4">
                          {settings.overtimeEnabled ? (
                            <input
                              type="number"
                              value={userOverrides[user._id]?.overtimeHours || 0}
                              onChange={(e) => handleOverride(user._id, "overtimeHours", e.target.value)}
                              className="w-20 bg-white border border-violet-200 rounded-lg px-3 py-1.5 text-gray-800 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                              min="0"
                            />
                          ) : (
                            <span className="text-gray-300 text-sm">—</span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-violet-600 font-medium whitespace-nowrap">
                          {row.overtime > 0 ? `NPR ${row.overtime.toLocaleString()}` : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-4 text-sm text-blue-600 font-bold whitespace-nowrap">
                          NPR {row.total.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td colSpan={7} className="px-5 py-4 text-sm font-semibold text-gray-500 text-right">Grand Total</td>
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

      {/* Modal */}
      <SalarySettingModal
        isOpen={salaryModal}
        onClose={() => setSalaryModal(false)}
        onSave={(s) => setSettings(s)}
        existingSettings={settings}
      />
    </div>
  );
}