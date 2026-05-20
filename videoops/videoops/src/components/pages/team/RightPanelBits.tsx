"use client";

import type { MemberProfile, MemberTaskRow } from "./teamTypes";
import { BORDER, BORDER_WEAK, TEXT_MAIN, TEXT_SUB } from "./teamUi";
import { getInitial } from "@/lib/utils";

export function SmallPill({ text, bg, color }: { text: string; bg: string; color: string }) {
  return (
    <span style={{ height: 22, padding: "0 10px", borderRadius: 999, background: bg, color, fontSize: 12, fontWeight: 900, display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}>
      {text}
    </span>
  );
}

export function RiskPill({ risk }: { risk: MemberTaskRow["riskLabel"] }) {
  if (risk === "已逾期") return <SmallPill text="已逾期" bg="rgba(220,38,38,0.14)" color="#dc2626" />;
  if (risk === "紧急") return <SmallPill text="紧急" bg="rgba(245,158,11,0.16)" color="#f59e0b" />;
  return <SmallPill text="正常" bg="rgba(22,163,74,0.12)" color="#16a34a" />;
}

export function StatusPill({ status }: { status: MemberTaskRow["statusLabel"] }) {
  if (status === "待提交") return <SmallPill text="待提交" bg="rgba(37,99,235,0.12)" color="#2563eb" />;
  if (status === "待需求方审核") return <SmallPill text="待需求方审核" bg="rgba(239,68,68,0.10)" color="#ef4444" />;
  if (status === "需修改") return <SmallPill text="需修改" bg="rgba(107,114,128,0.12)" color="#6b7280" />;
  if (status === "已通过") return <SmallPill text="已通过" bg="rgba(22,163,74,0.12)" color="#16a34a" />;
  return <SmallPill text="已结束" bg="rgba(148,163,184,0.16)" color="#64748b" />;
}

export function SectionTitle({ text }: { text: string }) {
  return <div style={{ fontSize: 12, fontWeight: 900, color: "#94a3b8", marginBottom: 10 }}>{text}</div>;
}

export function OutlineButton({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="transition-colors"
      style={{ height: 32, padding: "0 12px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "#fff", fontSize: 12, fontWeight: 900, color: TEXT_MAIN, cursor: "pointer" }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f9fafb")}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#fff")}
    >
      {text}
    </button>
  );
}

export function PrimaryBlue({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="transition-all"
      style={{ height: 32, padding: "0 12px", borderRadius: 10, background: "#2563eb", color: "#fff", border: "none", fontSize: 12, fontWeight: 900, cursor: "pointer", boxShadow: "0 10px 22px rgba(37, 99, 235, 0.22)" }}
      onMouseEnter={e => (e.currentTarget.style.opacity = "0.92")}
      onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
    >
      {text}
    </button>
  );
}
