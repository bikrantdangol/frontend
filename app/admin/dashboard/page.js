"use client";
import { useState, useEffect, useCallback } from "react";
import { useApp } from "../../../lib/context";
import { useLang } from "../../../lib/LangContext";
import {
  Users, CalendarDays, Clock, CheckCircle,
  ArrowRight, UserPlus, FileText, Settings,
  Bell, Activity,
} from "lucide-react";
import { getTodayBS } from "../../../lib/calendar";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const TEXT = {
  en: {
    title:            "Dashboard",
    welcome:          "Welcome back",
    totalEmployees:   "Total Employees",
    pendingLeave:     "Pending Leave",
    approvedLeave:    "Approved Leave",
    holidays:         "Holidays",
    quickStats:       "Quick Stats",
    totalUsers:       "Total Registered Users",
    pendingRequests:  "Pending Leave Requests",
    approvedMonth:    "Approved This Month",
    quickActions:     "Quick Actions",
    manage:           "Manage",
    manageUsers:      "Manage Users",
    manageUsersDesc:  "Add or edit employees",
    leaveRequests:    "Leave Requests",
    pendingApproval:  (n) => `${n} pending approval`,
    attendance:       "Attendance",
    attendanceDesc:   "View all records",
    holidaysLabel:    "Holidays",
    holidaysSet:      (n) => `${n} holidays set`,
    recentActivity:   "Recent Activity",
    lastUpdates:      "Last updates",
    noActivity:       "No recent activity",
    submittedLeave:   "Submitted leave request",
    leaveStatus:      (s) => `Leave request ${s}`,
    recentLeave:      "Recent Leave Requests",
    viewAll:          "View all",
    noLeave:          "No leave requests yet",
    statusPending:    "pending",
    statusApproved:   "approved",
    statusRejected:   "rejected",
  },
  np: {
    title:            "ड्यासबोर्ड",
    welcome:          "स्वागत छ",
    totalEmployees:   "कुल कर्मचारी",
    pendingLeave:     "बाँकी बिदा",
    approvedLeave:    "स्वीकृत बिदा",
    holidays:         "बिदाहरू",
    quickStats:       "छोटो तथ्याङ्क",
    totalUsers:       "कुल दर्ता भएका प्रयोगकर्ता",
    pendingRequests:  "बाँकी बिदा अनुरोधहरू",
    approvedMonth:    "यो महिना स्वीकृत",
    quickActions:     "द्रुत कार्यहरू",
    manage:           "व्यवस्थापन",
    manageUsers:      "प्रयोगकर्ता व्यवस्थापन",
    manageUsersDesc:  "कर्मचारी थप्नुस् वा सम्पादन गर्नुस्",
    leaveRequests:    "बिदा अनुरोधहरू",
    pendingApproval:  (n) => `${n} स्वीकृतिको लागि बाँकी`,
    attendance:       "हाजिरी",
    attendanceDesc:   "सबै रेकर्ड हेर्नुस्",
    holidaysLabel:    "बिदाहरू",
    holidaysSet:      (n) => `${n} बिदा तोकिएको`,
    recentActivity:   "हालका गतिविधिहरू",
    lastUpdates:      "अन्तिम अपडेट",
    noActivity:       "कुनै हालको गतिविधि छैन",
    submittedLeave:   "बिदा अनुरोध पेश गरियो",
    leaveStatus:      (s) => `बिदा अनुरोध ${s}`,
    recentLeave:      "हालका बिदा अनुरोधहरू",
    viewAll:          "सबै हेर्नुस्",
    noLeave:          "अहिलेसम्म कुनै बिदा अनुरोध छैन",
    statusPending:    "बाँकी",
    statusApproved:   "स्वीकृत",
    statusRejected:   "अस्वीकृत",
  },
};

function statusLabel(status, t) {
  if (status === "pending")  return t.statusPending;
  if (status === "approved") return t.statusApproved;
  return t.statusRejected;
}

