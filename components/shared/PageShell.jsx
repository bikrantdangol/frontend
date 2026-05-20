"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { getTodayBS, fmtDate } from "../../lib/calendar";
import { useApp } from "../../lib/context";
import { LangContext, useLang } from "../../lib/LangContext";

export { useLang }; // re-export so existing imports from PageShell still work

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ─── Translations ────────────────────────────────────────────────────────────
const TRANSLATIONS = {
  en: {
    notifications: "Notifications",
    new: "new",
    markAllRead: "Mark all as read",
    noNotifications: "No notifications",
    close: "Close",
    justNow: "Just now",
    mAgo: (m) => `${m}m ago`,
    hAgo: (h) => `${h}h ago`,
    dAgo: (d) => `${d}d ago`,
    footer: "Mirmire Bachat Rin Sahakari Sanstha Ltd.",
    switchLang: "नेपाली",
  },
  np: {
    notifications: "सूचनाहरू",
    new: "नयाँ",
    markAllRead: "सबै पढिएको मार्क गर्नुस्",
    noNotifications: "कुनै सूचना छैन",
    close: "बन्द गर्नुस्",
    justNow: "भर्खरै",
    mAgo: (m) => `${m} मिनेट अघि`,
    hAgo: (h) => `${h} घण्टा अघि`,
    dAgo: (d) => `${d} दिन अघि`,
    footer: "मिर्मिरे बचत ऋण सहकारी संस्था लि.",
    switchLang: "English",
  },
};

// ─── Notification icons ──────────────────────────────────────────────────────
const NOTIFICATION_ICONS = {
  leave_approved: "✅",
  leave_rejected: "❌",
  leave_requested: "📋",
  holiday_added: "🏖️",
  occasion: "🎉",
};

// ─── Time-ago helper (lang-aware) ────────────────────────────────────────────
function getTimeAgo(dateStr, t) {
  if (!dateStr) return "";
  const diffMs   = Date.now() - new Date(dateStr);
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1)  return t.justNow;
  if (diffMins < 60) return t.mAgo(diffMins);
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return t.hAgo(diffHours);
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7)  return t.dAgo(diffDays);
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Language Toggle Button ──────────────────────────────────────────────────
function LangToggle({ lang, onToggle }) {
  const isNp = lang === "np";
  return (
    <button
      onClick={onToggle}
      title={isNp ? "Switch to English" : "नेपालीमा हेर्नुस्"}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
        bg-white/10 border border-white/25 text-white text-xs font-bold
        hover:bg-white/20 active:scale-95 transition-all duration-150 select-none"
      style={{ letterSpacing: isNp ? "0" : "0.02em" }}
    >
      {/* Globe icon */}
      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
      <span>{isNp ? "English" : "नेपाली"}</span>
    </button>
  );
}

