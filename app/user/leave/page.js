"use client";

import { useState, useRef, useEffect } from "react";
import { CalendarDays, Send, AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";
import { BS_MONTHS_EN, getTodayBS } from "../../../lib/calendar";
import { useApp } from "../../../lib/context";
import { useLang } from "../../../lib/LangContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const LEAVE_TYPE_MAP = {
  "Casual Leave": "casual",
  "Sick Leave": "sick",
  "Earned / Annual Leave": "earned",
  "Pregnancy Leave": "pregnancy",
};

const TEXT = {
  en: {
    pageTitle:        "Leave Application",
    pageDesc:         "Submit a leave request for approval",
    successMsg:       "Leave request submitted successfully!",
    // Leave types
    leaveTypes:       ["Casual Leave", "Sick Leave", "Earned / Annual Leave", "Pregnancy Leave"],
    leaveTypeDisplay: { casual: "Casual Leave", sick: "Sick Leave", earned: "Earned / Annual Leave", pregnancy: "Pregnancy Leave" },
    // Form labels
    leaveTypeLabel:   "Leave Type",
    fromDate:         "From Date",
    toDate:           "To Date",
    selectDate:       "Select date",
    totalLeaveDays:   (n) => `Total leave days: ${n} day(s)`,
    reasonLabel:      "Purpose / Reason",
    reasonPlaceholder:"Please provide a reason for your leave request...",
    clearBtn:         "Clear",
    submitBtn:        "Submit Request",
    submittingBtn:    "Submitting...",
    selectStartFirst: "Please select start date first",
    endAfterStart:    "End date must be after start date",
    // Validation
    selectLeaveType:  "Please select leave type",
    selectStartDate:  "Please select start date",
    selectEndDate:    "Please select end date",
    provideReason:    "Please provide a reason",
    noLeaveLeft:      (n) => `You only have ${n} day(s) remaining this year.`,
    // Balance card
    leaveBalance:     "Leave Balance",
    daysLeft:         "left",
    balanceDesc:      "1 leave per month. Unused months carry forward.",
    // Status panel
    leaveReqStatus:   "Leave Request Status",
    pending:          "Pending",
    rejected:         "Rejected",
    // Status badges
    statusPending:    "pending",
    statusApproved:   "approved",
    statusRejected:   "rejected",
    pendingNotice:    "Your request is awaiting admin review. You will be notified once a decision is made.",
    rejectedTitle:    "Request Rejected",
    noReason:         "No reason provided by admin.",
    reasonPrefix:     "Reason: ",
    days:             (n) => `${n} day(s)`,
    // Table
    myLeaveRequests:  "My Leave Requests",
    myLeaveDesc:      "Full history of all leave requests",
    colLeaveType:     "Leave Type",
    colFrom:          "From",
    colTo:            "To",
    colDays:          "Days",
    colReason:        "Reason",
    colStatus:        "Status",
    noLeaveFound:     "No leave applications found",
    // Disclaimer modal
    disclaimerTitle:  "Leave Balance Warning",
    disclaimerSubtitle: "Exceeding current month allowance",
    disclaimerWarning:(month) => `⚠️ You are about to exceed your leave balance for ${month}.`,
    availableThis:    "Available this month:",
    youRequesting:    "You are requesting:",
    fromFuture:       "From future months:",
    alreadyUsed:      (n) => `You have already used ${n} day(s) this year.`,
    futureMonths:     (n) => n > 1 ? ` This will use leave from the next ${n} months.` : " This will use next months leave allowance.",
    disclaimer:       "By proceeding, you acknowledge that:",
    disclaimerList:   (month, yearLeft) => [
      `You will have no leave remaining for ${month}`,
      "Future months leave balance will be reduced accordingly",
      `You will have ${yearLeft} day(s) left for the entire year`,
    ],
    agreeText:        "I understand and agree to use leave from future months. I confirm this request is necessary.",
    cancel:           "Cancel",
    proceedAnyway:    "Proceed Anyway",
    // Date picker
    close:            "Close",
    weekdays:         ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  },
  np: {
    pageTitle:        "बिदा आवेदन",
    pageDesc:         "स्वीकृतिको लागि बिदा अनुरोध पेश गर्नुस्",
    successMsg:       "बिदा अनुरोध सफलतापूर्वक पेश गरियो!",
    // Leave types
    leaveTypes:       ["साधारण बिदा", "बिरामी बिदा", "अर्जित / वार्षिक बिदा", "प्रसूति बिदा"],
    leaveTypeDisplay: { casual: "साधारण बिदा", sick: "बिरामी बिदा", earned: "अर्जित / वार्षिक बिदा", pregnancy: "प्रसूति बिदा" },
    // Form labels
    leaveTypeLabel:   "बिदाको प्रकार",
    fromDate:         "सुरु मिति",
    toDate:           "अन्त्य मिति",
    selectDate:       "मिति छान्नुस्",
    totalLeaveDays:   (n) => `कुल बिदा दिन: ${n} दिन`,
    reasonLabel:      "उद्देश्य / कारण",
    reasonPlaceholder:"बिदा अनुरोधको कारण उल्लेख गर्नुस्...",
    clearBtn:         "हटाउनुस्",
    submitBtn:        "अनुरोध पेश गर्नुस्",
    submittingBtn:    "पेश हुँदैछ...",
    selectStartFirst: "पहिले सुरु मिति छान्नुस्",
    endAfterStart:    "अन्त्य मिति सुरु मिति पछि हुनुपर्छ",
    // Validation
    selectLeaveType:  "बिदाको प्रकार छान्नुस्",
    selectStartDate:  "सुरु मिति छान्नुस्",
    selectEndDate:    "अन्त्य मिति छान्नुस्",
    provideReason:    "कारण उल्लेख गर्नुस्",
    noLeaveLeft:      (n) => `यो वर्षमा तपाईंसँग केवल ${n} दिन बाँकी छ।`,
    // Balance card
    leaveBalance:     "बिदा ब्यालेन्स",
    daysLeft:         "बाँकी",
    balanceDesc:      "प्रति महिना १ बिदा। अप्रयुक्त महिनाहरू अर्को महिनामा सरिन्छ।",
    // Status panel
    leaveReqStatus:   "बिदा अनुरोधको स्थिति",
    pending:          "बाँकी",
    rejected:         "अस्वीकृत",
    // Status badges
    statusPending:    "बाँकी",
    statusApproved:   "स्वीकृत",
    statusRejected:   "अस्वीकृत",
    pendingNotice:    "तपाईंको अनुरोध प्रशासकको समीक्षाको प्रतीक्षामा छ। निर्णय भएपछि सूचना पाउनुहुनेछ।",
    rejectedTitle:    "अनुरोध अस्वीकार",
    noReason:         "प्रशासकले कुनै कारण दिएको छैन।",
    reasonPrefix:     "कारण: ",
    days:             (n) => `${n} दिन`,
    // Table
    myLeaveRequests:  "मेरो बिदा अनुरोधहरू",
    myLeaveDesc:      "सबै बिदा अनुरोधहरूको इतिहास",
    colLeaveType:     "बिदाको प्रकार",
    colFrom:          "सुरु",
    colTo:            "अन्त्य",
    colDays:          "दिन",
    colReason:        "कारण",
    colStatus:        "स्थिति",
    noLeaveFound:     "कुनै बिदा आवेदन भेटिएन",
    // Disclaimer modal
    disclaimerTitle:  "बिदा ब्यालेन्स चेतावनी",
    disclaimerSubtitle:"चालु महिनाको सीमा नाघ्दैछ",
    disclaimerWarning:(month) => `⚠️ तपाईं ${month} को बिदा ब्यालेन्स नाघ्न लाग्नुभएको छ।`,
    availableThis:    "यो महिना उपलब्ध:",
    youRequesting:    "तपाईं अनुरोध गर्दै:",
    fromFuture:       "भविष्यका महिनाबाट:",
    alreadyUsed:      (n) => `तपाईंले यो वर्ष पहिले नै ${n} दिन प्रयोग गर्नुभयो।`,
    futureMonths:     (n) => n > 1 ? ` यसले अर्को ${n} महिनाको बिदा प्रयोग गर्नेछ।` : " यसले अर्को महिनाको बिदा प्रयोग गर्नेछ।",
    disclaimer:       "अगाडि बढ्दा तपाईं स्वीकार गर्नुहुन्छ कि:",
    disclaimerList:   (month, yearLeft) => [
      `${month} को लागि तपाईंसँग कुनै बिदा बाँकी हुनेछैन`,
      "भविष्यका महिनाहरूको बिदा ब्यालेन्स घट्नेछ",
      `तपाईंसँग यो वर्षको लागि ${yearLeft} दिन बाँकी हुनेछ`,
    ],
    agreeText:        "म बुझ्छु र भविष्यका महिनाहरूबाट बिदा प्रयोग गर्न सहमत छु। यो अनुरोध आवश्यक छ भनी पुष्टि गर्छु।",
    cancel:           "रद्द गर्नुस्",
    proceedAnyway:    "फेरि पनि अगाडि बढ्नुस्",
    // Date picker
    close:            "बन्द गर्नुस्",
    weekdays:         ["आइत", "सोम", "मंगल", "बुध", "बिही", "शुक्र", "शनि"],
  },
};

