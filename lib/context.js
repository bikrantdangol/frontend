"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const Ctx = createContext(null);

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ─── API helper ───────────────────────────────────────────────────────────────
const apiFetch = async (path, options = {}, token = null) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API}${path}`, { ...options, headers });
  } catch (err) {
    throw new Error("Cannot connect to server. Is the backend running?");
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server error: ${res.status} ${res.statusText}`);
  }

  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

export const BS_MONTHS_EN = [
  "Baisakh",
  "Jestha",
  "Ashadh",
  "Shrawan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
];

// ─── All roles from officeRules.js ────────────────────────────────────────────
export const ROLE_META = {
  admin: { label: "Admin", color: "bg-purple-100 text-purple-700" },
  officer: { label: "Officer", color: "bg-blue-100 text-blue-700" },
  staff: { label: "Staff", color: "bg-blue-100 text-blue-700" },
  accountant: { label: "Accountant", color: "bg-green-100 text-green-700" },
  helper: { label: "Helper", color: "bg-orange-100 text-orange-700" },
  manager: { label: "Manager", color: "bg-indigo-100 text-indigo-700" },
  clerk: { label: "Clerk", color: "bg-yellow-100 text-yellow-700" },
  teller: { label: "Teller", color: "bg-cyan-100 text-cyan-700" },
  supervisor: { label: "Supervisor", color: "bg-pink-100 text-pink-700" },
  hr: { label: "HR", color: "bg-rose-100 text-rose-700" },
  collector: { label: "Collector", color: "bg-teal-100 text-teal-700" },
};

