"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useApp } from "../../../lib/context";
import { useLang } from "../../../lib/LangContext";
import { Trash2, Calendar, Plus, PartyPopper, Gift, LogOut, Camera } from "lucide-react";
import Image from "next/image";
import { BS_MONTHS_EN, getTodayBS, daysInBSMonth, firstDayOfBSMonth } from "../../../lib/calendar";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const TEXT = {
  en: {
    pageTitle:          "Settings",
    pageDesc:           "Manage holidays, celebrations and profile",
    tabHolidays:        "Holidays",
    tabCelebrations:    "Celebrations",
    holidayCal:         "Holiday Calendar",
    clickToAddRemove:   "Click on date to add/remove",
    addMultiple:        "+ Add Multiple",
    upcomingHolidays:   "Upcoming Holidays",
    noUpcomingHolidays: "No upcoming holidays",
    legendHoliday:      "Holiday",
    legendSaturday:     "Saturday",
    legendToday:        "Today",
    addNewCelebration:  "Add New Celebration",
    addNewCelebDesc:    "Create a new celebration event",
    addCelebration:     "Add Celebration",
    upcomingCelebrations:"Upcoming Celebrations 🎉",
    noCelebrations:     "No celebrations added yet",
    // Holiday modal
    addHolidayTitle:    "Add Holiday",
    addHolidaySubtitle: "Schedule a new holiday",
    holidayNamePlaceholder: "Holiday name",
    reasonPlaceholder:  "Reason",
    cancel:             "Cancel",
    addHolidayBtn:      "Add Holiday",
    confirmDeleteHoliday: "Delete this holiday?",
    confirmDeleteCelebration: "Delete this celebration?",
    // Mass modal
    addMultipleTitle:   "Add Multiple Holidays",
    addMultipleSubtitle:"Add a holiday for a range of dates",
    fromDate:           "From Date",
    toDate:             "To Date",
    selectStartDate:    "Select start date",
    selectEndDate:      "Select end date",
    selectStartFirst:   "Select start date first",
    addHolidays:        "Add Holidays",
    // Celebration modal
    addCelebTitle:      "Add Celebration / Occasion",
    addCelebSubtitle:   "Schedule a celebration for a team member",
    teamMember:         "Team Member",
    selectMember:       "Select team member",
    occasionType:       "Occasion Type",
    birthday:           "Birthday",
    workAnniversary:    "Work Anniversary",
    other:              "Other",
    titlePlaceholder:   "Title (e.g., Birthday Celebration)",
    dateLabel:          "Date (AD format: YYYY-MM-DD)",
    // Photo
    changePhoto:        "Change photo",
    photoTooLarge:      "Photo must be less than 100 KB",
    photoFailed:        "Photo upload failed: ",
    logout:             "Logout",
    // weekdays
    weekdays:           ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  },
  np: {
    pageTitle:          "सेटिङ",
    pageDesc:           "बिदा, उत्सव र प्रोफाइल व्यवस्थापन गर्नुस्",
    tabHolidays:        "बिदाहरू",
    tabCelebrations:    "उत्सवहरू",
    holidayCal:         "बिदा क्यालेन्डर",
    clickToAddRemove:   "थप्न/हटाउन मितिमा क्लिक गर्नुस्",
    addMultiple:        "+ धेरै थप्नुस्",
    upcomingHolidays:   "आगामी बिदाहरू",
    noUpcomingHolidays: "कुनै आगामी बिदा छैन",
    legendHoliday:      "बिदा",
    legendSaturday:     "शनिबार",
    legendToday:        "आज",
    addNewCelebration:  "नयाँ उत्सव थप्नुस्",
    addNewCelebDesc:    "नयाँ उत्सव कार्यक्रम बनाउनुस्",
    addCelebration:     "उत्सव थप्नुस्",
    upcomingCelebrations:"आगामी उत्सवहरू 🎉",
    noCelebrations:     "अहिलेसम्म कुनै उत्सव थपिएको छैन",
    // Holiday modal
    addHolidayTitle:    "बिदा थप्नुस्",
    addHolidaySubtitle: "नयाँ बिदा तालिका बनाउनुस्",
    holidayNamePlaceholder: "बिदाको नाम",
    reasonPlaceholder:  "कारण",
    cancel:             "रद्द गर्नुस्",
    addHolidayBtn:      "बिदा थप्नुस्",
    confirmDeleteHoliday: "यो बिदा मेट्ने?",
    confirmDeleteCelebration: "यो उत्सव मेट्ने?",
    // Mass modal
    addMultipleTitle:   "धेरै बिदाहरू थप्नुस्",
    addMultipleSubtitle:"मिति दायराका लागि बिदा थप्नुस्",
    fromDate:           "सुरु मिति",
    toDate:             "अन्त्य मिति",
    selectStartDate:    "सुरु मिति छान्नुस्",
    selectEndDate:      "अन्त्य मिति छान्नुस्",
    selectStartFirst:   "पहिले सुरु मिति छान्नुस्",
    addHolidays:        "बिदाहरू थप्नुस्",
    // Celebration modal
    addCelebTitle:      "उत्सव / अवसर थप्नुस्",
    addCelebSubtitle:   "टोली सदस्यको लागि उत्सव तालिका बनाउनुस्",
    teamMember:         "टोली सदस्य",
    selectMember:       "टोली सदस्य छान्नुस्",
    occasionType:       "अवसर प्रकार",
    birthday:           "जन्मदिन",
    workAnniversary:    "कार्य वार्षिकोत्सव",
    other:              "अन्य",
    titlePlaceholder:   "शीर्षक (जस्तै, जन्मदिन उत्सव)",
    dateLabel:          "मिति (AD ढाँचा: YYYY-MM-DD)",
    // Photo
    changePhoto:        "फोटो परिवर्तन गर्नुस्",
    photoTooLarge:      "फोटो १०० KB भन्दा कम हुनुपर्छ",
    photoFailed:        "फोटो अपलोड असफल: ",
    logout:             "लगआउट",
    weekdays:           ["आइत", "सोम", "मंगल", "बुध", "बिही", "शुक्र", "शनि"],
  },
};

