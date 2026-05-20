"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "../../../../lib/LangContext";

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmt(n) {
  return Number(n || 0).toLocaleString("en-NP");
}
function tax(amount, rate) {
  return Math.round((amount * rate) / 100);
}

const PRINT_STYLES = `
@page { size: A4 landscape; margin: 12mm; }
@media print {
  body { background: white !important; }
  .no-print { display: none !important; }
  .print-page { box-shadow: none !important; border: none !important; }
}
`;

const TEXT = {
  en: {
    loading:        "Loading salary data…",
    goBack:         "← Go back and enter salary data",
    backBtn:        "Back to Salary Entry",
    sheetTitle:     "Salary Sheet",
    downloadPdf:    "Download PDF (Landscape)",
    previewHint:    'Preview below • Click "Download PDF" to export in A4 landscape',
    salarySheet:    "SALARY SHEET",
    month:          "Month",
    sn:             "S.N.",
    name:           "Name",
    designation:    "Designation",
    staffBonus:     "Staff Bonus",
    staffSalary:    "Staff Salary",
    overtime:       "Overtime",
    grandTotal:     "Grand Total",
    signature:      "Signature",
    bonus:          "Bonus",
    tax:            "Tax",
    amount:         "Amount",
    salary:         "Salary",
    otHours:        "OT Hours",
    otRate:         "OT Rate",
    total:          "TOTAL",
    preparedBy:     "Prepared by",
    approvedBy:     "Approved by",
    date:           "Date",
  },
  np: {
    loading:        "तलब डेटा लोड हुँदैछ…",
    goBack:         "← फिर्ता जानुस् र तलब डेटा प्रविष्ट गर्नुस्",
    backBtn:        "तलब प्रविष्टिमा फिर्ता",
    sheetTitle:     "तलब पाना",
    downloadPdf:    "PDF डाउनलोड गर्नुस् (Landscape)",
    previewHint:    'तलको पूर्वावलोकन हेर्नुस् • A4 landscape मा निर्यात गर्न "PDF डाउनलोड" थिच्नुस्',
    salarySheet:    "तलब पाना",
    month:          "महिना",
    sn:             "क्र.सं.",
    name:           "नाम",
    designation:    "पद",
    staffBonus:     "कर्मचारी बोनस",
    staffSalary:    "कर्मचारी तलब",
    overtime:       "ओभरटाइम",
    grandTotal:     "महाजम्मा",
    signature:      "दस्तखत",
    bonus:          "बोनस",
    tax:            "कर",
    amount:         "रकम",
    salary:         "तलब",
    otHours:        "OT घण्टा",
    otRate:         "OT दर",
    total:          "जम्मा",
    preparedBy:     "तयार गर्नेः",
    approvedBy:     "स्वीकृत गर्नेः",
    date:           "मिति",
  },
};

export default function SalarySheetPage() {
  const router   = useRouter();
  const printRef = useRef(null);
  const [data, setData] = useState(null);
  const { lang } = useLang();
  const t        = TEXT[lang] || TEXT.en;

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
          <p className="text-gray-400 text-sm">{t.loading}</p>
          <button
            onClick={() => router.push("/admin/salary")}
            className="mt-4 text-blue-500 text-sm hover:underline"
          >
            {t.goBack}
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
            {t.backBtn}
          </button>
          <span className="text-gray-300">|</span>
          <h1 className="text-gray-800 font-semibold">
            {t.sheetTitle} — {month} {year}
          </h1>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-md shadow-blue-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {t.downloadPdf}
        </button>
      </div>

      {/* ── Preview hint ── */}
      <div className="no-print py-6 px-6 flex justify-center">
        <p className="text-gray-400 text-xs">{t.previewHint}</p>
      </div>

      {/* ── Printable Sheet ── */}
      <div
        ref={printRef}
        className="print-page mx-auto bg-white text-black shadow-xl rounded-lg overflow-hidden"
        style={{ width: "277mm", minHeight: "190mm", padding: "14mm", fontFamily: "'Times New Roman', Times, serif", fontSize: "11px" }}
      >
        {/* Document Header */}
        <div style={{ textAlign: "center", marginBottom: "10px" }}>
          <div style={{ fontSize: "15px", fontWeight: "bold", letterSpacing: "1px", borderBottom: "2px solid #000", paddingBottom: "4px", display: "inline-block", minWidth: "400px" }}>
            {t.salarySheet}
          </div>
          <div style={{ fontSize: "12px", marginTop: "4px", color: "#333" }}>
            {t.month}: <strong>{month} {year}</strong>
          </div>
        </div>

        {/* Main Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "6px" }}>
          <thead>
            <tr style={{ backgroundColor: "#000", color: "#fff" }}>
              <th rowSpan={2} style={thStyle({ width: "28px" })}>{t.sn}</th>
              <th rowSpan={2} style={thStyle({ width: "130px" })}>{t.name}</th>
              <th rowSpan={2} style={thStyle({ width: "100px" })}>{t.designation}</th>
              <th colSpan={3} style={thStyle({ textAlign: "center" })}>{t.staffBonus}</th>
              <th colSpan={3} style={thStyle({ textAlign: "center" })}>{t.staffSalary}</th>
              <th colSpan={3} style={thStyle({ textAlign: "center" })}>{t.overtime}</th>
              <th rowSpan={2} style={thStyle({ width: "70px" })}>{t.grandTotal}</th>
              <th rowSpan={2} style={thStyle({ width: "60px" })}>{t.signature}</th>
            </tr>
            <tr style={{ backgroundColor: "#333", color: "#fff" }}>
              <th style={subTh}>{t.bonus}</th>
              <th style={subTh}>{t.tax} {taxRate}%</th>
              <th style={subTh}>{t.amount}</th>
              <th style={subTh}>{t.salary}</th>
              <th style={subTh}>{t.tax} {taxRate}%</th>
              <th style={subTh}>{t.amount}</th>
              <th style={subTh}>{t.otHours}</th>
              <th style={subTh}>{t.otRate}</th>
              <th style={subTh}>{t.amount}</th>
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
              <td colSpan={3} style={{ ...tdStyle({}), color: "#fff", textAlign: "right", backgroundColor: "#000" }}>{t.total}</td>
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

        {/* Footer signatures */}
        <div style={{ marginTop: "28px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ textAlign: "left" }}>
            <div style={{ width: "160px", borderTop: "1px solid #000", paddingTop: "4px", marginTop: "30px" }}>
              <div style={{ fontSize: "11px", fontWeight: "bold" }}>{t.preparedBy}</div>
              <div style={{ fontSize: "11px" }}>Anjali Maharjan</div>
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "#555" }}>
              {t.date}: {month} {year}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ width: "160px", borderTop: "1px solid #000", paddingTop: "4px", marginTop: "30px", marginLeft: "auto" }}>
              <div style={{ fontSize: "11px", fontWeight: "bold" }}>{t.approvedBy}</div>
              <div style={{ fontSize: "11px" }}>Bikram Dangol</div>
            </div>
          </div>
        </div>
      </div>

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