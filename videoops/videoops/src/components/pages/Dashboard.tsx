"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { USERS } from "@/lib/mock-data";
import {
  getKeyProjects,
  getMonthlyWorkbenchSummary,
  getRecentRisks,
  getStudioSuggestion,
  getTeamTaskDistribution,
  type WorkbenchKeyProject,
  type WorkflowData,
} from "@/lib/workflowSelectors";

const PAGE_BG = "#f6f7fb";
const TEXT_MAIN = "#0f172a";
const TEXT_SUB = "#667085";
const BORDER = "#e5e7eb";
const BORDER_WEAK = "#eef1f6";
const BRAND_RED = "#ef4444";
const BLUE = "#2563eb";
const GOLD = "#c8a30a";
const GREEN = "#16a34a";
const CARD_SHADOW = "0 20px 60px rgba(15, 23, 42, 0.08)";
const RADIUS = 22;

function Card({
  children,
  padding = "18px 18px",
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
        background: "#fff",
        border: `1px solid ${BORDER_WEAK}`,
        boxShadow: CARD_SHADOW,
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function MetricIcon({
  children,
  color,
  background,
}: {
  children: React.ReactNode;
  color: string;
  background: string;
}) {
  return (
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: 14,
        background,
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon,
  accent = false,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <Card
      padding="20px 20px"
      style={{
        minHeight: 208,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: accent
          ? "linear-gradient(135deg, #bc315d 0%, #7a56d3 50%, #3b67d9 100%)"
          : "#fff",
        color: accent ? "#fff" : TEXT_MAIN,
        border: accent ? "1px solid rgba(255,255,255,0.16)" : `1px solid ${BORDER_WEAK}`,
        boxShadow: accent ? "0 18px 46px rgba(79, 70, 229, 0.18)" : CARD_SHADOW,
      }}
    >
      {accent ? (
        <>
          <div
            style={{
              position: "absolute",
              right: -72,
              top: -72,
              width: 156,
              height: 156,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 28,
              bottom: -90,
              width: 170,
              height: 170,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
              pointerEvents: "none",
            }}
          />
        </>
      ) : null}

      <div className="flex items-start justify-between gap-[12px]" style={{ position: "relative" }}>
        <div style={{ fontSize: 14, fontWeight: 900, lineHeight: 1.5, color: accent ? "#fff" : TEXT_MAIN }}>{title}</div>
        {icon}
      </div>

      <div style={{ position: "relative", marginTop: 22, marginBottom: 18 }}>
        <div
          style={{
            fontSize: 42,
            fontWeight: 950,
            lineHeight: 1,
            letterSpacing: "-0.02em",
            color: accent ? "#fff" : TEXT_MAIN,
          }}
        >
          {value}
        </div>
      </div>

      <div
        style={{
          position: "relative",
          fontSize: 12,
          fontWeight: 850,
          lineHeight: 1.8,
          color: accent ? "rgba(255,255,255,0.88)" : TEXT_SUB,
        }}
      >
        {description}
      </div>
    </Card>
  );
}

function formatMonthDay(dateText: string | null | undefined) {
  if (!dateText) return { month: "-", day: "-" };
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return { month: "-", day: "-" };
  return {
    month: `${date.getMonth() + 1}月`,
    day: String(date.getDate()).padStart(2, "0"),
  };
}

function AvatarBubble({ text, color }: { text: string; color: string }) {
  return (
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: "50%",
        background: color,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        fontWeight: 900,
        border: "2px solid rgba(255,255,255,0.95)",
        boxShadow: "0 10px 24px rgba(15,23,42,0.16)",
      }}
    >
      {text}
    </div>
  );
}

