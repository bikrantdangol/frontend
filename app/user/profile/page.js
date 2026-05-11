"use client";
import { useState, useRef, useEffect } from "react";
import { useApp, ROLE_META } from "../../../lib/context";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Mail,
  Briefcase,
  User,
  Calendar,
  Camera,
  LogOut,
  Check,
  CreditCard,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const ROLE_CHIP = {
  admin: "bg-blue-50 text-blue-800",
  manager: "bg-indigo-50 text-indigo-800",
  collector: "bg-cyan-50 text-cyan-800",
  accountant: "bg-purple-50 text-purple-800",
  helper: "bg-amber-50 text-amber-800",
  staff: "bg-green-50 text-green-800",
};

const INFO_ROWS = (user) => [
  {
    icon: <Mail size={16} />,
    label: "Email Address",
    value: user?.email,
    iconCls: "bg-blue-50 text-blue-600",
  },
  {
    icon: <Briefcase size={16} />,
    label: "Role",
    value: ROLE_META?.[user?.role]?.label || user?.role,
    iconCls: "bg-green-50 text-green-600",
  },
  {
    icon: <CreditCard size={16} />,
    label: "Employee ID",
    value: user?.employeeId || "—",
    iconCls: "bg-amber-50 text-amber-600",
  },
  {
    icon: <Calendar size={16} />,
    label: "Member Since",
    value: user?.createdAt
      ? new Date(user.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "—",
    iconCls: "bg-orange-50 text-orange-600",
  },
];

export default function UserProfilePage() {
  const { user, token, logout, setUser } = useApp();
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Keep photo in sync if context updates
  useEffect(() => {
    Promise.resolve().then(() => {
      if (user?.photoUrl) {
        setPhotoUrl(user.photoUrl);
      }
    });
  }, [user?.photoUrl]);

  // Fetch fresh profile on mount
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/profile/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.user && setUser) {
          setUser(d.user);
          localStorage.setItem("hrms_user", JSON.stringify(d.user));
        }
      })
      .catch(() => {});
  }, [token]);

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 100 * 1024) {
      alert("Photo must be less than 100 KB. Please resize the image.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch(`${API}/api/profile/upload-photo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      const updated = { ...user, photoUrl: data.photoUrl };
      if (setUser) setUser(updated);
      localStorage.setItem("hrms_user", JSON.stringify(updated));
      setPhotoUrl(data.photoUrl);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      alert("Photo upload failed: " + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const initial =
    user?.fullName?.[0]?.toUpperCase() || user?.name?.[0]?.toUpperCase() || "U";

  const roleChipCls = ROLE_CHIP[user?.role] || "bg-gray-100 text-gray-700";

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
          My Profile
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Your account information</p>
      </div>

      {/* Hero card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Cover */}
        <div className="h-24 bg-gradient-to-r from-green-800 via-green-700 to-green-500 relative">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,.06) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />
        </div>

        <div className="px-6 pb-6 relative">
          {/* Avatar */}
          <div className="relative inline-block -mt-10">
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`w-20 h-20 rounded-full ring-4 ring-white shadow-lg overflow-hidden flex items-center justify-center bg-green-700 text-white text-3xl font-extrabold cursor-pointer transition-transform hover:scale-105 ${uploading ? "cursor-not-allowed opacity-80" : ""}`}
            >
              {uploading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : photoUrl ? (
                <div className="relative w-full h-full">
                  <Image
                    src={photoUrl}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                initial
              )}
            </div>

            {/* Camera button */}
            <button
              onClick={() => !uploading && fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full border-2 border-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Camera size={13} className="text-green-700" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          {/* Upload success */}
          {uploadSuccess && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-xs font-semibold text-green-700">
              <Check size={13} /> Profile picture updated!
            </div>
          )}

          {/* Name + role */}
          <div className="mt-3">
            <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">
              {user?.fullName || user?.name}
            </h2>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide ${roleChipCls}`}
              >
                {ROLE_META?.[user?.role]?.label || user?.role}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Mail size={11} /> {user?.email}
              </span>
            </div>
          </div>

          <p className="mt-2 flex items-center gap-1 text-xs text-gray-400">
            <User size={10} /> Click on the profile picture to change it
          </p>
        </div>
      </div>

      {/* Info rows */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
        {INFO_ROWS(user).map((row, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${row.iconCls}`}
            >
              {row.icon}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">
                {row.label}
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {row.value || "—"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-3.5 bg-white border border-red-200 text-red-600 text-sm font-bold rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600 transition-all flex items-center justify-center gap-2 shadow-sm"
      >
        <LogOut size={16} /> Logout
      </button>

      <p className="text-center text-xs text-gray-400 pb-2">
        Profile information is managed by your administrator
      </p>
    </div>
  );
}
