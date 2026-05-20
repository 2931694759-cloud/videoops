"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import ProjectGanttModal from "@/components/pages/ProjectGanttModal";
import { useStore } from "@/lib/store";
import { USERS, type Notification, type ProjectRecord, type Questionnaire, type Task, type TypeTaskPackage } from "@/lib/mock-data";
import { getInitial } from "@/lib/utils";
import {
  getAssigneeAvatarGroup,
  getProjectGanttRows,
  getLatestTypeTaskPackageSubmission,
  getProjectLatestPromisedAt,
  getProjectStatusFromTypeTaskPackages,
  getProjectTaskBreakdown,
  getTypeTaskPackageProgress,
  getTypeTaskPackageSignoffHistory,
  getTypeTaskPackageSubmissions,
} from "@/lib/workflowSelectors";
import { ymdHmSlash, ymdSlash } from "@/lib/runtime";

const PAGE_BG = "#f6f7fb";
const TEXT_MAIN = "#111827";
const TEXT_SUB = "#6b7280";
const BORDER = "#e5e7eb";
const BORDER_WEAK = "#eef1f6";
const RED = "#ef4444";
const BLUE = "#2563eb";
const GREEN = "#16a34a";

type StatusTab = "全部" | ProjectRecord["status"];

type ProjectRow = {
  project: ProjectRecord;
  questionnaire: Questionnaire | null;
  packages: TypeTaskPackage[];
};

function statusPillStyle(status: ProjectRecord["status"]) {
  if (status === "制作中") return { bg: "rgba(37,99,235,0.10)", color: BLUE };
  if (status === "待验收") return { bg: "rgba(245,158,11,0.16)", color: "#b45309" };
  if (status === "已完成") return { bg: "rgba(22,163,74,0.12)", color: GREEN };
  return { bg: "rgba(107,114,128,0.12)", color: TEXT_SUB };
}

function taskStatusPillStyle(status: TypeTaskPackage["status"]) {
  if (status === "待提交") return { bg: "rgba(239,68,68,0.10)", color: RED };
  if (status === "待需求方审核") return { bg: "rgba(37,99,235,0.10)", color: BLUE };
  if (status === "需修改") return { bg: "rgba(245,158,11,0.16)", color: "#b45309" };
  if (status === "已通过") return { bg: "rgba(22,163,74,0.12)", color: GREEN };
  return { bg: "rgba(107,114,128,0.12)", color: TEXT_SUB };
}

