"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore, getQuestionnaireDeliverableTypes } from "@/lib/store";
import { USERS, type Questionnaire, type DeliverableItem, type DeliverableTypeGroup, type ProjectRecord, type Task, type TypeTaskPackage } from "@/lib/mock-data";
import { VIDEO_TYPE_MAP, getInitial } from "@/lib/utils";
import { addDaysIso, nowMs, toMs, ymdSlash } from "@/lib/runtime";
import { getAssigneeAvatarGroup, getDeliverableTypeSummary, getProjectStatusFromTypeTaskPackages, getTypeTaskPackageProgress } from "@/lib/workflowSelectors";
import QuestionnaireForm from "./QuestionnaireForm";

const PAGE_BG = "#f6f7fb";
const TEXT_MAIN = "#111827";
const TEXT_SUB = "#6b7280";
const BORDER = "#e5e7eb";
const BORDER_WEAK = "#eef1f6";
const RED = "#ef4444";
const BLUE = "#2563eb";
const GREEN = "#16a34a";

const EXTRA_QUESTS: Questionnaire[] = [
  { id: "q4", title: "年会开场视频", description: "2026 年年会开场 3 分钟视频，现场播放，视觉系…", videoType: "EVENT", duration: "3分钟", deadline: "2026-06-15T00:00:00.000Z", requesterName: "周婷", requesterEmail: "zhouting@example.com", requesterDept: "人力资源部", specialNotes: JSON.stringify({ brand: "HR Team", priority: "Medium" }), status: "PENDING", claimedById: null, assignedById: null, createdAt: "2026-04-12T00:00:00.000Z" },
  { id: "q5", title: "CEO 主题演讲精华剪辑", description: "将 CEO 年度大会 45 分钟演讲剪辑为 3 分钟精华版本。", videoType: "EVENT", duration: "3分钟", deadline: "2026-05-24T00:00:00.000Z", requesterName: "赵俊", requesterEmail: "zhaojun@example.com", requesterDept: "行政部", specialNotes: JSON.stringify({ brand: "Corporate", priority: "High", dispatch: { teamMemberIds: ["u3", "u6"], internalDueDate: "2026-05-21", estimatedCostRmb: 12000, managerNote: "" } }), status: "ASSIGNED", claimedById: null, assignedById: "u1", createdAt: "2026-04-07T00:00:00.000Z" },
];

type TabKey = "all" | "pending" | "generated";
type DeliverableType = "3D" | "视频" | "线下物料" | "平面设计" | "文案" | "内容创意" | "其他";
type DeliverableRow = {
  id: string;
  quantity: string;
  content: string;
  size: string;
  format: string;
  usage: string;
  note: string;
};
type BriefFormData = {
  projectName: string;
  brandTeam: string;
  requesterName: string;
  priority: string;
  requestDate: string;
  deadline: string;
  objective: string;
  keyMessage: string;
  targetAudience: string;
  touchPoints: string;
  mustInclude: string;
  stylePreference: string;
  tone: string;
  doNots: string;
  supportMaterialLink: string;
  email: string;
  selectedDeliverables: DeliverableType[];
  deliverables: Record<DeliverableType, DeliverableRow[]>;
};
type BriefDispatchMeta = {
  teamMemberIds?: unknown;
  committedDeliveryDate?: unknown;
  internalDueDate?: unknown;
  estimatedCostRmb?: unknown;
  marketCostRmb?: unknown;
  managerNote?: unknown;
  assignedAt?: unknown;
};
type BriefMeta = Record<string, unknown> & {
  brand?: string;
  team?: string;
  company?: string;
  priority?: string;
  objective?: string;
  keyMessage?: string;
  targetAudience?: string;
  touchPoints?: string;
  mustInclude?: string;
  stylePreference?: string;
  tone?: string;
  doNots?: string;
  supportMaterialLink?: string;
  requestDate?: string;
  dispatch?: BriefDispatchMeta;
  deliverableTypes?: Array<{ type?: string; items?: unknown[] }>;
  deliverables?: Record<string, unknown[]>;
  uploadedFiles?: Array<{ name?: string; sizeKb?: number }>;
};

const DELIVERABLE_TYPE_ORDER: DeliverableType[] = ["3D", "视频", "线下物料", "平面设计", "文案", "内容创意", "其他"];

function safeJsonParse(text: string | null) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getBriefMeta(q: Questionnaire): BriefMeta | null {
  const parsed = safeJsonParse(q.specialNotes);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    return parsed as BriefMeta;
  }
  return null;
}

function getBriefStatus(q: Questionnaire): "pending" | "generated" | "canceled" {
  if (q.status === "REJECTED") return "canceled";
  return q.status === "ASSIGNED" ? "generated" : "pending";
}

function formatYmd(dateStr: string) {
  return ymdSlash(dateStr);
}

function getBriefRequestDate(q: Questionnaire) {
  const meta = getBriefMeta(q);
  const requestDate = typeof meta?.requestDate === "string" ? meta.requestDate.trim() : "";
  return requestDate ? requestDate : q.createdAt;
}

function QuestionnairesTabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ height: 34, padding: "0 14px", borderRadius: 999, fontSize: 13, fontWeight: 800, background: active ? RED : "#fff", color: active ? "#fff" : TEXT_MAIN, border: active ? "none" : `1px solid ${BORDER}` }}
    >
      {label}
    </button>
  );
}

function QuestionnairesFilterButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="transition-colors"
      style={{ height: 34, padding: "0 12px", borderRadius: 12, background: "#fff", border: `1px solid ${BORDER}`, color: TEXT_MAIN, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f9fafb")}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#fff")}
    >
      {label}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
}

function getMostCommonDeliverable(quests: Questionnaire[]) {
  const counts = new Map<string, number>();
  for (const q of quests) {
    const entries = getDeliverableEntries(q);
    if (entries.length > 0) {
      for (const entry of entries) {
        counts.set(entry.label, (counts.get(entry.label) || 0) + entry.count);
      }
      continue;
    }
    const t = VIDEO_TYPE_MAP[q.videoType] || q.videoType;
    counts.set(t, (counts.get(t) || 0) + 1);
  }
  let best = "-";
  let bestN = 0;
  for (const [k, n] of counts.entries()) {
    if (n > bestN) {
      best = k;
      bestN = n;
    }
  }
  return best;
}

function createEmptyDeliverableItem(quantity = 1): DeliverableItem {
  return {
    name: "",
    quantity,
    size: "",
    outputFormat: "",
    usageScenario: "",
    remark: "",
  };
}

function getDeliverableEntries(q: Questionnaire) {
  return getDeliverableGroups(q)
    .map(group => ({ label: group.type, count: group.items.length }))
    .filter(entry => entry.label && entry.count > 0);
}

