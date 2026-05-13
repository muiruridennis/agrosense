"use client";
import { apiClient } from "@/lib/api/client";
import { useState, useEffect } from "react";

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n, dec = 0) => n == null ? "—" : Number(n).toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });
const pct = (n) => n == null ? "—" : `${Number(n).toFixed(1)}%`;
const dateStr = (d) => new Date(d).toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" });

const STATUS_META = {
  submitted: { label: "Pending review", color: "#E8A838", bg: "rgba(232,168,56,0.12)" },
  draft:     { label: "Draft",          color: "#5A6654", bg: "rgba(90,102,84,0.12)" },
  reviewed:  { label: "Approved",       color: "#7C9A5E", bg: "rgba(124,154,94,0.12)" },
  flagged:   { label: "Flagged",        color: "#E85050", bg: "rgba(232,80,80,0.12)" },
};

// ── Mock data (replace with real API calls) ────────────────────────────────
const MOCK_SUMMARY = {
  flock: { type: "layers", breed: "ISA Brown", currentCount: 4782, initialCount: 5000, placementDate: "2025-11-01", house: { name: "House A" } },
  pendingReview: 3,
  avgProductionRate: 78.4,
  totalMortality: 218,
  mortalityRate: 4.36,
  last7Days: [
    { id: "r1", recordDate: "2026-04-26", status: "submitted", submittedBy: { fullName: "James Mutua" }, morningEggs: 2100, eveningEggs: 1950, brokenEggs: 42, dirtyEggs: 18, mortality: 3, culls: 0, feedConsumedKg: 240, waterConsumedLitres: 380, sickBirds: 2, medication: null, productionRatePercent: 84.8, liveBirdsAfterRecord: 4782, remarks: null },
    { id: "r2", recordDate: "2026-04-25", status: "submitted", submittedBy: { fullName: "James Mutua" }, morningEggs: 1980, eveningEggs: 1860, brokenEggs: 55, dirtyEggs: 22, mortality: 4, culls: 1, feedConsumedKg: 238, waterConsumedLitres: 370, sickBirds: 3, medication: "Tetracycline 1g/L", productionRatePercent: 81.2, liveBirdsAfterRecord: 4785, remarks: "3 birds limping in pen 2" },
    { id: "r3", recordDate: "2026-04-24", status: "reviewed",  submittedBy: { fullName: "Grace Wanjiku" }, morningEggs: 2050, eveningEggs: 1900, brokenEggs: 38, dirtyEggs: 14, mortality: 2, culls: 0, feedConsumedKg: 242, waterConsumedLitres: 390, sickBirds: 0, medication: null, productionRatePercent: 82.5, liveBirdsAfterRecord: 4790, remarks: null },
    { id: "r4", recordDate: "2026-04-23", status: "reviewed",  submittedBy: { fullName: "James Mutua" }, morningEggs: 2200, eveningEggs: 2000, brokenEggs: 60, dirtyEggs: 25, mortality: 1, culls: 0, feedConsumedKg: 245, waterConsumedLitres: 395, sickBirds: 1, medication: null, productionRatePercent: 87.3, liveBirdsAfterRecord: 4792, remarks: null },
    { id: "r5", recordDate: "2026-04-22", status: "flagged",   submittedBy: { fullName: "Grace Wanjiku" }, morningEggs: 800,  eveningEggs: 750,  brokenEggs: 12, dirtyEggs: 8,  mortality: 1, culls: 0, feedConsumedKg: 190, waterConsumedLitres: 300, sickBirds: 0, medication: null, productionRatePercent: 32.1, liveBirdsAfterRecord: 4793, remarks: "Power went out morning", reviewNote: "Production too low — please confirm egg count and check if morning collection was missed" },
    { id: "r6", recordDate: "2026-04-21", status: "reviewed",  submittedBy: { fullName: "James Mutua" }, morningEggs: 2080, eveningEggs: 1920, brokenEggs: 45, dirtyEggs: 20, mortality: 2, culls: 1, feedConsumedKg: 240, waterConsumedLitres: 385, sickBirds: 0, medication: null, productionRatePercent: 83.6, liveBirdsAfterRecord: 4794, remarks: null },
    { id: "r7", recordDate: "2026-04-20", status: "reviewed",  submittedBy: { fullName: "James Mutua" }, morningEggs: 2120, eveningEggs: 1980, brokenEggs: 50, dirtyEggs: 22, mortality: 3, culls: 0, feedConsumedKg: 241, waterConsumedLitres: 382, sickBirds: 2, medication: "Electrolytes", productionRatePercent: 85.1, liveBirdsAfterRecord: 4797, remarks: null },
  ],
};

