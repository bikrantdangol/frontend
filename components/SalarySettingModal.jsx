"use client";
import { useState, useEffect } from "react";

export default function SalarySettingModal({ isOpen, onClose, onSave, existingSettings }) {
  const [settings, setSettings] = useState({
    bonusEnabled: false,
    bonusAmount: 0,
    overtimeEnabled: false,
    overtimeRate: 0,
    taxRate: 1,
  });

  useEffect(() => {
    if (existingSettings) setSettings(existingSettings);
  }, [existingSettings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0f1623] border border-[#1e2d45] rounded-2xl w-full max-w-md mx-4 shadow-2xl shadow-cyan-900/20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1e2d45]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-white font-semibold text-lg tracking-tight">Salary Settings</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Tax Rate */}
          <div>
            <label className="block text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-2">Tax Rate</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={settings.taxRate}
                onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
                className="w-24 bg-[#1a2535] border border-[#2a3a55] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                min="0" max="100" step="0.5"
              />
              <span className="text-gray-400 text-sm">%</span>
              <span className="text-gray-500 text-xs">(applied to bonus & salary)</span>
            </div>
          </div>

          {/* Bonus Setting */}
          <div className="bg-[#1a2535] rounded-xl p-4 border border-[#2a3a55]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white font-medium text-sm">Staff Bonus</p>
                <p className="text-gray-500 text-xs mt-0.5">Enable monthly bonus for staff</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, bonusEnabled: !settings.bonusEnabled })}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${settings.bonusEnabled ? "bg-cyan-500" : "bg-[#2a3a55]"}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${settings.bonusEnabled ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
            {settings.bonusEnabled && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">Bonus Amount (NPR)</label>
                <input
                  type="number"
                  value={settings.bonusAmount}
                  onChange={(e) => setSettings({ ...settings, bonusAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#0f1623] border border-[#2a3a55] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="e.g. 5000"
                />
              </div>
            )}
          </div>

          {/* Overtime Setting */}
          <div className="bg-[#1a2535] rounded-xl p-4 border border-[#2a3a55]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white font-medium text-sm">Overtime Pay</p>
                <p className="text-gray-500 text-xs mt-0.5">Enable overtime calculation</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, overtimeEnabled: !settings.overtimeEnabled })}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${settings.overtimeEnabled ? "bg-violet-500" : "bg-[#2a3a55]"}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${settings.overtimeEnabled ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
            {settings.overtimeEnabled && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">Rate per Hour (NPR)</label>
                <input
                  type="number"
                  value={settings.overtimeRate}
                  onChange={(e) => setSettings({ ...settings, overtimeRate: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#0f1623] border border-[#2a3a55] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="e.g. 150"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#2a3a55] text-gray-400 hover:text-white hover:border-gray-500 transition-all text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm transition-all shadow-lg shadow-cyan-500/25"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}