// Maps Nepali leave type labels back to English keys for API
const NP_LEAVE_TYPE_TO_API = {
  "साधारण बिदा":         "casual",
  "बिरामी बिदा":         "sick",
  "अर्जित / वार्षिक बिदा":"earned",
  "प्रसूति बिदा":        "pregnancy",
};

const STATUS_CONFIG_KEYS = { approved: "approved", rejected: "rejected", pending: "pending" };

// ─── Disclaimer Modal ─────────────────────────────────────────────────────────
function DisclaimerModal({ balance, days, onConfirm, onClose, t }) {
  const [agreed, setAgreed] = useState(false);
  const monthsAhead      = days - balance.availableNow;
  const currentMonthName = BS_MONTHS_EN[(balance.currentMonth || 1) - 1];
  const yearLeft         = Math.max(0, balance.remainingForYear - days);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <AlertCircle size={22} className="text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">{t.disclaimerTitle}</h3>
            <p className="text-orange-100 text-sm">{t.disclaimerSubtitle}</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 space-y-2">
            <p className="text-sm text-amber-800 font-medium">{t.disclaimerWarning(currentMonthName)}</p>
            <div className="space-y-1 text-sm text-amber-700">
              <div className="flex justify-between"><span>{t.availableThis}</span><span className="font-bold">{t.days(balance.availableNow)}</span></div>
              <div className="flex justify-between"><span>{t.youRequesting}</span><span className="font-bold">{t.days(days)}</span></div>
              <div className="flex justify-between border-t border-amber-300 pt-2"><span>{t.fromFuture}</span><span className="font-bold text-red-600">{t.days(monthsAhead)}</span></div>
            </div>
            <p className="text-xs text-amber-600 mt-2">{t.alreadyUsed(balance.used)}{t.futureMonths(monthsAhead)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-600 mb-2">{t.disclaimer}</p>
            <ul className="text-xs text-gray-600 space-y-1.5 list-disc pl-4">
              {t.disclaimerList(currentMonthName, yearLeft).map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
            <span className="text-sm text-gray-700">{t.agreeText}</span>
          </label>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors">{t.cancel}</button>
            <button onClick={() => agreed && onConfirm()} disabled={!agreed} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">{t.proceedAnyway}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Nepali Date Picker ───────────────────────────────────────────────────────
function NepaliDatePicker({ selectedDate, onSelect, onClose, minDate, t }) {
  const today = getTodayBS();
  const [currentYear,  setCurrentYear]  = useState(selectedDate?.year  || today.year);
  const [currentMonth, setCurrentMonth] = useState(selectedDate?.month || today.month);
  const [selectedDay,  setSelectedDay]  = useState(selectedDate?.day   || null);

  const getDaysInMonth  = (y, m) => ({ 1:31,2:31,3:32,4:31,5:31,6:31,7:30,8:29,9:30,10:29,11:30,12:30 })[m] || 30;
  const getFirstDay     = (y, m) => ({ 1:2,2:5,3:1,4:5,5:1,6:4,7:0,8:2,9:3,10:5,11:6,12:1 })[m] || 0;
  const isDateDisabled  = (y, m, d) => { if (!minDate) return false; if (y < minDate.year) return true; if (y === minDate.year && m < minDate.month) return true; if (y === minDate.year && m === minDate.month && d < minDate.day) return true; return false; };
  const isSaturday      = (y, m, d) => (getFirstDay(y, m) + d - 1) % 7 === 6;
  const isTodayFn       = (y, m, d) => y === today.year && m === today.month && d === today.day;

  const days     = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDay(currentYear, currentMonth);
  const cells    = [...Array(firstDay).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];

  const prevMonth = () => { if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(y => y-1); } else setCurrentMonth(m => m-1); setSelectedDay(null); };
  const nextMonth = () => { if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(y => y+1); } else setCurrentMonth(m => m+1); setSelectedDay(null); };
  const handleDateSelect = (day) => {
    if (!isDateDisabled(currentYear, currentMonth, day) && !isSaturday(currentYear, currentMonth, day)) {
      setSelectedDay(day);
      onSelect({ year: currentYear, month: currentMonth, day });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 w-80">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded">◀</button>
        <span className="font-semibold">{BS_MONTHS_EN[currentMonth-1]} {currentYear}</span>
        <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded">▶</button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {t.weekdays.map((d) => <div key={d} className="text-center text-xs font-semibold text-gray-500 py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`e-${idx}`} className="h-8" />;
          const selected = day === selectedDay;
          const disabled = isDateDisabled(currentYear, currentMonth, day);
          const sat      = isSaturday(currentYear, currentMonth, day);
          const isT      = isTodayFn(currentYear, currentMonth, day);
          let extra = "text-gray-700";
          if (selected)   extra = "bg-green-500 text-white";
          else if (isT)   extra = "ring-2 ring-green-500 bg-green-50 text-green-700 font-bold";
          else if (sat)   extra = "text-red-500 cursor-not-allowed";
          else if (disabled) extra = "text-gray-300 cursor-not-allowed";
          else            extra = "text-gray-700 hover:bg-gray-100 cursor-pointer";
          return <button key={day} onClick={() => handleDateSelect(day)} disabled={disabled || sat} className={`h-8 w-8 mx-auto rounded-lg text-sm font-medium transition-all ${extra}`}>{day}</button>;
        })}
      </div>
      <button onClick={onClose} className="mt-3 w-full py-2 text-sm text-gray-500 hover:text-gray-700 border-t">{t.close}</button>
    </div>
  );
}

