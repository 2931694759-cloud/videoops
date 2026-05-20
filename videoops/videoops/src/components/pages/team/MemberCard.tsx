"use client";

import type { MemberProfile, MemberStats } from "./teamTypes";
import { getInitial } from "@/lib/utils";
import { BORDER, BORDER_WEAK, TEXT_MAIN, TEXT_SUB } from "./teamUi";
import { skillStyle } from "./teamUi";

export default function MemberCard({
  member,
  stats,
  selected,
  onSelect,
}: {
  member: MemberProfile;
  stats: MemberStats;
  selected: boolean;
  onSelect: () => void;
}) {
  const borderColor = selected ? "rgba(239,68,68,0.25)" : BORDER_WEAK;
  const shadow = selected ? "0 18px 50px rgba(239, 68, 68, 0.14)" : "0 18px 50px rgba(15, 23, 42, 0.06)";

  return (
    <button
      type="button"
      onClick={onSelect}
      className="transition-all"
      style={{
        width: "100%",
        textAlign: "left",
        borderRadius: 18,
        background: "#fff",
        border: `1px solid ${borderColor}`,
        boxShadow: shadow,
        padding: "16px 16px 14px",
        position: "relative",
        cursor: "pointer",
      }}
      onMouseEnter={e => {
        if (!selected) {
          e.currentTarget.style.borderColor = BORDER;
          e.currentTarget.style.boxShadow = "0 22px 60px rgba(15, 23, 42, 0.10)";
        }
      }}
      onMouseLeave={e => {
        if (!selected) {
          e.currentTarget.style.borderColor = BORDER_WEAK;
          e.currentTarget.style.boxShadow = "0 18px 50px rgba(15, 23, 42, 0.06)";
        }
      }}
    >
      {selected && (
        <div style={{ position: "absolute", left: 0, top: 14, bottom: 14, width: 4, borderRadius: 99, background: "#ef4444" }} />
      )}

      <div className="flex items-start justify-between gap-[10px]" style={{ marginBottom: 10 }}>
        <div className="flex items-center gap-[10px] min-w-0">
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: member.avatar, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, flexShrink: 0 }}>
            {getInitial(member.name)}
          </div>
          <div className="min-w-0">
            <div style={{ fontSize: 14, fontWeight: 900, color: TEXT_MAIN, lineHeight: 1.2 }} className="truncate">{member.name}</div>
            <div style={{ fontSize: 12, color: TEXT_SUB, fontWeight: 700, marginTop: 2 }} className="truncate">{member.email}</div>
          </div>
        </div>

        <div className="flex items-center gap-[8px] shrink-0">
          <span style={{ height: 22, padding: "0 10px", borderRadius: 999, border: `1px solid ${BORDER}`, fontSize: 12, fontWeight: 900, color: TEXT_SUB, background: "#fff", display: "inline-flex", alignItems: "center" }}>
            {member.roleLabel}
          </span>
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-[8px]" style={{ marginBottom: 12 }}>
        {member.skills.slice(0, 4).map(s => {
          const st = skillStyle(s);
          return (
            <span key={s} style={{ height: 22, padding: "0 10px", borderRadius: 999, background: st.bg, color: st.color, fontSize: 12, fontWeight: 900, display: "inline-flex", alignItems: "center" }}>
              {s}
            </span>
          );
        })}
      </div>

      <div className="grid grid-cols-4 gap-[10px]">
        {[
          { n: stats.currentTasks, t: "当前交付任务" },
          { n: stats.toSubmit, t: "待提交" },
          { n: stats.waitingSignoff, t: "待需求方审核" },
          { n: stats.monthDone, t: "本月已通过" },
        ].map(x => (
          <div key={x.t} style={{ borderRadius: 14, border: `1px solid ${BORDER_WEAK}`, background: "#fff", padding: "10px 0", textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: TEXT_MAIN, lineHeight: 1.1 }}>{x.n}</div>
            <div style={{ marginTop: 4, fontSize: 11, fontWeight: 800, color: TEXT_SUB }}>{x.t}</div>
          </div>
        ))}
      </div>
    </button>
  );
}
