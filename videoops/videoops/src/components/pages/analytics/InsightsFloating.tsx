"use client";

import { ArrowUpRight } from "lucide-react";
import { BORDER_WEAK } from "./reportUi";

export default function InsightsFloating({
  open,
  setOpen,
  text,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  text: string;
}) {
  return (
    <div style={{ position: "fixed", right: 22, bottom: 22, zIndex: 55 }}>
      {open && (
        <div style={{ position: "absolute", right: 74, bottom: 8, width: 320 }}>
          <div style={{ borderRadius: 18, background: "#0b1220", boxShadow: "0 22px 60px rgba(15, 23, 42, 0.35)", padding: 14, border: `1px solid rgba(255,255,255,0.06)` }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: "#fff", marginBottom: 8 }}>运营洞察</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.78)", lineHeight: 1.8, marginBottom: 12 }}>
              {text}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="transition-all"
              style={{ width: "100%", height: 34, borderRadius: 12, background: "#ef4444", color: "#fff", border: "none", fontSize: 12, fontWeight: 900, cursor: "pointer", boxShadow: "0 10px 22px rgba(239, 68, 68, 0.22)" }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.92")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              知道了
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="transition-all"
        style={{ width: 54, height: 54, borderRadius: "50%", background: "#ef4444", border: `1px solid ${BORDER_WEAK}`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 22px 60px rgba(239, 68, 68, 0.30)" }}
        title="运营洞察"
      >
        <ArrowUpRight size={18} />
      </button>
    </div>
  );
}

