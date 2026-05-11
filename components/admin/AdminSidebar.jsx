"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useApp, ROLE_META } from "../../lib/context";

const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard", Icon: IcoDash },
  { href: "/admin/users", label: "Manage Users", Icon: IcoUsers },
  { href: "/admin/leave", label: "Leave Requests", Icon: IcoCal },
  { href: "/admin/attendance", label: "Attendance", Icon: IcoTime },
  { href: "/admin/settings", label: "Settings", Icon: IcoSet },
];

export default function AdminSidebar({ open, onClose }) {
  const path = usePathname();
  const router = useRouter();
  const { user, logout } = useApp();
  const pending = 0;
  const rm = ROLE_META[user?.role] || ROLE_META.user;

  const displayName = user?.fullName || user?.name || "Admin";
  const avatarInitial = displayName[0]?.toUpperCase();
  const photoUrl = user?.photoUrl || null;

  const doLogout = () => {
    logout();
    router.push("/");
  };

  const sidebarContent = (
    <nav className="w-64 h-full bg-green-900 flex flex-col shadow-[3px_0_20px_rgba(10,46,18,.2)] overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10 shrink-0">
        <div className="w-10 h-10 rounded-full border-2 border-yellow-400 bg-white flex items-center justify-center shrink-0 overflow-hidden">
          <Image
            src="/logo.png"
            alt="Mirmira Logo"
            width={36}
            height={36}
            className="object-contain"
          />
        </div>
        <div>
          <p className="text-white font-extrabold text-sm leading-tight">
            MirmiraHRMS
          </p>
          <p className="text-white/40 text-[11px] mt-0.5">Admin Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-2">
        <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest px-5 pt-3 pb-1">
          Navigation
        </p>
        {LINKS.map(({ href, label, Icon }) => {
          const active = path === href || path.startsWith(href + "/");
          const isBadge = href === "/admin/leave" && pending > 0;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`relative flex items-center gap-2.5 mx-2 my-0.5 px-2.5 py-2.5 rounded-[9px] text-[13.5px] font-medium transition-colors duration-150 no-underline
                ${
                  active
                    ? "bg-white/[0.14] text-white"
                    : "text-white/60 hover:bg-white/[0.07] hover:text-white/90"
                }`}
            >
              {/* Active indicator */}
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-yellow-400 rounded-r-full" />
              )}

              {/* Icon box */}
              <span
                className={`w-[30px] h-[30px] rounded-[7px] flex items-center justify-center shrink-0
                ${active ? "bg-white/[0.16]" : "bg-white/[0.07]"}`}
              >
                <Icon />
              </span>

              <span className="flex-1">{label}</span>

              {isBadge && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {pending}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10 p-2 shrink-0">
        {/* User profile */}
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-[9px] bg-white/[0.06] mb-1.5">
          <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden flex items-center justify-center bg-yellow-400 text-green-900 font-extrabold text-sm relative">
            {photoUrl ? (
              <Image
                src={photoUrl}
                alt={displayName}
                fill
                className="object-cover"
              />
            ) : (
              avatarInitial
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[13px] font-bold truncate">
              {displayName}
            </p>
            <p className="text-white/40 text-[10.5px]">{rm.label}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={doLogout}
          className="flex items-center gap-2.5 w-full px-2.5 py-2.5 rounded-[9px] text-[13.5px] font-medium text-red-400 bg-transparent hover:bg-red-500/10 transition-colors duration-150 cursor-pointer border-none font-[inherit]"
        >
          <span className="w-[30px] h-[30px] rounded-[7px] flex items-center justify-center bg-red-500/10 shrink-0">
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </span>
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-screen sticky top-0">
        {sidebarContent}
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Drawer */}
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}

// ── Icons ────────────────────────────────────────────────────────────────────
function IcoDash() {
  return (
    <svg
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function IcoUsers() {
  return (
    <svg
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IcoCal() {
  return (
    <svg
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function IcoTime() {
  return (
    <svg
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function IcoSet() {
  return (
    <svg
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
    </svg>
  );
}