export const LEAVE_TYPES = [
  "Casual Leave",
  "Sick Leave",
  "Earned / Annual Leave",
  "Pregnancy Leave",
];

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // hydrating from localStorage

  // ── Hydrate from localStorage on mount ──────────────────────────────────────
  useEffect(() => {
    const loadAuth = async () => {
      const savedToken = localStorage.getItem("hrms_token");
      const savedUser = localStorage.getItem("hrms_user");

      if (savedToken && savedUser) {
        Promise.resolve().then(() => {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        });
      }
    };

    loadAuth();
  }, []);

  // ── AUTH ────────────────────────────────────────────────────────────────────

  const login = async (email, pass) => {
    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password: pass }),
      });
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem("hrms_token", data.token);
      localStorage.setItem("hrms_user", JSON.stringify(data.user));
      return { ok: true, user: data.user };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("hrms_token");
    localStorage.removeItem("hrms_user");
  };

  // ── USERS ───────────────────────────────────────────────────────────────────

  const getUsers = useCallback(async () => {
    return await apiFetch("/api/users", {}, token);
  }, [token]);

  const createUser = async (data) => {
    return await apiFetch(
      "/api/users",
      { method: "POST", body: JSON.stringify(data) },
      token,
    );
  };

  const updateUser = async (id, data) => {
    return await apiFetch(
      `/api/users/${id}`,
      { method: "PUT", body: JSON.stringify(data) },
      token,
    );
  };

  const deleteUser = async (id) => {
    return await apiFetch(`/api/users/${id}`, { method: "DELETE" }, token);
  };

  const deactivateUser = async (id) => {
    return await apiFetch(
      `/api/users/${id}/deactivate`,
      { method: "PUT" },
      token,
    );
  };

  const reactivateUser = async (id) => {
    return await apiFetch(
      `/api/users/${id}/reactivate`,
      { method: "PUT" },
      token,
    );
  };

  const getDashboardStats = useCallback(async () => {
    return await apiFetch("/api/users/dashboard-stats", {}, token);
  }, [token]);

  // ── ATTENDANCE ──────────────────────────────────────────────────────────────

  const getTodayAttendance = useCallback(async () => {
    return await apiFetch("/api/attendance/today", {}, token);
  }, [token]);

  const getMyAttendance = useCallback(
    async (startDate, endDate) => {
      return await apiFetch(
        `/api/attendance/my?startDate=${startDate}&endDate=${endDate}`,
        {},
        token,
      );
    },
    [token],
  );

  const getUserAttendance = useCallback(
    async (userId, startDate, endDate) => {
      return await apiFetch(
        `/api/attendance/user/${userId}?startDate=${startDate}&endDate=${endDate}`,
        {},
        token,
      );
    },
    [token],
  );

  const getAllAttendance = useCallback(
    async (date) => {
      return await apiFetch(`/api/attendance/all?date=${date}`, {}, token);
    },
    [token],
  );

  const getMyMonthlySummary = useCallback(
    async (nepaliYear, nepaliMonth) => {
      return await apiFetch(
        `/api/attendance/my/summary?nepaliYear=${nepaliYear}&nepaliMonth=${nepaliMonth}`,
        {},
        token,
      );
    },
    [token],
  );

  // ── LEAVE ───────────────────────────────────────────────────────────────────

  const requestLeave = async (data) => {
    return await apiFetch(
      "/api/leave",
      { method: "POST", body: JSON.stringify(data) },
      token,
    );
  };

  const getMyLeaves = useCallback(async () => {
    return await apiFetch("/api/leave/my", {}, token);
  }, [token]);

  const getMyLeaveBalance = useCallback(async () => {
    return await apiFetch("/api/leave/balance", {}, token);
  }, [token]);

  const getAllLeaves = useCallback(async () => {
    return await apiFetch("/api/leave/all", {}, token);
  }, [token]);

  const approveLeave = async (id, adminNote = "") => {
    return await apiFetch(
      `/api/leave/${id}/approve`,
      { method: "PUT", body: JSON.stringify({ adminNote }) },
      token,
    );
  };

  const rejectLeave = async (id, adminNote = "") => {
    return await apiFetch(
      `/api/leave/${id}/reject`,
      { method: "PUT", body: JSON.stringify({ adminNote }) },
      token,
    );
  };

  // ── HOLIDAYS ─────────────────────────────────────────────────────────────────

  const getHolidays = useCallback(
    async (nepaliYear) => {
      return await apiFetch(
        `/api/holidays?nepaliYear=${nepaliYear}`,
        {},
        token,
      );
    },
    [token],
  );

  const getUpcomingHolidays = useCallback(async () => {
    return await apiFetch("/api/holidays/upcoming", {}, token);
  }, [token]);

  const addHoliday = async (data) => {
    return await apiFetch(
      "/api/holidays",
      { method: "POST", body: JSON.stringify(data) },
      token,
    );
  };

  const deleteHoliday = async (id) => {
    return await apiFetch(`/api/holidays/${id}`, { method: "DELETE" }, token);
  };

  // ── ZK DEVICE ────────────────────────────────────────────────────────────────

  const zkSync = async () => {
    return await apiFetch("/api/zk/sync", { method: "POST" }, token);
  };

  const zkInfo = useCallback(async () => {
    return await apiFetch("/api/zk/info", {}, token);
  }, [token]);

  const zkUsers = useCallback(async () => {
    return await apiFetch("/api/zk/users", {}, token);
  }, [token]);

  const zkPushUser = async (userId) => {
    return await apiFetch(
      `/api/zk/push-user/${userId}`,
      { method: "POST" },
      token,
    );
  };

  // ── REPORTS ──────────────────────────────────────────────────────────────────

  const getMyMonthlyReport = useCallback(async () => {
    return await apiFetch("/api/reports/monthly", {}, token);
  }, [token]);

  const getMyYearlyReport = useCallback(async () => {
    return await apiFetch("/api/reports/yearly", {}, token);
  }, [token]);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <Ctx.Provider
      value={{
        // auth
        user,
        token,
        loading,
        setUser,
        login,
        logout,

        // users
        getUsers,
        createUser,
        updateUser,
        deleteUser,
        deactivateUser,
        reactivateUser,
        getDashboardStats,

        // attendance
        getTodayAttendance,
        getMyAttendance,
        getUserAttendance,
        getAllAttendance,
        getMyMonthlySummary,

        // leave
        requestLeave,
        getMyLeaves,
        getMyLeaveBalance,
        getAllLeaves,
        approveLeave,
        rejectLeave,

        // holidays
        getHolidays,
        getUpcomingHolidays,
        addHoliday,
        deleteHoliday,

        // zk device
        zkSync,
        zkInfo,
        zkUsers,
        zkPushUser,

        // reports
        getMyMonthlyReport,
        getMyYearlyReport,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useApp = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp must be used within AppProvider");
  return c;
};