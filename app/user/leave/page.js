"use client";

import { useState, useRef, useEffect } from "react";
import {
  CalendarDays,
  Send,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { BS_MONTHS_EN, getTodayBS } from "../../../lib/calendar";
import { useApp } from "../../../lib/context";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const LEAVE_TYPES = [
  "Casual Leave",
  "Sick Leave",
  "Earned / Annual Leave",
  "Pregnancy Leave",
];

const LEAVE_TYPE_MAP = {
  "Casual Leave": "casual",
  "Sick Leave": "sick",
  "Earned / Annual Leave": "earned",
  "Pregnancy Leave": "pregnancy",
};

const LEAVE_TYPE_DISPLAY = {
  casual: "Casual Leave",
  sick: "Sick Leave",
  earned: "Earned / Annual Leave",
  pregnancy: "Pregnancy Leave",
};

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  approved: {
    icon: <CheckCircle size={14} />,
    cls: "bg-green-100 text-green-700",
    iconCls: "text-green-600",
    badge: "bg-green-50 border-green-200 text-green-700",
  },
  rejected: {
    icon: <XCircle size={14} />,
    cls: "bg-red-100 text-red-700",
    iconCls: "text-red-600",
    badge: "bg-red-50 border-red-200 text-red-700",
  },
  pending: {
    icon: <Clock size={14} />,
    cls: "bg-orange-100 text-orange-700",
    iconCls: "text-orange-600",
    badge: "bg-orange-50 border-orange-200 text-orange-700",
  },
};

const getStatusCfg = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.pending;

// ─── Disclaimer Modal ─────────────────────────────────────────────────────────
function DisclaimerModal({ balance, days, onConfirm, onClose }) {
  const [agreed, setAgreed] = useState(false);
  const monthsAhead = days - balance.availableNow;
  const currentMonthName = BS_MONTHS_EN[(balance.currentMonth || 1) - 1];

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <AlertCircle size={22} className="text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">
              Leave Balance Warning
            </h3>
            <p className="text-orange-100 text-sm">
              Exceeding current month allowance
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 space-y-2">
            <p className="text-sm text-amber-800 font-medium">
              ⚠️ You are about to exceed your leave balance for{" "}
              {currentMonthName}.
            </p>
            <div className="space-y-1 text-sm text-amber-700">
              <div className="flex justify-between">
                <span>Available this month:</span>
                <span className="font-bold">{balance.availableNow} day(s)</span>
              </div>
              <div className="flex justify-between">
                <span>You are requesting:</span>
                <span className="font-bold">{days} day(s)</span>
              </div>
              <div className="flex justify-between border-t border-amber-300 pt-2">
                <span>From future months:</span>
                <span className="font-bold text-red-600">
                  {monthsAhead} day(s)
                </span>
              </div>
            </div>
            <p className="text-xs text-amber-600 mt-2">
              You have already used {balance.used} day(s) this year.
              {monthsAhead > 1
                ? ` This will use leave from the next ${monthsAhead} months.`
                : " This will use next months leave allowance."}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-600 mb-2">
              By proceeding, you acknowledge that:
            </p>
            <ul className="text-xs text-gray-600 space-y-1.5 list-disc pl-4">
              <li>You will have no leave remaining for {currentMonthName}</li>
              <li>Future months leave balance will be reduced accordingly</li>
              <li>
                You will have {Math.max(0, balance.remainingForYear - days)}{" "}
                day(s) left for the entire year
              </li>
            </ul>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">
              I understand and agree to use leave from future months. I confirm
              this request is necessary.
            </span>
          </label>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => agreed && onConfirm()}
              disabled={!agreed}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Proceed Anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Nepali Date Picker ───────────────────────────────────────────────────────