export default function AdminDashboard() {
  const { token } = useApp();
  const { lang }  = useLang();
  const t         = TEXT[lang] || TEXT.en;
  const today     = getTodayBS();

  const [users,         setUsers]         = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [holidays,      setHolidays]      = useState([]);
  const [loading,       setLoading]       = useState(true);

  const fetchDashboard = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [usersRes, leavesRes, holidaysRes] = await Promise.all([
        fetch(`${API}/api/users`, { headers }),
        fetch(`${API}/api/leave/all`, { headers }),
        fetch(`${API}/api/holidays?nepaliYear=${today.year}`, { headers }),
      ]);
      if (usersRes.ok)    setUsers((await usersRes.json()).users || []);
      if (leavesRes.ok)   setLeaveRequests((await leavesRes.json()).leaves || []);
      if (holidaysRes.ok) setHolidays((await holidaysRes.json()).holidays || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [token, today.year]);

  useEffect(() => { fetchDashboard(); }, []);

  const pending  = leaveRequests.filter((r) => r.status === "pending").length;
  const approved = leaveRequests.filter((r) => r.status === "approved").length;
  const recent   = [...leaveRequests]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  const stats = [
    { icon: Users,       label: t.totalEmployees, value: users.length,    color: "text-blue-500",   bg: "bg-blue-50"   },
    { icon: CalendarDays,label: t.pendingLeave,   value: pending,         color: "text-orange-500", bg: "bg-orange-50" },
    { icon: CheckCircle, label: t.approvedLeave,  value: approved,        color: "text-green-500",  bg: "bg-green-50"  },
    { icon: Clock,       label: t.holidays,       value: holidays.length, color: "text-purple-500", bg: "bg-purple-50" },
  ];

  const quickActions = [
    { href: "/admin/users",      icon: Users,       label: t.manageUsers,    desc: t.manageUsersDesc,            bg: "bg-blue-50",   text: "text-blue-600"   },
    { href: "/admin/leave",      icon: CalendarDays,label: t.leaveRequests,  desc: t.pendingApproval(pending),   bg: "bg-orange-50", text: "text-orange-600", badge: pending },
    { href: "/admin/attendance", icon: Clock,       label: t.attendance,     desc: t.attendanceDesc,             bg: "bg-green-50",  text: "text-green-600"  },
    { href: "/admin/settings",   icon: UserPlus,    label: t.holidaysLabel,  desc: t.holidaysSet(holidays.length),bg: "bg-purple-50", text: "text-purple-600" },
  ];

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t.title}</h1>
        <p className="text-sm text-gray-500 mt-1">{t.welcome}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <stat.icon size={20} className={stat.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={16} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{t.quickStats}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-3xl font-bold text-gray-800">{users.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">{t.totalUsers}</p>
          </div>
          <div className="md:border-l md:border-gray-100 md:pl-6">
            <p className="text-3xl font-bold text-gray-800">{pending}</p>
            <p className="text-xs text-gray-500 mt-0.5">{t.pendingRequests}</p>
          </div>
          <div className="md:border-l md:border-gray-100 md:pl-6">
            <p className="text-3xl font-bold text-gray-800">{approved}</p>
            <p className="text-xs text-gray-500 mt-0.5">{t.approvedMonth}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">{t.quickActions}</h2>
          <Link href="/admin/settings" className="text-green-600 text-sm hover:underline flex items-center gap-1">
            <Settings size={14} /> {t.manage}
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((a, i) => (
            <Link key={i} href={a.href} className="group bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl ${a.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <a.icon size={18} className={a.text} />
                </div>
                {a.badge > 0 && (
                  <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">{a.badge}</span>
                )}
              </div>
              <h3 className="font-semibold text-gray-800 mt-3 text-sm">{a.label}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{a.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity & Leave Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-800">{t.recentActivity}</h2>
            </div>
            <span className="text-xs text-gray-400">{t.lastUpdates}</span>
          </div>
          <div className="space-y-3">
            {recent.length === 0 ? (
              <div className="text-center py-6">
                <Activity size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">{t.noActivity}</p>
              </div>
            ) : (
              recent.map((req, idx) => (
                <div key={idx} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center shrink-0">
                    <Activity size={12} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{req.user?.fullName || "Unknown"}</p>
                    <p className="text-xs text-gray-500">
                      {req.status === "pending" ? t.submittedLeave : t.leaveStatus(statusLabel(req.status, t))}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(req.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Leave Requests */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-800">{t.recentLeave}</h2>
            </div>
            <Link href="/admin/leave" className="text-green-600 text-sm hover:underline flex items-center gap-1">
              {t.viewAll} <ArrowRight size={12} />
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="text-center py-10">
              <CalendarDays size={36} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">{t.noLeave}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map((req) => {
                const name = req.user?.fullName || "Unknown";
                const type = req.leaveType
                  ? req.leaveType.charAt(0).toUpperCase() + req.leaveType.slice(1)
                  : "Leave";
                const date = req.fromDateNepali || req.fromDate?.slice(0, 10) || "";
                const status = statusLabel(req.status, t);
                return (
                  <div key={req._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-xs font-semibold">
                        {name[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{name}</p>
                        <p className="text-xs text-gray-400">{type} · {date}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      req.status === "pending"  ? "bg-orange-100 text-orange-700" :
                      req.status === "approved" ? "bg-green-100 text-green-700"  :
                                                  "bg-red-100 text-red-700"
                    }`}>
                      {status}
                    </span>
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