function getDeliverableGroups(q: Questionnaire): DeliverableTypeGroup[] {
  if (Array.isArray(q.deliverableTypes) && q.deliverableTypes.length > 0) {
    return q.deliverableTypes;
  }

  const meta = getBriefMeta(q);
  if (Array.isArray(meta?.deliverableTypes)) {
    return meta.deliverableTypes.flatMap(group => {
      if (!group || typeof group !== "object" || Array.isArray(group)) return [];
      const safe = group as Record<string, unknown>;
      const type = typeof safe.type === "string" ? safe.type : "";
      const items = Array.isArray(safe.items)
        ? safe.items
          .filter(item => item && typeof item === "object" && !Array.isArray(item))
          .map(item => {
            const row = item as Record<string, unknown>;
            return {
              name:
                typeof row.name === "string" && row.name.trim()
                  ? row.name.trim()
                  : typeof row.content === "string" && row.content.trim()
                    ? row.content.trim()
                    : typeof row.description === "string" && row.description.trim()
                      ? row.description.trim()
                      : typeof row.remark === "string" && row.remark.trim()
                        ? row.remark.trim()
                        : typeof row.note === "string" && row.note.trim()
                          ? row.note.trim()
                          : "",
              quantity: Number(String(row.quantity || "1")) > 0 ? Number(String(row.quantity || "1")) : 1,
              size: typeof row.size === "string" ? row.size : "",
              outputFormat: typeof row.outputFormat === "string" ? row.outputFormat : typeof row.format === "string" ? row.format : "",
              usageScenario: typeof row.usageScenario === "string" ? row.usageScenario : typeof row.usage === "string" ? row.usage : "",
              remark: typeof row.remark === "string" ? row.remark : typeof row.note === "string" ? row.note : "",
            } satisfies DeliverableItem;
          })
        : [];
      return type && items.length > 0 ? [{ type, items }] : [];
    });
  }

  const legacy = meta?.deliverables;
  if (legacy && typeof legacy === "object" && !Array.isArray(legacy)) {
    return Object.entries(legacy).map(([type, rows]) => ({
      type,
      items: Array.isArray(rows)
        ? (rows.length > 0 ? rows : [createEmptyDeliverableItem()]).map(row => {
          const safe = row && typeof row === "object" ? row as Record<string, unknown> : {};
          return {
            name:
              typeof safe.name === "string" && safe.name.trim()
                ? safe.name.trim()
                : typeof safe.content === "string" && safe.content.trim()
                  ? safe.content.trim()
                  : typeof safe.description === "string" && safe.description.trim()
                    ? safe.description.trim()
                    : typeof safe.remark === "string" && safe.remark.trim()
                      ? safe.remark.trim()
                      : typeof safe.note === "string" && safe.note.trim()
                        ? safe.note.trim()
                        : "",
            quantity: Number(String(safe.quantity || "1")) > 0 ? Number(String(safe.quantity || "1")) : 1,
            size: typeof safe.size === "string" ? safe.size : "",
            outputFormat: typeof safe.outputFormat === "string" ? safe.outputFormat : typeof safe.format === "string" ? safe.format : "",
            usageScenario: typeof safe.usageScenario === "string" ? safe.usageScenario : typeof safe.usage === "string" ? safe.usage : "",
            remark: typeof safe.remark === "string" ? safe.remark : typeof safe.note === "string" ? safe.note : "",
          } satisfies DeliverableItem;
        })
        : [createEmptyDeliverableItem()],
    })).filter(group => group.type.trim().length > 0 && group.items.length > 0);
  }

  const fallbackType = VIDEO_TYPE_MAP[q.videoType] || q.videoType;
  return fallbackType ? [{ type: fallbackType, items: [createEmptyDeliverableItem()] }] : [];
}

function getDeliverableVisual(label: string) {
  if (label === "视频") return { bg: "rgba(37,99,235,0.10)", color: "#2563eb" };
  if (label === "平面设计") return { bg: "rgba(22,163,74,0.12)", color: "#16a34a" };
  if (label === "线下物料") return { bg: "rgba(236,72,153,0.12)", color: "#db2777" };
  if (label === "文案") return { bg: "rgba(245,158,11,0.14)", color: "#f59e0b" };
  return { bg: "rgba(100,116,139,0.14)", color: "#64748b" };
}

function getDeliverableSummary(q: Questionnaire) {
  const groups = getDeliverableGroups(q);
  if (groups.length > 0) {
    return groups.map(group => `${group.type} × ${group.items.length}`).join(" / ");
  }
  return "-";
}

function getPriorityLabel(q: Questionnaire) {
  const meta = getBriefMeta(q);
  const p = meta?.priority;
  if (p === "HIGH" || p === "High") return "High";
  if (p === "LOW" || p === "Low") return "Low";
  if (p === "MEDIUM" || p === "Medium") return "Medium";
  return "Medium";
}

function getBrandTeam(q: Questionnaire) {
  const meta = getBriefMeta(q);
  if (q.requesterDept && q.requesterDept.trim()) return "保乐力加";
  if (typeof meta?.brand === "string" && meta.brand.trim()) return meta.brand.trim();
  if (typeof meta?.company === "string" && meta.company.trim()) return meta.company.trim();
  if (typeof meta?.team === "string" && meta.team.trim()) return meta.team.trim();
  return "-";
}

function getRequesterDisplay(q: Questionnaire) {
  if (q.requesterDept && q.requesterDept.trim()) {
    return `${q.requesterName} · ${q.requesterDept.trim()}`;
  }
  return q.requesterName;
}

function getPriorityPill(priority: string) {
  if (priority === "High") return { text: "高", bg: "rgba(239,68,68,0.12)", color: RED };
  if (priority === "Low") return { text: "低", bg: "rgba(100,116,139,0.14)", color: "#64748b" };
  return { text: "中", bg: "rgba(245,158,11,0.14)", color: "#f59e0b" };
}

function getDispatchInfo(q: Questionnaire) {
  const meta = getBriefMeta(q);
  const dispatch = meta?.dispatch;
  if (!dispatch) return null;
  const rawIds = Array.isArray(dispatch.teamMemberIds) ? dispatch.teamMemberIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0) : [];
  return {
    teamMemberIds: rawIds.length > 0 ? [rawIds[0]] : [],
    committedDeliveryDate: typeof dispatch.committedDeliveryDate === "string" ? dispatch.committedDeliveryDate : "",
    internalDueDate: typeof dispatch.internalDueDate === "string" ? dispatch.internalDueDate : "",
    estimatedCostRmb: typeof dispatch.estimatedCostRmb === "number" ? dispatch.estimatedCostRmb : null,
    marketCostRmb: typeof dispatch.marketCostRmb === "number" ? dispatch.marketCostRmb : null,
    managerNote: typeof dispatch.managerNote === "string" ? dispatch.managerNote : "",
  };
}

