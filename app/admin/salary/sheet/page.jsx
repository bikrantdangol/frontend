"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmt(n) {
  return Number(n || 0).toLocaleString("en-NP");
}
function tax(amount, rate) {
  return Math.round((amount * rate) / 100);
}

// ─── Print / PDF styles injected into <head> ────────────────────────────────
const PRINT_STYLES = `
@page { size: A4 landscape; margin: 12mm; }
@media print {
  body { background: white !important; }
  .no-print { display: none !important; }
  .print-page { box-shadow: none !important; border: none !important; }
}
`;

export default function SalarySheetPage() {
  const router = useRouter();
  const printRef = useRef(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("salarySheetData");
    if (raw) setData(JSON.parse(raw));
  }, []);

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = PRINT_STYLES;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const handlePrint = () => window.print();

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading salary data…</p>
          <button
            onClick={() => router.push("/admin/salary")}
            className="mt-4 text-blue-500 text-sm hover:underline"
          >
            ← Go back and enter salary data
          </button>
        </div>
      </div>
    );
  }

  const { month, year, settings, rows } = data;
  const taxRate = settings.taxRate || 1;

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      {/* ── Top bar (no-print) ── */}
      <div className="no-print border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/admin/salary")}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Salary Entry
          </button>
          <span className="text-gray-300">|</span>
          <h1 className="text-gray-800 font-semibold">
            Salary Sheet — {month} {year}
          </h1>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-md shadow-blue-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download PDF (Landscape)
        </button>
      </div>

      {/* ── Preview hint ── */}
      <div className="no-print py-6 px-6 flex justify-center">
        <p className="text-gray-400 text-xs">Preview below • Click "Download PDF" to export in A4 landscape</p>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          PRINTABLE SALARY SHEET
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        ref={printRef}
        className="print-page mx-auto bg-white text-black shadow-xl rounded-lg overflow-hidden"
        style={{ width: "277mm", minHeight: "190mm", padding: "14mm", fontFamily: "'Times New Roman', Times, serif", fontSize: "11px" }}
      >
        {/* ── Document Header ── */}
        <div style={{ textAlign: "center", marginBottom: "10px" }}>
          <div style={{ fontSize: "15px", fontWeight: "bold", letterSpacing: "1px", borderBottom: "2px solid #000", paddingBottom: "4px", display: "inline-block", minWidth: "400px" }}>
            SALARY SHEET
          </div>
          <div style={{ fontSize: "12px", marginTop: "4px", color: "#333" }}>
            Month: <strong>{month} {year}</strong>
          </div>
        </div>

        {/* ── Main Table ── */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "6px" }}>
          <thead>
            <tr style={{ backgroundColor: "#000", color: "#fff" }}>
              <th rowSpan={2} style={thStyle({ width: "28px" })}>S.N.</th>
              <th rowSpan={2} style={thStyle({ width: "130px" })}>Name</th>
              <th rowSpan={2} style={thStyle({ width: "100px" })}>Designation</th>
              <th colSpan={3} style={thStyle({ textAlign: "center" })}>Staff Bonus</th>
              <th colSpan={3} style={thStyle({ textAlign: "center" })}>Staff Salary</th>
              <th colSpan={3} style={thStyle({ textAlign: "center" })}>Overtime</th>
              <th rowSpan={2} style={thStyle({ width: "70px" })}>Grand Total</th>
              <th rowSpan={2} style={thStyle({ width: "60px" })}>Signature</th>
            </tr>
            <tr style={{ backgroundColor: "#333", color: "#fff" }}>
              <th style={subTh}>Bonus</th>
              <th style={subTh}>Tax {taxRate}%</th>
              <th style={subTh}>Amount</th>
              <th style={subTh}>Salary</th>
              <th style={subTh}>Tax {taxRate}%</th>
              <th style={subTh}>Amount</th>
              <th style={subTh}>OT Hours</th>
              <th style={subTh}>OT Rate</th>
              <th style={subTh}>Amount</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, idx) => {
              const bonusVal  = row.bonus || 0;
              const bonusTax  = bonusVal > 0 ? tax(bonusVal, taxRate) : 0;
              const bonusNet  = bonusVal - bonusTax;

              const salaryVal = row.salary || 0;
              const salaryTax = tax(salaryVal, taxRate);
              const salaryNet = salaryVal - salaryTax;

              const otHours   = row.overtimeHours || 0;
              const otRate    = settings.overtimeEnabled ? settings.overtimeRate : 0;
              const otAmount  = row.overtime || 0;

              const grandTotal = salaryNet + bonusNet + otAmount;
              const rowBg = idx % 2 === 0 ? "#fff" : "#f9f9f9";

              return (
                <tr key={row.id} style={{ backgroundColor: rowBg }}>
                  <td style={tdStyle({ textAlign: "center" })}>{idx + 1}</td>
                  <td style={tdStyle({})}>{row.name}</td>
                  <td style={tdStyle({})}>{row.role}</td>
                  <td style={tdStyle({ textAlign: "right" })}>{bonusVal > 0 ? fmt(bonusVal) : "—"}</td>
                  <td style={tdStyle({ textAlign: "right" })}>{bonusTax > 0 ? fmt(bonusTax) : "—"}</td>
                  <td style={tdStyle({ textAlign: "right", fontWeight: "bold" })}>{bonusNet > 0 ? fmt(bonusNet) : "—"}</td>
                  <td style={tdStyle({ textAlign: "right" })}>{fmt(salaryVal)}</td>
                  <td style={tdStyle({ textAlign: "right" })}>{fmt(salaryTax)}</td>
                  <td style={tdStyle({ textAlign: "right", fontWeight: "bold" })}>{fmt(salaryNet)}</td>
                  <td style={tdStyle({ textAlign: "center" })}>{otHours > 0 ? otHours : "—"}</td>
                  <td style={tdStyle({ textAlign: "right" })}>{otRate > 0 ? fmt(otRate) : "—"}</td>
                  <td style={tdStyle({ textAlign: "right" })}>{otAmount > 0 ? fmt(otAmount) : "—"}</td>
                  <td style={tdStyle({ textAlign: "right", fontWeight: "bold", backgroundColor: "#fffbea" })}>{fmt(grandTotal)}</td>
                  <td style={tdStyle({})}></td>
                </tr>
              );
            })}

            {/* Totals row */}
            <tr style={{ backgroundColor: "#000", color: "#fff", fontWeight: "bold" }}>
              <td colSpan={3} style={{ ...tdStyle({}), color: "#fff", textAlign: "right", backgroundColor: "#000" }}>TOTAL</td>
              <td style={{ ...tdStyle({ textAlign: "right" }), color: "#fff", backgroundColor: "#000" }}>
                {fmt(rows.reduce((s, r) => s + (r.bonus || 0), 0))}
              </td>
              <td style={{ ...tdStyle({ textAlign: "right" }), color: "#fff", backgroundColor: "#000" }}>
                {fmt(rows.reduce((s, r) => s + tax(r.bonus || 0, taxRate), 0))}
              </td>
              <td style={{ ...tdStyle({ textAlign: "right" }), color: "#fff", backgroundColor: "#000" }}>
                {fmt(rows.reduce((s, r) => s + ((r.bonus || 0) - tax(r.bonus || 0, taxRate)), 0))}
              </td>
              <td style={{ ...tdStyle({ textAlign: "right" }), color: "#fff", backgroundColor: "#000" }}>
                {fmt(rows.reduce((s, r) => s + (r.salary || 0), 0))}
              </td>
              <td style={{ ...tdStyle({ textAlign: "right" }), color: "#fff", backgroundColor: "#000" }}>
                {fmt(rows.reduce((s, r) => s + tax(r.salary || 0, taxRate), 0))}
              </td>
              <td style={{ ...tdStyle({ textAlign: "right" }), color: "#fff", backgroundColor: "#000" }}>
                {fmt(rows.reduce((s, r) => s + ((r.salary || 0) - tax(r.salary || 0, taxRate)), 0))}
              </td>
              <td style={{ ...tdStyle({ textAlign: "center" }), color: "#fff", backgroundColor: "#000" }}>
                {rows.reduce((s, r) => s + (r.overtimeHours || 0), 0)}
              </td>
              <td style={{ ...tdStyle({}), color: "#fff", backgroundColor: "#000" }}></td>
              <td style={{ ...tdStyle({ textAlign: "right" }), color: "#fff", backgroundColor: "#000" }}>
                {fmt(rows.reduce((s, r) => s + (r.overtime || 0), 0))}
              </td>
              <td style={{ ...tdStyle({ textAlign: "right" }), color: "#fff", backgroundColor: "#000" }}>
                {fmt(rows.reduce((s, r) => {
                  const bonusNet  = (r.bonus || 0) - tax(r.bonus || 0, taxRate);
                  const salaryNet = (r.salary || 0) - tax(r.salary || 0, taxRate);
                  return s + salaryNet + bonusNet + (r.overtime || 0);
                }, 0))}
              </td>
              <td style={{ ...tdStyle({}), backgroundColor: "#000" }}></td>
            </tr>
          </tbody>
        </table>

        {/* ── Footer signatures ── */}
        <div style={{ marginTop: "28px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ textAlign: "left" }}>
            <div style={{ width: "160px", borderTop: "1px solid #000", paddingTop: "4px", marginTop: "30px" }}>
              <div style={{ fontSize: "11px", fontWeight: "bold" }}>Prepared by</div>
              <div style={{ fontSize: "11px" }}>Anjali Maharjan</div>
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "#555" }}>
              Date: {month} {year}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ width: "160px", borderTop: "1px solid #000", paddingTop: "4px", marginTop: "30px", marginLeft: "auto" }}>
              <div style={{ fontSize: "11px", fontWeight: "bold" }}>Approved by</div>
              <div style={{ fontSize: "11px" }}>Bikram Dangol</div>
            </div>
          </div>
        </div>
      </div>

      {/* Screen-only bottom padding */}
      <div className="no-print h-16" />
    </div>
  );
}

// ── Table style helpers ──────────────────────────────────────────────────────
function thStyle(extra = {}) {
  return {
    border: "1px solid #555",
    padding: "5px 6px",
    fontSize: "10px",
    fontWeight: "bold",
    textAlign: "left",
    verticalAlign: "middle",
    ...extra,
  };
}

const subTh = {
  border: "1px solid #555",
  padding: "4px 6px",
  fontSize: "9.5px",
  fontWeight: "bold",
  textAlign: "right",
  verticalAlign: "middle",
};

function tdStyle(extra = {}) {
  return {
    border: "1px solid #ccc",
    padding: "4px 6px",
    fontSize: "10px",
    verticalAlign: "middle",
    ...extra,
  };
}