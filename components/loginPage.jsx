"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../lib/context";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useApp();

  const [email, setEmail]   = useState("");
  const [pass, setPass]     = useState("");
  const [showP, setShowP]   = useState(false);
  const [err, setErr]       = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const res = await login(email, pass);
    setLoading(false);
    if (res.ok) {
      router.push(
        res.user.role === "admin" ? "/admin/dashboard" : "/user/dashboard",
      );
    } else {
      setErr(res.error || "Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">

        {/* ── Logo banner – shown in full, natural aspect ratio ── */}
        <div className="w-full bg-white border-b border-gray-100 px-6 pt-6 pb-4">
          <div className="relative w-full" style={{ aspectRatio: "772/120" }}>
            <Image
              src="/login.png"
              alt="Mirmire Saving & Credit Co-operative Ltd."
              fill
              priority
              sizes="(max-width: 448px) 100vw, 448px"
              className="object-contain object-center"
            />
          </div>
        </div>

        {/* ── Divider with HRMS label ── */}
        <div className="flex items-center gap-3 px-6 py-3 bg-green-700">
          <div className="flex-1 h-px bg-green-500 opacity-40" />
          <span className="text-white text-xs font-bold tracking-widest uppercase">
            HR Management System
          </span>
          <div className="flex-1 h-px bg-green-500 opacity-40" />
        </div>

        {/* ── Form ── */}
        <div className="px-8 py-7">
          <h1 className="text-lg font-extrabold text-gray-800 mb-0.5">
            Employee Sign In
          </h1>
          <p className="text-sm text-gray-400 mb-6">
            Enter your credentials to access the portal
          </p>

          <form onSubmit={submit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m2 7 10 7 10-7" />
                  </svg>
                </span>
                <input
                  type="email"
                  placeholder="you@mirmire.com.np"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErr(""); }}
                  required
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  type={showP ? "text" : "password"}
                  placeholder="Enter your password"
                  value={pass}
                  onChange={(e) => { setPass(e.target.value); setErr(""); }}
                  required
                  className="w-full pl-9 pr-10 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowP((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showP ? (
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {err && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2.5">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {err}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-1 rounded-lg bg-green-700 hover:bg-green-800 active:scale-[0.98] text-white font-bold text-sm shadow-sm transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── Footer ── */}
        <div className="px-8 pb-6 text-center">
          <p className="text-xs text-gray-300">
            टोखा न.पा.-२, पुखुसी, काठमाडौं &nbsp;|&nbsp; सम्पर्क: ०१-५११००४८
          </p>
          <p className="text-xs text-gray-300 mt-0.5">
            © {new Date().getFullYear()} Mirmire Saving &amp; Credit Co-operative Ltd.
          </p>
        </div>

      </div>
    </div>
  );
}