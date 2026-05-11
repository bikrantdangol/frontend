"use client";
import { useState, useEffect, useCallback } from "react";
import { useApp } from "../../../lib/context";
import {
  Users,
  CalendarDays,
  Clock,
  CheckCircle,
  ArrowRight,
  UserPlus,
  FileText,
  Settings,
  Bell,
  Activity,
} from "lucide-react";
import { getTodayBS } from "../../../lib/calendar";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AdminDashboard() {
  const { token } = useApp();
  const today = getTodayBS();

  const [users, setUsers] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

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
      if (usersRes.ok) setUsers((await usersRes.json()).users || []);
      if (leavesRes.ok) setLeaveRequests((await leavesRes.json()).leaves || []);
      if (holidaysRes.ok)
        setHolidays((await holidaysRes.json()).holidays || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [token, today.year]);

  useEffect(() => {
    const loadDashboard = async () => {
      await fetchDashboard();
    };

    loadDashboard();
  }, []);

  const pending = leaveRequests.filter((r) => r.status === "pending").length;
  const approved = leaveRequests.filter((r) => r.status === "approved").length;
  const recent = [...leaveRequests]
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
    {
      icon: Users,
      label: "Total Employees",
      value: users.length,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      icon: CalendarDays,
      label: "Pending Leave",
      value: pending,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
    {
      icon: CheckCircle,
      label: "Approved Leave",
      value: approved,
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      icon: Clock,
      label: "Holidays",
      value: holidays.length,
      color: "text-purple-500",
      bg: "bg-purple-50",
    },
  ];

  const quickActions = [
    {
      href: "/admin/users",
      icon: Users,
      label: "Manage Users",
      desc: "Add or edit employees",
      bg: "bg-blue-50",
      text: "text-blue-600",
    },
    {
      href: "/admin/leave",
      icon: CalendarDays,
      label: "Leave Requests",
      desc: `${pending} pending approval`,
      bg: "bg-orange-50",
      text: "text-orange-600",
      badge: pending,
    },
    {
      href: "/admin/attendance",
      icon: Clock,
      label: "Attendance",
      desc: "View all records",
      bg: "bg-green-50",
      text: "text-green-600",
    },
    {
      href: "/admin/settings",
      icon: UserPlus,
      label: "Holidays",
      desc: `${holidays.length} holidays set`,
      bg: "bg-purple-50",
      text: "text-purple-600",
    },
  ];

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back 👋</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
              </div>
              <div
                className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}
              >
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
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Quick Stats
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-3xl font-bold text-gray-800">{users.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Total Registered Users
            </p>
          </div>
          <div className="md:border-l md:border-gray-100 md:pl-6">
            <p className="text-3xl font-bold text-gray-800">{pending}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Pending Leave Requests
            </p>
          </div>
          <div className="md:border-l md:border-gray-100 md:pl-6">
            <p className="text-3xl font-bold text-gray-800">{approved}</p>
            <p className="text-xs text-gray-500 mt-0.5">Approved This Month</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Quick Actions</h2>
          <Link
            href="/admin/settings"
            className="text-green-600 text-sm hover:underline flex items-center gap-1"
          >
            <Settings size={14} /> Manage
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((a, i) => (
            <Link
              key={i}
              href={a.href}
              className="group bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`w-10 h-10 rounded-xl ${a.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}
                >
                  <a.icon size={18} className={a.text} />
                </div>
                {a.badge > 0 && (
                  <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                    {a.badge}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-gray-800 mt-3 text-sm">
                {a.label}
              </h3>
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
              <h2 className="text-lg font-semibold text-gray-800">
                Recent Activity
              </h2>
            </div>
            <span className="text-xs text-gray-400">Last updates</span>
          </div>
          <div className="space-y-3">
            {recent.length === 0 ? (
              <div className="text-center py-6">
                <Activity size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No recent activity</p>
              </div>
            ) : (
              recent.map((req, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                >
                  <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center shrink-0">
                    <Activity size={12} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      {req.user?.fullName || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {req.status === "pending"
                        ? "Submitted leave request"
                        : `Leave request ${req.status}`}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(req.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
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
              <h2 className="text-lg font-semibold text-gray-800">
                Recent Leave Requests
              </h2>
            </div>
            <Link
              href="/admin/leave"
              className="text-green-600 text-sm hover:underline flex items-center gap-1"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="text-center py-10">
              <CalendarDays size={36} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No leave requests yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map((req) => {
                const name = req.user?.fullName || "Unknown";
                const type = req.leaveType
                  ? req.leaveType.charAt(0).toUpperCase() +
                    req.leaveType.slice(1)
                  : "Leave";
                const date =
                  req.fromDateNepali || req.fromDate?.slice(0, 10) || "";
                return (
                  <div
                    key={req._id}
                    className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-xs font-semibold">
                        {name[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {type} · {date}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        req.status === "pending"
                          ? "bg-orange-100 text-orange-700"
                          : req.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {req.status}
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