function ModalShell({ children, onClose, maxWidth = 1080 }: { children: ReactNode; onClose: () => void; maxWidth?: number }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div className="w-full" style={{ maxWidth, maxHeight: "calc(100vh - 56px)" }} onClick={e => e.stopPropagation()}>
        <div style={{ borderRadius: 26, background: "#fff", border: `1px solid ${BORDER_WEAK}`, boxShadow: "0 22px 60px rgba(15, 23, 42, 0.18)", overflow: "hidden" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function OutlineButton({ text, onClick, color = TEXT_MAIN, disabled = false }: { text: string; onClick: () => void; color?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{ height: 34, padding: "0 12px", borderRadius: 10, background: "#fff", border: `1px solid ${BORDER}`, color: disabled ? "#9ca3af" : color, fontSize: 12, fontWeight: 900, cursor: disabled ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}
    >
      {text}
    </button>
  );
}

function PrimaryButton({ text, onClick, disabled = false, bg = RED }: { text: string; onClick: () => void; disabled?: boolean; bg?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 34,
        padding: "0 12px",
        borderRadius: 10,
        background: disabled ? "#d1d5db" : bg,
        color: "#fff",
        border: "none",
        fontSize: 12,
        fontWeight: 900,
        cursor: disabled ? "not-allowed" : "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </button>
  );
}

export function performAcceptanceSubmit(_: {
  workflowData: unknown;
  task: Task;
  questionnaire: Questionnaire | null;
  vals: { faLink: string; faVersion: string; managerMailNote: string };
  currentUser: { id: string; name: string } | null;
  updateTask: (taskId: string, patch: Partial<Task>) => void;
  addNotification: (payload: Notification) => void;
}): { ok: false; reason: string } {
  return {
    ok: false,
    reason: "旧项目验收入口已停用，请改用新的交付任务提交与需求方审核链路。",
  };
}

export function SubmitSignoffModal({
  data,
  onClose,
}: {
  data: {
    task: Task;
    questionnaire: Questionnaire | null;
    mock: { committedDeliveryDate: string };
  };
  onClose: () => void;
  onConfirm: (vals: { faLink: string; faVersion: string; managerMailNote: string }) => void;
}) {
  return (
    <ModalShell onClose={onClose} maxWidth={640}>
      <div style={{ padding: "18px 20px", borderBottom: `1px solid ${BORDER_WEAK}` }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: TEXT_MAIN }}>兼容页面提示</div>
        <div style={{ marginTop: 8, fontSize: 13, color: TEXT_SUB, lineHeight: 1.7 }}>
          旧项目级验收入口已停用。请在“我的任务”提交交付物后，使用系统生成的审核链接完成需求方审核。
        </div>
      </div>
      <div style={{ padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: TEXT_MAIN }}>{data.task.taskNumber} · {data.task.title}</div>
        <div style={{ marginTop: 8, fontSize: 13, color: TEXT_SUB }}>承诺交付时间：{ymdSlash(data.mock.committedDeliveryDate)}</div>
      </div>
      <div className="flex items-center justify-end gap-[10px]" style={{ padding: "16px 20px", borderTop: `1px solid ${BORDER_WEAK}` }}>
        <OutlineButton text="关闭" onClick={onClose} />
      </div>
    </ModalShell>
  );
}

function DetailModal({ row, onClose, onCancel }: { row: ProjectRow; onClose: () => void; onCancel: () => void }) {
  const submissions = useStore(s => s.submissions);
  const signoffRecords = useStore(s => s.signoffRecords);
  const currentUser = useStore(s => s.currentUser);
  const latestPromisedAt = getProjectLatestPromisedAt(row.packages);
  const progress = getTypeTaskPackageProgress(row.packages);

  return (
    <ModalShell onClose={onClose}>
      <div style={{ padding: "18px 20px", borderBottom: `1px solid ${BORDER_WEAK}` }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: TEXT_MAIN }}>{row.project.projectCode} · {row.project.projectName}</div>
        <div style={{ marginTop: 8, fontSize: 13, color: TEXT_SUB, lineHeight: 1.7 }}>
          按交付任务查看项目进度、版本记录与需求方反馈。
        </div>
      </div>

      <div style={{ padding: 20, maxHeight: "calc(100vh - 220px)", overflowY: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14, padding: 16, background: PAGE_BG, border: `1px solid ${BORDER_WEAK}`, borderRadius: 16 }}>
          {[
            { k: "品牌 / 团队", v: row.project.brandTeam || "-" },
            { k: "需求方", v: row.questionnaire ? `${row.questionnaire.requesterName} / ${row.questionnaire.requesterEmail}` : row.project.requestorName || "-" },
            { k: "项目状态", v: row.project.status },
            { k: "交付任务进度", v: progress.label },
            { k: "最近承诺交付时间", v: ymdSlash(latestPromisedAt) },
            { k: "创建时间", v: ymdSlash(row.project.createdAt) },
          ].map(item => (
            <div key={item.k}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 900 }}>{item.k}</div>
              <div style={{ marginTop: 6, fontSize: 14, color: TEXT_MAIN, fontWeight: 900, wordBreak: "break-word" }}>{item.v}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
          {row.packages.map(pkg => {
            const latestSubmission = getLatestTypeTaskPackageSubmission(pkg.id, submissions);
            const latestSignoff = getTypeTaskPackageSignoffHistory(pkg.id, signoffRecords)[0] || null;
            const latestHistory = getTypeTaskPackageSubmissions(pkg.id, submissions);
            const style = taskStatusPillStyle(pkg.status);
            return (
              <div key={pkg.id} style={{ padding: 16, borderRadius: 18, background: "#fff", border: `1px solid ${BORDER}` }}>
                <div className="flex items-start justify-between gap-[12px]">
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: TEXT_MAIN }}>{pkg.deliverableType} × {pkg.deliverableItems.length}</div>
                    <div style={{ marginTop: 6, fontSize: 12, color: TEXT_SUB }}>执行成员：{pkg.assigneeName || "未分配"} · 承诺交付时间：{ymdSlash(pkg.promisedAt)}</div>
                  </div>
                  <span style={{ display: "inline-flex", alignItems: "center", height: 24, padding: "0 10px", borderRadius: 999, background: style.bg, color: style.color, fontSize: 12, fontWeight: 900 }}>{pkg.status}</span>
                </div>

                <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
                  {[
                    { k: "当前版本", v: pkg.currentVersion || "未提交" },
                    { k: "最近提交", v: latestSubmission ? ymdHmSlash(latestSubmission.submittedAt) : "-" },
                    { k: "最近反馈", v: pkg.latestFeedback || "-" },
                    { k: "提交记录数", v: String(latestHistory.length) },
                  ].map(item => (
                    <div key={item.k}>
                      <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 900 }}>{item.k}</div>
                      <div style={{ marginTop: 6, fontSize: 13, color: TEXT_MAIN, fontWeight: 800, wordBreak: "break-word" }}>{item.v}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: TEXT_MAIN }}>交付物明细</div>
                  <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                    {pkg.deliverableItems.map((item, index) => (
                      <div key={`${pkg.id}-${index}`} style={{ padding: "10px 12px", borderRadius: 12, background: PAGE_BG, border: `1px solid ${BORDER_WEAK}` }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: TEXT_MAIN }}>{item.name || "暂无交付物明细"}</div>
                        <div style={{ marginTop: 4, fontSize: 12, color: TEXT_SUB, lineHeight: 1.7 }}>
                          数量 {item.quantity || 1} · 尺寸 {item.size || "-"} · 输出格式 {item.outputFormat || "-"} · 使用场景 {item.usageScenario || "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {(pkg.fileLinks.length > 0 || pkg.uploadedFiles.length > 0) ? (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: TEXT_MAIN }}>当前交付内容</div>
                    {pkg.fileLinks.length > 0 ? <div style={{ marginTop: 8, fontSize: 12, color: TEXT_MAIN, lineHeight: 1.7 }}>文件链接：{pkg.fileLinks.join(" / ")}</div> : null}
                    {pkg.uploadedFiles.length > 0 ? <div style={{ marginTop: 6, fontSize: 12, color: TEXT_MAIN, lineHeight: 1.7 }}>上传文件：{pkg.uploadedFiles.map(file => file.name).join(" / ")}</div> : null}
                  </div>
                ) : null}

                {latestSignoff ? (
                  <div style={{ marginTop: 12, padding: 12, borderRadius: 12, border: `1px solid ${BORDER}`, background: "#fff" }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: TEXT_MAIN }}>最近审核结果：{latestSignoff.result === "passed" ? "需求方通过" : "需求方退回修改"}</div>
                    <div style={{ marginTop: 4, fontSize: 12, color: TEXT_SUB }}>审核时间：{ymdHmSlash(latestSignoff.reviewedAt)}</div>
                    <div style={{ marginTop: 6, fontSize: 12, color: TEXT_MAIN, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{latestSignoff.feedback || "无补充意见"}</div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-end gap-[10px]" style={{ padding: "16px 20px", borderTop: `1px solid ${BORDER_WEAK}` }}>
        <OutlineButton text="关闭" onClick={onClose} />
        {currentUser?.role === "LEADER" ? (
          <PrimaryButton text="取消项目" bg={RED} onClick={onCancel} disabled={row.project.status === "已取消" || row.project.status === "已完成"} />
        ) : null}
      </div>
    </ModalShell>
  );
}

function CancelModal({ row, onClose }: { row: ProjectRow; onClose: () => void }) {
  const cancelProject = useStore(s => s.cancelProject);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <ModalShell onClose={onClose} maxWidth={640}>
      <div style={{ padding: "18px 20px", borderBottom: `1px solid ${BORDER_WEAK}` }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: TEXT_MAIN }}>取消项目</div>
        <div style={{ marginTop: 8, fontSize: 13, color: TEXT_SUB, lineHeight: 1.7 }}>
          项目取消后，未完成的交付任务会进入“已结束”，后续不允许继续流转。
        </div>
      </div>
      <div style={{ padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: TEXT_MAIN }}>项目</div>
        <div style={{ marginTop: 8, fontSize: 14, color: TEXT_MAIN, fontWeight: 900 }}>{row.project.projectCode} · {row.project.projectName}</div>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="请填写取消原因"
          style={{ marginTop: 16, width: "100%", minHeight: 120, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "12px 14px", outline: "none", fontSize: 13, color: TEXT_MAIN, resize: "vertical", lineHeight: 1.6 }}
        />
        {error ? <div style={{ marginTop: 10, fontSize: 12, fontWeight: 900, color: RED }}>{error}</div> : null}
      </div>
      <div className="flex items-center justify-end gap-[10px]" style={{ padding: "16px 20px", borderTop: `1px solid ${BORDER_WEAK}` }}>
        <OutlineButton text="取消" onClick={onClose} />
        <PrimaryButton
          text="确认取消项目"
          onClick={() => {
            const result = cancelProject({ projectId: row.project.id, reason });
            if (!result.ok) {
              setError(result.error);
              return;
            }
            onClose();
          }}
        />
      </div>
    </ModalShell>
  );
}

export default function TaskBoard({
  onNavigate,
  initialTab,
  openTaskId,
  highlightTaskId,
  highlightQuestionnaireId,
}: {
  onNavigate?: (page: string) => void;
  initialTab?: string;
  openTaskId?: string;
  highlightTaskId?: string;
  highlightQuestionnaireId?: string;
}) {
  const tasks = useStore(s => s.tasks);
  const projects = useStore(s => s.projects);
  const questionnaires = useStore(s => s.questionnaires);
  const reviews = useStore(s => s.reviews);
  const submissions = useStore(s => s.submissions);
  const signoffRecords = useStore(s => s.signoffRecords);
  const typeTaskPackages = useStore(s => s.typeTaskPackages);
  const currentUser = useStore(s => s.currentUser);

  const [tab, setTab] = useState<StatusTab>((initialTab === "制作中" || initialTab === "待验收" || initialTab === "已完成" || initialTab === "已取消") ? initialTab : "全部");
  const [search, setSearch] = useState("");
  const [detailProjectId, setDetailProjectId] = useState<string | null>(null);
  const [cancelProjectId, setCancelProjectId] = useState<string | null>(null);
  const [showGanttModal, setShowGanttModal] = useState(false);

  const questionnaireById = useMemo(() => new Map(questionnaires.map(item => [item.id, item] as const)), [questionnaires]);

  const rows = useMemo<ProjectRow[]>(() => {
    return projects
      .map(project => {
        const packages = typeTaskPackages.filter(pkg => pkg.projectId === project.id);
        const nextStatus = getProjectStatusFromTypeTaskPackages(packages);
        return {
          project: project.status === nextStatus ? project : { ...project, status: nextStatus },
          questionnaire: questionnaireById.get(project.briefId) || null,
          packages,
        };
      })
      .sort((a, b) => String(b.project.createdAt || "").localeCompare(String(a.project.createdAt || "")));
  }, [projects, questionnaireById, typeTaskPackages]);

  useEffect(() => {
    const preferredId = openTaskId || highlightTaskId || null;
    if (preferredId) {
      const matched = rows.find(row => row.project.id === preferredId || row.project.legacyTaskId === preferredId) || null;
      if (matched) setDetailProjectId(matched.project.id);
    }
  }, [highlightTaskId, openTaskId, rows]);

  useEffect(() => {
    if (!highlightQuestionnaireId) return;
    const matched = rows.find(row => row.project.briefId === highlightQuestionnaireId) || null;
    if (matched) setDetailProjectId(matched.project.id);
  }, [highlightQuestionnaireId, rows]);

  const counts = useMemo(() => {
    return {
      全部: rows.length,
      制作中: rows.filter(row => row.project.status === "制作中").length,
      待验收: rows.filter(row => row.project.status === "待验收").length,
      已完成: rows.filter(row => row.project.status === "已完成").length,
      已取消: rows.filter(row => row.project.status === "已取消").length,
    } as Record<StatusTab, number>;
  }, [rows]);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return rows.filter(row => {
      if (tab !== "全部" && row.project.status !== tab) return false;
      if (!keyword) return true;
      const haystack = [
        row.project.projectCode,
        row.project.projectName,
        row.project.brandTeam,
        row.project.requestorName,
        row.questionnaire?.requesterName,
      ].join(" ").toLowerCase();
      return haystack.includes(keyword);
    });
  }, [rows, search, tab]);

  const activeDetail = detailProjectId ? rows.find(row => row.project.id === detailProjectId) || null : null;
  const activeCancel = cancelProjectId ? rows.find(row => row.project.id === cancelProjectId) || null : null;
  const ganttRows = useMemo(() => getProjectGanttRows({
    tasks,
    questionnaires,
    submissions,
    reviews,
    projects,
    typeTaskPackages,
    signoffRecords,
  }), [projects, questionnaires, reviews, signoffRecords, submissions, tasks, typeTaskPackages]);

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: PAGE_BG, padding: "24px 40px 34px" }}>
      <div className="flex items-end justify-between gap-[16px]" style={{ marginBottom: 18 }}>
        <div>
          <div className="flex items-center gap-[8px]">
            <div style={{ fontSize: 28, color: TEXT_MAIN, fontWeight: 900 }}>项目看板</div>
            <button
              type="button"
              title="查看项目甘特图"
              aria-label="查看项目甘特图"
              onClick={() => setShowGanttModal(true)}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                border: `1px solid ${BORDER}`,
                background: "#fff",
                color: TEXT_SUB,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M7 3v4" />
                <path d="M17 3v4" />
                <path d="M3 9h18" />
                <path d="M7 13h3" />
                <path d="M12 13h5" />
                <path d="M7 16h7" />
              </svg>
            </button>
          </div>
          <div style={{ marginTop: 8, fontSize: 13, color: TEXT_SUB, fontWeight: 700, lineHeight: 1.8 }}>
            追踪项目整体状态与交付任务进度，并按交付任务状态自动联动项目阶段。
          </div>
        </div>
        <div style={{ width: 320, maxWidth: "100%" }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索项目名称、编号、品牌 / 团队、需求方"
            style={{ width: "100%", height: 42, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "0 14px", outline: "none", fontSize: 13, color: TEXT_MAIN, background: "#fff" }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14, marginBottom: 18 }}>
        {[
          { label: "制作中", value: counts["制作中"], color: BLUE, bg: "rgba(37,99,235,0.10)" },
          { label: "待验收", value: counts["待验收"], color: "#b45309", bg: "rgba(245,158,11,0.16)" },
          { label: "已完成", value: counts["已完成"], color: GREEN, bg: "rgba(22,163,74,0.12)" },
          { label: "已取消", value: counts["已取消"], color: TEXT_SUB, bg: "rgba(107,114,128,0.12)" },
        ].map(card => (
          <div key={card.label} style={{ padding: 18, borderRadius: 18, background: "#fff", border: `1px solid ${BORDER_WEAK}` }}>
            <div style={{ fontSize: 12, color: TEXT_SUB, fontWeight: 800 }}>{card.label}</div>
            <div style={{ marginTop: 10, fontSize: 28, fontWeight: 900, color: card.color }}>{card.value}</div>
            <div style={{ marginTop: 10, height: 6, borderRadius: 999, background: card.bg }} />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-[10px]" style={{ marginBottom: 16, flexWrap: "wrap" }}>
        {(["全部", "制作中", "待验收", "已完成", "已取消"] as StatusTab[]).map(item => {
          const active = tab === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              style={{
                height: 34,
                padding: "0 14px",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 900,
                background: active ? RED : "#fff",
                color: active ? "#fff" : TEXT_MAIN,
                border: active ? "none" : `1px solid ${BORDER}`,
              }}
            >
              {item}{counts[item] > 0 ? ` (${counts[item]})` : ""}
            </button>
          );
        })}
      </div>

      <div style={{ borderRadius: 20, border: `1px solid ${BORDER_WEAK}`, background: "#fff", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1.1fr 1.1fr 180px", gap: 12, padding: "14px 18px", borderBottom: `1px solid ${BORDER_WEAK}`, fontSize: 12, fontWeight: 900, color: TEXT_SUB }}>
          <div>项目</div>
          <div>品牌/需求方</div>
          <div>项目状态</div>
          <div>交付任务进度</div>
          <div>最近承诺交付时间</div>
          <div>操作</div>
        </div>

        {filteredRows.length === 0 ? (
          <div style={{ padding: "56px 20px", textAlign: "center", color: TEXT_SUB, fontSize: 14, fontWeight: 700 }}>
            当前筛选条件下没有项目。
          </div>
        ) : filteredRows.map(row => {
          const packages = row.packages;
          const progress = getTypeTaskPackageProgress(packages);
          const breakdown = getProjectTaskBreakdown(packages);
          const latestPromisedAt = getProjectLatestPromisedAt(packages);
          const style = statusPillStyle(row.project.status);
          const assigneeIds = getAssigneeAvatarGroup(packages);
          return (
            <div key={row.project.id} style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1.1fr 1.1fr 180px", gap: 12, padding: "16px 18px", borderBottom: `1px solid ${BORDER_WEAK}`, alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: TEXT_MAIN }}>{row.project.projectName}</div>
                <div style={{ marginTop: 4, fontSize: 12, color: TEXT_SUB }}>{row.project.projectCode}</div>
              </div>
              <div style={{ fontSize: 13, color: TEXT_MAIN, lineHeight: 1.7 }}>
                <div style={{ fontWeight: 800 }}>
                  {(() => {
                    const internalDepts = ["市场部", "电商部", "培训部", "行政部", "销售部", "渠道部", "传播部", "人力资源部"];
                    const isInternal = row.project.brandTeam === "保乐力加" || 
                                      internalDepts.includes(row.project.brandTeam || "") ||
                                      !!row.questionnaire?.requesterDept;
                    return isInternal ? "保乐力加" : (row.project.brandTeam || "-");
                  })()}
                </div>
                <div style={{ marginTop: 4, color: TEXT_SUB }}>
                  {row.questionnaire?.requesterName || row.project.requestorName || "-"}
                  {(() => {
                    const internalDepts = ["市场部", "电商部", "培训部", "行政部", "销售部", "渠道部", "传播部", "人力资源部"];
                    const isInternal = row.project.brandTeam === "保乐力加" || 
                                      internalDepts.includes(row.project.brandTeam || "") ||
                                      !!row.questionnaire?.requesterDept;
                    return isInternal && row.questionnaire?.requesterDept ? ` · ${row.questionnaire.requesterDept}` : "";
                  })()}
                </div>
              </div>
              <div>
                <span style={{ display: "inline-flex", alignItems: "center", height: 24, padding: "0 10px", borderRadius: 999, background: style.bg, color: style.color, fontSize: 12, fontWeight: 900 }}>{row.project.status}</span>
              </div>
              <div style={{ fontSize: 12, color: TEXT_MAIN, lineHeight: 1.7 }}>
                <div className="flex items-center gap-[8px]" style={{ flexWrap: "wrap" }}>
                  {packages.map(pkg => (
                    <span key={pkg.id} style={{ display: "inline-flex", alignItems: "center", height: 22, padding: "0 8px", borderRadius: 999, background: taskStatusPillStyle(pkg.status).bg, color: taskStatusPillStyle(pkg.status).color, fontSize: 11, fontWeight: 900 }}>
                      {pkg.deliverableType} × {pkg.deliverableItems.length}
                    </span>
                  ))}
                </div>
                <div style={{ marginTop: 8, fontWeight: 900 }}>{progress.label}</div>
                <div style={{ marginTop: 4, color: TEXT_SUB }}>
                  项目状态：{row.project.status}
                  {breakdown.waiting > 0 ? ` · ${breakdown.waiting} 个待需求方审核` : null}
                  {breakdown.todo > 0 ? `${breakdown.waiting > 0 ? "" : " · "}${breakdown.todo} 个待提交` : null}
                  {breakdown.revise > 0 ? `${breakdown.waiting > 0 || breakdown.todo > 0 ? " · " : " · "}${breakdown.revise} 个需修改` : null}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: TEXT_MAIN, fontWeight: 800 }}>{ymdSlash(latestPromisedAt)}</div>
                <div className="flex items-center gap-[6px]" style={{ marginTop: 8, flexWrap: "wrap" }}>
                  {assigneeIds.slice(0, 4).map(userId => {
                    const user = USERS.find(item => item.id === userId) || null;
                    return (
                      <div key={userId} title={user?.name || userId} style={{ width: 28, height: 28, borderRadius: "50%", background: user?.avatar || "rgba(37,99,235,0.10)", color: "#fff", fontSize: 12, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {getInitial(user?.name || userId)}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-[8px]" style={{ flexWrap: "wrap" }}>
                <OutlineButton text="查看详情" onClick={() => setDetailProjectId(row.project.id)} />
                {currentUser?.role === "LEADER" ? (
                  <PrimaryButton text="取消项目" bg={RED} disabled={row.project.status === "已取消" || row.project.status === "已完成"} onClick={() => setCancelProjectId(row.project.id)} />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {activeDetail ? <DetailModal row={activeDetail} onClose={() => setDetailProjectId(null)} onCancel={() => { setDetailProjectId(null); setCancelProjectId(activeDetail.project.id); }} /> : null}
      {activeCancel ? <CancelModal row={activeCancel} onClose={() => setCancelProjectId(null)} /> : null}
      {showGanttModal ? (
        <ProjectGanttModal
          rows={ganttRows}
          hasProjects={projects.length > 0}
          hasPackages={typeTaskPackages.length > 0}
          onClose={() => setShowGanttModal(false)}
        />
      ) : null}
    </div>
  );
}