// ─── Main Shell ──────────────────────────────────────────────────────────────
export default function PageShell({ children, SidebarComp, title }) {
  const [open, setOpen]                       = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications]     = useState([]);
  const [unreadCount, setUnreadCount]         = useState(0);
  const [lang, setLang]                       = useState("en");
  const { user, token }                       = useApp();
  const today                                 = getTodayBS();

  const t = TRANSLATIONS[lang];

  // Persist language preference
  useEffect(() => {
    const saved = localStorage.getItem("hrms_lang");
    if (saved === "np" || saved === "en") setLang(saved);
  }, []);

  const toggleLang = () => {
    setLang((prev) => {
      const next = prev === "en" ? "np" : "en";
      localStorage.setItem("hrms_lang", next);
      return next;
    });
  };

  // ── Notifications ──
  const fetchNotifications = useCallback(async () => {
    if (!token || !user) return;
    try {
      const res = await fetch(`${API}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, [token, user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showNotifications) fetchNotifications();
  }, [showNotifications]);

  const markAsRead = async (id) => {
    try {
      await fetch(`${API}/api/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${API}/api/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  return (
    <LangContext.Provider value={{ lang, t }}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* ── Desktop Sidebar ── */}
        <div className="hidden lg:flex fixed top-0 left-0 h-full z-40">
          <SidebarComp />
        </div>

        {/* ── Mobile Drawer ── */}
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <div className="relative z-10 h-full">
              <SidebarComp open={open} onClose={() => setOpen(false)} />
            </div>
          </div>
        )}

        {/* ── Main Area ── */}
        <div className="flex-1 flex flex-col lg:ml-64">

          {/* ════ TOPBAR ════ */}
          <header
            className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6
              bg-gradient-to-r from-green-900 to-green-700 border-b border-green-950
              shadow-[0_2px_12px_rgba(10,46,18,.25)]"
            style={{ height: 60 }}
          >
            {/* Left */}
            <div className="flex items-center gap-3">
              {/* Hamburger – mobile */}
              <button
                onClick={() => setOpen(true)}
                className="lg:hidden flex items-center justify-center p-2 rounded-lg
                  bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>

              {/* Logo – mobile */}
              <div className="lg:hidden w-8 h-8 rounded-full overflow-hidden border-2 border-yellow-400 bg-white relative shrink-0">
                <Image src="/logo.png" alt="Mirmira Logo" fill className="object-contain" />
              </div>

              <span className="text-base font-bold text-white">{title}</span>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2 sm:gap-3">

              {/* ── Language Toggle ── */}
              <LangToggle lang={lang} onToggle={toggleLang} />

              {/* ── Notification bell ── */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications((v) => !v)}
                  className="relative flex items-center justify-center p-2 rounded-lg
                    bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <div className="absolute top-full right-0 mt-2 w-80 sm:w-[360px] bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,.15)] z-50 overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-800">{t.notifications}</span>
                          {unreadCount > 0 && (
                            <span className="text-[11px] text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                              {unreadCount} {t.new}
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-[11px] text-blue-500 hover:underline border-none bg-transparent cursor-pointer"
                          >
                            {t.markAllRead}
                          </button>
                        )}
                      </div>

                      {/* List */}
                      <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                            <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="opacity-40 mb-2">
                              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            <p className="text-xs">{t.noNotifications}</p>
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif._id}
                              onClick={() => { if (!notif.read) markAsRead(notif._id); }}
                              className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50
                                ${notif.read ? "bg-white" : "bg-green-50"}`}
                            >
                              <span className="text-lg shrink-0">{NOTIFICATION_ICONS[notif.type] || "🔔"}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-gray-800 mb-0.5">{notif.title}</p>
                                <p className="text-[11px] text-gray-500 mb-1">{notif.message}</p>
                                <p className="text-[10px] text-gray-400">{getTimeAgo(notif.createdAt, t)}</p>
                              </div>
                              {!notif.read && (
                                <span className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {/* Footer */}
                      <div className="px-4 py-2.5 border-t border-gray-100 text-center">
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="text-xs text-yellow-600 font-medium bg-transparent border-none cursor-pointer hover:underline"
                        >
                          {t.close}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Date pill */}
              <div className="hidden sm:flex items-center gap-1.5 bg-white/10 border border-white/20 px-3 py-1.5 rounded-full text-xs font-semibold text-white">
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {fmtDate(today.year, today.month, today.day, lang === "np" ? "np" : "en")}
              </div>
            </div>
          </header>

          {/* ════ CONTENT ════ */}
          <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-6">
            {children}
          </main>

          {/* ════ FOOTER ════ */}
          <footer className="bg-white border-t border-gray-100 px-4 sm:px-6">
            <div className="max-w-[1280px] mx-auto h-[52px] flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full overflow-hidden border border-yellow-400 bg-white relative shrink-0">
                  <Image src="/logo.png" alt="Mirmira Logo" fill className="object-contain" />
                </div>
                <span className="text-[12.5px] font-semibold text-gray-600">MirmiraHRMS</span>
                <span className="text-[11.5px] text-gray-400 border-l border-gray-200 pl-2">
                  {t.footer}
                </span>
              </div>
              <p className="text-[11.5px] text-gray-400">
                © {new Date().getFullYear()} MirmiraHRMS · 📍 {lang === "np" ? "टोखा, काठमाडौं" : "Tokha, Kathmandu"}
              </p>
            </div>
          </footer>
        </div>
      </div>
    </LangContext.Provider>
  );
}