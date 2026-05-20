"use client";
import { useState, useEffect, useCallback } from "react";
import { useApp } from "../../../lib/context";
import { useLang } from "../../../lib/LangContext";
import Image from "next/image";
import {
  Plus, Search, Pencil, Trash2, X, Mail, Lock, User,
  Eye, EyeOff, Users, Filter, ChevronDown, Fingerprint,
  CreditCard, Calendar, Shield, Phone,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const ROLES = [
  { value: "manager",   labelEn: "Manager",   labelNp: "म्यानेजर",   color: "bg-indigo-100 text-indigo-700" },
  { value: "collector", labelEn: "Collector", labelNp: "संकलक",      color: "bg-cyan-100 text-cyan-700"    },
  { value: "accountant",labelEn: "Accountant",labelNp: "लेखापाल",   color: "bg-green-100 text-green-700"  },
  { value: "helper",    labelEn: "Helper",    labelNp: "सहायक",      color: "bg-orange-100 text-orange-700"},
  { value: "staff",     labelEn: "Staff",     labelNp: "कर्मचारी",  color: "bg-blue-100 text-blue-700"    },
];

const ROLE_FILTER_LIST = ["all", ...ROLES.map((r) => r.value)];
const getRoleBadge = (role) => ROLES.find((r) => r.value === role)?.color || "bg-gray-100 text-gray-700";
const capitalize = (s) => s?.charAt(0).toUpperCase() + s?.slice(1);

const TEXT = {
  en: {
    pageTitle:        "User Management",
    pageDesc:         "Manage team members and their access",
    addUser:          "Add New User",
    total:            "Total",
    searchPlaceholder:"Search by name, email, employee ID or biometric ID…",
    allRoles:         "All Roles",
    loadingUsers:     "Loading users…",
    noUsers:          "No users found",
    addAUser:         "Add a user",
    noEmployeeId:     "No employee ID",
    notSet:           "Not set",
    edit:             "Edit",
    delete:           "Delete",
    showing:          (f, t) => `Showing ${f} of ${t} users`,
    // Modal
    editUser:         "Edit User",
    addNewUser:       "Add New User",
    updateInfo:       "Update user information",
    fillDetails:      "Fill in the details below",
    employeeId:       "Employee ID",
    biometricId:      "Biometric ID",
    biometricHint:    "Used for attendance tracking",
    fullName:         "Full Name",
    phone:            "Phone Number",
    joiningDate:      "Joining Date",
    email:            "Email Address",
    password:         "Password",
    passwordHint:     "Leave blank to keep current",
    passwordMin:      "Min 4 characters",
    role:             "Role",
    cancel:           "Cancel",
    saving:           "Saving…",
    saveChanges:      "Save Changes",
    createUser:       "Create User",
    // Validation
    nameRequired:     "Name is required",
    emailRequired:    "Email is required",
    emailInvalid:     "Email is invalid",
    bioRequired:      "Biometric ID is required",
    passRequired:     "Password is required",
    passMin:          "Min 4 characters",
    // Confirm
    confirmDelete:    (name) => `Delete "${name}"? This cannot be undone.`,
    deleteFailed:     "Failed to delete user",
    roleLabel:        (role, lang) => ROLES.find(r => r.value === role)?.[lang === "np" ? "labelNp" : "labelEn"] || capitalize(role),
  },
  np: {
    pageTitle:        "प्रयोगकर्ता व्यवस्थापन",
    pageDesc:         "टोली सदस्यहरू र तिनीहरूको पहुँच व्यवस्थापन गर्नुस्",
    addUser:          "नयाँ प्रयोगकर्ता थप्नुस्",
    total:            "जम्मा",
    searchPlaceholder:"नाम, इमेल, कर्मचारी ID वा बायोमेट्रिक ID खोज्नुस्…",
    allRoles:         "सबै पद",
    loadingUsers:     "प्रयोगकर्ता लोड हुँदैछ…",
    noUsers:          "कुनै प्रयोगकर्ता भेटिएन",
    addAUser:         "प्रयोगकर्ता थप्नुस्",
    noEmployeeId:     "कर्मचारी ID छैन",
    notSet:           "तोकिएको छैन",
    edit:             "सम्पादन",
    delete:           "मेट्नुस्",
    showing:          (f, t) => `${t} मध्ये ${f} देखाइँदैछ`,
    // Modal
    editUser:         "प्रयोगकर्ता सम्पादन",
    addNewUser:       "नयाँ प्रयोगकर्ता थप्नुस्",
    updateInfo:       "प्रयोगकर्ता जानकारी अपडेट गर्नुस्",
    fillDetails:      "तलको विवरण भर्नुस्",
    employeeId:       "कर्मचारी ID",
    biometricId:      "बायोमेट्रिक ID",
    biometricHint:    "हाजिरी ट्र्याकिङका लागि प्रयोग गरिन्छ",
    fullName:         "पूरा नाम",
    phone:            "फोन नम्बर",
    joiningDate:      "सामेल भएको मिति",
    email:            "इमेल ठेगाना",
    password:         "पासवर्ड",
    passwordHint:     "अपरिवर्तित राख्न खाली छोड्नुस्",
    passwordMin:      "कम्तीमा ४ अक्षर",
    role:             "पद",
    cancel:           "रद्द गर्नुस्",
    saving:           "सुरक्षित गर्दै…",
    saveChanges:      "परिवर्तन सुरक्षित गर्नुस्",
    createUser:       "प्रयोगकर्ता बनाउनुस्",
    // Validation
    nameRequired:     "नाम आवश्यक छ",
    emailRequired:    "इमेल आवश्यक छ",
    emailInvalid:     "इमेल अमान्य छ",
    bioRequired:      "बायोमेट्रिक ID आवश्यक छ",
    passRequired:     "पासवर्ड आवश्यक छ",
    passMin:          "कम्तीमा ४ अक्षर",
    // Confirm
    confirmDelete:    (name) => `"${name}" मेट्ने? यो पूर्ववत हुन सक्दैन।`,
    deleteFailed:     "प्रयोगकर्ता मेट्न असफल",
    roleLabel:        (role, lang) => ROLES.find(r => r.value === role)?.[lang === "np" ? "labelNp" : "labelEn"] || capitalize(role),
  },
};

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, required, error, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

// ─── Icon input ───────────────────────────────────────────────────────────────
function IconInput({ icon: Icon, error, ...props }) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
        <Icon size={15} />
      </div>
      <input
        className={`w-full pl-10 pr-4 py-2.5 border ${
          error ? "border-red-300 focus:ring-red-400" : "border-gray-200 focus:ring-green-500"
        } rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-white`}
        {...props}
      />
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ user, onSave, onClose, t, lang }) {
  const isEdit = !!user?._id;
  const [form, setForm] = useState({
    name:        user?.fullName ?? user?.name ?? "",
    email:       user?.email ?? "",
    password:    "",
    role:        user?.role ?? "staff",
    biometricId: user?.biometricId ?? "",
    employeeId:  user?.employeeId ?? "",
    joiningDate: user?.joiningDate?.slice(0, 10) ?? "",
    phone:       user?.phone ?? "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors]             = useState({});
  const [loading, setLoading]           = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())                          e.name        = t.nameRequired;
    if (!form.email.trim())                         e.email       = t.emailRequired;
    else if (!/\S+@\S+\.\S+/.test(form.email))     e.email       = t.emailInvalid;
    if (!form.biometricId?.toString().trim())       e.biometricId = t.bioRequired;
    if (!isEdit) {
      if (!form.password)                           e.password    = t.passRequired;
      else if (form.password.length < 4)            e.password    = t.passMin;
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSave(form);
    } catch (err) {
      setErrors({ submit: err.message || "Failed to save user" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">{isEdit ? t.editUser : t.addNewUser}</h2>
            <p className="text-green-100 text-xs mt-0.5">{isEdit ? t.updateInfo : t.fillDetails}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
            <X size={16} className="text-white" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{errors.submit}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label={t.employeeId}>
              <IconInput icon={CreditCard} type="text" placeholder="EMP-001" value={form.employeeId} onChange={set("employeeId")} />
            </Field>
            <Field label={t.biometricId} required error={errors.biometricId} hint={t.biometricHint}>
              <IconInput icon={Fingerprint} type="text" placeholder="e.g. 1023" error={errors.biometricId} value={form.biometricId} onChange={set("biometricId")} />
            </Field>
          </div>

          <Field label={t.fullName} required error={errors.name}>
            <IconInput icon={User} type="text" placeholder={t.fullName} error={errors.name} value={form.name} onChange={set("name")} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label={t.phone}>
              <IconInput icon={Phone} type="tel" placeholder="98XXXXXXXX" value={form.phone} onChange={set("phone")} />
            </Field>
            <Field label={t.joiningDate}>
              <IconInput icon={Calendar} type="date" value={form.joiningDate} onChange={set("joiningDate")} />
            </Field>
          </div>

          <Field label={t.email} required error={errors.email}>
            <IconInput icon={Mail} type="email" placeholder="user@example.com" error={errors.email} value={form.email} onChange={set("email")} />
          </Field>

          <Field label={t.password} required={!isEdit} error={errors.password}>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <Lock size={15} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder={isEdit ? t.passwordHint : t.passwordMin}
                value={form.password}
                onChange={set("password")}
                className={`w-full pl-10 pr-10 py-2.5 border ${errors.password ? "border-red-300" : "border-gray-200"} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
              />
              <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </Field>

          <Field label={t.role} required>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <Shield size={15} />
              </div>
              <select
                value={form.role}
                onChange={set("role")}
                className="w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {lang === "np" ? r.labelNp : r.labelEn}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <ChevronDown size={15} />
              </div>
            </div>
          </Field>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 font-medium hover:bg-gray-50 transition-colors">
              {t.cancel}
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-gradient-to-r from-green-600 to-green-500 text-white text-sm font-medium rounded-xl hover:from-green-700 hover:to-green-600 transition-all shadow-sm disabled:opacity-50">
              {loading ? t.saving : isEdit ? t.saveChanges : t.createUser}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const { token }   = useApp();
  const { lang }    = useLang();
  const t           = TEXT[lang] || TEXT.en;

  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [roleFilter,   setRoleFilter]   = useState("all");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModal,    setShowModal]    = useState(false);
  const [editUser,     setEditUser]     = useState(null);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/users`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchUsers(); }, []);

  const handleSave = async (form) => {
    const url    = editUser?._id ? `${API}/api/users/${editUser._id}` : `${API}/api/users`;
    const method = editUser?._id ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        fullName: form.name, email: form.email,
        password: form.password || undefined, role: form.role,
        biometricId: form.biometricId, employeeId: form.employeeId,
        phone: form.phone, joiningDate: form.joiningDate || undefined,
      }),
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Failed to save user"); }
    await fetchUsers();
    setShowModal(false);
    setEditUser(null);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(t.confirmDelete(name))) return;
    try {
      const res = await fetch(`${API}/api/users/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchUsers();
    } catch (err) {
      alert(err.message || t.deleteFailed);
    }
  };

  const openAdd  = () => { setEditUser(null); setShowModal(true); };
  const openEdit = (u) => { setEditUser(u);   setShowModal(true); };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      ((u.fullName || "").toLowerCase().includes(q) ||
       (u.email    || "").toLowerCase().includes(q) ||
       (u.biometricId || "").toString().includes(q) ||
       (u.employeeId  || "").toString().includes(q)) &&
      (roleFilter === "all" || u.role === roleFilter)
    );
  });

  const stats = [
    { labelEn: "Total",      labelNp: "जम्मा",      value: users.length,                                    cls: "bg-white border-gray-100 text-gray-800"          },
    { labelEn: "Manager",    labelNp: "म्यानेजर",   value: users.filter(u => u.role === "manager").length,  cls: "bg-indigo-50 border-indigo-100 text-indigo-700"   },
    { labelEn: "Collector",  labelNp: "संकलक",      value: users.filter(u => u.role === "collector").length,cls: "bg-cyan-50 border-cyan-100 text-cyan-700"         },
    { labelEn: "Accountant", labelNp: "लेखापाल",   value: users.filter(u => u.role === "accountant").length,cls: "bg-green-50 border-green-100 text-green-700"      },
    { labelEn: "Helper",     labelNp: "सहायक",      value: users.filter(u => u.role === "helper").length,   cls: "bg-orange-50 border-orange-100 text-orange-700"   },
    { labelEn: "Staff",      labelNp: "कर्मचारी",  value: users.filter(u => u.role === "staff").length,    cls: "bg-blue-50 border-blue-100 text-blue-700"         },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t.pageTitle}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t.pageDesc}</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:from-green-700 hover:to-green-600 transition-all shadow-sm"
        >
          <Plus size={16} /> {t.addUser}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {stats.map((s) => (
          <div key={s.labelEn} className={`rounded-xl border p-3 text-center shadow-sm ${s.cls}`}>
            <p className="text-xs opacity-70 mb-0.5">{lang === "np" ? s.labelNp : s.labelEn}</p>
            <p className="text-xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowDropdown((p) => !p)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-sm text-gray-700 transition-colors"
          >
            <Filter size={15} className="text-gray-400" />
            {roleFilter === "all" ? t.allRoles : t.roleLabel(roleFilter, lang)}
            <ChevronDown size={14} className="text-gray-400" />
          </button>
          {showDropdown && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowDropdown(false)} />
              <div className="absolute top-full right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 z-40 py-1 overflow-hidden">
                {ROLE_FILTER_LIST.map((role) => (
                  <button
                    key={role}
                    onClick={() => { setRoleFilter(role); setShowDropdown(false); }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      roleFilter === role ? "bg-green-50 text-green-700 font-medium" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {role === "all" ? t.allRoles : t.roleLabel(role, lang)}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* User cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-400 text-sm">{t.loadingUsers}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-gray-100">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users size={22} className="text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">{t.noUsers}</p>
            <button onClick={openAdd} className="mt-2 text-green-600 text-sm hover:underline">{t.addAUser}</button>
          </div>
        ) : (
          filtered.map((u) => (
            <div key={u._id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all duration-200 flex flex-col gap-4">
              {/* Card header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full flex-shrink-0 bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-sm font-bold overflow-hidden relative">
                    {u.photoUrl ? (
                      <Image src={u.photoUrl} alt={u.fullName} fill className="object-cover" />
                    ) : (
                      (u.fullName || u.name || "?")[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{u.fullName}</p>
                    <p className="text-xs text-gray-400">{u.employeeId || t.noEmployeeId}</p>
                  </div>
                </div>
                <span className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium ${getRoleBadge(u.role)}`}>
                  {t.roleLabel(u.role, lang)}
                </span>
              </div>

              {/* Card details */}
              <div className="space-y-1.5 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail size={13} className="text-gray-400 shrink-0" />
                  <span className="truncate">{u.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Fingerprint size={13} className="text-gray-400 shrink-0" />
                  <span>{u.biometricId || <span className="text-gray-300">{t.notSet}</span>}</span>
                </div>
                {u.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-gray-400 shrink-0" />
                    <span>{u.phone}</span>
                  </div>
                )}
                {u.joiningDate && (
                  <div className="flex items-center gap-2">
                    <Calendar size={13} className="text-gray-400 shrink-0" />
                    <span>{new Date(u.joiningDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1 pt-3 border-t border-gray-100">
                <button
                  onClick={() => openEdit(u)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors font-medium"
                >
                  <Pencil size={13} /> {t.edit}
                </button>
                <button
                  onClick={() => handleDelete(u._id, u.fullName)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors font-medium"
                >
                  <Trash2 size={13} /> {t.delete}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer count */}
      {filtered.length > 0 && (
        <p className="text-xs text-gray-400 text-right">{t.showing(filtered.length, users.length)}</p>
      )}

      {/* Modal */}
      {showModal && (
        <Modal user={editUser} onSave={handleSave} onClose={() => setShowModal(false)} t={t} lang={lang} />
      )}
    </div>
  );
}