function StatusPill({ text }: { text: "制作中" | "待验收" | "已完成" | "已取消" }) {
  const styles =
    text === "制作中"
      ? { color: BLUE, bg: "rgba(37,99,235,0.10)" }
      : text === "待验收"
        ? { color: "#f59e0b", bg: "rgba(245,158,11,0.14)" }
        : text === "已完成"
          ? { color: GREEN, bg: "rgba(22,163,74,0.10)" }
          : { color: "#64748b", bg: "rgba(148,163,184,0.22)" };
  return (
    <span
      style={{
        height: 28,
        padding: "0 12px",
        borderRadius: 999,
        background: styles.bg,
        color: styles.color,
        fontSize: 12,
        fontWeight: 950,
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {text}
    </span>
  );
}

type FocusProjectCard = {
  projectId: string;
  displayTitle: string;
  brandDemand: string;
  status: "制作中" | "待验收" | "已完成" | "已取消";
  avatars: Array<{ text: string; color: string }>;
  progress: number;
  progressText: string;
  riskText: string;
  barColor: string;
};

function FocusProjectPanel({
  card,
  onOpen,
}: {
  card: FocusProjectCard;
  onOpen?: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen?.();
        }
      }}
      style={{
        borderRadius: 24,
        background: "#fff",
        border: `1px solid ${BORDER_WEAK}`,
        boxShadow: "0 18px 50px rgba(15, 23, 42, 0.06)",
        padding: "18px 18px 14px",
        position: "relative",
        overflow: "hidden",
        cursor: onOpen ? "pointer" : "default",
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: card.barColor }} />
      <div className="flex items-start justify-between gap-[14px]">
        <div className="min-w-0">
          <div style={{ fontSize: 15, fontWeight: 950, color: TEXT_MAIN, lineHeight: 1.4 }}>{card.displayTitle}</div>
          <div style={{ marginTop: 8, fontSize: 12, fontWeight: 850, color: TEXT_SUB }}>{card.brandDemand}</div>
        </div>
        <StatusPill text={card.status} />
      </div>

      <div className="flex items-center justify-between" style={{ marginTop: 16 }}>
        <div className="flex items-center" style={{ marginLeft: -2 }}>
          {card.avatars.length ? (
            card.avatars.slice(0, 3).map((avatar, idx) => (
              <div key={`${avatar.text}-${idx}`} style={{ marginLeft: idx === 0 ? 0 : -10 }}>
                <AvatarBubble text={avatar.text} color={avatar.color} />
              </div>
            ))
          ) : (
            <AvatarBubble text="—" color="#94a3b8" />
          )}
        </div>
        <div className="flex items-center gap-[16px]" style={{ fontSize: 12, fontWeight: 850, color: "#64748b" }}>
          <span>{card.progressText}</span>
          <span>{card.riskText}</span>
        </div>
      </div>

      <div style={{ marginTop: 14, height: 4, borderRadius: 999, background: "#e9edf5", overflow: "hidden" }}>
        <div style={{ width: `${card.progress}%`, height: "100%", borderRadius: 999, background: card.barColor }} />
      </div>
    </div>
  );
}