function NepaliDatePicker({ selectedDate, onSelect, onClose, minDate }) {
  const today = getTodayBS();
  const [currentYear, setCurrentYear] = useState(
    selectedDate?.year || today.year,
  );
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate?.month || today.month,
  );
  const [selectedDay, setSelectedDay] = useState(selectedDate?.day || null);

  const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getDaysInMonth = (year, month) =>
    ({
      1: 31,
      2: 31,
      3: 32,
      4: 31,
      5: 31,
      6: 31,
      7: 30,
      8: 29,
      9: 30,
      10: 29,
      11: 30,
      12: 30,
    })[month] || 30;

  const getFirstDayOfMonth = (year, month) =>
    ({
      1: 2,
      2: 5,
      3: 1,
      4: 5,
      5: 1,
      6: 4,
      7: 0,
      8: 2,
      9: 3,
      10: 5,
      11: 6,
      12: 1,
    })[month] || 0;

  const isDateDisabled = (y, m, d) => {
    if (!minDate) return false;
    if (y < minDate.year) return true;
    if (y === minDate.year && m < minDate.month) return true;
    if (y === minDate.year && m === minDate.month && d < minDate.day)
      return true;
    return false;
  };

  const isSaturday = (y, m, d) => (getFirstDayOfMonth(y, m) + d - 1) % 7 === 6;
  const isTodayFn = (y, m, d) =>
    y === today.year && m === today.month && d === today.day;

  const days = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const cells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];

  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else setCurrentMonth((m) => m - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else setCurrentMonth((m) => m + 1);
    setSelectedDay(null);
  };

  const handleDateSelect = (day) => {
    if (
      !isDateDisabled(currentYear, currentMonth, day) &&
      !isSaturday(currentYear, currentMonth, day)
    ) {
      setSelectedDay(day);
      onSelect({ year: currentYear, month: currentMonth, day });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 w-80">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded">
          ◀
        </button>
        <span className="font-semibold">
          {BS_MONTHS_EN[currentMonth - 1]} {currentYear}
        </span>
        <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded">
          ▶
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WD.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-semibold text-gray-500 py-1"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`e-${idx}`} className="h-8" />;
          const selected = day === selectedDay;
          const disabled = isDateDisabled(currentYear, currentMonth, day);
          const sat = isSaturday(currentYear, currentMonth, day);
          const isT = isTodayFn(currentYear, currentMonth, day);
          const base =
            "h-8 w-8 mx-auto rounded-lg text-sm font-medium transition-all";
          let extra = "text-gray-700";
          if (selected) extra = "bg-green-500 text-white";
          else if (isT)
            extra =
              "ring-2 ring-green-500 bg-green-50 text-green-700 font-bold";
          else if (sat) extra = "text-red-500 cursor-not-allowed";
          else if (disabled) extra = "text-gray-300 cursor-not-allowed";
          else extra = "text-gray-700 hover:bg-gray-100 cursor-pointer";
          return (
            <button
              key={day}
              onClick={() => handleDateSelect(day)}
              disabled={disabled || sat}
              className={`${base} ${extra}`}
            >
              {day}
            </button>
          );
        })}
      </div>
      <button
        onClick={onClose}
        className="mt-3 w-full py-2 text-sm text-gray-500 hover:text-gray-700 border-t"
      >
        Close
      </button>
    </div>
  );
}