function toDateInputValue(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function slugPreviewUrl(id: string, name: string) {
  const encoded = encodeURIComponent(name.replace(/\s+/g, "-"));
  return `https://assets.example.com/brief/${id}/${encoded}`;
}

function createMockDeliverableRows(label: DeliverableType, count: number, brandTeam: string, projectName: string): DeliverableRow[] {
  return Array.from({ length: Math.max(1, count) }, (_, index) => ({
    id: `${label}-${index + 1}`,
    quantity: "1",
    content: `${projectName} ${label}内容 ${index + 1}`,
    size: label === "视频" ? "1920x1080" : label === "线下物料" ? "A3" : label === "3D" ? "4K" : "1080x1350",
    format: label === "视频" ? "MP4" : label === "文案" ? "DOCX" : label === "线下物料" ? "PDF" : label === "3D" ? "PNG / MP4" : "JPG / PNG",
    usage: brandTeam ? `${brandTeam} 渠道投放` : "品牌传播",
    note: index === 0 ? "请保持品牌视觉一致性" : "",
  }));
}

function buildReadonlyFormData(q: Questionnaire): { data: BriefFormData; files: Array<{ name: string; sizeKb: number; previewUrl: string }> } {
  const meta = getBriefMeta(q);
  const brandTeam = getBrandTeam(q) === "-" ? (q.requesterDept || "Studio") : getBrandTeam(q);
  const requesterDisplay = getRequesterDisplay(q);
  const deliverableGroups = getDeliverableGroups(q);
  const deliverableEntries = deliverableGroups.length > 0
    ? deliverableGroups.map(group => ({ label: group.type, count: group.items.length }))
    : getDeliverableEntries(q);
  const selectedDeliverables = (deliverableEntries.map(entry => entry.label).filter((label): label is DeliverableType => DELIVERABLE_TYPE_ORDER.includes(label as DeliverableType))) as DeliverableType[];

  const deliverables = DELIVERABLE_TYPE_ORDER.reduce<Record<DeliverableType, DeliverableRow[]>>((acc, type) => {
    const group = deliverableGroups.find(item => item.type === type);
    if (group && group.items.length > 0) {
      acc[type] = group.items.map((item, index) => ({
        id: `${type}-${index + 1}`,
        quantity: String(item.quantity || 1),
        content: item.name || `${q.title} ${type}内容 ${index + 1}`,
        size: item.size,
        format: item.outputFormat,
        usage: item.usageScenario,
        note: item.remark,
      }));
      return acc;
    }

    const entry = deliverableEntries.find(item => item.label === type);
    acc[type] = entry ? createMockDeliverableRows(type, entry.count, brandTeam, q.title) : [];
    return acc;
  }, {
    "3D": [],
    "视频": [],
    "线下物料": [],
    "平面设计": [],
    "文案": [],
    "内容创意": [],
    "其他": [],
  });

  const files = Array.isArray(meta?.uploadedFiles) && meta?.uploadedFiles.length > 0
    ? meta.uploadedFiles
      .map((file, index) => {
        const name = typeof file?.name === "string" && file.name.trim() ? file.name.trim() : `support-file-${index + 1}.pdf`;
        const sizeKb = typeof file?.sizeKb === "number" && Number.isFinite(file.sizeKb) ? file.sizeKb : 1280;
        return { name, sizeKb, previewUrl: slugPreviewUrl(q.id, name) };
      })
    : [
        { name: `${q.title}-brief-overview.pdf`, sizeKb: 1280, previewUrl: slugPreviewUrl(q.id, `${q.title}-brief-overview.pdf`) },
        { name: `${brandTeam}-assets.zip`, sizeKb: 8640, previewUrl: slugPreviewUrl(q.id, `${brandTeam}-assets.zip`) },
      ];

  return {
    data: {
      projectName: q.title,
      brandTeam,
      requesterName: requesterDisplay,
      email: q.requesterEmail || "",
      priority: getPriorityLabel(q),
      requestDate: typeof meta?.requestDate === "string" && meta.requestDate.trim() ? meta.requestDate : toDateInputValue(q.createdAt),
      deadline: toDateInputValue(q.deadline),
      objective: typeof meta?.objective === "string" && meta.objective.trim() ? meta.objective : q.description,
      keyMessage: typeof meta?.keyMessage === "string" && meta.keyMessage.trim() ? meta.keyMessage : `请围绕「${q.title}」统一核心表达，并确保主信息简洁清晰。`,
      targetAudience: typeof meta?.targetAudience === "string" && meta.targetAudience.trim() ? meta.targetAudience : `${brandTeam} 目标客群与相关内部协作方`,
      touchPoints: typeof meta?.touchPoints === "string" && meta.touchPoints.trim() ? meta.touchPoints : "社交媒体、内部沟通、线下展示",
      mustInclude: typeof meta?.mustInclude === "string" && meta.mustInclude.trim() ? meta.mustInclude : `${brandTeam} Logo、项目名称、核心卖点`,
      stylePreference: typeof meta?.stylePreference === "string" && meta.stylePreference.trim() ? meta.stylePreference : "简洁、现代、品牌一致、信息层级清晰",
      tone: typeof meta?.tone === "string" && meta.tone.trim() ? meta.tone : "专业、清晰、可信",
      doNots: typeof meta?.doNots === "string" ? meta.doNots : "",
      supportMaterialLink: typeof meta?.supportMaterialLink === "string" && meta.supportMaterialLink.trim() ? meta.supportMaterialLink : `https://share.example.com/brief/${q.id}`,
      selectedDeliverables,
      deliverables,
    },
    files,
  };
}

function getDispatchDisplay(q: Questionnaire) {
  const real = getDispatchInfo(q);
  if (real) return real;
  if (getBriefStatus(q) !== "generated") return null;

  const priority = getPriorityLabel(q);
  const estimatedCostRmb = priority === "High" ? 15000 : priority === "Low" ? 8000 : 12000;
  const marketCostRmb = priority === "High" ? 25000 : priority === "Low" ? 12000 : 18000;
  const internalDueDate = addDaysIso(q.deadline, -3) || q.deadline;
  const defaultAssigneeIds = ["u1", "u2", "u3", "u4", "u5", "u6"];
  const numericId = Number(String(q.id).replace(/\D/g, "")) || 0;
  return {
    teamMemberIds: [defaultAssigneeIds[numericId % defaultAssigneeIds.length]],
    internalDueDate,
    estimatedCostRmb,
    marketCostRmb,
    managerNote: "",
  };
}

function getDispatchCostValues(q: Questionnaire) {
  const dispatch = getDispatchInfo(q);
  const priority = getPriorityLabel(q);
  return {
    estimatedCostRmb: dispatch?.estimatedCostRmb ?? (priority === "High" ? 15000 : priority === "Low" ? 8000 : 12000),
    marketCostRmb: dispatch?.marketCostRmb ?? (priority === "High" ? 25000 : priority === "Low" ? 12000 : 18000),
  };
}

function Avatar({ label, color }: { label: string; color: string }) {
  return (
    <div
      className="shrink-0 flex items-center justify-center"
      style={{ width: 34, height: 34, borderRadius: "50%", backgroundColor: color, color: "#fff", fontSize: 13, fontWeight: 700 }}
    >
      {label}
    </div>
  );
}

function Pill({ text, bg, color }: { text: string; bg: string; color: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", height: 24, padding: "0 10px", borderRadius: 999, background: bg, color, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
      {text}
    </span>
  );
}

function OutlineButton({ text, onClick, color = "#111827" }: { text: string; onClick: () => void; color?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="transition-colors"
      style={{ height: 32, padding: "0 10px", borderRadius: 10, background: "#fff", border: `1px solid ${BORDER}`, color, fontSize: 12, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f9fafb")}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#fff")}
    >
      {text}
    </button>
  );
}

function PrimaryButton({ text, onClick, bg = RED }: { text: string; onClick: () => void; bg?: string }) {
  const shadow = bg === GREEN ? "0 10px 24px rgba(22,163,74,0.18)" : "0 10px 24px rgba(239,68,68,0.20)";
  return (
    <button
      type="button"
      onClick={onClick}
      className="transition-all"
      style={{ height: 32, padding: "0 10px", borderRadius: 10, background: bg, color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 900, boxShadow: shadow, whiteSpace: "nowrap" }}
    >
      {text}
    </button>
  );
}

export default function Questionnaires({ onNavigate, initialTab, openQuestionnaireId }: { onNavigate?: (page: string) => void; initialTab?: TabKey; openQuestionnaireId?: string }) {
  const { questionnaires: storeQuests, tasks, projects, typeTaskPackages, currentUser, dispatchBrief, updateBriefDispatch } = useStore();
  const isLeader = currentUser?.role === "LEADER";

  const [activeTab, setActiveTab] = useState<TabKey>(() => initialTab || "all");
  const [showTemplate, setShowTemplate] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(() => openQuestionnaireId || null);
  const [assignId, setAssignId] = useState<string | null>(null);

  const allQuests = useMemo(() => {
    const merged = [...storeQuests, ...EXTRA_QUESTS.filter(eq => !storeQuests.find(sq => sq.id === eq.id))];
    return merged.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  }, [storeQuests]);

  const pendingQuests = useMemo(() => allQuests.filter(q => getBriefStatus(q) === "pending"), [allQuests]);
  const generatedQuests = useMemo(() => allQuests.filter(q => getBriefStatus(q) === "generated"), [allQuests]);
  const canceledQuests = useMemo(() => allQuests.filter(q => getBriefStatus(q) === "canceled"), [allQuests]);

  const shown = useMemo(() => {
    if (activeTab === "pending") return pendingQuests;
    if (activeTab === "generated") return generatedQuests;
    return allQuests;
  }, [activeTab, allQuests, pendingQuests, generatedQuests]);

  const stats = useMemo(() => {
    const now = nowMs();
    const withinDays = (dt: string, days: number) => (now - toMs(dt)) <= days * 86400000;
    const thisWeek = allQuests.filter(q => withinDays(q.createdAt, 7)).length;
    const lastWeek = allQuests.filter(q => {
      const t = now - toMs(q.createdAt);
      return t > 7 * 86400000 && t <= 14 * 86400000;
    }).length;
    const delta = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0;
    return {
      thisWeek,
      deltaText: lastWeek > 0 ? `较上周 ${delta >= 0 ? "+" : ""}${delta}%` : "较上周 +0%",
      pending: pendingQuests.length,
      generated: generatedQuests.length,
      commonDeliverable: getMostCommonDeliverable(allQuests),
    };
  }, [allQuests, pendingQuests.length, generatedQuests.length]);

  const copyLink = () => {
    const url = `${window.location.origin}/questionnaire-form`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const selectedDetail = detailId ? allQuests.find(q => q.id === detailId) : null;
  const selectedAssign = assignId ? allQuests.find(q => q.id === assignId) : null;
  const projectByBriefId = useMemo(() => new Map(projects.map(project => [project.briefId, project] as const)), [projects]);
  const packagesByProjectId = useMemo(() => {
    const map = new Map<string, TypeTaskPackage[]>();
    typeTaskPackages.forEach(pkg => {
      const current = map.get(pkg.projectId) || [];
      map.set(pkg.projectId, [...current, pkg]);
    });

    for (const quest of allQuests) {
      if (quest.status !== "ASSIGNED") continue;
      const project = projectByBriefId.get(quest.id);
      if (!project) continue;
      if (map.get(project.id) && map.get(project.id)!.length > 0) continue;

      const deliverableGroups = getQuestionnaireDeliverableTypes(quest);
      if (deliverableGroups.length === 0) {
        deliverableGroups.push({ type: "其他", items: [{ name: "未指定", quantity: 1, size: "", outputFormat: "", usageScenario: "", remark: "" }] });
      }

      const dispatch = getDispatchInfo(quest);
      const assigneeId = dispatch?.teamMemberIds?.[0] || null;
      const assignee = assigneeId ? USERS.find(u => u.id === assigneeId) : null;

      for (const group of deliverableGroups) {
        const pkg: TypeTaskPackage = {
          id: `ttp-dynamic-${project.id}-${group.type}`,
          projectId: project.id,
          briefId: quest.id,
          deliverableType: group.type,
          deliverableItems: group.items,
          assigneeId,
          assigneeName: assignee?.name || "待分配",
          promisedAt: dispatch?.committedDeliveryDate ? new Date(dispatch.committedDeliveryDate).toISOString() : null,
          estimatedWorkingHours: null,
          actualWorkingHours: null,
          assetCategory: "",
          assignmentNote: "",
          status: "待提交",
          currentVersion: null,
          fileLinks: [],
          uploadedFiles: [],
          latestFeedback: null,
          submissions: [],
          signoffHistory: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const existing = map.get(project.id) || [];
        map.set(project.id, [...existing, pkg]);
      }
    }

    return map;
  }, [typeTaskPackages, projects, allQuests, projectByBriefId]);

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: PAGE_BG, padding: "28px 40px" }}>
      <div className="flex items-start justify-between gap-[24px]" style={{ marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: TEXT_MAIN, letterSpacing: "-0.4px" }}>需求分发中心</div>
          <div style={{ marginTop: 8, maxWidth: 720, fontSize: 13, lineHeight: 1.7, color: TEXT_SUB }}>
            接收并处理需求方提交的 Brief，按交付物类型分配执行成员与承诺交付时间，确认后自动生成项目与对应交付任务。
          </div>
        </div>
        <div className="flex items-center gap-[10px] shrink-0" style={{ paddingTop: 2 }}>
          <button
            type="button"
            onClick={() => setShowTemplate(true)}
            className="transition-all"
            style={{ height: 36, padding: "0 14px", borderRadius: 12, background: "#fff", border: "1px solid rgba(239,68,68,0.35)", color: RED, fontSize: 13, fontWeight: 800, cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.06)")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#fff")}
          >
            查看表单模板
          </button>
          <button
            type="button"
            onClick={copyLink}
            className="transition-all"
            style={{ height: 36, padding: "0 14px", borderRadius: 12, background: RED, color: "#fff", fontSize: 13, fontWeight: 800, border: "none", cursor: "pointer", boxShadow: "0 12px 28px rgba(239,68,68,0.22)" }}
          >
            {linkCopied ? "链接已复制" : "复制表单链接"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-[16px]" style={{ marginBottom: 16 }}>
        <div style={{ borderRadius: 26, padding: "18px 18px", background: "linear-gradient(135deg, #ef4444 0%, #d71920 100%)", color: "#fff", boxShadow: "0 22px 60px rgba(15, 23, 42, 0.08)" }}>
          <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.95 }}>待分配 Brief</div>
          <div style={{ fontSize: 40, fontWeight: 900, marginTop: 8, lineHeight: 1 }}>{stats.pending}</div>
          <div style={{ fontSize: 12, fontWeight: 700, marginTop: 10, opacity: 0.9 }}>等待项目管理员分配交付任务</div>
        </div>
        <div style={{ borderRadius: 26, padding: "18px 18px", background: "#fff", border: `1px solid ${BORDER_WEAK}`, boxShadow: "0 22px 60px rgba(15, 23, 42, 0.08)" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: TEXT_MAIN }}>待分配</div>
          <div style={{ fontSize: 36, fontWeight: 900, color: TEXT_MAIN, marginTop: 10, lineHeight: 1 }}>{stats.pending}</div>
          <div style={{ fontSize: 12, color: TEXT_SUB, fontWeight: 700, marginTop: 10 }}>尚未生成项目</div>
        </div>
        <div style={{ borderRadius: 26, padding: "18px 18px", background: "#fff", border: `1px solid ${BORDER_WEAK}`, boxShadow: "0 22px 60px rgba(15, 23, 42, 0.08)" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: TEXT_MAIN }}>已转项目</div>
          <div style={{ fontSize: 36, fontWeight: 900, color: TEXT_MAIN, marginTop: 10, lineHeight: 1 }}>{stats.generated}</div>
          <div style={{ fontSize: 12, color: TEXT_SUB, fontWeight: 700, marginTop: 10 }}>已生成项目记录</div>
        </div>
        <div style={{ borderRadius: 26, padding: "18px 18px", background: "#fff", border: `1px solid ${BORDER_WEAK}`, boxShadow: "0 22px 60px rgba(15, 23, 42, 0.08)" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: TEXT_MAIN }}>高频交付类型</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: TEXT_MAIN, marginTop: 12, lineHeight: 1.1 }}>{stats.commonDeliverable}</div>
          <div style={{ fontSize: 12, color: TEXT_SUB, fontWeight: 700, marginTop: 10 }}>当前 Brief 中最常出现</div>
        </div>
      </div>

      <div style={{ borderRadius: 28, background: "#fff", border: `1px solid ${BORDER_WEAK}`, boxShadow: "0 22px 60px rgba(15, 23, 42, 0.08)", overflow: "hidden" }}>
        <div className="flex items-center justify-between" style={{ padding: "16px 18px", borderBottom: `1px solid ${BORDER_WEAK}`, background: "#fff" }}>
          <div className="flex items-center gap-[10px]">
            <QuestionnairesTabButton label="全部 Brief" active={activeTab === "all"} onClick={() => setActiveTab("all")} />
            <QuestionnairesTabButton label="待分配" active={activeTab === "pending"} onClick={() => setActiveTab("pending")} />
            <QuestionnairesTabButton label="已转项目" active={activeTab === "generated"} onClick={() => setActiveTab("generated")} />
          </div>
          <div className="flex items-center gap-[10px]">
            <QuestionnairesFilterButton label="优先级" />
            <QuestionnairesFilterButton label="交付类型" />
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 980, borderCollapse: "separate", borderSpacing: 0 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {[
                  { label: "需求", w: 320 },
                  { label: "品牌/需求方", w: 220 },
                  { label: "交付物", w: 140 },
                  { label: "提交日期", w: 140 },
                  { label: "分配/状态", w: 260 },
                  { label: "操作", w: 260 },
                ].map(h => (
                  <th key={h.label} style={{ textAlign: "left", fontSize: 12, color: "#94a3b8", fontWeight: 800, padding: "14px 18px", borderBottom: `1px solid ${BORDER_WEAK}`, width: h.w }}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "42px 18px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
                    暂无 Brief
                  </td>
                </tr>
              ) : (
                shown.map(q => {
                  const status = getBriefStatus(q);
                  const brandTeam = getBrandTeam(q);
                  const project = projectByBriefId.get(q.id) || null;
                  const projectPackages = project ? (packagesByProjectId.get(project.id) || []) : [];
                  const deliverableEntries = getDeliverableEntries(q);
                  const priority = getPriorityLabel(q);
                  const priorityPill = getPriorityPill(priority);
                  const dispatch = getDispatchDisplay(q);
                  const avatarIds = projectPackages.length > 0 ? getAssigneeAvatarGroup(projectPackages) : (dispatch?.teamMemberIds || []);
                  const progress = projectPackages.length > 0 ? getTypeTaskPackageProgress(projectPackages) : null;
                  const generatedStatus = projectPackages.length > 0 ? getProjectStatusFromTypeTaskPackages(projectPackages) : null;

                  return (
                    <tr key={q.id} style={{ borderBottom: `1px solid ${BORDER_WEAK}`, height: 110 }}>
                      <td style={{ padding: "18px 18px", verticalAlign: "middle" }}>
                        <div style={{ fontSize: 15, fontWeight: 900, color: TEXT_MAIN }}>{q.title}</div>
                        <div style={{ marginTop: 6, fontSize: 12, color: TEXT_SUB, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
                          {q.description}
                        </div>
                      </td>
                      <td style={{ padding: "18px 18px", verticalAlign: "middle" }}>
                        <div className="flex items-center gap-[10px]">
                          <Avatar label={getInitial(brandTeam)} color={brandTeam === "-" ? "#94a3b8" : BLUE} />
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: TEXT_MAIN }}>{brandTeam}</div>
                            <div style={{ marginTop: 4, fontSize: 12, color: TEXT_SUB, fontWeight: 600 }}>{getRequesterDisplay(q)}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "18px 18px", verticalAlign: "middle" }}>
                        {deliverableEntries.length > 1 ? (
                          <div className="flex items-center" style={{ paddingLeft: 8 }}>
                            {deliverableEntries.slice(0, 3).map((entry, idx) => {
                              const visual = getDeliverableVisual(entry.label);
                              return (
                                <span
                                  key={`${q.id}-${entry.label}`}
                                  style={{ height: 26, padding: "0 10px", borderRadius: 999, background: visual.bg, color: visual.color, fontSize: 12, fontWeight: 900, display: "inline-flex", alignItems: "center", marginLeft: idx === 0 ? 0 : -18, border: "2px solid #fff", zIndex: 10 - idx }}
                                >
                                  {idx === 0 ? `${entry.label} × ${entry.count}` : ""}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span
                            style={{ height: 26, padding: "0 10px", borderRadius: 999, background: getDeliverableVisual(deliverableEntries[0]?.label || "其他").bg, color: getDeliverableVisual(deliverableEntries[0]?.label || "其他").color, fontSize: 12, fontWeight: 900, display: "inline-flex", alignItems: "center" }}
                          >
                            {(deliverableEntries[0]?.label || "其他")} × {(deliverableEntries[0]?.count || 1)}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "18px 18px", verticalAlign: "middle" }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: TEXT_MAIN }}>{formatYmd(getBriefRequestDate(q))}</div>
                        <div style={{ marginTop: 8 }}>
                          <Pill text={priorityPill.text} bg={priorityPill.bg} color={priorityPill.color} />
                        </div>
                      </td>
                      <td style={{ padding: "18px 18px", verticalAlign: "middle" }}>
                        {status === "pending" ? (
                          <>
                            <Pill text="待分配" bg="rgba(239,68,68,0.12)" color={RED} />
                            <div style={{ marginTop: 8, fontSize: 12, color: TEXT_SUB, fontWeight: 700 }}>暂未分配成员</div>
                          </>
                        ) : status === "canceled" ? (
                          <>
                            <Pill text="已取消" bg="rgba(148,163,184,0.22)" color="#64748b" />
                            <div style={{ marginTop: 8, fontSize: 12, color: TEXT_SUB, fontWeight: 700 }}>需求已取消</div>
                          </>
                        ) : (
                          <>
                            <Pill text="已转项目" bg="rgba(22,163,74,0.12)" color={GREEN} />
                            <div className="flex items-center gap-[8px]" style={{ marginTop: 10, flexWrap: "wrap" }}>
                              {avatarIds.length > 0 ? avatarIds.map((id, index) => {
                                const user = USERS.find(u => u.id === id) || null;
                                if (!user) return null;
                                return (
                                  <div key={`${q.id}-${id}`} style={{ marginLeft: index === 0 ? 0 : -8, border: "2px solid #fff", borderRadius: 999 }}>
                                    <Avatar label={getInitial(user.name)} color={user.avatar || GREEN} />
                                  </div>
                                );
                              }) : (
                                <div style={{ fontSize: 13, color: TEXT_MAIN, fontWeight: 800 }}>未分配</div>
                              )}
                            </div>
                            {progress ? (
                              <div style={{ marginTop: 10, fontSize: 12, color: TEXT_SUB, fontWeight: 700 }}>
                                {progress.label} · 项目状态：{generatedStatus}
                              </div>
                            ) : (
                              <div style={{ marginTop: 10, fontSize: 12, color: TEXT_SUB, fontWeight: 700 }}>暂无交付任务数据</div>
                            )}
                          </>
                        )}
                      </td>
                      <td style={{ padding: "18px 14px", verticalAlign: "middle" }}>
                        <div className="flex items-center justify-end gap-[6px]" style={{ flexWrap: "nowrap" }}>
                          {status === "pending" ? (
                            isLeader ? (
                              <>
                                <PrimaryButton text="分配任务" onClick={() => setAssignId(q.id)} bg={RED} />
                                <OutlineButton text="详情" onClick={() => setDetailId(q.id)} />
                              </>
                            ) : (
                              <OutlineButton text="详情" onClick={() => setDetailId(q.id)} />
                            )
                          ) : status === "canceled" ? (
                            <OutlineButton text="详情" onClick={() => setDetailId(q.id)} />
                          ) : (
                            <>
                              <PrimaryButton
                                text="查看项目"
                                onClick={() => {
                                  const hasProject = tasks.some(task => task.questionnaireId === q.id);
                                  onNavigate?.(hasProject ? `tasks?source=${encodeURIComponent(q.id)}` : "tasks");
                                }}
                                bg={GREEN}
                              />
                              {isLeader && <OutlineButton text="调整分配" onClick={() => setAssignId(q.id)} color={BLUE} />}
                              <OutlineButton text="详情" onClick={() => setDetailId(q.id)} />
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showTemplate && <QuestionnaireForm mode="modal" onCancel={() => setShowTemplate(false)} onSubmitted={() => setShowTemplate(false)} />}

      {selectedDetail && (() => {
        const detail = buildReadonlyFormData(selectedDetail);
        return (
          <QuestionnaireForm
            mode="modal"
            readonly
            headerTitle="Brief 详情"
            initialData={detail.data}
            initialFiles={detail.files}
            onCancel={() => setDetailId(null)}
          />
        );
      })()}

      {selectedAssign && (
        <AssignModal
          quest={selectedAssign}
          isLeader={isLeader}
          currentUserId={currentUser?.id || ""}
          isAdjusting={selectedAssign.status === "ASSIGNED"}
          onClose={() => setAssignId(null)}
          onSubmit={(payload) => {
            const params = {
              questionnaireId: selectedAssign.id,
              packages: payload.packages,
              assignerId: currentUser?.id || "",
              resolvedDeliverableGroups: payload.resolvedDeliverableGroups,
            };
            if (selectedAssign.status === "ASSIGNED") return updateBriefDispatch(params);
            return dispatchBrief(params);
          }}
        />
      )}
    </div>
  );
}

function AssignModal({
  quest,
  isLeader,
  currentUserId,
  isAdjusting,
  onClose,
  onSubmit,
}: {
  quest: Questionnaire;
  isLeader: boolean;
  currentUserId: string;
  isAdjusting?: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    packages: Array<{
      deliverableType: string;
      assigneeId: string;
      promisedAt: string;
      estimatedWorkingHours: number | null;
      assetCategory: string;
      assignmentNote: string;
    }>;
    resolvedDeliverableGroups: DeliverableTypeGroup[];
  }) => { ok: true } | { ok: false; error: string };
}) {
  const { projects, typeTaskPackages, tasks } = useStore();
  const resolvedDeliverableGroups = useMemo(() => getDeliverableGroups(quest), [quest]);
  const dispatchInfo = useMemo(() => getDispatchInfo(quest), [quest]);
  const existingProject = useMemo(() => projects.find(project => project.briefId === quest.id) || null, [projects, quest.id]);
  const existingPackages = useMemo(
    () => existingProject ? typeTaskPackages.filter(pkg => pkg.projectId === existingProject.id) : [],
    [existingProject, typeTaskPackages]
  );
  const legacyTask = useMemo(() => tasks.find(task => task.questionnaireId === quest.id) || null, [tasks, quest.id]);
  const buildPackageForms = () => resolvedDeliverableGroups.map(group => {
    const existing = existingPackages.find(pkg => pkg.deliverableType === group.type) || null;
    const fallbackTask: Task | null = existing ? null : legacyTask;
    return {
      deliverableType: group.type,
      assigneeId: existing?.assigneeId || fallbackTask?.assigneeId || fallbackTask?.primaryAssigneeId || dispatchInfo?.teamMemberIds?.[0] || "",
      promisedAt: existing?.promisedAt
        ? existing.promisedAt.slice(0, 10)
        : toDateInputValue(fallbackTask?.committedDeliveryDate || fallbackTask?.dueDate || dispatchInfo?.committedDeliveryDate || dispatchInfo?.internalDueDate || ""),
      estimatedWorkingHours: existing?.estimatedWorkingHours != null
        ? String(existing.estimatedWorkingHours)
        : fallbackTask?.estimatedWorkingHours != null
          ? String(fallbackTask.estimatedWorkingHours)
          : "",
      assetCategory: existing?.assetCategory || fallbackTask?.assetType || fallbackTask?.workType || "",
      assignmentNote: existing?.assignmentNote || dispatchInfo?.managerNote || fallbackTask?.description || "",
      expanded: false,
    };
  });
  const [packageForms, setPackageForms] = useState(buildPackageForms);
  const [error, setError] = useState<string | null>(null);

  const brandTeam = getBrandTeam(quest);
  const deliverable = resolvedDeliverableGroups.map(group => `${group.type} × ${group.items.length}`).join("，") || "-";
  const members = USERS;
  const hasIncompleteRequired = packageForms.some(item => !item.assigneeId || !item.promisedAt);
  const selectedAssigneeCount = Array.from(new Set(packageForms.map(item => item.assigneeId).filter(Boolean))).length;
  const hasDeliverableCards = packageForms.length > 0;
  const isSubmitDisabled = !isLeader || !currentUserId || !hasDeliverableCards || hasIncompleteRequired;

  useEffect(() => {
    setPackageForms(buildPackageForms());
  }, [quest.id, resolvedDeliverableGroups, existingPackages, dispatchInfo, legacyTask]);

  const handleConfirm = () => {
    if (!isLeader || !currentUserId) return;
    if (packageForms.length !== resolvedDeliverableGroups.length) {
      setError("交付任务数量与交付物类型数量不一致。");
      return;
    }
    let payload: Array<{
      deliverableType: string;
      assigneeId: string;
      promisedAt: string;
      estimatedWorkingHours: number | null;
      assetCategory: string;
      assignmentNote: string;
    }> = [];
    try {
      payload = packageForms.map(item => {
        if (!item.assigneeId) throw new Error(`请选择「${item.deliverableType}」的执行成员`);
        if (!item.promisedAt) throw new Error(`请选择「${item.deliverableType}」的承诺交付时间`);
        const promisedMs = new Date(item.promisedAt).getTime();
        if (Number.isNaN(promisedMs)) throw new Error(`「${item.deliverableType}」的承诺交付时间格式不合法`);
        return {
          deliverableType: item.deliverableType,
          assigneeId: item.assigneeId,
          promisedAt: item.promisedAt,
          estimatedWorkingHours: item.estimatedWorkingHours.trim() ? Number(item.estimatedWorkingHours) : null,
          assetCategory: item.assetCategory.trim(),
          assignmentNote: item.assignmentNote.trim(),
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "分配信息不完整");
      return;
    }
    setError(null);
    const result = onSubmit({ packages: payload, resolvedDeliverableGroups });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    window.alert(isAdjusting ? "已更新交付任务分配。" : `已生成 1 个项目和 ${payload.length} 个交付任务。`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: "min(860px, calc(100vw - 96px))", maxHeight: "calc(100vh - 64px)", background: "#fff", borderRadius: 28, border: `1px solid ${BORDER_WEAK}`, boxShadow: "0 22px 60px rgba(15, 23, 42, 0.18)", overflow: "hidden", display: "flex", flexDirection: "column" }}
      >
        <div className="flex items-start justify-between" style={{ padding: "22px 24px", borderBottom: `1px solid ${BORDER_WEAK}` }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: TEXT_MAIN }}>{isAdjusting ? "调整交付任务分配" : "分配交付任务"}</div>
            <div style={{ marginTop: 8, fontSize: 13, color: TEXT_SUB, lineHeight: 1.7 }}>
              系统会按交付物类型分配执行任务。每个交付物类型仅分配 1 名执行成员，并设置 1 个承诺交付时间。
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ width: 40, height: 40, borderRadius: 14, border: `1px solid ${BORDER}`, background: "#fff", fontSize: 18, color: "#6b7280" }}>×</button>
        </div>

        <div style={{ padding: 24, overflowY: "auto" }}>
          <div style={{ background: PAGE_BG, border: `1px solid ${BORDER_WEAK}`, borderRadius: 18, padding: 16 }}>
            <div className="grid grid-cols-2 gap-[14px]">
              {[
                { k: "需求名称", v: quest.title },
                { k: "品牌/团队", v: brandTeam },
                { k: "交付物摘要", v: deliverable },
                { k: "提交日期", v: formatYmd(getBriefRequestDate(quest)) },
                { k: "需求方期望截止日期", v: formatYmd(quest.deadline) },
              ].map(it => (
                <div key={it.k}>
                  <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 900, letterSpacing: "0.2px" }}>{it.k}</div>
                  <div style={{ marginTop: 6, fontSize: 14, color: TEXT_MAIN, fontWeight: 900 }}>{it.v}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 13, color: TEXT_MAIN, fontWeight: 900, marginBottom: 10 }}>按交付物类型分配</div>
            <div className="flex flex-col gap-[12px]">
              {packageForms.map((item, index) => {
                const group = resolvedDeliverableGroups.find(entry => entry.type === item.deliverableType) || null;
                const itemSummary = group
                  ? group.items
                    .slice(0, 2)
                    .map(detail => detail.name.trim() || "暂无交付物明细")
                    .join(" / ")
                  : "-";
                return (
                  <div key={item.deliverableType} style={{ border: `1px solid ${BORDER}`, borderRadius: 18, background: "#fff", padding: 14 }}>
                    <div className="flex items-center justify-between gap-[12px]">
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 900, color: TEXT_MAIN }}>{item.deliverableType} × {group?.items.length || 0}</div>
                        <div style={{ marginTop: 6, fontSize: 12, color: TEXT_SUB, fontWeight: 700 }}>{itemSummary || "-"}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPackageForms(prev => prev.map((row, rowIndex) => rowIndex === index ? { ...row, expanded: !row.expanded } : row))}
                        style={{ height: 30, padding: "0 12px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "#fff", fontSize: 12, color: TEXT_MAIN, fontWeight: 800 }}
                      >
                        {item.expanded ? "收起明细" : "查看明细"}
                      </button>
                    </div>

                    {item.expanded && group ? (
                      <div style={{ marginTop: 12, padding: 12, borderRadius: 14, background: PAGE_BG, border: `1px solid ${BORDER_WEAK}` }}>
                        {group.items.map((detail, detailIndex) => (
                          <div key={`${item.deliverableType}-${detailIndex}`} style={{ display: "grid", gap: 6 }}>
                            <div className="flex">
                              <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800, width: 72 }}>交付内容：</span>
                              <span style={{ fontSize: 12, color: TEXT_MAIN }}>{detail.name.trim() || "暂无详细说明"}</span>
                            </div>
                            <div className="flex">
                              <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800, width: 72 }}>数量：</span>
                              <span style={{ fontSize: 12, color: TEXT_MAIN }}>{detail.quantity}</span>
                            </div>
                            <div className="flex">
                              <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800, width: 72 }}>尺寸：</span>
                              <span style={{ fontSize: 12, color: TEXT_MAIN }}>{detail.size || "未填写"}</span>
                            </div>
                            <div className="flex">
                              <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800, width: 72 }}>输出格式：</span>
                              <span style={{ fontSize: 12, color: TEXT_MAIN }}>{detail.outputFormat || "未填写"}</span>
                            </div>
                            <div className="flex">
                              <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800, width: 72 }}>使用场景：</span>
                              <span style={{ fontSize: 12, color: TEXT_MAIN }}>{detail.usageScenario || "未填写"}</span>
                            </div>
                            <div className="flex">
                              <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800, width: 72 }}>备注：</span>
                              <span style={{ fontSize: 12, color: TEXT_MAIN }}>{detail.remark || "未填写"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <div className="grid grid-cols-2 gap-[12px]" style={{ marginTop: 12 }}>
                      <div>
                        <div style={{ fontSize: 12, color: TEXT_MAIN, fontWeight: 900 }}>执行成员 <span style={{ color: RED }}>*</span></div>
                        <select
                          value={item.assigneeId}
                          onChange={e => setPackageForms(prev => prev.map((row, rowIndex) => rowIndex === index ? { ...row, assigneeId: e.target.value } : row))}
                          style={{ marginTop: 8, width: "100%", height: 42, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "0 12px", background: "#fff", color: TEXT_MAIN, fontSize: 13 }}
                        >
                          <option value="">请选择成员</option>
                          {members.map(user => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div style={{ fontSize: 12, color: TEXT_MAIN, fontWeight: 900 }}>承诺交付时间 <span style={{ color: RED }}>*</span></div>
                        <input
                          type="date"
                          value={item.promisedAt}
                          onChange={e => setPackageForms(prev => prev.map((row, rowIndex) => rowIndex === index ? { ...row, promisedAt: e.target.value } : row))}
                          style={{ marginTop: 8, width: "100%", height: 42, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "0 12px", background: "#fff", color: TEXT_MAIN, fontSize: 13 }}
                        />
                      </div>

                      <div>
                        <div style={{ fontSize: 12, color: TEXT_MAIN, fontWeight: 900 }}>预估工时</div>
                        <input
                          value={item.estimatedWorkingHours}
                          onChange={e => setPackageForms(prev => prev.map((row, rowIndex) => rowIndex === index ? { ...row, estimatedWorkingHours: e.target.value } : row))}
                          placeholder="选填，如 8"
                          style={{ marginTop: 8, width: "100%", height: 42, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "0 12px", background: "#fff", color: TEXT_MAIN, fontSize: 13 }}
                        />
                      </div>

                      <div>
                        <div style={{ fontSize: 12, color: TEXT_MAIN, fontWeight: 900 }}>素材类别</div>
                        <input
                          value={item.assetCategory}
                          onChange={e => setPackageForms(prev => prev.map((row, rowIndex) => rowIndex === index ? { ...row, assetCategory: e.target.value } : row))}
                          placeholder="选填，如 KV / 社媒 / 电商"
                          style={{ marginTop: 8, width: "100%", height: 42, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "0 12px", background: "#fff", color: TEXT_MAIN, fontSize: 13 }}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 12, color: TEXT_MAIN, fontWeight: 900 }}>分配备注</div>
                      <textarea
                        value={item.assignmentNote}
                        onChange={e => setPackageForms(prev => prev.map((row, rowIndex) => rowIndex === index ? { ...row, assignmentNote: e.target.value } : row))}
                        placeholder="选填，补充给执行成员的任务说明"
                        style={{ marginTop: 8, width: "100%", height: 80, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "10px 12px", outline: "none", fontSize: 13, color: TEXT_MAIN, background: "#fff", resize: "none", lineHeight: 1.6 }}
                      />
                    </div>
                  </div>
                );
              })}
              {packageForms.length === 0 ? (
                <div style={{ border: `1px solid ${BORDER}`, borderRadius: 18, background: "#fff", padding: 16, fontSize: 13, color: TEXT_SUB, fontWeight: 700 }}>
                  当前 Brief 未解析到可分配的交付任务，请检查交付物类型配置。
                </div>
              ) : null}
            </div>
          </div>

          <div style={{ marginTop: 14, background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.18)", padding: "12px 14px", borderRadius: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: TEXT_MAIN }}>确认后结果摘要</div>
            <div style={{ marginTop: 8, fontSize: 12, color: TEXT_SUB, fontWeight: 700, lineHeight: 1.6 }}>
              <div>将生成 1 个项目</div>
              <div>将生成 {packageForms.length} 个交付任务</div>
              {hasDeliverableCards ? (
                hasIncompleteRequired
                  ? <div>请先完成所有交付任务的成员和承诺时间设置</div>
                  : <div>将通知 {selectedAssigneeCount} 名执行成员</div>
              ) : (
                <div>请先检查 Brief 的交付物配置</div>
              )}
            </div>
          </div>

          {error && (
            <div style={{ marginTop: 14, fontSize: 12, fontWeight: 800, color: RED, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", padding: "10px 12px", borderRadius: 14 }}>
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-[10px]" style={{ padding: "14px 18px", borderTop: `1px solid ${BORDER_WEAK}`, background: "#fff" }}>
          <button type="button" onClick={onClose} style={{ height: 38, padding: "0 14px", borderRadius: 12, background: "#fff", border: `1px solid ${BORDER}`, color: TEXT_MAIN, fontSize: 13, fontWeight: 800 }}>
            取消
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitDisabled}
            style={{ height: 38, padding: "0 16px", borderRadius: 12, background: RED, border: "none", color: "#fff", fontSize: 13, fontWeight: 900, opacity: isSubmitDisabled ? 0.5 : 1, cursor: isSubmitDisabled ? "not-allowed" : "pointer" }}
          >
            {isAdjusting ? "确认并更新分配" : "确认分配并创建项目"}
          </button>
        </div>
      </div>
    </div>
  );
}
