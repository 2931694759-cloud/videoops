"use client";

import { BORDER, BORDER_WEAK, CARD_SHADOW, PAGE_BG, RADIUS, TEXT_MAIN, TEXT_SUB } from "./reportUi";

export function Card({
  children,
  padding = "16px 16px",
  style,
}: {
  children: React.ReactNode;
  padding?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        borderRadius: RADIUS,
        border: `1px solid ${BORDER_WEAK}`,
        background: "#fff",
        boxShadow: CARD_SHADOW,
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-[8px]" style={{ margin: "10px 0 12px" }}>
      <div style={{ width: 6, height: 6, borderRadius: 999, background: "#ef4444" }} />
      <div style={{ fontSize: 13, fontWeight: 900, color: TEXT_MAIN }}>{title}</div>
    </div>
  );
}

export function CardTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-[12px]" style={{ marginBottom: 12 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 900, color: TEXT_MAIN }}>{title}</div>
        {subtitle && <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: TEXT_SUB }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

export function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ key: string; label: string }>;
  onChange: (k: string) => void;
}) {
  return (
    <div style={{ padding: 3, borderRadius: 999, border: `1px solid ${BORDER}`, background: "#fff", display: "inline-flex", gap: 2 }}>
      {options.map(o => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className="transition-colors"
            style={{
              height: 30,
              padding: "0 14px",
              borderRadius: 999,
              border: "none",
              background: active ? "#ef4444" : "transparent",
              color: active ? "#fff" : "#6b7280",
              fontSize: 12,
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Pill({ text, active, onClick }: { text: string; active?: boolean; onClick?: () => void }) {
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      {...(onClick ? { type: "button", onClick } : {})}
      className={onClick ? "transition-colors" : undefined}
      style={{
        height: 32,
        padding: "0 12px",
        borderRadius: 999,
        border: `1px solid ${active ? "rgba(239,68,68,0.22)" : BORDER}`,
        background: active ? "rgba(239,68,68,0.08)" : "#fff",
        color: active ? "#ef4444" : TEXT_SUB,
        fontSize: 12,
        fontWeight: 900,
        cursor: onClick ? "pointer" : "default",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {text}
    </Tag>
  );
}

export function MutedPill({ text, rightIcon }: { text: string; rightIcon?: React.ReactNode }) {
  return (
    <button
      type="button"
      className="transition-colors"
      style={{ height: 32, padding: "0 12px", borderRadius: 999, border: `1px solid ${BORDER}`, background: "#fff", color: TEXT_SUB, fontSize: 12, fontWeight: 900, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f9fafb")}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#fff")}
    >
      <span>{text}</span>
      {rightIcon}
    </button>
  );
}

export function Toast({ text }: { text: string }) {
  return (
    <div style={{ position: "fixed", left: 24 + 260, bottom: 18, zIndex: 60 }}>
      <div style={{ borderRadius: 999, background: "rgba(15, 23, 42, 0.92)", color: "#fff", padding: "10px 14px", fontSize: 12, fontWeight: 900, boxShadow: "0 18px 50px rgba(15, 23, 42, 0.24)" }}>
        {text}
      </div>
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ borderRadius: RADIUS, border: `1px solid ${BORDER_WEAK}`, background: "#fff", boxShadow: CARD_SHADOW, padding: "56px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 14, fontWeight: 900, color: TEXT_MAIN }}>{text}</div>
    </div>
  );
}

export function SoftDivider() {
  return <div style={{ height: 1, background: BORDER_WEAK }} />;
}

export function PanelTop({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: "14px 16px", background: PAGE_BG, borderBottom: `1px solid ${BORDER_WEAK}` }}>
      {children}
    </div>
  );
}