// ── Holiday Calendar ──────────────────────────────────────────────────────────
function HolidayCal({ year, month, holidays, onAdd, onRemove, t }) {
  const today = getTodayBS();
  const days  = daysInBSMonth(year, month);
  const first = firstDayOfBSMonth(year, month);

  const getHoliday = (d) => holidays.find((h) => h.year === year && h.month === month && h.day === d);
  const isPast     = (d) => year < today.year || (year === today.year && (month < today.month || (month === today.month && d < today.day)));
  const isToday    = (d) => year === today.year && month === today.month && d === today.day;
  const isSaturday = (d) => (first + d - 1) % 7 === 6;

  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let i = 1; i <= days; i++) cells.push(i);

  return (
    <div>
      <div className="grid grid-cols-7 mb-2">
        {t.weekdays.map((d, i) => (
          <div key={d} className={`text-center text-xs font-semibold py-1 ${i === 6 ? "text-red-500" : "text-gray-500"}`}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, idx) => {
          if (d === null) return <div key={`empty-${idx}`} />;
          const holiday   = getHoliday(d);
          const past      = isPast(d);
          const todayDate = isToday(d);
          const sat       = isSaturday(d);
          const isHoliday = !!holiday;
          return (
            <button
              key={`${year}-${month}-${d}`}
              disabled={past && !todayDate}
              onClick={() => {
                if (past && !todayDate) return;
                if (isHoliday) onRemove(holiday._id || holiday.id, holiday);
                else onAdd({ year, month, day: d });
              }}
              className={`w-10 h-10 mx-auto rounded-xl text-sm font-medium transition-all relative flex items-center justify-center
                ${isHoliday ? "bg-red-100 text-red-700 ring-2 ring-red-300" : ""}
                ${sat && !isHoliday && !todayDate ? "text-red-500 bg-red-50 font-semibold" : ""}
                ${todayDate && !isHoliday ? "ring-2 ring-green-500 bg-green-50 text-green-700 font-bold" : ""}
                ${!isHoliday && !sat && !todayDate && !past ? "hover:bg-gray-100 text-gray-700" : ""}
                ${past && !todayDate ? "text-gray-300 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {d}
              {isHoliday && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Add Holiday Modal ─────────────────────────────────────────────────────────
function AddHolidayModal({ date, onConfirm, onClose, t }) {
  const [name, setName]     = useState("");
  const [reason, setReason] = useState("");
  if (!date) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 rounded-t-2xl">
          <h3 className="text-white font-bold text-lg">{t.addHolidayTitle}</h3>
          <p className="text-red-100 text-sm">{t.addHolidaySubtitle}</p>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-sm text-gray-600">📅 {date.day} {BS_MONTHS_EN[date.month - 1]} {date.year} BS</p>
          <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition" placeholder={t.holidayNamePlaceholder} value={name} onChange={(e) => setName(e.target.value)} />
          <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition resize-none" placeholder={t.reasonPlaceholder} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">{t.cancel}</button>
            <button onClick={() => { if (name.trim()) onConfirm(name, reason); }} disabled={!name.trim()} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl py-2.5 text-sm font-medium transition disabled:opacity-50">{t.addHolidayBtn}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Mass Holiday Modal ────────────────────────────────────────────────────────
function MassHolidayModal({ onClose, onConfirm, t }) {
  const today = getTodayBS();
  const [name, setName]           = useState("");
  const [reason, setReason]       = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate]     = useState(null);
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd]     = useState(false);

  const dim = (y, m) => ({ 1:31,2:31,3:32,4:31,5:31,6:31,7:30,8:29,9:30,10:29,11:30,12:30 })[m] || 30;

  const handleConfirm = () => {
    if (!name.trim() || !startDate || !endDate) return;
    const dates = [];
    let cur = { ...startDate };
    const end = { ...endDate };
    while (cur.year < end.year || (cur.year === end.year && cur.month < end.month) || (cur.year === end.year && cur.month === end.month && cur.day <= end.day)) {
      dates.push(`${cur.year}-${String(cur.month).padStart(2,"0")}-${String(cur.day).padStart(2,"0")}`);
      cur.day++;
      if (cur.day > dim(cur.year, cur.month)) { cur.day = 1; cur.month++; if (cur.month > 12) { cur.month = 1; cur.year++; } }
    }
    onConfirm({ title: name, occasion: reason, dates });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 rounded-t-2xl">
          <h3 className="text-white font-bold text-lg">{t.addMultipleTitle}</h3>
          <p className="text-red-100 text-sm">{t.addMultipleSubtitle}</p>
        </div>
        <div className="p-6 space-y-3">
          <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition" placeholder={t.holidayNamePlaceholder} value={name} onChange={(e) => setName(e.target.value)} />
          <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition resize-none" placeholder={t.reasonPlaceholder} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-600 mb-1">{t.fromDate}</label>
            <button type="button" onClick={() => setShowStart(!showStart)} className="w-full text-left px-4 py-2.5 border border-gray-200 rounded-xl flex justify-between items-center text-sm hover:border-red-300 transition">
              <span className={startDate ? "text-gray-800" : "text-gray-400"}>{startDate ? `${startDate.day} ${BS_MONTHS_EN[startDate.month-1]} ${startDate.year}` : t.selectStartDate}</span>
              <Calendar size={16} className="text-gray-400 shrink-0" />
            </button>
            {showStart && (
              <div className="absolute mt-1 z-50">
                <NepaliDatePicker selectedDate={startDate} onSelect={(d) => { setStartDate(d); setShowStart(false); }} onClose={() => setShowStart(false)} minDate={today} />
              </div>
            )}
          </div>
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-600 mb-1">{t.toDate}</label>
            <button type="button" onClick={() => startDate ? setShowEnd(!showEnd) : alert(t.selectStartFirst)} className="w-full text-left px-4 py-2.5 border border-gray-200 rounded-xl flex justify-between items-center text-sm hover:border-red-300 transition">
              <span className={endDate ? "text-gray-800" : "text-gray-400"}>{endDate ? `${endDate.day} ${BS_MONTHS_EN[endDate.month-1]} ${endDate.year}` : t.selectEndDate}</span>
              <Calendar size={16} className="text-gray-400 shrink-0" />
            </button>
            {showEnd && startDate && (
              <div className="absolute mt-1 z-50">
                <NepaliDatePicker selectedDate={endDate} onSelect={(d) => { setEndDate(d); setShowEnd(false); }} onClose={() => setShowEnd(false)} minDate={startDate} />
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">{t.cancel}</button>
            <button onClick={handleConfirm} disabled={!name.trim() || !startDate || !endDate} className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-xl py-2.5 text-sm font-medium transition disabled:opacity-50">{t.addHolidays}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Nepali Date Picker ────────────────────────────────────────────────────────
function NepaliDatePicker({ selectedDate, onSelect, onClose, minDate }) {
  const today = getTodayBS();
  const [currentYear,  setCurrentYear]  = useState(selectedDate?.year  || today.year);
  const [currentMonth, setCurrentMonth] = useState(selectedDate?.month || today.month);
  const [selectedDay,  setSelectedDay]  = useState(selectedDate?.day   || null);
  const WD = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  const getDays     = (y, m) => ({ 1:31,2:31,3:32,4:31,5:31,6:31,7:30,8:29,9:30,10:29,11:30,12:30 })[m] || 30;
  const getFirstDay = (y, m) => ({ 1:2,2:5,3:1,4:5,5:1,6:4,7:0,8:2,9:3,10:5,11:6,12:1 })[m] || 0;
  const isDisabled  = (y, m, d) => minDate && (y < minDate.year || (y === minDate.year && m < minDate.month) || (y === minDate.year && m === minDate.month && d < minDate.day));
  const isSaturday  = (y, m, d) => (getFirstDay(y, m) + d - 1) % 7 === 6;

  const days = getDays(currentYear, currentMonth);
  const firstDay = getFirstDay(currentYear, currentMonth);
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= days; i++) cells.push(i);

  const prevMonth = () => { if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(y => y-1); } else setCurrentMonth(m => m-1); setSelectedDay(null); };
  const nextMonth = () => { if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(y => y+1); } else setCurrentMonth(m => m+1); setSelectedDay(null); };
  const handleSelect = (day) => { if (isDisabled(currentYear, currentMonth, day) || isSaturday(currentYear, currentMonth, day)) return; setSelectedDay(day); onSelect({ year: currentYear, month: currentMonth, day }); };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 w-80">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition">◀</button>
        <span className="font-semibold text-sm">{BS_MONTHS_EN[currentMonth-1]} {currentYear}</span>
        <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition">▶</button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WD.map(d => <div key={d} className="text-center text-xs font-semibold text-gray-500 py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`e-${idx}`} className="h-8" />;
          const disabled  = isDisabled(currentYear, currentMonth, day);
          const sat       = isSaturday(currentYear, currentMonth, day);
          const selected  = day === selectedDay;
          return (
            <button key={`${currentYear}-${currentMonth}-${day}`} disabled={disabled} onClick={() => handleSelect(day)}
              className={`w-10 h-10 mx-auto rounded-xl text-sm font-medium transition-all flex items-center justify-center
                ${selected ? "ring-2 ring-green-500 bg-green-50 text-green-700 font-bold" : ""}
                ${sat && !selected ? "text-red-500 bg-red-50" : ""}
                ${!disabled && !sat && !selected ? "hover:bg-gray-100 text-gray-700" : ""}
                ${disabled ? "text-gray-300 cursor-not-allowed" : "cursor-pointer"}`}
            >{day}</button>
          );
        })}
      </div>
    </div>
  );
}

// ── Add Celebration Modal ─────────────────────────────────────────────────────
function AddCelebrationModal({ users, onConfirm, onClose, t }) {
  const [name,         setName]         = useState("");
  const [date,         setDate]         = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [type,         setType]         = useState("birthday");
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 px-6 py-4 rounded-t-2xl">
          <h3 className="text-white font-bold text-lg">{t.addCelebTitle}</h3>
          <p className="text-purple-100 text-sm">{t.addCelebSubtitle}</p>
        </div>
        <div className="p-6 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{t.teamMember}</label>
            <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
              <option value="">{t.selectMember}</option>
              {users.map(u => <option key={u._id} value={u._id}>{u.fullName || u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{t.occasionType}</label>
            <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="birthday">{t.birthday}</option>
              <option value="work_anniversary">{t.workAnniversary}</option>
              <option value="other">{t.other}</option>
            </select>
          </div>
          <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" placeholder={t.titlePlaceholder} value={name} onChange={(e) => setName(e.target.value)} />
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{t.dateLabel}</label>
            <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">{t.cancel}</button>
            <button onClick={() => { if (selectedUser && date && name.trim()) onConfirm({ userId: selectedUser, type, date, title: name }); }} disabled={!selectedUser || !date || !name.trim()} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl py-2.5 text-sm font-medium transition disabled:opacity-50">{t.addCelebration}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminSettingsPage() {
  const router = useRouter();
  const { user, token, setUser, logout } = useApp();
  const { lang } = useLang();
  const t        = TEXT[lang] || TEXT.en;
  const today    = getTodayBS();

  const [year,             setYear]             = useState(today.year);
  const [month,            setMonth]            = useState(today.month);
  const [holidayModal,     setHolidayModal]     = useState(null);
  const [celebrationModal, setCelebrationModal] = useState(false);
  const [massModal,        setMassModal]        = useState(false);
  const [uploadingPhoto,   setUploadingPhoto]   = useState(false);
  const [activeTab,        setActiveTab]        = useState("holidays");
  const [holidays,         setHolidays]         = useState([]);
  const [occasions,        setOccasions]        = useState([]);
  const [usersList,        setUsersList]        = useState([]);
  const fileInputRef = useRef(null);

  const fetchHolidays = useCallback(async () => {
    if (!token) return;
    try {
      const res  = await fetch(`${API}/api/holidays?nepaliYear=${year}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setHolidays((data.holidays || []).map(h => {
        const nd = h.nepaliDate ? h.nepaliDate.split("-") : [];
        return { id: h._id, _id: h._id, name: h.title, reason: h.occasion || "", year: parseInt(nd[0]) || h.nepaliYear, month: parseInt(nd[1]) || 1, day: parseInt(nd[2]) || 1 };
      }));
    } catch (err) { console.error("Failed to fetch holidays:", err); }
  }, [token, year]);

  const fetchOccasions = useCallback(async () => {
    if (!token) return;
    try {
      const res  = await fetch(`${API}/api/occasions`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setOccasions(data.occasions || []);
    } catch (err) { console.error("Failed to fetch occasions:", err); }
  }, [token]);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    try {
      const res  = await fetch(`${API}/api/users`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setUsersList(data.users || []);
    } catch (err) { console.error("Failed to fetch users:", err); }
  }, [token]);

  useEffect(() => { fetchHolidays(); }, []);
  useEffect(() => { fetchOccasions(); fetchUsers(); }, []);

  const prev = () => { if (month === 1) { setYear(y => y-1); setMonth(12); } else setMonth(m => m-1); };
  const next = () => { if (month === 12) { setYear(y => y+1); setMonth(1); } else setMonth(m => m+1); };

  const handleAddHoliday = async (name, reason) => {
    if (!holidayModal || !token) return;
    const bsDateStr = `${holidayModal.year}-${String(holidayModal.month).padStart(2,"0")}-${String(holidayModal.day).padStart(2,"0")}`;
    try {
      const res = await fetch(`${API}/api/holidays`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ title: name, occasion: reason, date: bsDateStr }) });
      if (res.ok) fetchHolidays(); else { const err = await res.json(); alert(err.message || "Failed to add holiday"); }
    } catch (err) { console.error(err); }
    setHolidayModal(null);
  };

  const handleMassHoliday = async ({ title, occasion, dates }) => {
    if (!token || !dates?.length) return;
    try {
      const res = await fetch(`${API}/api/holidays/mass`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ title, occasion, dates }) });
      if (res.ok) { fetchHolidays(); setMassModal(false); } else { const err = await res.json(); alert(err.message || "Failed to add holidays"); }
    } catch (err) { console.error(err); }
  };

  const handleRemoveHoliday = async (id) => {
    if (!confirm(t.confirmDeleteHoliday)) return;
    try {
      const res = await fetch(`${API}/api/holidays/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) fetchHolidays();
    } catch (err) { console.error(err); }
  };

  const handleAddCelebration = async (data) => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/occasions`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
      if (res.ok) fetchOccasions();
    } catch (err) { console.error(err); }
    setCelebrationModal(false);
  };

  const handleRemoveCelebration = async (id) => {
    if (!confirm(t.confirmDeleteCelebration)) return;
    try {
      const res = await fetch(`${API}/api/occasions/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) fetchOccasions();
    } catch (err) { console.error(err); }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 100 * 1024) { alert(t.photoTooLarge); return; }
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res  = await fetch(`${API}/api/profile/upload-photo`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const updated = { ...user, photoUrl: data.photoUrl };
      if (typeof setUser === "function") setUser(updated);
      localStorage.setItem("hrms_user", JSON.stringify(updated));
    } catch (err) { alert(t.photoFailed + err.message); }
    finally { setUploadingPhoto(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const upcomingHolidays = holidays
    .filter(h => h.year > year || (h.year === year && h.month >= month))
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month !== b.month ? a.month - b.month : a.day - b.day);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t.pageTitle}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t.pageDesc}</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold overflow-hidden shrink-0 relative">
            {user?.photoUrl ? <Image src={user.photoUrl} alt={user?.fullName || user?.name} fill className="object-cover" /> : (user?.fullName || user?.name || "A")[0].toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-800">{user?.fullName || user?.name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <button onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title={t.changePhoto}>
            {uploadingPhoto ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" /> : <Camera size={16} />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          <button onClick={() => { logout(); router.push("/"); }} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title={t.logout}>
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button onClick={() => setActiveTab("holidays")} className={`px-4 py-2 rounded-t-lg text-sm font-medium flex items-center gap-2 transition -mb-px ${activeTab === "holidays" ? "bg-red-50 text-red-700 border-b-2 border-red-500" : "text-gray-500 hover:text-gray-700"}`}>
          <Calendar size={16} /> {t.tabHolidays}
        </button>
        <button onClick={() => setActiveTab("celebrations")} className={`px-4 py-2 rounded-t-lg text-sm font-medium flex items-center gap-2 transition -mb-px ${activeTab === "celebrations" ? "bg-purple-50 text-purple-700 border-b-2 border-purple-500" : "text-gray-500 hover:text-gray-700"}`}>
          <PartyPopper size={16} /> {t.tabCelebrations}
        </button>
      </div>

      {/* Holidays Tab */}
      {activeTab === "holidays" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
              <h2 className="font-semibold text-gray-800">{t.holidayCal}</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 hidden sm:block">{t.clickToAddRemove}</span>
                <button onClick={() => setMassModal(true)} className="text-xs px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition">{t.addMultiple}</button>
              </div>
            </div>
            <div className="flex justify-between items-center mb-4">
              <button onClick={prev} className="p-2 hover:bg-gray-100 rounded-lg transition">◀</button>
              <span className="font-semibold text-sm">{BS_MONTHS_EN[month-1]} {year}</span>
              <button onClick={next} className="p-2 hover:bg-gray-100 rounded-lg transition">▶</button>
            </div>
            <HolidayCal year={year} month={month} holidays={holidays} onAdd={setHolidayModal} onRemove={handleRemoveHoliday} t={t} />
            <div className="mt-4 pt-3 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-100 rounded-full ring-1 ring-red-300" /><span>{t.legendHoliday}</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-50 rounded-full" /><span>{t.legendSaturday}</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-50 rounded-full ring-1 ring-green-500" /><span>{t.legendToday}</span></div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-4">{t.upcomingHolidays}</h2>
            {upcomingHolidays.length === 0 ? (
              <div className="text-center py-10"><Calendar size={40} className="text-gray-200 mx-auto mb-2" /><p className="text-sm text-gray-400">{t.noUpcomingHolidays}</p></div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {upcomingHolidays.map(hol => (
                  <div key={hol._id || hol.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{hol.name}</p>
                      <p className="text-xs text-gray-500">{hol.day} {BS_MONTHS_EN[hol.month-1]} {hol.year} BS{hol.reason ? ` • ${hol.reason}` : ""}</p>
                    </div>
                    <button onClick={() => handleRemoveHoliday(hol._id || hol.id)} className="p-2 text-gray-400 hover:text-red-500 transition"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Celebrations Tab */}
      {activeTab === "celebrations" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center shrink-0"><Gift size={22} className="text-purple-600" /></div>
              <div>
                <h2 className="font-semibold text-gray-800">{t.addNewCelebration}</h2>
                <p className="text-xs text-gray-500">{t.addNewCelebDesc}</p>
              </div>
            </div>
            <button onClick={() => setCelebrationModal(true)} className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition">
              <Plus size={18} /> {t.addCelebration}
            </button>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-4">{t.upcomingCelebrations}</h2>
            {occasions.length === 0 ? (
              <div className="text-center py-10"><PartyPopper size={40} className="text-gray-200 mx-auto mb-2" /><p className="text-sm text-gray-400">{t.noCelebrations}</p></div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {occasions.map(occ => (
                  <div key={occ._id} className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                    <div>
                      <div className="flex items-center gap-2"><PartyPopper size={14} className="text-purple-500 shrink-0" /><p className="text-sm font-medium text-gray-800">{occ.title}</p></div>
                      <p className="text-xs text-gray-500 mt-1">📅 {occ.nepaliDate || occ.date?.slice(0,10)} • {occ.user?.fullName || "Unknown"}</p>
                    </div>
                    <button onClick={() => handleRemoveCelebration(occ._id)} className="p-2 text-gray-400 hover:text-red-500 transition"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {holidayModal && <AddHolidayModal date={holidayModal} onConfirm={handleAddHoliday} onClose={() => setHolidayModal(null)} t={t} />}
      {massModal && <MassHolidayModal onClose={() => setMassModal(false)} onConfirm={handleMassHoliday} t={t} />}
      {celebrationModal && <AddCelebrationModal users={usersList} onConfirm={handleAddCelebration} onClose={() => setCelebrationModal(false)} t={t} />}
    </div>
  );
}