// ─── Leave Status Detail Card ─────────────────────────────────────────────────
function LeaveStatusCard({ leave, t }) {
  const status    = leave.status;
  const isPending  = status === "pending";
  const isRejected = status === "rejected";

  const cfgMap = {
    approved: { icon: <CheckCircle size={14} />, cls: "bg-green-100 text-green-700",  badge: "bg-green-50 border-green-200 text-green-700"  },
    rejected: { icon: <XCircle size={14} />,     cls: "bg-red-100 text-red-700",     badge: "bg-red-50 border-red-200 text-red-700"       },
    pending:  { icon: <Clock size={14} />,        cls: "bg-orange-100 text-orange-700",badge: "bg-orange-50 border-orange-200 text-orange-700"},
  };
  const cfg        = cfgMap[status] || cfgMap.pending;
  const statusLabel = { approved: t.statusApproved, rejected: t.statusRejected, pending: t.statusPending }[status] || status;

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${cfg.badge}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-800">{t.leaveTypeDisplay[leave.leaveType] || leave.leaveType}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {leave.fromDateNepali || leave.fromDate?.slice(0, 10)} → {leave.toDateNepali || leave.toDate?.slice(0, 10)}
            {leave.totalDays ? ` · ${t.days(leave.totalDays)}` : ""}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${cfg.cls}`}>
          {cfg.icon}<span>{statusLabel}</span>
        </span>
      </div>
      {leave.reason && (
        <div className="text-xs text-gray-600 bg-white/60 rounded-lg px-3 py-2">
          <span className="font-medium text-gray-700">{t.reasonPrefix}</span>{leave.reason}
        </div>
      )}
      {isPending && (
        <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
          <Clock size={14} className="text-orange-500 mt-0.5 shrink-0" />
          <p className="text-xs text-orange-700">{t.pendingNotice}</p>
        </div>
      )}
      {isRejected && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <XCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-red-700 mb-0.5">{t.rejectedTitle}</p>
            <p className="text-xs text-red-600">{leave.rejectionReason || leave.adminNote || t.noReason}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function UserLeavePage() {
  const { user, token } = useApp();
  const { lang }        = useLang();
  const t               = TEXT[lang] || TEXT.en;

  const [leaveType,          setLeaveType]          = useState(t.leaveTypes[0]);
  const [reason,             setReason]             = useState("");
  const [startDate,          setStartDate]          = useState(null);
  const [endDate,            setEndDate]            = useState(null);
  const [showStartCalendar,  setShowStartCalendar]  = useState(false);
  const [showEndCalendar,    setShowEndCalendar]    = useState(false);
  const [submitted,          setSubmitted]          = useState(false);
  const [error,              setError]              = useState("");
  const [myLeaves,           setMyLeaves]           = useState([]);
  const [leaveBalance,       setLeaveBalance]       = useState(null);
  const [loading,            setLoading]            = useState(false);
  const [showDisclaimer,     setShowDisclaimer]     = useState(false);
  const [pendingRequest,     setPendingRequest]     = useState(null);

  const startPickerRef = useRef(null);
  const endPickerRef   = useRef(null);
  const today          = getTodayBS();

  // Reset leave type label when language changes
  useEffect(() => { setLeaveType(t.leaveTypes[0]); }, [lang]);

  const fetchLeaves = async () => {
    if (!token) return;
    try {
      const res  = await fetch(`${API}/api/leave`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setMyLeaves(data.leaves || []);
    } catch (_) {}
  };

  const fetchBalance = async () => {
    if (!token) return;
    try {
      const res  = await fetch(`${API}/api/leave/balance`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setLeaveBalance(data.balance);
    } catch (_) {}
  };

  useEffect(() => {
    if (!user || !token) return;
    fetchLeaves();
    fetchBalance();
  }, [user, token]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (startPickerRef.current && !startPickerRef.current.contains(e.target)) setShowStartCalendar(false);
      if (endPickerRef.current   && !endPickerRef.current.contains(e.target))   setShowEndCalendar(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const usedLeaves       = leaveBalance?.used || 0;
  const availableLeaves  = leaveBalance?.remainingForYear ?? 12 - usedLeaves;
  const accruedSoFar     = leaveBalance?.accruedSoFar || 0;

  const pendingLeaves    = myLeaves.filter((l) => l.status === "pending");
  const rejectedLeaves   = myLeaves.filter((l) => l.status === "rejected");
  const actionableLeaves = [...pendingLeaves, ...rejectedLeaves];

  const handleStartDateSelect = (date) => {
    setStartDate(date);
    setShowStartCalendar(false);
    if (endDate && (date.year > endDate.year || (date.year === endDate.year && date.month > endDate.month) || (date.year === endDate.year && date.month === endDate.month && date.day > endDate.day))) setEndDate(null);
  };

  const handleEndDateSelect = (date) => {
    if (!startDate) { setError(t.selectStartFirst); setShowEndCalendar(false); return; }
    const valid = date.year > startDate.year || (date.year === startDate.year && date.month > startDate.month) || (date.year === startDate.year && date.month === startDate.month && date.day >= startDate.day);
    if (valid) { setEndDate(date); setError(""); setShowEndCalendar(false); }
    else setError(t.endAfterStart);
  };

  const getLeaveDays = () => {
    if (!startDate || !endDate) return 1;
    const dim = (m) => ({ 1:31,2:31,3:32,4:31,5:31,6:31,7:30,8:29,9:30,10:29,11:30,12:30 })[m] || 30;
    let days = 0, cy = startDate.year, cm = startDate.month, cd = startDate.day;
    while (cy < endDate.year || (cy === endDate.year && cm < endDate.month) || (cy === endDate.year && cm === endDate.month && cd <= endDate.day)) {
      days++;
      if (cy === endDate.year && cm === endDate.month && cd === endDate.day) break;
      cd++; if (cd > dim(cm)) { cd = 1; cm++; } if (cm > 12) { cm = 1; cy++; }
    }
    return days;
  };

  // Resolve API leave type from either English or Nepali label
  const resolveApiLeaveType = (label) => LEAVE_TYPE_MAP[label] || NP_LEAVE_TYPE_TO_API[label] || "casual";

  const doSubmitLeave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          leaveType: resolveApiLeaveType(leaveType),
          reason,
          fromDate: `${startDate.year}-${String(startDate.month).padStart(2,"0")}-${String(startDate.day).padStart(2,"0")}`,
          toDate:   `${endDate.year}-${String(endDate.month).padStart(2,"0")}-${String(endDate.day).padStart(2,"0")}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit");
      await fetchLeaves();
      await fetchBalance();
      setSubmitted(true);
      setLeaveType(t.leaveTypes[0]);
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
    if (!leaveType)      return setError(t.selectLeaveType);
    if (!startDate)      return setError(t.selectStartDate);
    if (!endDate)        return setError(t.selectEndDate);
    if (!reason.trim())  return setError(t.provideReason);
    const days = getLeaveDays();
    if (usedLeaves + days > 12) return setError(t.noLeaveLeft(12 - usedLeaves));
    if (leaveBalance && days > leaveBalance.availableNow) { setPendingRequest({ days }); setShowDisclaimer(true); return; }
    setPendingRequest({ days });
    await doSubmitLeave();
  };

  const handleClear = () => { setLeaveType(t.leaveTypes[0]); setReason(""); setStartDate(null); setEndDate(null); setError(""); };
  const formatDateDisplay = (date) => date ? `${date.day} ${BS_MONTHS_EN[date.month-1]} ${date.year} BS` : t.selectDate;

  const cfgMap = {
    approved: { icon: <CheckCircle size={14} />, cls: "bg-green-100 text-green-700"  },
    rejected: { icon: <XCircle size={14} />,     cls: "bg-red-100 text-red-700"     },
    pending:  { icon: <Clock size={14} />,        cls: "bg-orange-100 text-orange-700"},
  };
  const getStatusLabel = (s) => ({ approved: t.statusApproved, rejected: t.statusRejected, pending: t.statusPending }[s] || s);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t.pageTitle}</h1>
        <p className="text-gray-500 text-sm mt-1">{t.pageDesc}</p>
      </div>

      {/* Alerts */}
      {submitted && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <Send size={16} /><span className="text-sm font-medium">{t.successMsg}</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle size={16} /><span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Status panel */}
      {actionableLeaves.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-800">{t.leaveReqStatus}</h2>
            {pendingLeaves.length  > 0 && <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">{pendingLeaves.length} {t.pending}</span>}
            {rejectedLeaves.length > 0 && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">{rejectedLeaves.length} {t.rejected}</span>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {actionableLeaves.map((leave) => <LeaveStatusCard key={leave._id} leave={leave} t={t} />)}
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Balance Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              <div className="w-11 h-11 rounded-2xl bg-green-100 flex items-center justify-center"><CalendarDays size={20} className="text-green-600" /></div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">{t.leaveBalance}</h3>
                <p className="text-sm text-gray-500">{availableLeaves} / 12 {lang === "np" ? "दिन" : "days"}</p>
              </div>
            </div>
            <div className="bg-green-50 rounded-2xl px-4 py-2 text-center min-w-[70px]">
              <p className="text-2xl font-bold text-green-600">{availableLeaves}</p>
              <p className="text-xs text-gray-500">{t.daysLeft}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">{t.balanceDesc}</p>
          <div className="flex flex-wrap gap-2">
            {BS_MONTHS_EN.map((month, index) => (
              <div key={month} className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${index < accruedSoFar ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-50 text-gray-400 border-gray-100"}`}>
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.leaveTypeLabel} *</label>
              <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500">
                {t.leaveTypes.map((lt) => <option key={lt}>{lt}</option>)}
              </select>
            </div>

            {/* From Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.fromDate} *</label>
              <div className="relative" ref={startPickerRef}>
                <button type="button" onClick={() => setShowStartCalendar(!showStartCalendar)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-left flex items-center justify-between hover:border-gray-300">
                  <span className={startDate ? "text-gray-800" : "text-gray-400"}>{formatDateDisplay(startDate)}</span>
                  <CalendarDays size={16} className="text-gray-400" />
                </button>
                {showStartCalendar && (
                  <div className="absolute top-full left-0 mt-2 z-50">
                    <NepaliDatePicker selectedDate={startDate} onSelect={handleStartDateSelect} onClose={() => setShowStartCalendar(false)} minDate={today} t={t} />
                  </div>
                )}
              </div>
            </div>

            {/* To Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.toDate} *</label>
              <div className="relative" ref={endPickerRef}>
                <button type="button" onClick={() => { if (startDate) setShowEndCalendar(!showEndCalendar); else setError(t.selectStartFirst); }} className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl text-left flex items-center justify-between ${!startDate ? "bg-gray-50 cursor-not-allowed" : "hover:border-gray-300"}`}>
                  <span className={endDate ? "text-gray-800" : "text-gray-400"}>{formatDateDisplay(endDate)}</span>
                  <CalendarDays size={16} className="text-gray-400" />
                </button>
                {showEndCalendar && startDate && (
                  <div className="absolute top-full left-0 mt-2 z-50">
                    <NepaliDatePicker selectedDate={endDate} onSelect={handleEndDateSelect} onClose={() => setShowEndCalendar(false)} minDate={startDate} t={t} />
                  </div>
                )}
              </div>
            </div>

            {/* Days preview */}
            {startDate && endDate && (
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-sm text-blue-700">{t.totalLeaveDays(getLeaveDays())}</p>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.reasonLabel} *</label>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows="4" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" placeholder={t.reasonPlaceholder} />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button type="button" onClick={handleClear} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50">{t.clearBtn}</button>
              <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-gradient-to-r from-green-600 to-green-500 text-white font-medium rounded-xl hover:from-green-700 hover:to-green-600 shadow-sm disabled:opacity-50">
                {loading ? t.submittingBtn : t.submitBtn}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* All Leave Requests Table */}
      {myLeaves.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-800">{t.myLeaveRequests}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{t.myLeaveDesc}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {[t.colLeaveType, t.colFrom, t.colTo, t.colDays, t.colReason, t.colStatus].map((h) => (
                    <th key={h} className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {myLeaves.map((req) => {
                  const cfg         = cfgMap[req.status] || cfgMap.pending;
                  const statusLabel = getStatusLabel(req.status);
                  return (
                    <tr key={req._id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-sm text-gray-800">{t.leaveTypeDisplay[req.leaveType] || req.leaveType}</td>
                      <td className="p-3 text-sm text-gray-600">{req.fromDateNepali || req.fromDate?.slice(0,10) || "—"}</td>
                      <td className="p-3 text-sm text-gray-600">{req.toDateNepali   || req.toDate?.slice(0,10)   || "—"}</td>
                      <td className="p-3 text-sm font-medium text-gray-700">{req.totalDays || "—"}</td>
                      <td className="p-3 text-sm text-gray-500 max-w-[200px] truncate">{req.reason || "—"}</td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.cls}`}>
                            {cfg.icon}<span>{statusLabel}</span>
                          </span>
                          {req.status === "rejected" && (req.rejectionReason || req.adminNote) && (
                            <p className="text-xs text-red-500 max-w-[160px]">{req.rejectionReason || req.adminNote}</p>
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
        <p className="text-gray-500 font-medium">{t.noLeaveFound}</p>
      )}

      {/* Disclaimer Modal */}
      {showDisclaimer && leaveBalance && pendingRequest && (
        <DisclaimerModal
          balance={leaveBalance}
          days={pendingRequest.days}
          t={t}
          onConfirm={() => { setShowDisclaimer(false); doSubmitLeave(); }}
          onClose={() => { setShowDisclaimer(false); setPendingRequest(null); }}
        />
      )}
    </div>
  );
}