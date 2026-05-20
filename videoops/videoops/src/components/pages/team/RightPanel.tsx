"use client";

import type { MemberPerformance, MemberProfile, MemberStats, MemberTaskRow } from "./teamTypes";
import { BORDER_WEAK, PAGE_BG, TEXT_MAIN, TEXT_SUB } from "./teamUi";
import { skillStyle } from "./teamUi";
import { getInitial } from "@/lib/utils";
import { OutlineButton, PrimaryBlue, RiskPill, SectionTitle, SmallPill, StatusPill } from "./RightPanelBits";

export default function RightPanel({
  mode,
  selected,
  selectedStats,
  selectedPerformance,
  selectedTasks,
  onOpenEdit,
  onViewTasks,
  onBackDetail,
}: {
  mode: "empty" | "detail" | "tasks";
  selected: MemberProfile | null;
  selectedStats: MemberStats | null;
  selectedPerformance: MemberPerformance | null;
  selectedTasks: MemberTaskRow[];
  onOpenEdit: () => void;
  onViewTasks: () => void;
  onBackDetail: () => void;
}) {
  const panelTitle = mode === "tasks" ? `${selected?.name || ""} 的任务` : "成员详情";
  const panelSub = mode === "empty"
    ? "请选择一名成员。选择左侧成员后，可查看成员能力标签、当前交付任务数、本月已通过数和交付表现。"
    : mode === "tasks"
      ? "查看当前交付任务参与情况和交付风险。"
      : "查看成员能力标签、交付任务参与情况与交付表现。";

  return (
    <aside
      className="shrink-0 flex flex-col"
      style={{
        width: 360,
        borderRadius: 18,
        border: `1px solid ${BORDER_WEAK}`,
        background: "#fff",
        boxShadow: "0 22px 60px rgba(15, 23, 42, 0.10)",
        overflow: "hidden",
        minHeight: 0,
      }}
    >
      <div style={{ padding: "14px 16px", background: PAGE_BG, borderBottom: `1px solid ${BORDER_WEAK}` }}>
        <div className="flex items-start justify-between gap-[10px]">
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: TEXT_MAIN }}>{panelTitle}</div>
            <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: TEXT_SUB, lineHeight: 1.6 }}>{panelSub}</div>
          </div>
          {mode === "detail" && selected && (
            <div className="flex items-center gap-[10px]">
              <OutlineButton text="编辑" onClick={onOpenEdit} />
              <PrimaryBlue text="查看任务" onClick={onViewTasks} />
            </div>
          )}
          {mode === "tasks" && (
            <OutlineButton text="返回详情" onClick={onBackDetail} />
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ padding: 16 }}>
        {mode === "empty" && (
          <div style={{ borderRadius: 16, border: `1px solid ${BORDER_WEAK}`, background: "#fff", padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: TEXT_MAIN, marginBottom: 10 }}>请选择一名成员。</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: TEXT_SUB, lineHeight: 1.8 }}>
                选择左侧成员后，可查看成员能力标签、当前交付任务数、本月已通过数和交付表现。
            </div>
          </div>
        )}

        {mode === "detail" && selected && selectedStats && selectedPerformance && (
          <>
            <div style={{ borderRadius: 16, border: `1px solid ${BORDER_WEAK}`, background: "#fff", padding: 14, marginBottom: 14 }}>
              <div className="flex items-center gap-[12px]" style={{ marginBottom: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: selected.avatar, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900 }}>
                  {getInitial(selected.name)}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: TEXT_MAIN }}>{selected.name}</div>
                  <div style={{ marginTop: 4, fontSize: 12, fontWeight: 800, color: TEXT_SUB }}>{selected.email}</div>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <SectionTitle text="角色" />
                <div style={{ fontSize: 13, fontWeight: 900, color: TEXT_MAIN }}>{selected.roleLabel}</div>
              </div>

              <SectionTitle text="能力标签" />
              <div className="flex items-center flex-wrap gap-[8px]" style={{ marginBottom: 14 }}>
                {selected.skills.map(s => {
                  const st = skillStyle(s);
                  return <SmallPill key={s} text={s} bg={st.bg} color={st.color} />;
                })}
              </div>

              <SectionTitle text="当前任务状态" />
              <div className="grid grid-cols-2 gap-[10px]" style={{ marginBottom: 14 }}>
                {[
                  { n: selectedStats.currentTasks, t: "当前交付任务" },
                  { n: selectedStats.toSubmit, t: "待提交" },
                  { n: selectedStats.waitingSignoff, t: "待需求方审核" },
                  { n: selectedStats.needFix, t: "需修改" },
                ].map(x => (
                  <div key={x.t} style={{ borderRadius: 14, border: `1px solid ${BORDER_WEAK}`, background: "#fff", padding: "12px 10px", textAlign: "left" }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: TEXT_MAIN, lineHeight: 1.1 }}>{x.n}</div>
                    <div style={{ marginTop: 4, fontSize: 11, fontWeight: 800, color: TEXT_SUB }}>{x.t}</div>
                  </div>
                ))}
              </div>

              <SectionTitle text="交付表现参考" />
              <div style={{ borderRadius: 14, border: `1px solid ${BORDER_WEAK}`, background: PAGE_BG, padding: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: TEXT_SUB, marginBottom: 10 }}>（以下为分配参考，非自动分配依据）</div>
                <div className="grid grid-cols-2 gap-[10px]">
                  {[
                    { k: "本月已通过", v: selectedStats.monthDone },
                    { k: "累计已通过", v: selectedStats.passed },
                    { k: "被退回次数", v: selectedStats.revisionCount },
                    { k: "通过率", v: `${Math.round(selectedPerformance.passRate)}%` },
                    { k: "准时率", v: `${Math.round(selectedPerformance.onTimeRate)}%` },
                    { k: "平均返工", v: `${selectedPerformance.avgRework.toFixed(1)}次` },
                  ].map(it => (
                    <div key={it.k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: TEXT_SUB }}>{it.k}</div>
                      <div style={{ fontSize: 11, fontWeight: 900, color: TEXT_MAIN }}>{it.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {mode === "tasks" && selected && (
          <div className="flex flex-col gap-[10px]">
            {selectedTasks.length === 0 ? (
              <div style={{ borderRadius: 16, border: `1px solid ${BORDER_WEAK}`, background: PAGE_BG, padding: 14, fontSize: 13, fontWeight: 800, color: TEXT_SUB }}>
                暂无任务
              </div>
            ) : (
              selectedTasks.map(t => (
                <div key={t.id} style={{ borderRadius: 16, border: `1px solid ${BORDER_WEAK}`, background: "#fff", padding: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: TEXT_MAIN, marginBottom: 10 }}>{t.title}</div>
                  <div className="flex items-center flex-wrap gap-[8px]">
                    <StatusPill status={t.statusLabel} />
                    <RiskPill risk={t.riskLabel} />
                    <SmallPill text={t.deliverables} bg="#fff" color={TEXT_SUB} />
                    <SmallPill text={`承诺交付时间：${t.dueLabel}`} bg="#fff" color={TEXT_SUB} />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
