"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp, ROLE_META } from "../../lib/context";
import { useLang } from "../../lib/LangContext";
import { G, GOLD, SIDEBAR_W } from "../../lib/colors";
import Image from "next/image";

const LINKS = [
  { href: "/user/dashboard",  labelEn: "Home",       labelNp: "गृहपृष्ठ", Icon: IcoHome   },
  { href: "/user/attendance", labelEn: "Attendance", labelNp: "हाजिरी",   Icon: IcoShield },
  { href: "/user/leave",      labelEn: "Leave Request",      labelNp: "बिदाको लागि अनुरोध",      Icon: IcoCal    },
  { href: "/user/profile",    labelEn: "Profile",    labelNp: "प्रोफाइल", Icon: IcoUser   },
];

const SIDEBAR_TEXT = {
  en: { portal: "Employee Portal", navigation: "Navigation", logout: "Logout" },
  np: { portal: "कर्मचारी पोर्टल", navigation: "नेभिगेसन",   logout: "लगआउट"  },
};

export default function UserSidebar() {
  const path   = usePathname();
  const router = useRouter();
  const { user, logout } = useApp();
  const { lang } = useLang();
  const s = SIDEBAR_TEXT[lang] || SIDEBAR_TEXT.en;

  const photoUrl = user?.photoUrl || null;
  const fullName = user?.fullName || user?.name || "";
  const roleMeta = ROLE_META[user?.role] || { label: user?.role || "User", color: "bg-gray-100 text-gray-700" };

  const doLogout = () => { logout(); router.push("/"); };

  const linkStyle = (active) => ({
    display: "flex", alignItems: "center", gap: 10,
    padding: "9px 10px", margin: "1px 8px", borderRadius: 9,
    fontSize: 13.5, fontWeight: 500,
    color: active ? "#fff" : "rgba(255,255,255,.62)",
    background: active ? "rgba(255,255,255,.14)" : "transparent",
    cursor: "pointer", textDecoration: "none",
    transition: "all .14s", position: "relative",
  });

  const iconBox = (active) => ({
    width: 30, height: 30, borderRadius: 7,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: active ? "rgba(255,255,255,.16)" : "rgba(255,255,255,.07)",
    flexShrink: 0,
  });

  return (
    <nav style={{ width: SIDEBAR_W, height: "100vh", background: G[800], display: "flex", flexDirection: "column", boxShadow: "3px 0 20px rgba(10,46,18,.2)" }}>

      {/* ── Logo ── */}
      <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid rgba(255,255,255,.08)", display: "flex", alignItems: "center", gap: 11, flexShrink: 0 }}>
        <div style={{ width: 42, height: 42, borderRadius: "50%", border: `2.5px solid ${GOLD.M}`, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", position: "relative" }}>
          <Image src="/logo.png" alt="Mirmira Logo" fill sizes="42px" style={{ objectFit: "cover", borderRadius: "50%" }} />
        </div>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>MirmiraHRMS</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 1 }}>{s.portal}</div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <div style={{ flex: 1, padding: "8px 0" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.28)", textTransform: "uppercase", letterSpacing: ".8px", padding: "12px 18px 4px" }}>
          {s.navigation}
        </div>

        {LINKS.map(({ href, labelEn, labelNp, Icon }) => {
          const active = path === href || path.startsWith(href + "/");
          const label  = lang === "np" ? labelNp : labelEn;
          return (
            <Link
              key={href}
              href={href}
              style={linkStyle(active)}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,.07)"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              {active && (
                <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 22, borderRadius: "0 3px 3px 0", background: GOLD.M }} />
              )}
              <div style={iconBox(active)}><Icon /></div>
              <span style={{ flex: 1 }}>{label}</span>
              {active && (
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
            </Link>
          );
        })}
      </div>

      {/* ── User + Logout ── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", padding: "10px 8px", flexShrink: 0 }}>
        {/* User Info */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 9, background: "rgba(255,255,255,.06)", marginBottom: 6 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: photoUrl ? "transparent" : GOLD.M, color: G[900], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, flexShrink: 0, overflow: "hidden", position: "relative" }}>
            {photoUrl ? (
              <Image src={photoUrl} alt={fullName} fill sizes="34px" style={{ objectFit: "cover", borderRadius: "50%" }} />
            ) : (
              fullName?.[0]?.toUpperCase() || "U"
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fullName}</div>
            <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.38)" }}>{roleMeta.label}</div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={doLogout}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 9, width: "100%", border: "none", cursor: "pointer", background: "transparent", color: "rgba(239,100,100,.85)", fontSize: 13.5, fontWeight: 500, fontFamily: "inherit", transition: "background .14s" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,.09)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <div style={{ width: 30, height: 30, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(239,68,68,.09)", flexShrink: 0 }}>
            <svg width="14" height="14" fill="none" stroke="rgba(239,100,100,.85)" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </div>
          <span>{s.logout}</span>
        </button>
      </div>
    </nav>
  );
}

/* ── Icons ── */
function IcoHome() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
function IcoShield() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function IcoCal() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function IcoUser() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}