export default function Dashboard({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { tasks, questionnaires, reviews, submissions, projects, typeTaskPackages, signoffRecords } = useStore();
  const [toast, setToast] = useState<string | null>(null);
  const [showMetricDrawer, setShowMetricDrawer] = useState(false);

  const showToast = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(null), 2200);
  };

  const workflowData = useMemo<WorkflowData>(() => ({
    tasks,
    questionnaires,
    submissions,
    reviews,
    projects,
    typeTaskPackages,
    signoffRecords,
  }), [projects, questionnaires, reviews, signoffRecords, submissions, tasks, typeTaskPackages]);

  const monthlySummary = useMemo(() => getMonthlyWorkbenchSummary(workflowData, new Date()), [workflowData]);

  const keyProjects = useMemo(() => getKeyProjects(workflowData, { now: new Date(), limit: 6 }), [workflowData]);
  const recentRisks = useMemo(() => getRecentRisks(workflowData, { now: new Date(), windowDays: 7, limitPerType: 3 }), [workflowData]);
  const studioSuggestion = useMemo(() => getStudioSuggestion(workflowData, { now: new Date() }), [workflowData]);
  const teamDistribution = useMemo(() => getTeamTaskDistribution(workflowData), [workflowData]);

  const focusProjects = useMemo<FocusProjectCard[]>(() => {
    const toCard = (p: WorkbenchKeyProject): FocusProjectCard => {
      const assignees = p.assigneeIds
        .map(id => USERS.find(u => u.id === id) || null)
        .filter(Boolean);
      const avatars = assignees.map(user => ({
        text: user?.name?.charAt(0) || "—",
        color: user?.avatar || "#94a3b8",
      }));
      const brandDemand = [p.brand, p.stakeholder].filter(x => x && x !== "-").join(" · ") || "-";
      return {
        projectId: p.projectId,
        displayTitle: p.projectName,
        brandDemand,
        status: p.projectStatus,
        avatars,
        progress: p.stageProgress,
        progressText: p.progressText,
        riskText: p.riskText,
        barColor: p.barColor,
      };
    };

    return keyProjects.map(toCard);
  }, [keyProjects]);

  const internalRiskItems = useMemo(() => {
    return recentRisks.internal.map(item => {
      const date = formatMonthDay(item.dueDate);
      return {
        taskId: item.taskId,
        title: item.title,
        month: date.month,
        day: date.day,
        note: item.note,
      };
    });
  }, [recentRisks.internal]);

  const externalRiskItems = useMemo(() => {
    return recentRisks.external.map(item => {
      const date = formatMonthDay(item.dueDate);
      return {
        taskId: item.taskId,
        title: item.title,
        month: date.month,
        day: date.day,
        note: item.note,
      };
    });
  }, [recentRisks.external]);

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: PAGE_BG, padding: "22px 28px 30px" }}>
      <div className="flex items-center justify-end" style={{ marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => setShowMetricDrawer(true)}
          style={{
            background: "#fff",
            border: `1px solid ${BORDER_WEAK}`,
            borderRadius: 999,
            height: 32,
            padding: "0 12px",
            fontSize: 12,
            fontWeight: 950,
            color: TEXT_SUB,
            cursor: "pointer",
            boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
          }}
        >
          指标说明
        </button>
      </div>
      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
          alignItems: "stretch",
        }}
      >
        <MetricCard
          title="待分配 Brief"
          value={monthlySummary.pendingDispatchCount}
          description="当前仍有 Brief 等待项目管理员分配交付任务。"
          accent
          icon={(
            <MetricIcon color="#fff" background="rgba(255,255,255,0.16)">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 3h8l4 4v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
                <path d="M15 3v4h4" />
                <path d="M9 13h6" />
                <path d="M9 17h4" />
              </svg>
            </MetricIcon>
          )}
        />

        <MetricCard
          title="制作中项目"
          value={monthlySummary.inProgressProjectCount}
          description="当前仍有项目存在未通过的交付任务。"
          icon={(
            <MetricIcon color={BRAND_RED} background="rgba(239,68,68,0.10)">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 6v6l4 2" />
                <circle cx="12" cy="12" r="8" />
              </svg>
            </MetricIcon>
          )}
        />

        <MetricCard
          title="待需求方审核"
          value={monthlySummary.waitingSignoffPackageCount}
          description="等待需求方 Sign-off 反馈。"
          icon={(
            <MetricIcon color="#c8a30a" background="rgba(245,158,11,0.14)">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="5" width="14" height="14" />
              </svg>
            </MetricIcon>
          )}
        />

        <MetricCard
          title="需修改交付任务"
          value={monthlySummary.revisionPackageCount}
          description="需根据需求方反馈重新提交。"
          icon={(
            <MetricIcon color={BLUE} background="rgba(37,99,235,0.10)">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </MetricIcon>
          )}
        />
      </div>

      <div className="grid" style={{ gridTemplateColumns: "minmax(0,1.85fr) 360px", gap: 18, marginTop: 18, alignItems: "start" }}>
        <div className="min-w-0">
          <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 950, color: TEXT_MAIN }}>重点项目跟进</div>
            <button
              type="button"
              onClick={() => onNavigate?.("tasks")}
              style={{ background: "none", border: "none", color: BRAND_RED, fontSize: 12, fontWeight: 950, cursor: "pointer" }}
            >
              查看全部项目
            </button>
          </div>

          <div className="flex flex-col" style={{ gap: 14 }}>
            {focusProjects.length === 0 ? (
              <Card padding="18px 18px" style={{ borderStyle: "dashed", boxShadow: "none", background: "rgba(255,255,255,0.7)" }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: TEXT_SUB }}>暂无需要重点关注的项目</div>
              </Card>
            ) : (
              focusProjects.map(card => (
                <FocusProjectPanel
                  key={card.projectId}
                  card={card}
                  onOpen={() => onNavigate?.(`tasks?open=${encodeURIComponent(card.projectId)}`)}
                />
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col" style={{ gap: 14 }}>
          <Card padding="14px 14px" style={{ background: "linear-gradient(180deg, rgba(82,110,255,0.08) 0%, rgba(82,110,255,0.03) 100%)" }}>
            <div style={{ fontSize: 14, fontWeight: 950, color: TEXT_MAIN }}>近期风险</div>
            <div style={{ marginTop: 10, fontSize: 12, fontWeight: 900, color: TEXT_SUB }}>承诺交付时间</div>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
              {internalRiskItems.map(item => (
                <div
                  key={item.taskId}
                  role="button"
                  tabIndex={0}
                  onClick={() => onNavigate?.(`tasks?open=${encodeURIComponent(item.taskId)}`)}
                  onKeyDown={event => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onNavigate?.(`tasks?open=${encodeURIComponent(item.taskId)}`);
                    }
                  }}
                  style={{ display: "flex", gap: 12, padding: "10px 10px", borderRadius: 16, background: "rgba(255,255,255,0.88)", border: `1px solid ${BORDER_WEAK}`, cursor: "pointer" }}
                >
                  <div style={{ width: 46, height: 46, borderRadius: 16, background: "#fff", border: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 950, color: "#94a3b8" }}>{item.month}</div>
                    <div style={{ marginTop: 1, fontSize: 14, fontWeight: 950, color: TEXT_MAIN }}>{item.day}</div>
                  </div>
                  <div className="min-w-0">
                    <div style={{ fontSize: 13, fontWeight: 950, color: TEXT_MAIN, lineHeight: 1.5 }}>{item.title}</div>
                    <div style={{ marginTop: 4, fontSize: 12, fontWeight: 800, color: TEXT_SUB }}>{item.note}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, fontSize: 12, fontWeight: 900, color: TEXT_SUB }}>审核与修改</div>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
              {externalRiskItems.map(item => (
                <div
                  key={`${item.taskId}-external`}
                  role="button"
                  tabIndex={0}
                  onClick={() => onNavigate?.(`tasks?open=${encodeURIComponent(item.taskId)}`)}
                  onKeyDown={event => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onNavigate?.(`tasks?open=${encodeURIComponent(item.taskId)}`);
                    }
                  }}
                  style={{ display: "flex", gap: 12, padding: "10px 10px", borderRadius: 16, background: "rgba(255,255,255,0.88)", border: `1px solid ${BORDER_WEAK}`, cursor: "pointer" }}
                >
                  <div style={{ width: 46, height: 46, borderRadius: 16, background: "#fff", border: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 950, color: "#94a3b8" }}>{item.month}</div>
                    <div style={{ marginTop: 1, fontSize: 14, fontWeight: 950, color: TEXT_MAIN }}>{item.day}</div>
                  </div>
                  <div className="min-w-0">
                    <div style={{ fontSize: 13, fontWeight: 950, color: TEXT_MAIN, lineHeight: 1.5 }}>{item.title}</div>
                    <div style={{ marginTop: 4, fontSize: 12, fontWeight: 800, color: TEXT_SUB }}>{item.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="18px 18px" style={{ background: "linear-gradient(180deg, rgba(255,233,233,0.72) 0%, rgba(255,243,243,0.88) 100%)", position: "relative", overflow: "hidden" }}>
            <div style={{ fontSize: 14, fontWeight: 950, color: TEXT_MAIN }}>工作室建议</div>
            <div style={{ marginTop: 12, fontSize: 12, fontWeight: 850, color: TEXT_SUB, lineHeight: 1.9, maxWidth: 270 }}>
              {studioSuggestion}
            </div>
            <button
              type="button"
              onClick={() =>
                showToast(
                  `待分配 Brief ${monthlySummary.pendingDispatchCount} 个 · 待需求方审核 ${monthlySummary.waitingSignoffPackageCount} 个 · 需修改 ${monthlySummary.revisionPackageCount} 个 · 风险提醒 ${recentRisks.internalCount + recentRisks.externalCount} 个`
                )
              }
              style={{ marginTop: 18, background: "none", border: "none", color: BRAND_RED, fontSize: 12, fontWeight: 950, cursor: "pointer", padding: 0 }}
            >
              查看处理建议 →
            </button>
            <div style={{ position: "absolute", right: 18, bottom: 18, width: 46, height: 46, borderRadius: "50%", background: "#ef4444", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 18px 40px rgba(239,68,68,0.28)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />
              </svg>
            </div>
          </Card>

          <Card padding="18px 18px" style={{ background: "linear-gradient(180deg, #1f2942 0%, #202843 100%)", borderColor: "rgba(148,163,184,0.15)", boxShadow: "0 24px 70px rgba(2,6,23,0.42)" }}>
            <div className="flex items-center justify-between">
              <div style={{ fontSize: 14, fontWeight: 950, color: "#f8fafc" }}>团队任务分布</div>
              <div style={{ fontSize: 12, fontWeight: 950, color: "rgba(248,250,252,0.88)" }}>{monthlySummary.monthLabel}</div>
            </div>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
              {teamDistribution.map(item => (
                <div key={item.label}>
                  <div className="flex items-center justify-between">
                    <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(248,250,252,0.92)" }}>{item.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 950, color: "#fff" }}>{item.count} 个交付任务</div>
                  </div>
                  <div style={{ marginTop: 8, height: 5, borderRadius: 999, background: "rgba(148,163,184,0.18)", overflow: "hidden" }}>
                    <div style={{ width: `${Math.round(item.ratio * 100)}%`, height: "100%", borderRadius: 999, background: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {showMetricDrawer ? (
        <div style={{ position: "fixed", inset: 0, zIndex: 90 }}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => setShowMetricDrawer(false)}
            onKeyDown={e => {
              if (e.key === "Escape") setShowMetricDrawer(false);
            }}
            style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.35)" }}
          />
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: 420,
              background: "#fff",
              borderLeft: `1px solid ${BORDER}`,
              boxShadow: "0 20px 60px rgba(15, 23, 42, 0.18)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div className="flex items-center justify-between" style={{ padding: "18px 18px", borderBottom: `1px solid ${BORDER_WEAK}` }}>
              <div style={{ fontSize: 14, fontWeight: 950, color: TEXT_MAIN }}>工作台指标说明</div>
              <button
                type="button"
                onClick={() => setShowMetricDrawer(false)}
                style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${BORDER_WEAK}`, background: "#fff", cursor: "pointer", color: TEXT_SUB }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div style={{ padding: "14px 18px 18px", overflowY: "auto" }}>
              {[
                { title: "本月概况", desc: "本页面默认统计本月数据，所有“本月完成”“较上月变化”等指标均以自然月为周期。" },
                  { title: "待分配 Brief", desc: "统计已提交但尚未转为项目的 Brief 数量。" },
                  { title: "制作中项目数", desc: "统计当前项目状态为“制作中”的项目数量。" },
                  { title: "待需求方审核", desc: "统计交付任务已提交、正在等待需求方 Sign-off 的数量。" },
                  { title: "需修改交付任务", desc: "统计已被需求方退回、需要执行成员重新提交的交付任务数量。" },
                  { title: "重点项目跟进", desc: "展示需修改、临近承诺时间、待需求方审核较久或多类型未全部通过的项目。" },
                { title: "项目卡片进度条", desc: "进度条表示项目阶段进度，不表示实际制作完成度，也不表示时间消耗比例。" },
                  { title: "近期风险", desc: "围绕承诺交付时间、需求方退回与待需求方审核超时进行提醒。" },
                  { title: "交付时间风险", desc: "交付任务临近或超过承诺交付时间，且尚未通过时会进入提醒范围。" },
                  { title: "审核与修改风险", desc: "需求方退回、待需求方审核过久或项目仍有未通过交付任务时会进入提醒范围。" },
                  { title: "工作室建议", desc: "系统会根据待分配 Brief、需修改、待需求方审核与承诺时间风险自动生成建议。" },
                  { title: "团队任务分布", desc: "按交付任务的交付物类型统计当前任务分布，例如平面设计、文案、视频、3D 等。" },
              ].map(item => (
                <div key={item.title} style={{ padding: "12px 12px", border: `1px solid ${BORDER_WEAK}`, borderRadius: 16, background: "#fff", boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)", marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 950, color: TEXT_MAIN }}>{item.title}</div>
                  <div style={{ marginTop: 6, fontSize: 12, fontWeight: 850, color: TEXT_SUB, lineHeight: 1.7 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div style={{ position: "fixed", left: 24 + 260, bottom: 18, zIndex: 80 }}>
          <div style={{ borderRadius: 999, background: "rgba(15, 23, 42, 0.92)", color: "#fff", padding: "10px 14px", fontSize: 12, fontWeight: 950, boxShadow: "0 18px 50px rgba(15, 23, 42, 0.24)" }}>
            {toast}
          </div>
        </div>
      ) : null}
    </div>
  );
}
