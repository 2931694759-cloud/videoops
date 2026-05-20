"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { USERS } from "@/lib/mock-data";
import { daysBetweenMs, nowIso, nowMs, toMs, ymdSlash, yearMonthFromMs } from "@/lib/runtime";
import { getLatestTypeTaskPackageSubmission, getTypeTaskPackageSignoffHistory } from "@/lib/workflowSelectors";

const BRAND_RED = "#e74c3c";
const CARD = {
  backgroundColor: "#ffffff",
  border: "1px solid #e8e8ec",
  borderRadius: 18,
};

function getQuarter(dateStr: string): string {
  const ms = toMs(dateStr);
  const m = Number.isNaN(ms) ? 0 : yearMonthFromMs(ms).month;
  if (m < 3) return "Q1";
  if (m < 6) return "Q2";
  if (m < 9) return "Q3";
  return "Q4";
}

export default function PortfolioPage({ initialMemberId }: { initialMemberId?: string }) {
  const { projects, typeTaskPackages, signoffRecords, submissions } = useStore();
  const members = USERS.filter(u => u.role === "MEMBER");
  const [selectedMember, setSelectedMember] = useState(() => {
    if (initialMemberId && members.some(m => m.id === initialMemberId)) return initialMemberId;
    return members[0]?.id || "";
  });
  const [selectedQuarter, setSelectedQuarter] = useState(() => {
    const now = yearMonthFromMs(nowMs());
    const q = now.month < 3 ? "Q1" : now.month < 6 ? "Q2" : now.month < 9 ? "Q3" : "Q4";
    return `${now.year} ${q}`;
  });
  const [toast, setToast] = useState("");
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  const memberDept: Record<string, string> = {
    u3: "平面设计组",
    u4: "视频创意组",
    u5: "视频创意组",
    u6: "内容创意组",
  };

  const forcedMemberId = useMemo(() => {
    if (!initialMemberId) return null;
    if (!members.some(m => m.id === initialMemberId)) return null;
    return initialMemberId;
  }, [initialMemberId, members]);

  const effectiveSelectedMember = forcedMemberId || selectedMember;
  const selectedMemberObj = members.find(m => m.id === effectiveSelectedMember) || null;

  const quarterParts = selectedQuarter.split(" ");
  const selectedYear = Number(quarterParts[0]) || new Date(nowIso()).getFullYear();
  const selectedQ = quarterParts[1] || "Q2";

  const completedTasks = useMemo(() => {
    const projectById = new Map(projects.map(project => [project.id, project] as const));
    return typeTaskPackages
      .filter(pkg => pkg.assigneeId === effectiveSelectedMember && pkg.status === "已通过")
      .map(pkg => {
        const project = projectById.get(pkg.projectId) || null;
        const latestPass = getTypeTaskPackageSignoffHistory(pkg.id, signoffRecords).find(record => record.result === "passed") || null;
        const latestSubmission = getLatestTypeTaskPackageSubmission(pkg.id, submissions);
        const passedAt = latestPass?.reviewedAt || project?.completedAt || pkg.updatedAt || null;
        return {
          id: pkg.id,
          projectId: pkg.projectId,
          projectName: project?.projectName || "未命名项目",
          projectCode: project?.projectCode || pkg.projectId,
          brandTeam: project?.brandTeam || "—",
          deliverableType: pkg.deliverableType,
          deliverableCount: pkg.deliverableItems.length,
          version: pkg.currentVersion || latestSubmission?.version || "V1",
          fileLink: pkg.fileLinks[0] || latestSubmission?.fileLinks?.[0] || latestSubmission?.link || null,
          passedAt,
          assigneeName: pkg.assigneeName || "—",
          createdAt: pkg.createdAt,
          updatedAt: pkg.updatedAt,
        };
      })
      .filter(item => {
        const ms = toMs(item.passedAt);
        if (Number.isNaN(ms)) return false;
        const ym = yearMonthFromMs(ms);
        return ym.year === selectedYear && getQuarter(item.passedAt!) === selectedQ;
      })
      .sort((a, b) => String(b.passedAt || "").localeCompare(String(a.passedAt || "")));
  }, [effectiveSelectedMember, projects, selectedQ, selectedYear, signoffRecords, submissions, typeTaskPackages]);

  const leadtimeDaysOf = (createdAt: string, passedAt: string) => {
    const a = toMs(createdAt);
    const b = toMs(passedAt);
    if (Number.isNaN(a) || Number.isNaN(b)) return 0;
    return Math.max(1, Math.abs(daysBetweenMs(a, b)));
  };

  const handleExport = () => {
    const chosen = completedTasks.filter(t => (selectedIds[t.id] ?? true));
    if (chosen.length === 0) {
      setToast("请至少选择一个作品页再导出。");
      window.setTimeout(() => setToast(""), 2500);
      return;
    }
    const name = selectedMemberObj?.name || "成员";
    setToast(`已导出${name}的成员季度作品集，共 ${chosen.length} 个作品页。`);
    window.setTimeout(() => setToast(""), 2500);
  };

  const handlePreview = () => {
    const name = selectedMemberObj?.name || "成员";
    setToast(`正在预览${name}的成员季度作品集 PPT。`);
    window.setTimeout(() => setToast(""), 2500);
  };

  const openLinkToast = (label: "文件链接" | "审核记录") => {
    setToast(`正在打开${label}链接（模拟）。`);
    window.setTimeout(() => setToast(""), 2500);
  };

  const selectStyle = {
    height: 38, padding: "0 12px",
    backgroundColor: "#ffffff", border: "1px solid #d0d0d6",
    borderRadius: 10, fontSize: 13, color: "#1a1a2e", outline: "none",
  };

  const quarters = useMemo(() => {
    const y = selectedYear || new Date(nowIso()).getFullYear();
    return [`${y} Q1`, `${y} Q2`, `${y} Q3`, `${y} Q4`];
  }, [selectedYear]);

  const selectedTasks = completedTasks.filter(t => (selectedIds[t.id] ?? true));
  const totalDeliverables = selectedTasks.reduce((acc, t) => acc + t.deliverableCount, 0);
  const toggleAllLabel = completedTasks.length > 0 && selectedTasks.length === completedTasks.length ? "取消全选" : "全选作品";

  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: "26px 40px 40px" }}>
      <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.7, marginBottom: 18, maxWidth: 980 }}>
        系统根据成员已通过的交付任务自动生成作品集。每个作品页固定包含项目名称、品牌 / 团队、交付物类型、当前版本、文件链接与通过时间，页面内仅选择是否纳入本次导出。
      </div>

      <div style={{ ...CARD, padding: "18px 20px", marginBottom: 18 }}>
        <div className="flex items-center gap-[18px]" style={{ flexWrap: "wrap" }}>
          <div style={{ minWidth: 240 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#8a8a96", marginBottom: 6 }}>成员</div>
            <select value={effectiveSelectedMember} disabled={Boolean(forcedMemberId)} onChange={e => setSelectedMember(e.target.value)} style={{ ...selectStyle, width: "100%" }}>
              {members.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} · {memberDept[u.id] || "成员"}
                </option>
              ))}
            </select>
          </div>
          <div style={{ minWidth: 180 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#8a8a96", marginBottom: 6 }}>季度</div>
            <select value={selectedQuarter} onChange={e => setSelectedQuarter(e.target.value)} style={{ ...selectStyle, width: "100%" }}>
              {quarters.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>

          <div className="flex-1" style={{ minWidth: 320, fontSize: 12, color: "#8a8a96", lineHeight: 1.6, paddingTop: 18 }}>
            作品范围为当前成员在所选季度内已通过的交付任务；归属按交付任务负责人计算，不在此页面编辑。
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-[14px]" style={{ marginBottom: 18 }}>
        <div style={{ ...CARD, padding: "16px 18px" }}>
          <div style={{ fontSize: 12, color: "#8a8a96", fontWeight: 800 }}>已通过交付任务</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#111827", marginTop: 8 }}>{completedTasks.length}</div>
          <div style={{ fontSize: 12, color: "#8a8a96", marginTop: 6 }}>当前季度内自动纳入候选范围</div>
        </div>
        <div style={{ ...CARD, padding: "16px 18px" }}>
          <div style={{ fontSize: 12, color: "#8a8a96", fontWeight: 800 }}>已选作品页</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#111827", marginTop: 8 }}>{selectedTasks.length}</div>
          <div style={{ fontSize: 12, color: "#8a8a96", marginTop: 6 }}>将进入本次 PPT 导出</div>
        </div>
        <div style={{ ...CARD, padding: "16px 18px" }}>
          <div style={{ fontSize: 12, color: "#8a8a96", fontWeight: 800 }}>交付物总数</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#111827", marginTop: 8 }}>{totalDeliverables}</div>
          <div style={{ fontSize: 12, color: "#8a8a96", marginTop: 6 }}>所选作品页的交付物合计</div>
        </div>
      </div>

      <div className="flex gap-[18px] items-start">
        <div className="flex-1 min-w-0">
          <div style={{ ...CARD, padding: "18px 18px", marginBottom: 18 }}>
            <div className="flex items-start justify-between gap-[16px]" style={{ marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 900, color: "#111827" }}>已通过交付任务</div>
                <div style={{ fontSize: 12, color: "#8a8a96", marginTop: 6 }}>勾选需要进入本次季度作品集的作品页</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (completedTasks.length === 0) return;
                  const allSelected = completedTasks.every(t => (selectedIds[t.id] ?? true));
                  setSelectedIds(() => {
                    const next: Record<string, boolean> = {};
                    for (const t of completedTasks) next[t.id] = !allSelected;
                    return next;
                  });
                }}
                style={{ height: 34, padding: "0 14px", borderRadius: 10, border: "1px solid #e8e8ec", background: "#ffffff", color: "#111827", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#ffffff")}
              >
                {toggleAllLabel}
              </button>
            </div>

            {completedTasks.length === 0 ? (
              <div style={{ padding: "56px 0", textAlign: "center" }}>
                <div style={{ fontSize: 13, color: "#8a8a96" }}>该成员在 {selectedQuarter} 暂无已通过交付任务</div>
              </div>
            ) : (
              <div className="flex flex-col" style={{ gap: 12 }}>
                {completedTasks.map(task => {
                  const checked = selectedIds[task.id] ?? true;
                  const code = task.projectCode;
                  const completed = task.passedAt ? ymdSlash(task.passedAt) : "-";
                  const lead = task.passedAt ? leadtimeDaysOf(task.createdAt, task.passedAt) : 0;

                  return (
                    <div
                      key={task.id}
                      className="transition-all duration-150"
                      style={{ borderRadius: 16, border: checked ? `1px solid rgba(231,76,60,0.30)` : "1px solid #eef1f6", background: "#ffffff", padding: "14px 14px" }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 10px 28px rgba(15, 23, 42, 0.06)"; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}
                    >
                      <div className="flex items-start gap-[12px]">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedIds(prev => {
                              const current = prev[task.id] ?? true;
                              return { ...prev, [task.id]: !current };
                            })
                          }
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 4,
                            border: checked ? "none" : "1px solid #d0d0d6",
                            background: checked ? BRAND_RED : "#ffffff",
                            marginTop: 3,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                          aria-pressed={checked}
                        >
                          {checked ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : null}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div style={{ fontSize: 14, fontWeight: 900, color: "#111827", lineHeight: 1.5 }}>{task.projectName}</div>
                          <div style={{ fontSize: 12, color: "#8a8a96", marginTop: 4, lineHeight: 1.5 }}>
                            {task.brandTeam} · {code} · 通过时间：{completed}
                          </div>

                          <div className="flex flex-wrap items-center gap-[10px]" style={{ marginTop: 10, fontSize: 12, color: "#111827" }}>
                            <span style={{ padding: "6px 10px", borderRadius: 999, background: "#f5f5f7", border: "1px solid #eef1f6", fontWeight: 800 }}>类型：{task.deliverableType}</span>
                            <span style={{ padding: "6px 10px", borderRadius: 999, background: "#f5f5f7", border: "1px solid #eef1f6", fontWeight: 800 }}>交付物：{task.deliverableCount}</span>
                            <span style={{ padding: "6px 10px", borderRadius: 999, background: "#f5f5f7", border: "1px solid #eef1f6", fontWeight: 800 }}>Leadtime：{lead} 天</span>
                            <span style={{ padding: "6px 10px", borderRadius: 999, background: "#ffffff", border: "1px solid #eef1f6", fontWeight: 800 }}>
                              文件链接：{" "}
                              <button type="button" onClick={() => openLinkToast("文件链接")} style={{ color: BRAND_RED, fontWeight: 900, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                                查看
                              </button>
                            </span>
                            <span style={{ padding: "6px 10px", borderRadius: 999, background: "#ffffff", border: "1px solid #eef1f6", fontWeight: 800 }}>
                              审核记录：{" "}
                              <button type="button" onClick={() => openLinkToast("审核记录")} style={{ color: BRAND_RED, fontWeight: 900, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                                查看
                              </button>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div style={{ width: 420, position: "sticky", top: 84 }}>
          <div style={{ borderRadius: 18, background: "linear-gradient(135deg, #0f172a 0%, #1f2a44 100%)", color: "#ffffff", padding: "18px 18px", boxShadow: "0 22px 60px rgba(15, 23, 42, 0.16)", marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: "-0.2px" }}>
              {(selectedMemberObj?.name || "成员")} · {selectedQuarter} 成员季度作品集
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
              {(memberDept[effectiveSelectedMember] || "—")} · {selectedTasks.length} 个作品页将进入导出文件。
            </div>
            <div className="flex items-center gap-[10px]" style={{ marginTop: 14 }}>
              <button
                type="button"
                onClick={handlePreview}
                style={{ height: 38, padding: "0 14px", borderRadius: 12, background: "#ffffff", color: "#0f172a", border: "1px solid rgba(255,255,255,0.18)", fontSize: 13, fontWeight: 900, cursor: "pointer" }}
              >
                预览 PPT
              </button>
              <button
                type="button"
                onClick={handleExport}
                style={{ height: 38, padding: "0 14px", borderRadius: 12, background: BRAND_RED, color: "#ffffff", border: "none", fontSize: 13, fontWeight: 900, cursor: "pointer", boxShadow: "0 8px 20px rgba(231,76,60,0.28)" }}
              >
                导出 PPT
              </button>
            </div>
          </div>

          <div style={{ ...CARD, padding: "16px 16px" }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#111827" }}>PPT 页面预览</div>
            <div style={{ fontSize: 12, color: "#8a8a96", marginTop: 6 }}>封面 · 摘要概览 · 项目页</div>

            <div className="flex flex-col" style={{ gap: 10, marginTop: 12 }}>
              <div style={{ borderRadius: 14, border: "1px solid #eef1f6", background: "#ffffff", padding: "10px 12px", display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 36, height: 28, borderRadius: 10, background: "#f5f5f7", border: "1px solid #eef1f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", fontWeight: 900, fontSize: 12 }}>封面</div>
                <div className="min-w-0">
                  <div style={{ fontSize: 13, fontWeight: 900, color: "#111827" }}>{selectedMemberObj?.name || "成员"} 成员季度作品集</div>
                  <div style={{ fontSize: 12, color: "#8a8a96", marginTop: 2 }}>{selectedQuarter}</div>
                </div>
              </div>
              <div style={{ borderRadius: 14, border: "1px solid #eef1f6", background: "#ffffff", padding: "10px 12px", display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 36, height: 28, borderRadius: 10, background: "#f5f5f7", border: "1px solid #eef1f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", fontWeight: 900, fontSize: 12 }}>摘要</div>
                <div className="min-w-0">
                  <div style={{ fontSize: 13, fontWeight: 900, color: "#111827" }}>季度成果概览</div>
                  <div style={{ fontSize: 12, color: "#8a8a96", marginTop: 2 }}>已选 {selectedTasks.length} · 已通过 {completedTasks.length} · 交付物 {totalDeliverables}</div>
                </div>
              </div>

              {selectedTasks.map((t, idx) => {
                const p = idx + 3;
                const lead = t.passedAt ? leadtimeDaysOf(t.createdAt, t.passedAt) : 0;
                return (
                  <div key={t.id} style={{ borderRadius: 14, border: "1px solid #eef1f6", background: "#ffffff", padding: "10px 12px", display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ width: 36, height: 28, borderRadius: 10, background: "#f5f5f7", border: "1px solid #eef1f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", fontWeight: 900, fontSize: 12 }}>{`P${p}`}</div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate" style={{ fontSize: 13, fontWeight: 900, color: "#111827" }}>{t.projectName}</div>
                      <div className="truncate" style={{ fontSize: 12, color: "#8a8a96", marginTop: 2 }}>
                        {t.brandTeam} · {t.deliverableType} · 交付物 {t.deliverableCount} · Leadtime {lead} 天 · 文件链接 · 审核记录
                      </div>
                    </div>
                  </div>
                );
              })}

              {selectedTasks.length === 0 && (
                <div style={{ padding: "18px 0", textAlign: "center", color: "#8a8a96", fontSize: 12 }}>
                  勾选至少一个作品页后，将在此展示导出页面清单。
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)", padding: "12px 28px", borderRadius: 10, background: "#1a1a2e", color: "#fff", fontSize: 13, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 999, animation: "fadeUp .3s ease" }}>
          {toast}
          <style>{`@keyframes fadeUp{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
        </div>
      )}
    </div>
  );
}
