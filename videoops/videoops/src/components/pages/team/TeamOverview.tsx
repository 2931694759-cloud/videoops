"use client";

import { BORDER_WEAK, TEXT_MAIN, TEXT_SUB } from "./teamUi";

export default function TeamOverview({
  assignable,
  highLoad,
  pending,
  needFix,
}: {
  assignable: number;
  highLoad: number;
  pending: number;
  needFix: number;
}) {
  const cards = [
    { k: "可分配成员", v: assignable, d: "负载低于 80%，可接新任务", accent: true },
    { k: "高负载成员", v: highLoad, d: "忙碌或超负荷，需要谨慎分配", accent: false },
    { k: "待审核提交", v: pending, d: "成员已提交，等待需求方审核", accent: false },
    { k: "需修改任务", v: needFix, d: "被退回后等待成员重新提交", accent: false },
  ];

  return (
    <div className="grid grid-cols-4 gap-[14px]" style={{ marginBottom: 14 }}>
      {cards.map(c => (
        <div key={c.k} style={{ borderRadius: 18, border: `1px solid ${BORDER_WEAK}`, background: "#fff", boxShadow: "0 18px 50px rgba(15, 23, 42, 0.06)", padding: "14px 16px", position: "relative" }}>
          {c.accent && <div style={{ position: "absolute", left: 0, top: 12, bottom: 12, width: 4, borderRadius: 99, background: "#ef4444" }} />}
          <div style={{ fontSize: 12, fontWeight: 900, color: TEXT_SUB, marginBottom: 10 }}>{c.k}</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: TEXT_MAIN, letterSpacing: "-0.5px", lineHeight: 1.1 }}>{c.v}</div>
          <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: TEXT_SUB }}>{c.d}</div>
        </div>
      ))}
    </div>
  );
}
