"use client";
import { useState, useEffect, useCallback } from "react";
import { useApp } from "../../../lib/context";
import {
  Check,
  X,
  CalendarDays,
  Clock,
  FileText,
  Search,
  Trash2,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const TABS = ["all", "pending", "approved", "rejected"];

const LEAVE_TYPE_DISPLAY = {
  casual: "Casual Leave",
  sick: "Sick Leave",
  earned: "Earned / Annual Leave",
  pregnancy: "Pregnancy Leave",
};

const TYPE_COLOR = {
  casual: "bg-blue-100 text-blue-700",
  sick: "bg-red-100 text-red-700",
  earned: "bg-green-100 text-green-700",
  pregnancy: "bg-purple-100 text-purple-700",
};

const ROLE_COLORS = {
  admin: "bg-purple-100 text-purple-700",
  officer: "bg-blue-100 text-blue-700",
  staff: "bg-blue-100 text-blue-700",
  accountant: "bg-green-100 text-green-700",
  helper: "bg-orange-100 text-orange-700",
};

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

const getStatusBadge = (s) => {
  if (s === "pending") return "bg-orange-100 text-orange-700";
  if (s === "approved") return "bg-green-100 text-green-700";
  if (s === "rejected") return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-700";
};

// ── Reject Modal ──────────────────────────────────────────────────────────────
function RejectModal({ leave, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError("Rejection reason is required");
      return;
    }
    onSubmit(reason.trim());
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 rounded-t-2xl">
          <h3 className="text-white font-bold text-lg">Reject Leave Request</h3>
          <p className="text-red-100 text-sm">
            Please provide a reason for rejection
          </p>
        </div>
        <div className="p-6 space-y-3">
          <div className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 space-y-1">
            <p>
              <strong>Employee:</strong> {leave?.user?.fullName || "Unknown"}
            </p>
            <p>
              <strong>Leave Type:</strong>{" "}
              {LEAVE_TYPE_DISPLAY[leave?.leaveType] || leave?.leaveType}
            </p>
            <p>
              <strong>Dates:</strong>{" "}
              {leave?.fromDateNepali || fmt(leave?.fromDate)} →{" "}
              {leave?.toDateNepali || fmt(leave?.toDate)}
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Rejection Reason *
            </label>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition resize-none"
              rows={3}
              placeholder="Explain why this leave is being rejected..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError("");
              }}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl py-2.5 text-sm font-medium transition"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteModal({ leave, onClose, onConfirm }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center space-y-4">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <Trash2 size={24} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              Delete Leave Request
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Are you sure you want to delete Leave request for{" "}
              <strong>{leave?.user?.fullName || "this user"}</strong>{" "}
              {LEAVE_TYPE_DISPLAY[leave?.leaveType] || "leave"}? This action
              cannot be undone.
            </p>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl py-2.5 text-sm font-medium transition"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminLeavePage() {
  const { token } = useApp();
  const [tab, setTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

  const fetchLeaves = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/leave/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLeaveRequests(data.leaves || []);
    } catch (err) {
      console.error("Failed to fetch leaves:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const loadLeaves = async () => {
      await fetchLeaves();
    };

    loadLeaves();
  }, []);

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`${API}/api/leave/${id}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ adminNote: "" }),
      });
      if (!res.ok) throw new Error("Failed");
      fetchLeaves();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id, note) => {
    try {
      const res = await fetch(`${API}/api/leave/${id}/reject`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ adminNote: note }),
      });
      if (!res.ok) throw new Error("Failed");
      fetchLeaves();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API}/api/leave/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      fetchLeaves();
    } catch (err) {
      console.error(err);
    }
    setDeleteModal(null);
  };

  const list =
    tab === "all"
      ? leaveRequests
      : leaveRequests.filter((r) => r.status === tab);
  const filtered = list.filter((req) => {
    const s = searchTerm.toLowerCase();
    const name = (req.user?.fullName || "").toLowerCase();
    const type = (LEAVE_TYPE_DISPLAY[req.leaveType] || "").toLowerCase();
    return (
      name.includes(s) ||
      type.includes(s) ||
      (req.reason || "").toLowerCase().includes(s)
    );
  });

  const counts = {
    all: leaveRequests.length,
    pending: leaveRequests.filter((r) => r.status === "pending").length,
    approved: leaveRequests.filter((r) => r.status === "approved").length,
    rejected: leaveRequests.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Leave Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review and manage employee leave requests
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Total Requests</p>
          <p className="text-2xl font-bold text-gray-800">{counts.all}</p>
        </div>
        <div className="bg-orange-50 rounded-xl border border-orange-100 p-4 shadow-sm">
          <p className="text-xs text-orange-600">Pending</p>
          <p className="text-2xl font-bold text-orange-700">{counts.pending}</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-100 p-4 shadow-sm">
          <p className="text-xs text-green-600">Approved</p>
          <p className="text-2xl font-bold text-green-700">{counts.approved}</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-100 p-4 shadow-sm">
          <p className="text-xs text-red-600">Rejected</p>
          <p className="text-2xl font-bold text-red-700">{counts.rejected}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4">
        {TABS.map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize flex items-center gap-2 transition
              ${tab === s ? "bg-green-50 text-green-700 border border-green-200" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
          >
            {s}
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold
              ${
                s === "pending"
                  ? "bg-orange-100 text-orange-700"
                  : s === "approved"
                    ? "bg-green-100 text-green-700"
                    : s === "rejected"
                      ? "bg-red-100 text-red-600"
                      : "bg-gray-100 text-gray-600"
              }`}
            >
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search by name, leave type or reason..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-green-100 border-t-green-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarDays size={32} className="text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No leave requests found</p>
          <p className="text-sm text-gray-400 mt-1">
            {searchTerm ? "Try adjusting your search" : "All caught up!"}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {filtered.map((req) => {
              const name = req.user?.fullName || "Unknown";
              const role = req.user?.role || "staff";
              const lt = LEAVE_TYPE_DISPLAY[req.leaveType] || req.leaveType;
              const tc =
                TYPE_COLOR[req.leaveType] || "bg-gray-100 text-gray-700";
              const rc = ROLE_COLORS[role] || "bg-gray-100 text-gray-700";
              return (
                <div
                  key={req._id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: user info */}
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm">
                          {name[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className="font-semibold text-gray-800">
                              {name}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${rc}`}
                            >
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${tc}`}
                            >
                              {lt}
                            </span>
                          </div>
                          {req.reason && (
                            <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                              {req.reason}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <CalendarDays size={12} />
                              {req.fromDateNepali || fmt(req.fromDate)} →{" "}
                              {req.toDateNepali || fmt(req.toDate)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={12} /> {fmt(req.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText size={12} /> {req.totalDays || 1} day(s)
                            </span>
                          </div>
                          {/* Rejection note */}
                          {req.status === "rejected" && req.adminNote && (
                            <p className="mt-2 text-xs text-red-500 bg-red-50 rounded-lg px-2.5 py-1.5">
                              <strong>Reason:</strong> {req.adminNote}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: actions */}
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        {req.status === "pending" ? (
                          <>
                            <button
                              onClick={() => handleApprove(req._id)}
                              className="flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium px-3 py-2 rounded-xl transition-colors"
                            >
                              <Check size={14} /> Approve
                            </button>
                            <button
                              onClick={() => setRejectModal(req)}
                              className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium px-3 py-2 rounded-xl transition-colors"
                            >
                              <X size={14} /> Reject
                            </button>
                          </>
                        ) : (
                          <div
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium ${getStatusBadge(req.status)}`}
                          >
                            {req.status === "approved" ? (
                              <Check size={12} />
                            ) : req.status === "rejected" ? (
                              <X size={12} />
                            ) : null}
                            <span className="capitalize">{req.status}</span>
                          </div>
                        )}
                        {/* Delete button — always visible */}
                        <button
                          onClick={() => setDeleteModal(req)}
                          className="flex items-center gap-1.5 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 text-sm font-medium px-3 py-2 rounded-xl transition-colors"
                          title="Delete request"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-gray-400">
              Showing {filtered.length} of {list.length} requests
            </p>
            <span className="text-xs text-gray-400">
              Last updated: {new Date().toLocaleDateString()}
            </span>
          </div>
        </>
      )}

      {/* Modals */}
      {rejectModal && (
        <RejectModal
          leave={rejectModal}
          onClose={() => setRejectModal(null)}
          onSubmit={(reason) => {
            handleReject(rejectModal._id, reason);
            setRejectModal(null);
          }}
        />
      )}
      {deleteModal && (
        <DeleteModal
          leave={deleteModal}
          onClose={() => setDeleteModal(null)}
          onConfirm={() => handleDelete(deleteModal._id)}
        />
      )}
    </div>
  );
}