// ── Sub-components ─────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color = "#7C9A5E", alert }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)", border: `1px solid ${alert ? "rgba(232,80,80,0.3)" : "rgba(255,255,255,0.08)"}`,
      borderRadius: 14, padding: "16px 18px", flex: 1, minWidth: 0,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        {alert && <span style={{ fontSize: 10, color: "#E85050", background: "rgba(232,80,80,0.12)", borderRadius: 4, padding: "2px 6px", fontWeight: 600 }}>ALERT</span>}
      </div>
      <div style={{ marginTop: 10, color, fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px", fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ color: "#C5D4BC", fontSize: 13, fontWeight: 500, marginTop: 2 }}>{label}</div>
      {sub && <div style={{ color: "#5A6654", fontSize: 11, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Sparkline({ values, color = "#7C9A5E", height = 36 }) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 120, h = height;
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * w,
    h - ((v - min) / range) * (h - 4) - 2,
  ]);
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill={color} />
    </svg>
  );
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] ?? STATUS_META.draft;
  return (
    <span style={{ background: m.bg, color: m.color, borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
      {m.label}
    </span>
  );
}

function ReviewPanel({ record, onApprove, onFlag, onClose }) {
  const [note, setNote] = useState("");
  const [flagging, setFlagging] = useState(false);

  const isLayers = record.morningEggs != null;
  const totalEggs = (record.morningEggs ?? 0) + (record.eveningEggs ?? 0);
  const goodEggs = totalEggs - (record.brokenEggs ?? 0) - (record.dirtyEggs ?? 0);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#1A1F14", borderRadius: "20px 20px 0 0",
        border: "1px solid rgba(255,255,255,0.1)",
        width: "100%", maxWidth: 640,
        maxHeight: "90vh", overflowY: "auto",
        padding: "24px 24px 40px",
        animation: "slideUp 0.3s ease",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ color: "#E8EDE4", fontSize: 17, fontWeight: 600 }}>{dateStr(record.recordDate)}</div>
            <div style={{ color: "#5A6654", fontSize: 13 }}>by {record.submittedBy?.fullName}</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 8, width: 32, height: 32, color: "#9BA89A", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        {/* KPIs row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
          {isLayers && <>
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ color: "#5A6654", fontSize: 10, marginBottom: 4 }}>TOTAL EGGS</div>
              <div style={{ color: "#E8EDE4", fontSize: 18, fontWeight: 700 }}>{totalEggs.toLocaleString()}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ color: "#5A6654", fontSize: 10, marginBottom: 4 }}>GOOD EGGS</div>
              <div style={{ color: "#A8C98A", fontSize: 18, fontWeight: 700 }}>{goodEggs.toLocaleString()}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ color: "#5A6654", fontSize: 10, marginBottom: 4 }}>PROD. RATE</div>
              <div style={{ color: record.productionRatePercent > 70 ? "#7C9A5E" : "#E85050", fontSize: 18, fontWeight: 700 }}>{pct(record.productionRatePercent)}</div>
            </div>
          </>}
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ color: "#5A6654", fontSize: 10, marginBottom: 4 }}>MORTALITY</div>
            <div style={{ color: record.mortality > 5 ? "#E85050" : "#E8EDE4", fontSize: 18, fontWeight: 700 }}>{record.mortality}</div>
          </div>
        </div>

        {/* Detail rows */}
        {[
          ["Feed consumed", `${record.feedConsumedKg} kg${record.feedType ? ` · ${record.feedType}` : ""}`],
          ["Water consumed", record.waterConsumedLitres ? `${record.waterConsumedLitres} L` : "—"],
          ["Sick birds", record.sickBirds > 0 ? `${record.sickBirds} birds` : "None"],
          ["Medication", record.medication || "None"],
          ["Live birds after", record.liveBirdsAfterRecord?.toLocaleString()],
        ].map(([k, v]) => v && (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 14 }}>
            <span style={{ color: "#5A6654" }}>{k}</span>
            <span style={{ color: "#E8EDE4" }}>{v}</span>
          </div>
        ))}

        {record.remarks && (
          <div style={{ marginTop: 14, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ color: "#5A6654", fontSize: 11, marginBottom: 6 }}>WORKER REMARKS</div>
            <div style={{ color: "#C5D4BC", fontSize: 14, lineHeight: 1.6 }}>{record.remarks}</div>
          </div>
        )}

        {record.reviewNote && (
          <div style={{ marginTop: 14, background: "rgba(232,80,80,0.08)", border: "1px solid rgba(232,80,80,0.2)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ color: "#E85050", fontSize: 11, marginBottom: 6 }}>PREVIOUS FLAG NOTE</div>
            <div style={{ color: "#F08080", fontSize: 14, lineHeight: 1.6 }}>{record.reviewNote}</div>
          </div>
        )}

        {record.status === "submitted" && (
          <>
            {flagging ? (
              <div style={{ marginTop: 20 }}>
                <div style={{ color: "#C5D4BC", fontSize: 13, marginBottom: 8 }}>Flag note (required — worker will see this)</div>
                <textarea
                  value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Explain what needs to be corrected..."
                  rows={3}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(232,80,80,0.3)",
                    borderRadius: 10, padding: "11px 14px",
                    color: "#E8EDE4", fontSize: 14, outline: "none", fontFamily: "inherit", resize: "vertical",
                  }}
                />
                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <button onClick={() => setFlagging(false)} style={{ flex: 1, padding: "12px 0", borderRadius: 10, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "#9BA89A", fontFamily: "inherit", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>Cancel</button>
                  <button
                    onClick={() => { if (note.trim()) onFlag(record.id, note); }}
                    disabled={!note.trim()}
                    style={{ flex: 2, padding: "12px 0", borderRadius: 10, background: note.trim() ? "#5A1B1B" : "rgba(255,255,255,0.04)", border: `1px solid ${note.trim() ? "rgba(232,80,80,0.5)" : "rgba(255,255,255,0.08)"}`, color: note.trim() ? "#F08080" : "#3D4B38", fontFamily: "inherit", cursor: note.trim() ? "pointer" : "not-allowed", fontSize: 14, fontWeight: 600 }}>
                    Send flag to worker
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                <button onClick={() => setFlagging(true)} style={{ flex: 1, padding: "13px 0", borderRadius: 12, background: "rgba(232,80,80,0.1)", border: "1px solid rgba(232,80,80,0.3)", color: "#F08080", fontFamily: "inherit", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>
                  🚩 Flag
                </button>
                <button onClick={() => onApprove(record.id)} style={{ flex: 2, padding: "13px 0", borderRadius: 12, background: "linear-gradient(135deg, #2D5A1B, #4A7C3F)", border: "none", color: "#fff", fontFamily: "inherit", cursor: "pointer", fontSize: 15, fontWeight: 600, boxShadow: "0 4px 16px rgba(74,124,63,0.3)" }}>
                  ✓ Approve record
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Main dashboard ─────────────────────────────────────────────────────────
export default function ManagerDashboard({ farmId }) {
  const [summary, setSummary] = useState(MOCK_SUMMARY);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [records, setRecords] = useState(MOCK_SUMMARY.last7Days);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = async (recordId) => {
    try {
      await apiClient.patch(`/poultry/records/${recordId}/review`, { status: "reviewed" });
      setRecords(r => r.map(x => x.id === recordId ? { ...x, status: "reviewed" } : x));
      setSelectedRecord(null);
      showToast("Record approved ✓");
    } catch {
      // In dev, just update local state
      setRecords(r => r.map(x => x.id === recordId ? { ...x, status: "reviewed" } : x));
      setSelectedRecord(null);
      showToast("Record approved ✓");
    }
  };

  const handleFlag = async (recordId, note) => {
    try {
      await apiClient.patch(`/poultry/records/${recordId}/review`, { status: "flagged", reviewNote: note });
      setRecords(r => r.map(x => x.id === recordId ? { ...x, status: "flagged", reviewNote: note } : x));
      setSelectedRecord(null);
      showToast("Record flagged — worker notified");
    } catch {
      setRecords(r => r.map(x => x.id === recordId ? { ...x, status: "flagged", reviewNote: note } : x));
      setSelectedRecord(null);
      showToast("Record flagged — worker notified");
    }
  };

  const pending = records.filter(r => r.status === "submitted");
  const all = records;
  const shown = activeTab === "pending" ? pending : all;
  const prodRates = records.filter(r => r.productionRatePercent).map(r => r.productionRatePercent).reverse();

  return (
    <div style={{
      minHeight: "100vh", background: "#161B12",
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", paddingBottom: 40,
    }}>
      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes toastIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
      `}</style>

      {toast && (
        <div style={{ position:"fixed",top:20,right:20,zIndex:100,background:toast.type==="success"?"#2D5A1B":"#5A1B1B",border:`1px solid ${toast.type==="success"?"#4A7C3F":"#7C3F3F"}`,borderRadius:10,padding:"12px 18px",color:"#E8EDE4",fontSize:14,fontWeight:500,animation:"toastIn 0.3s ease",boxShadow:"0 4px 20px rgba(0,0,0,0.4)",zIndex:200 }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ background:"rgba(22,27,18,0.97)",backdropFilter:"blur(10px)",borderBottom:"1px solid rgba(255,255,255,0.07)",padding:"16px 20px",position:"sticky",top:0,zIndex:10 }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",maxWidth:900,margin:"0 auto" }}>
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            <div style={{ width:38,height:38,borderRadius:10,background:"linear-gradient(135deg,#2D5A1B,#4A7C3F)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>🏠</div>
            <div>
              <div style={{ color:"#E8EDE4",fontSize:17,fontWeight:600 }}>{summary.flock.house?.name}</div>
              <div style={{ color:"#5A6654",fontSize:12 }}>{summary.flock.breed} · {summary.flock.currentCount?.toLocaleString()} live birds</div>
            </div>
          </div>
          {pending.length > 0 && (
            <div style={{ background:"rgba(232,168,56,0.15)",border:"1px solid rgba(232,168,56,0.3)",borderRadius:20,padding:"5px 14px",display:"flex",alignItems:"center",gap:6 }}>
              <span style={{ width:7,height:7,borderRadius:"50%",background:"#E8A838",display:"inline-block" }}/>
              <span style={{ color:"#E8A838",fontSize:13,fontWeight:600 }}>{pending.length} pending</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding:"20px",maxWidth:900,margin:"0 auto" }}>

        {/* KPI cards */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginBottom:20 }}>
          <KpiCard icon="🥚" label="Avg production rate" value={pct(summary.avgProductionRate)} sub="Last 7 days" color={summary.avgProductionRate > 70 ? "#7C9A5E" : "#E8A838"} />
          <KpiCard icon="💀" label="Mortality rate" value={pct(summary.mortalityRate)} sub={`${summary.totalMortality} total losses`} color={summary.mortalityRate > 5 ? "#E85050" : "#E8EDE4"} alert={summary.mortalityRate > 5} />
          <KpiCard icon="🐔" label="Live birds" value={summary.flock.currentCount?.toLocaleString()} sub={`of ${summary.flock.initialCount?.toLocaleString()} placed`} />
          <KpiCard icon="📋" label="Pending reviews" value={summary.pendingReview} sub="Awaiting your approval" color={summary.pendingReview > 0 ? "#E8A838" : "#7C9A5E"} />
        </div>

        {/* Production trend sparkline */}
        <div style={{ background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"16px 20px",marginBottom:20 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
            <div>
              <div style={{ color:"#E8EDE4",fontSize:14,fontWeight:600 }}>Production trend</div>
              <div style={{ color:"#5A6654",fontSize:12 }}>Last 7 days · production rate %</div>
            </div>
            <Sparkline values={prodRates} color="#7C9A5E" height={40} />
          </div>
          <div style={{ display:"flex",gap:6 }}>
            {records.slice().reverse().map((r, i) => {
              const rate = r.productionRatePercent ?? 0;
              const color = rate > 80 ? "#4A7C3F" : rate > 65 ? "#E8A838" : "#E85050";
              return (
                <div key={i} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer" }} onClick={() => setSelectedRecord(r)}>
                  <div style={{ width:"100%",borderRadius:4,background:color,opacity:0.85,height:Math.max(4, (rate/100)*60) }}/>
                  <span style={{ fontSize:10,color:"#5A6654" }}>{new Date(r.recordDate).getDate()}</span>
                  {r.status === "submitted" && <span style={{ width:5,height:5,borderRadius:"50%",background:"#E8A838",display:"block" }}/>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Record list */}
        <div style={{ display:"flex",gap:0,marginBottom:16,background:"rgba(255,255,255,0.04)",borderRadius:10,padding:4 }}>
          {[["pending", `Pending (${pending.length})`], ["all", "All records"]].map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex:1,padding:"8px 0",borderRadius:8,border:"none",background:activeTab===tab?"rgba(124,154,94,0.2)":"transparent",color:activeTab===tab?"#A8C98A":"#5A6654",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s" }}>
              {label}
            </button>
          ))}
        </div>

        {shown.length === 0 && (
          <div style={{ textAlign:"center",padding:"40px 0",color:"#5A6654",fontSize:14 }}>
            {activeTab === "pending" ? "✓ All caught up — no pending reviews" : "No records yet"}
          </div>
        )}

        {shown.map((record) => {
          const totalEggs = (record.morningEggs ?? 0) + (record.eveningEggs ?? 0);
          return (
            <div
              key={record.id}
              onClick={() => setSelectedRecord(record)}
              style={{
                background:"rgba(255,255,255,0.04)",
                border:`1px solid ${record.status==="submitted"?"rgba(232,168,56,0.25)":record.status==="flagged"?"rgba(232,80,80,0.2)":"rgba(255,255,255,0.07)"}`,
                borderRadius:14,padding:"16px 18px",marginBottom:10,cursor:"pointer",
                transition:"all 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
            >
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10 }}>
                <div>
                  <div style={{ color:"#E8EDE4",fontSize:15,fontWeight:600 }}>{dateStr(record.recordDate)}</div>
                  <div style={{ color:"#5A6654",fontSize:12,marginTop:2 }}>by {record.submittedBy?.fullName}</div>
                </div>
                <StatusBadge status={record.status} />
              </div>

              <div style={{ display:"flex",gap:16,flexWrap:"wrap" }}>
                {totalEggs > 0 && <div style={{ fontSize:13 }}><span style={{ color:"#5A6654" }}>Eggs </span><span style={{ color:"#E8EDE4",fontWeight:600 }}>{totalEggs.toLocaleString()}</span></div>}
                {record.productionRatePercent != null && (
                  <div style={{ fontSize:13 }}>
                    <span style={{ color:"#5A6654" }}>Rate </span>
                    <span style={{ color:record.productionRatePercent>70?"#7C9A5E":"#E85050",fontWeight:600 }}>{pct(record.productionRatePercent)}</span>
                  </div>
                )}
                <div style={{ fontSize:13 }}><span style={{ color:"#5A6654" }}>Mortality </span><span style={{ color:record.mortality>5?"#E85050":"#E8EDE4",fontWeight:600 }}>{record.mortality}</span></div>
                <div style={{ fontSize:13 }}><span style={{ color:"#5A6654" }}>Feed </span><span style={{ color:"#E8EDE4",fontWeight:600 }}>{record.feedConsumedKg}kg</span></div>
              </div>

              {record.remarks && (
                <div style={{ marginTop:10,fontSize:12,color:"#7C9A5E",background:"rgba(124,154,94,0.08)",borderRadius:6,padding:"6px 10px" }}>
                  💬 {record.remarks}
                </div>
              )}
              {record.reviewNote && (
                <div style={{ marginTop:8,fontSize:12,color:"#F08080",background:"rgba(232,80,80,0.08)",borderRadius:6,padding:"6px 10px" }}>
                  🚩 {record.reviewNote}
                </div>
              )}

              {record.status === "submitted" && (
                <div style={{ marginTop:12,color:"#E8A838",fontSize:12,textAlign:"right",fontWeight:600 }}>
                  Tap to review →
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Review panel */}
      {selectedRecord && (
        <ReviewPanel
          record={selectedRecord}
          onApprove={handleApprove}
          onFlag={handleFlag}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
}