// ─── Leave Status Detail Card ─────────────────────────────────────────────────
function LeaveStatusCard({ leave }) {
  const cfg = getStatusCfg(leave.status);
  const isPending = leave.status === "pending";
  const isRejected = leave.status === "rejected";

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${cfg.badge}`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-800">
            {LEAVE_TYPE_DISPLAY[leave.leaveType] || leave.leaveType}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {leave.fromDateNepali || leave.fromDate?.slice(0, 10)} →{" "}
            {leave.toDateNepali || leave.toDate?.slice(0, 10)}
            {leave.totalDays ? ` · ${leave.totalDays} day(s)` : ""}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${cfg.cls}`}
        >
          {cfg.icon}
          <span className="capitalize">{leave.status}</span>
        </span>
      </div>

      {/* Reason */}
      {leave.reason && (
        <div className="text-xs text-gray-600 bg-white/60 rounded-lg px-3 py-2">
          <span className="font-medium text-gray-700">Reason: </span>
          {leave.reason}
        </div>
      )}

      {/* Pending notice */}
      {isPending && (
        <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
          <Clock size={14} className="text-orange-500 mt-0.5 shrink-0" />
          <p className="text-xs text-orange-700">
            Your request is awaiting admin review. You will be notified once a
            decision is made.
          </p>
        </div>
      )}

      {/* Rejection reason */}
      {isRejected && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <XCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-red-700 mb-0.5">
              Request Rejected
            </p>
            <p className="text-xs text-red-600">
              {leave.rejectionReason ||
                leave.adminNote ||
                "No reason provided by admin."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function UserLeavePage() {
  const { user, token } = useApp();
  const [leaveType, setLeaveType] = useState("Casual Leave");
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [myLeaves, setMyLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);

  const startPickerRef = useRef(null);
  const endPickerRef = useRef(null);
  const today = getTodayBS();

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchLeaves = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/leave`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMyLeaves(data.leaves || []);
    } catch (_) {}
  };

  const fetchBalance = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/leave/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setLeaveBalance(data.balance);
    } catch (_) {}
  };

  useEffect(() => {
    if (!user || !token) return;

    const loadData = async () => {
      await fetchLeaves();
      await fetchBalance();
    };

    loadData();
  }, [user, token]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (startPickerRef.current && !startPickerRef.current.contains(e.target))
        setShowStartCalendar(false);
      if (endPickerRef.current && !endPickerRef.current.contains(e.target))
        setShowEndCalendar(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const usedLeaves = leaveBalance?.used || 0;
  const availableLeaves = leaveBalance?.remainingForYear ?? 12 - usedLeaves;
  const accruedSoFar = leaveBalance?.accruedSoFar || 0;

  // Derived leave lists for status panel
  const pendingLeaves = myLeaves.filter((l) => l.status === "pending");
  const rejectedLeaves = myLeaves.filter((l) => l.status === "rejected");
  const actionableLeaves = [...pendingLeaves, ...rejectedLeaves];

  // ── Date helpers ───────────────────────────────────────────────────────────
  const handleStartDateSelect = (date) => {
    setStartDate(date);
    setShowStartCalendar(false);
    if (
      endDate &&
      (date.year > endDate.year ||
        (date.year === endDate.year && date.month > endDate.month) ||
        (date.year === endDate.year &&
          date.month === endDate.month &&
          date.day > endDate.day))
    ) {
      setEndDate(null);
    }
  };

  const handleEndDateSelect = (date) => {
    if (!startDate) {
      setError("Please select start date first");
      setShowEndCalendar(false);
      return;
    }
    const valid =
      date.year > startDate.year ||
      (date.year === startDate.year && date.month > startDate.month) ||
      (date.year === startDate.year &&
        date.month === startDate.month &&
        date.day >= startDate.day);
    if (valid) {
      setEndDate(date);
      setError("");
      setShowEndCalendar(false);
    } else {
      setError("End date must be after start date");
    }
  };

  const getLeaveDays = () => {
    if (!startDate || !endDate) return 1;
    const dim = (m) =>
      ({
        1: 31,
        2: 31,
        3: 32,
        4: 31,
        5: 31,
        6: 31,
        7: 30,
        8: 29,
        9: 30,
        10: 29,
        11: 30,
        12: 30,
      })[m] || 30;
    let days = 0,
      cy = startDate.year,
      cm = startDate.month,
      cd = startDate.day;
    while (
      cy < endDate.year ||
      (cy === endDate.year && cm < endDate.month) ||
      (cy === endDate.year && cm === endDate.month && cd <= endDate.day)
    ) {
      days++;
      if (cy === endDate.year && cm === endDate.month && cd === endDate.day)
        break;
      cd++;
      if (cd > dim(cm)) {
        cd = 1;
        cm++;
      }
      if (cm > 12) {
        cm = 1;
        cy++;
      }
    }
    return days;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const doSubmitLeave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/leave`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          leaveType: LEAVE_TYPE_MAP[leaveType],
          reason,
          fromDate: `${startDate.year}-${String(startDate.month).padStart(2, "0")}-${String(startDate.day).padStart(2, "0")}`,
          toDate: `${endDate.year}-${String(endDate.month).padStart(2, "0")}-${String(endDate.day).padStart(2, "0")}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit");
      await fetchLeaves();
      await fetchBalance();
      setSubmitted(true);
      setLeaveType("Casual Leave");
      setReason("");
      setStartDate(null);
      setEndDate(null);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setPendingRequest(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!leaveType) return setError("Please select leave type");
    if (!startDate) return setError("Please select start date");
    if (!endDate) return setError("Please select end date");
    if (!reason.trim()) return setError("Please provide a reason");

    const days = getLeaveDays();
    if (usedLeaves + days > 12) {
      return setError(
        `You only have ${12 - usedLeaves} day(s) remaining this year.`,
      );
    }
    if (leaveBalance && days > leaveBalance.availableNow) {
      setPendingRequest({ days });
      setShowDisclaimer(true);
      return;
    }
    setPendingRequest({ days });
    await doSubmitLeave();
  };

  const handleClear = () => {
    setLeaveType("Casual Leave");
    setReason("");
    setStartDate(null);
    setEndDate(null);
    setError("");
  };

  const formatDateDisplay = (date) =>
    date
      ? `${date.day} ${BS_MONTHS_EN[date.month - 1]} ${date.year} BS`
      : "Select date";

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Leave Application</h1>
        <p className="text-gray-500 text-sm mt-1">
          Submit a leave request for approval
        </p>
      </div>

      {/* Alerts */}
      {submitted && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <Send size={16} />
          <span className="text-sm font-medium">
            Leave request submitted successfully!
          </span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle size={16} />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Pending / Rejected notice banner */}
      {actionableLeaves.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-800">
              Leave Request Status
            </h2>
            {pendingLeaves.length > 0 && (
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                {pendingLeaves.length} Pending
              </span>
            )}
            {rejectedLeaves.length > 0 && (
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                {rejectedLeaves.length} Rejected
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {actionableLeaves.map((leave) => (
              <LeaveStatusCard key={leave._id} leave={leave} />
            ))}
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Leave Balance Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              <div className="w-11 h-11 rounded-2xl bg-green-100 flex items-center justify-center">
                <CalendarDays size={20} className="text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Leave Balance
                </h3>
                <p className="text-sm text-gray-500">
                  {availableLeaves} / 12 days
                </p>
              </div>
            </div>
            <div className="bg-green-50 rounded-2xl px-4 py-2 text-center min-w-[70px]">
              <p className="text-2xl font-bold text-green-600">
                {availableLeaves}
              </p>
              <p className="text-xs text-gray-500">left</p>
            </div>
          </div>

          <p className="text-sm text-gray-500">
            1 leave per month. Unused months carry forward.
          </p>

          <div className="flex flex-wrap gap-2">
            {BS_MONTHS_EN.map((month, index) => (
              <div
                key={month}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                  index < accruedSoFar
                    ? "bg-green-100 text-green-700 border-green-200"
                    : "bg-gray-50 text-gray-400 border-gray-100"
                }`}
              >
                {month.slice(0, 3)}
              </div>
            ))}
          </div>
        </div>

        {/* Leave Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Leave Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Leave Type *
              </label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {LEAVE_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* From Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                From Date *
              </label>
              <div className="relative" ref={startPickerRef}>
                <button
                  type="button"
                  onClick={() => setShowStartCalendar(!showStartCalendar)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-left flex items-center justify-between hover:border-gray-300"
                >
                  <span
                    className={startDate ? "text-gray-800" : "text-gray-400"}
                  >
                    {formatDateDisplay(startDate)}
                  </span>
                  <CalendarDays size={16} className="text-gray-400" />
                </button>
                {showStartCalendar && (
                  <div className="absolute top-full left-0 mt-2 z-50">
                    <NepaliDatePicker
                      selectedDate={startDate}
                      onSelect={handleStartDateSelect}
                      onClose={() => setShowStartCalendar(false)}
                      minDate={today}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* To Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                To Date *
              </label>
              <div className="relative" ref={endPickerRef}>
                <button
                  type="button"
                  onClick={() => {
                    if (startDate) setShowEndCalendar(!showEndCalendar);
                    else setError("Please select start date first");
                  }}
                  className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl text-left flex items-center justify-between ${
                    !startDate
                      ? "bg-gray-50 cursor-not-allowed"
                      : "hover:border-gray-300"
                  }`}
                >
                  <span className={endDate ? "text-gray-800" : "text-gray-400"}>
                    {formatDateDisplay(endDate)}
                  </span>
                  <CalendarDays size={16} className="text-gray-400" />
                </button>
                {showEndCalendar && startDate && (
                  <div className="absolute top-full left-0 mt-2 z-50">
                    <NepaliDatePicker
                      selectedDate={endDate}
                      onSelect={handleEndDateSelect}
                      onClose={() => setShowEndCalendar(false)}
                      minDate={startDate}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Days preview */}
            {startDate && endDate && (
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-sm text-blue-700">
                  Total leave days:{" "}
                  <span className="font-bold">{getLeaveDays()}</span> day(s)
                </p>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Purpose / Reason *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows="4"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                placeholder="Please provide a reason for your leave request..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClear}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-gradient-to-r from-green-600 to-green-500 text-white font-medium rounded-xl hover:from-green-700 hover:to-green-600 shadow-sm disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* All Leave Requests Table */}
      {myLeaves.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-800">
              My Leave Requests
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Full history of all leave requests
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Leave Type", "From", "To", "Days", "Reason", "Status"].map(
                    (h) => (
                      <th
                        key={h}
                        className="p-3 text-left text-xs font-semibold text-gray-500 uppercase"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {myLeaves.map((req) => {
                  const cfg = getStatusCfg(req.status);
                  return (
                    <tr
                      key={req._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-3 text-sm text-gray-800">
                        {LEAVE_TYPE_DISPLAY[req.leaveType] || req.leaveType}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {req.fromDateNepali ||
                          req.fromDate?.slice(0, 10) ||
                          "—"}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {req.toDateNepali || req.toDate?.slice(0, 10) || "—"}
                      </td>
                      <td className="p-3 text-sm font-medium text-gray-700">
                        {req.totalDays || "—"}
                      </td>
                      <td className="p-3 text-sm text-gray-500 max-w-[200px] truncate">
                        {req.reason || "—"}
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.cls}`}
                          >
                            {cfg.icon}
                            <span className="capitalize">{req.status}</span>
                          </span>
                          {req.status === "rejected" &&
                            (req.rejectionReason || req.adminNote) && (
                              <p className="text-xs text-red-500 max-w-[160px]">
                                {req.rejectionReason || req.adminNote}
                              </p>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-gray-500 font-medium">No leave applications found</p>
      )}

      {/* Disclaimer Modal */}
      {showDisclaimer && leaveBalance && pendingRequest && (
        <DisclaimerModal
          balance={leaveBalance}
          days={pendingRequest.days}
          onConfirm={() => {
            setShowDisclaimer(false);
            doSubmitLeave();
          }}
          onClose={() => {
            setShowDisclaimer(false);
            setPendingRequest(null);
          }}
        />
      )}
    </div>
  );
}
