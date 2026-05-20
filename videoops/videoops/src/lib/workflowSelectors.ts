import { USERS, type Questionnaire, type Review, type SubmissionRecord, type Task, type DeliverableTypeGroup, type DeliverableItem, type TypeTaskPackage, type ProjectRecord, type SignoffRecord } from "./mock-data";

export type WorkflowData = {
  tasks: Task[];
  questionnaires: Questionnaire[];
  submissions: SubmissionRecord[];
  reviews: Review[];
  projects?: ProjectRecord[];
  typeTaskPackages?: TypeTaskPackage[];
  signoffRecords?: SignoffRecord[];
};

export type ProjectStatus = "制作中" | "待验收" | "已完成" | "已取消";
export type ReviewDisplayStatus = "待审核" | "已通过" | "已退回";
export type MemberTaskDisplayStatus = "待提交" | "审核中" | "需修改" | "已通过" | "已结束";

type DeliverableSummaryItem = { type: string; quantity: number };
type DeliverableItemDetail = DeliverableItem;

export type WorkbenchTrendSource = "mock" | "computed";
export type WorkbenchTrend = { pct: number; source: WorkbenchTrendSource };

export type WorkbenchMonthlySummary = {
  monthLabel: string;
  inProgressProjectCount: number;
  submittedInProgressProjectCount: number;
  submittedProjectRate: number;
  pendingDispatchCount: number;
  waitingSignoffPackageCount: number;
  revisionPackageCount: number;
  monthlyCompletedProjectCount: number;
  monthlyPassedPackageCount: number;
  pendingDispatchTrend: WorkbenchTrend;
  monthlyCompletedTrend: WorkbenchTrend;
};

export type WorkbenchKeyProject = {
  taskId: string;
  projectId: string;
  projectName: string;
  brand: string;
  stakeholder: string;
  assigneeId: string | null;
  assigneeIds: string[];
  projectStatus: ProjectStatus;
  deliverablesCount: number;
  latestReviewStatus: ReviewDisplayStatus | null;
  stageProgress: number;
  barColor: string;
  progressText: string;
  riskText: string;
  latestPromisedAt: string | null;
  passedCount: number;
  totalCount: number;
};

export type WorkbenchRiskItem = {
  taskId: string;
  title: string;
  dueDate: string;
  ms: number;
  note: string;
};

export type WorkbenchRecentRisks = {
  internal: WorkbenchRiskItem[];
  external: WorkbenchRiskItem[];
  internalCount: number;
  externalCount: number;
};

export type WorkbenchTaskDistributionItem = {
  label: string;
  count: number;
  ratio: number;
  color: string;
};

export type ProjectGanttRiskTag = "已逾期" | "即将到期" | "待审核过久" | "需修改" | "正常";

export type ProjectGanttTimelineNodeType =
  | "assigned"
  | "promised"
  | "submitted"
  | "approved"
  | "revision"
  | "current";

export type ProjectGanttTimelineNode = {
  type: ProjectGanttTimelineNodeType;
  label: string;
  date: string | null;
  note?: string | null;
  version?: string | null;
};

export type ProjectGanttRow = {
  projectId: string;
  projectCode: string;
  projectName: string;
  brandTeam: string;
  projectStatus: ProjectStatus;
  typeTaskPackageId: string;
  deliverableType: string;
  itemCount: number;
  assigneeId: string | null;
  assigneeName: string;
  promisedAt: string | null;
  packageStatus: TypeTaskPackage["status"];
  currentVersion: string | null;
  latestFeedback: string | null;
  riskTag: ProjectGanttRiskTag;
  timelineNodes: ProjectGanttTimelineNode[];
  anchorAt: string | null;
  startAt: string | null;
  endAt: string | null;
};

function safeJsonParse(text: string | null) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function toMs(dateText: string | null | undefined) {
  if (!dateText) return Number.NaN;
  const ms = new Date(dateText).getTime();
  return Number.isNaN(ms) ? Number.NaN : ms;
}

function startOfMonth(ref: Date) {
  return new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(ref: Date) {
  return new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
}

function inSameMonth(dateText: string | null | undefined, ref: Date) {
  const ms = toMs(dateText);
  if (Number.isNaN(ms)) return false;
  const d = new Date(ms);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

function daysBetween(nowMs: number, targetMs: number) {
  return Math.floor((targetMs - nowMs) / 86400000);
}

function projectStatusFromTask(task: Task): ProjectStatus {
  if (task.status === "PENDING_SIGNOFF") return "待验收";
  if (task.status === "COMPLETED") return "已完成";
  if (task.status === "CANCELED") return "已取消";
  return "制作中";
}

function isProjectLikeTask(task: Task) {
  return task.status !== "BRIEF_REVIEW";
}

function sortByStringDesc<T>(items: T[], getValue: (row: T) => string | null | undefined) {
  return items.slice().sort((a, b) => String(getValue(b) || "").localeCompare(String(getValue(a) || "")));
}

function sortByStringAsc<T>(items: T[], getValue: (row: T) => string | null | undefined) {
  return items.slice().sort((a, b) => String(getValue(a) || "").localeCompare(String(getValue(b) || "")));
}

function isNumberedVersion(version: string | null | undefined) {
  return /^V\d+$/i.test(String(version || "").trim());
}

function normalizeDeliverableType(raw: string, task: Task) {
  if (raw.includes("平面")) return "平面设计";
  if (raw.includes("线下")) return "线下物料";
  if (raw.includes("拍摄")) return "拍摄";
  if (raw.includes("文案")) return "文案";
  if (task.category === "SHOOTING") return "拍摄";
  if (task.category === "SCRIPT") return "文案";
  if (task.category === "DESIGN") return "平面设计";
  return "视频";
}

function isInternalTeamName(text: string) {
  const v = String(text || "").trim();
  if (!v) return false;
  const lowered = v.toLowerCase();
  const blocked = [
    "retail team",
    "retail",
    "hr team",
    "hr",
    "sales team",
    "sales",
    "marketing team",
    "marketing",
    "e-commerce team",
    "e-commerce",
    "finance team",
    "finance",
    "legal team",
    "legal",
    "channel team",
    "function team",
    "corporate",
    "training team",
    "brand team",
  ];
  if (blocked.includes(lowered)) return true;
  if (v.includes("Team")) return true;
  if (v.includes("部门")) return true;
  if (v.includes("内部")) return true;
  return false;
}

function buildDeliverables(task: Task, questionnaire: Questionnaire | null): DeliverableSummaryItem[] {
  const meta = safeJsonParse(questionnaire?.specialNotes || null);
  const deliverables =
    meta && typeof meta === "object" && !Array.isArray(meta)
      ? (meta as { deliverables?: Record<string, unknown> }).deliverables
      : null;

  if (deliverables && typeof deliverables === "object" && !Array.isArray(deliverables)) {
    const items = Object.entries(deliverables)
      .map(([key, value]) => {
        const quantity = Array.isArray(value) && value.length > 0 ? value.length : 1;
        return { type: normalizeDeliverableType(key, task), quantity };
      })
      .filter(row => row.quantity > 0);
    if (items.length > 0) return items;
  }

  const fallbackType = normalizeDeliverableType(String(task.assetType || ""), task);
  return [{ type: fallbackType, quantity: 1 }];
}

function toDeliverableItem(row: Record<string, unknown>): DeliverableItemDetail {
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
    quantity: (() => {
      if (typeof row.quantity === "number" && Number.isFinite(row.quantity)) return row.quantity;
      const parsed = Number(String(row.quantity || "").trim());
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
    })(),
    size: typeof row.size === "string" ? row.size : "",
    outputFormat: typeof row.outputFormat === "string"
      ? row.outputFormat
      : typeof row.format === "string"
        ? row.format
        : "",
    usageScenario: typeof row.usageScenario === "string"
      ? row.usageScenario
      : typeof row.usage === "string"
        ? row.usage
        : "",
    remark: typeof row.remark === "string"
      ? row.remark
      : typeof row.note === "string"
        ? row.note
        : "",
  };
}

function getQuestionnaireDeliverableGroups(questionnaire: Questionnaire | null): DeliverableTypeGroup[] {
  if (!questionnaire) return [];
  if (Array.isArray(questionnaire.deliverableTypes) && questionnaire.deliverableTypes.length > 0) {
    return questionnaire.deliverableTypes;
  }

  const meta = safeJsonParse(questionnaire.specialNotes || null);
  const deliverableTypes =
    meta && typeof meta === "object" && !Array.isArray(meta)
      ? (meta as { deliverableTypes?: unknown }).deliverableTypes
      : null;
  if (Array.isArray(deliverableTypes)) {
    return deliverableTypes.flatMap(group => {
      if (!group || typeof group !== "object" || Array.isArray(group)) return [];
      const safe = group as Record<string, unknown>;
      const type = typeof safe.type === "string" ? safe.type.trim() : "";
      const items = Array.isArray(safe.items)
        ? safe.items
          .filter(item => item && typeof item === "object" && !Array.isArray(item))
          .map(item => toDeliverableItem(item as Record<string, unknown>))
        : [];
      return type ? [{ type, items }] : [];
    });
  }

  const legacyDeliverables =
    meta && typeof meta === "object" && !Array.isArray(meta)
      ? (meta as { deliverables?: Record<string, unknown> }).deliverables
      : null;
  if (legacyDeliverables && typeof legacyDeliverables === "object" && !Array.isArray(legacyDeliverables)) {
    return Object.entries(legacyDeliverables)
      .map(([type, rows]) => ({
        type,
        items: Array.isArray(rows)
          ? rows
            .filter(row => row && typeof row === "object" && !Array.isArray(row))
            .map(row => toDeliverableItem(row as Record<string, unknown>))
          : [],
      }))
      .filter(group => group.type && group.items.length > 0);
  }

  return [];
}

export function getDeliverableTypeSummary(questionnaire: Questionnaire | null) {
  return getQuestionnaireDeliverableGroups(questionnaire).map(group => ({
    type: group.type,
    quantity: group.items.length,
  }));
}

export function getProjectStatusFromTypeTaskPackages(typeTaskPackages: TypeTaskPackage[]): ProjectStatus {
  if (typeTaskPackages.length === 0) return "制作中";
  if (typeTaskPackages.every(pkg => pkg.status === "已通过")) return "已完成";
  const hasEnded = typeTaskPackages.some(pkg => pkg.status === "已结束");
  const hasPending = typeTaskPackages.some(pkg => pkg.status === "待提交" || pkg.status === "需修改");
  const hasWaitingSignoff = typeTaskPackages.some(pkg => pkg.status === "待需求方审核");
  if (typeTaskPackages.every(pkg => pkg.status === "已结束") || (hasEnded && !hasPending && !hasWaitingSignoff)) return "已取消";
  if (!hasPending && hasWaitingSignoff) return "待验收";
  return "制作中";
}

export function getTypeTaskPackageProgress(typeTaskPackages: TypeTaskPackage[]) {
  const total = typeTaskPackages.length;
  const passed = typeTaskPackages.filter(pkg => pkg.status === "已通过").length;
  return {
    total,
    passed,
    label: total > 0 ? `${passed} / ${total} 已通过` : "0 / 0 已通过",
  };
}

export function getAssigneeAvatarGroup(typeTaskPackages: TypeTaskPackage[]) {
  return Array.from(new Set(typeTaskPackages.map(pkg => pkg.assigneeId).filter((id): id is string => Boolean(id))));
}

export function getProjectLatestPromisedAt(typeTaskPackages: TypeTaskPackage[]) {
  const dates = typeTaskPackages
    .map(pkg => String(pkg.promisedAt || "").trim())
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a));
  return dates[0] || null;
}

export function getTypeTaskPackageSubmissions(typeTaskPackageId: string, submissions: SubmissionRecord[]) {
  return sortByStringDesc(
    submissions.filter(item => item.typeTaskPackageId === typeTaskPackageId),
    item => item.submittedAt
  );
}

export function getLatestTypeTaskPackageSubmission(typeTaskPackageId: string, submissions: SubmissionRecord[]) {
  return getTypeTaskPackageSubmissions(typeTaskPackageId, submissions)[0] || null;
}

export function getTypeTaskPackageSignoffHistory(typeTaskPackageId: string, signoffRecords: SignoffRecord[]) {
  return sortByStringDesc(
    signoffRecords.filter(item => item.typeTaskPackageId === typeTaskPackageId),
    item => item.reviewedAt
  );
}

export function getLatestTypeTaskPackageFeedback(typeTaskPackage: TypeTaskPackage, signoffRecords: SignoffRecord[]) {
  if (typeTaskPackage.latestFeedback) return typeTaskPackage.latestFeedback;
  const latest = getTypeTaskPackageSignoffHistory(typeTaskPackage.id, signoffRecords)[0] || null;
  return latest?.feedback || null;
}

function getProjectStatusForGantt(project: ProjectRecord, packages: TypeTaskPackage[]) {
  if (project.status === "已取消" || Boolean(project.canceledAt)) return "已取消" as const;
  if (project.status === "已完成" || Boolean(project.completedAt)) return "已完成" as const;
  return getProjectStatusFromTypeTaskPackages(packages);
}

export function getTypeTaskPackageRiskTag(
  typeTaskPackage: TypeTaskPackage,
  data: WorkflowData,
  options?: { now?: Date }
): ProjectGanttRiskTag {
  const nowMs = (options?.now || new Date()).getTime();
  const dueMs = toMs(typeTaskPackage.promisedAt);
  const latestSubmission = getLatestTypeTaskPackageSubmission(typeTaskPackage.id, data.submissions);
  const latestSignoff = getTypeTaskPackageSignoffHistory(
    typeTaskPackage.id,
    data.signoffRecords || []
  )[0] || null;

  if (
    !Number.isNaN(dueMs)
    && dueMs < nowMs
    && typeTaskPackage.status !== "已通过"
    && typeTaskPackage.status !== "已结束"
  ) {
    return "已逾期";
  }

  if (typeTaskPackage.status === "需修改") return "需修改";

  if (typeTaskPackage.status === "待需求方审核" && latestSubmission && !latestSignoff) {
    const submittedMs = toMs(latestSubmission.submittedAt);
    if (!Number.isNaN(submittedMs) && Math.floor((nowMs - submittedMs) / 86400000) >= 3) {
      return "待审核过久";
    }
  }

  if (
    !Number.isNaN(dueMs)
    && dueMs >= nowMs
    && Math.floor((dueMs - nowMs) / 86400000) <= 2
    && typeTaskPackage.status !== "已通过"
    && typeTaskPackage.status !== "已结束"
  ) {
    return "即将到期";
  }

  return "正常";
}

export function getProjectGanttRows(
  data: WorkflowData,
  options?: { now?: Date }
): ProjectGanttRow[] {
  if (!Array.isArray(data.projects) || !Array.isArray(data.typeTaskPackages)) return [];

  const projectById = new Map(data.projects.map(project => [project.id, project] as const));
  const packagesByProject = new Map<string, TypeTaskPackage[]>();
  data.typeTaskPackages.forEach(pkg => {
    const current = packagesByProject.get(pkg.projectId) || [];
    current.push(pkg);
    packagesByProject.set(pkg.projectId, current);
  });

  return sortByStringDesc(data.typeTaskPackages, pkg => pkg.createdAt).map(pkg => {
    const project = projectById.get(pkg.projectId);
    const projectPackages = packagesByProject.get(pkg.projectId) || [pkg];
    const signoffHistory = getTypeTaskPackageSignoffHistory(pkg.id, data.signoffRecords || []);
    const submissions = sortByStringAsc(
      getTypeTaskPackageSubmissions(pkg.id, data.submissions),
      item => item.submittedAt
    );
    const latestFeedback = getLatestTypeTaskPackageFeedback(pkg, data.signoffRecords || []);
    const promisedLabel = pkg.promisedAt
      ? (() => {
          const d = new Date(pkg.promisedAt);
          if (Number.isNaN(d.getTime())) return "承诺交付";
          return `承诺交付 ${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
        })()
      : "未设置承诺时间";

    const timelineNodes: ProjectGanttTimelineNode[] = [
      {
        type: "assigned",
        label: "已分配",
        date: pkg.createdAt || project?.createdAt || null,
      },
      {
        type: "promised",
        label: promisedLabel,
        date: pkg.promisedAt || null,
      },
      ...submissions.map(item => ({
        type: "submitted" as const,
        label: `${item.version} 提交`,
        date: item.submittedAt || null,
        note: item.submitNote || item.note || null,
        version: item.version,
      })),
      ...sortByStringAsc(signoffHistory, item => item.reviewedAt).map(item => ({
        type: item.result === "passed" ? ("approved" as const) : ("revision" as const),
        label: item.result === "passed" ? "需求方通过" : "需求方退回",
        date: item.reviewedAt || null,
        note: item.feedback || null,
        version: item.version,
      })),
    ];

    const currentDate =
      pkg.status === "待需求方审核"
        ? submissions[submissions.length - 1]?.submittedAt || pkg.updatedAt || null
        : pkg.status === "需修改" || pkg.status === "已通过"
          ? signoffHistory[0]?.reviewedAt || pkg.updatedAt || null
          : pkg.updatedAt || pkg.promisedAt || pkg.createdAt || null;

    timelineNodes.push({
      type: "current",
      label: pkg.status,
      date: currentDate,
    });

    const datedNodes = timelineNodes
      .map(node => node.date)
      .filter((value): value is string => Boolean(value))
      .sort((a, b) => a.localeCompare(b));

    return {
      projectId: pkg.projectId,
      projectCode: project?.projectCode || pkg.projectId,
      projectName: project?.projectName || "未命名项目",
      brandTeam: project?.brandTeam || "-",
      projectStatus: getProjectStatusForGantt(project || {
        id: pkg.projectId,
        projectCode: pkg.projectId,
        briefId: pkg.briefId,
        projectName: "未命名项目",
        brandTeam: "-",
        requestorName: "-",
        requestorEmail: "-",
        status: "制作中",
        typeTaskPackageIds: [pkg.id],
        createdAt: pkg.createdAt,
        completedAt: null,
        canceledAt: null,
        cancelReason: null,
      }, projectPackages),
      typeTaskPackageId: pkg.id,
      deliverableType: pkg.deliverableType,
      itemCount: pkg.deliverableItems.length,
      assigneeId: pkg.assigneeId,
      assigneeName: pkg.assigneeName || "未分配",
      promisedAt: pkg.promisedAt || null,
      packageStatus: pkg.status,
      currentVersion: pkg.currentVersion || submissions[submissions.length - 1]?.version || null,
      latestFeedback,
      riskTag: getTypeTaskPackageRiskTag(pkg, data, options),
      timelineNodes,
      anchorAt:
        datedNodes[datedNodes.length - 1]
        || pkg.promisedAt
        || pkg.updatedAt
        || pkg.createdAt
        || project?.createdAt
        || null,
      startAt: datedNodes[0] || pkg.createdAt || project?.createdAt || null,
      endAt: datedNodes[datedNodes.length - 1] || pkg.updatedAt || pkg.promisedAt || null,
    } satisfies ProjectGanttRow;
  });
}

export function getProjectTaskBreakdown(typeTaskPackages: TypeTaskPackage[]) {
  const total = typeTaskPackages.length;
  const passed = typeTaskPackages.filter(pkg => pkg.status === "已通过").length;
  const waiting = typeTaskPackages.filter(pkg => pkg.status === "待需求方审核").length;
  const todo = typeTaskPackages.filter(pkg => pkg.status === "待提交").length;
  const revise = typeTaskPackages.filter(pkg => pkg.status === "需修改").length;
  const ended = typeTaskPackages.filter(pkg => pkg.status === "已结束").length;
  return { total, passed, waiting, todo, revise, ended };
}

type V2WorkbenchProjectRow = {
  project: ProjectRecord;
  packages: TypeTaskPackage[];
};

function hasV2ProjectData(data: WorkflowData): data is WorkflowData & {
  projects: ProjectRecord[];
  typeTaskPackages: TypeTaskPackage[];
} {
  return Array.isArray(data.projects) && Array.isArray(data.typeTaskPackages) && data.projects.length > 0;
}

function getNormalizedProjectStatus(project: ProjectRecord, packages: TypeTaskPackage[]) {
  if (project.status === "已取消" || Boolean(project.canceledAt)) return "已取消" as const;
  if (project.status === "已完成" && Boolean(project.completedAt)) return "已完成" as const;
  return getProjectStatusFromTypeTaskPackages(packages);
}

function getV2WorkbenchRows(data: WorkflowData): V2WorkbenchProjectRow[] {
  if (!hasV2ProjectData(data)) return [];
  return data.projects.map(project => {
    const packages = data.typeTaskPackages.filter(pkg => pkg.projectId === project.id);
    const status = getNormalizedProjectStatus(project, packages);
    return {
      project: status === project.status ? project : { ...project, status },
      packages,
    };
  });
}

function isOpenTypeTaskPackage(pkg: TypeTaskPackage) {
  return pkg.status !== "已通过" && pkg.status !== "已结束";
}

function getPackageDueDiffDays(pkg: TypeTaskPackage, nowMs: number) {
  const dueMs = toMs(pkg.promisedAt);
  if (Number.isNaN(dueMs)) return null;
  return daysBetween(nowMs, dueMs);
}

function getPackageLatestSubmittedAt(pkg: TypeTaskPackage, submissions: SubmissionRecord[]) {
  return getLatestTypeTaskPackageSubmission(pkg.id, submissions)?.submittedAt || pkg.updatedAt || null;
}

function getWaitingSignoffAgeDays(pkg: TypeTaskPackage, data: WorkflowData, nowMs: number) {
  if (pkg.status !== "待需求方审核") return null;
  const submittedAt = getPackageLatestSubmittedAt(pkg, data.submissions);
  const submittedMs = toMs(submittedAt);
  if (Number.isNaN(submittedMs)) return null;
  return Math.max(0, Math.floor((nowMs - submittedMs) / 86400000));
}

function getNearestOutstandingPromisedAt(packages: TypeTaskPackage[]) {
  const candidates = packages
    .filter(isOpenTypeTaskPackage)
    .map(pkg => String(pkg.promisedAt || "").trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  return candidates[0] || null;
}

function getLatestPassedAt(pkg: TypeTaskPackage, signoffRecords: SignoffRecord[] | undefined) {
  const latestPassed = (signoffRecords || [])
    .filter(record => record.typeTaskPackageId === pkg.id && record.result === "passed")
    .sort((a, b) => String(b.reviewedAt || "").localeCompare(String(a.reviewedAt || "")))[0] || null;
  if (latestPassed?.reviewedAt) return latestPassed.reviewedAt;
  return pkg.status === "已通过" ? (pkg.updatedAt || null) : null;
}

function normalizeWorkbenchPackageType(type: string) {
  const raw = String(type || "").trim();
  if (!raw) return "其他";
  if (raw.includes("文案") || raw.toLowerCase() === "copy") return "文案";
  if (raw.includes("线下") || raw.includes("物料")) return "线下物料";
  if (raw.includes("平面")) return "平面设计";
  if (raw.includes("3D")) return "3D";
  if (raw.includes("视频") || raw.includes("拍摄")) return "视频";
  return raw;
}

function toReviewDisplayStatus(reviewStatus: string | null | undefined): ReviewDisplayStatus {
  if (reviewStatus === "APPROVED") return "已通过";
  if (reviewStatus === "REVISION_REQUESTED") return "已退回";
  return "待审核";
}

export function getProjectEntities(data: WorkflowData, taskId: string) {
  const task = data.tasks.find(t => t.id === taskId) || null;
  const questionnaire = task?.questionnaireId
    ? data.questionnaires.find(q => q.id === task.questionnaireId) || null
    : null;
  return { task, questionnaire };
}

export function getSubmissionsByTask(data: WorkflowData, taskId: string) {
  const all = sortByStringDesc(
    data.submissions.filter(s => s.taskId === taskId),
    s => s.submittedAt
  );
  const numbered = all.filter(s => isNumberedVersion(s.version));
  const latestNumbered = numbered[0] || null;
  const latestAny = all[0] || null;
  return { all, numbered, latestNumbered, latestAny };
}

export function getLatestReviewForSubmission(data: WorkflowData, submissionId: string) {
  const rel = sortByStringDesc(
    data.reviews.filter(r => r.submissionId === submissionId),
    r => r.createdAt
  );
  return rel[0] || null;
}

export function getLatestReview(data: WorkflowData, taskId: string) {
  const { latestNumbered } = getSubmissionsByTask(data, taskId);
  const review = latestNumbered ? getLatestReviewForSubmission(data, latestNumbered.id) : null;
  return { submission: latestNumbered, review };
}

export function hasPendingReview(data: WorkflowData, taskId: string) {
  const { submission, review } = getLatestReview(data, taskId);
  if (!submission) return false;
  if (!review) return true;
  return review.status === "PENDING";
}

export function getProjectStatus(data: WorkflowData, taskId: string): ProjectStatus | null {
  const { task } = getProjectEntities(data, taskId);
  if (!task) return null;
  return projectStatusFromTask(task);
}

export function canSubmitForAcceptance(data: WorkflowData, taskId: string) {
  const projectStatus = getProjectStatus(data, taskId);
  if (!projectStatus) return { ok: false as const, reason: "未找到对应项目。" };
  if (projectStatus !== "制作中") return { ok: false as const, reason: `当前项目状态为「${projectStatus}」，无法提交验收。` };

  const { submission, review } = getLatestReview(data, taskId);
  if (!submission) return { ok: false as const, reason: "当前尚未提交交付物，无法提交验收。" };
  if (!review || review.status === "PENDING") return { ok: false as const, reason: "当前版本仍在内部审核中，暂不能提交验收。" };
  if (review.status === "REVISION_REQUESTED") return { ok: false as const, reason: "当前版本已退回，请等待成员重新提交并审核通过。" };
  if (review.status === "APPROVED") return { ok: true as const };
  return { ok: false as const, reason: "当前审核状态不支持提交验收。" };
}

export function getMemberTaskDisplayStatus(data: WorkflowData, taskId: string): MemberTaskDisplayStatus {
  const { task } = getProjectEntities(data, taskId);
  if (!task) return "已结束";
  if (task.status === "COMPLETED" || task.status === "CANCELED") return "已结束";

  const { submission, review } = getLatestReview(data, taskId);
  if (!submission) return "待提交";
  if (review?.status === "REVISION_REQUESTED") return "需修改";
  if (review?.status === "APPROVED") return "已通过";
  return "审核中";
}

export function getProjectReviewDisplay(data: WorkflowData, taskId: string) {
  const { submission, review } = getLatestReview(data, taskId);
  const latestVersion = submission?.version || null;
  const latestReviewStatus: ReviewDisplayStatus | null = submission ? toReviewDisplayStatus(review?.status) : null;
  const latestReviewComment = review?.comment || null;
  const latestReviewedAt = review?.createdAt || null;
  return {
    latestVersion,
    latestReviewStatus,
    latestReviewComment,
    latestReviewedAt,
    hasPendingReview: hasPendingReview(data, taskId),
  };
}

export function getProjectDisplayFields(data: WorkflowData, taskId: string) {
  const { task, questionnaire } = getProjectEntities(data, taskId);
  if (!task) {
    return {
      ok: false as const,
      reason: "未找到对应项目。",
    };
  }

  const stakeholder = (() => {
    if (!questionnaire) return "-";
    const meta = safeJsonParse(questionnaire.specialNotes || null) as Record<string, unknown> | null;
    const team = typeof meta?.team === "string" && meta.team.trim() ? meta.team.trim() : "";
    if (team && isInternalTeamName(team)) {
      return questionnaire.requesterName ? `${team} · ${questionnaire.requesterName}` : team;
    }
    const dept = questionnaire.requesterDept && questionnaire.requesterDept.trim() ? questionnaire.requesterDept.trim() : "";
    return dept ? `${questionnaire.requesterName} · ${dept}` : questionnaire.requesterName || "-";
  })();

  const brand = (() => {
    if (typeof task.brand === "string" && task.brand.trim() && !isInternalTeamName(task.brand)) return task.brand.trim();
    const meta = safeJsonParse(questionnaire?.specialNotes || null);
    const raw = meta && typeof meta === "object" && !Array.isArray(meta) ? (meta as { brand?: unknown }).brand : null;
    if (typeof raw === "string" && raw.trim() && !isInternalTeamName(raw)) return raw.trim();
    const company = meta && typeof meta === "object" && !Array.isArray(meta) ? (meta as { company?: unknown }).company : null;
    if (company === "保乐力加") return "保乐力加";
    return "-";
  })();

  const internalDueDate = task.internalDueDate || task.dueDate || null;
  const committedDeliveryDate = task.committedDeliveryDate || task.stakeholderExpectedDueDate || questionnaire?.deadline || null;

  const deliverables = buildDeliverables(task, questionnaire);
  const deliverablesSummary = deliverables.map(d => `${d.type} × ${d.quantity}`).join(" / ");

  return {
    ok: true as const,
    taskId: task.id,
    projectCode: task.taskNumber || task.projectCode || task.id,
    projectName: task.title,
    brand,
    stakeholder,
    deliverables,
    deliverablesSummary,
    internalDueDate,
    committedDeliveryDate,
    faLink: task.faLink || null,
    faVersion: task.faVersion || null,
    projectStatus: getProjectStatus(data, taskId),
  };
}

export function getInProgressProjectCount(data: WorkflowData) {
  if (hasV2ProjectData(data)) {
    return getV2WorkbenchRows(data).filter(row => row.project.status === "制作中").length;
  }
  return data.tasks.filter(task => isProjectLikeTask(task) && projectStatusFromTask(task) === "制作中").length;
}

export function getSubmittedProjectRate(data: WorkflowData) {
  if (hasV2ProjectData(data)) {
    const rows = getV2WorkbenchRows(data).filter(row => row.project.status === "制作中");
    const total = rows.length;
    if (total === 0) return { total: 0, submitted: 0, rate: 0 };
    const submitted = rows.filter(row => row.packages.some(pkg => pkg.status === "待需求方审核" || pkg.status === "已通过")).length;
    return { total, submitted, rate: submitted / total };
  }
  const inProgress = data.tasks.filter(task => isProjectLikeTask(task) && projectStatusFromTask(task) === "制作中");
  const total = inProgress.length;
  if (total === 0) return { total: 0, submitted: 0, rate: 0 };
  const submitted = inProgress.filter(task => data.submissions.some(s => s.taskId === task.id)).length;
  return { total, submitted, rate: submitted / total };
}

export function getPendingDispatchBriefs(data: WorkflowData) {
  return data.questionnaires.filter(q => {
    if (q.status === "REJECTED") return false;
    if (q.status === "ASSIGNED") return false;
    if (q.status === "COMPLETED") return false;
    return true;
  });
}

export function getPendingDispatchCount(data: WorkflowData) {
  return getPendingDispatchBriefs(data).length;
}

export function getMonthlyCompletedProjectCount(data: WorkflowData, refDate: Date = new Date()) {
  if (hasV2ProjectData(data)) {
    return getV2WorkbenchRows(data).filter(row => row.project.status === "已完成" && inSameMonth(row.project.completedAt || null, refDate)).length;
  }
  return data.tasks.filter(task => isProjectLikeTask(task) && projectStatusFromTask(task) === "已完成" && inSameMonth(task.completedAt || null, refDate)).length;
}

function getStageProgress(data: WorkflowData, taskId: string) {
  const projectStatus = getProjectStatus(data, taskId);
  if (!projectStatus) return 0;
  if (projectStatus === "已取消") return 0;
  if (projectStatus === "已完成") return 100;
  if (projectStatus === "待验收") return 90;

  const { submission, review } = getLatestReview(data, taskId);
  if (!submission) return 25;
  if (!review || review.status === "PENDING") return 50;
  if (review.status === "REVISION_REQUESTED") return 50;
  if (review.status === "APPROVED") return 75;
  return 50;
}

function getNearestDueDateMs(internalDueDate: string | null, committedDeliveryDate: string | null) {
  const internalMs = toMs(internalDueDate);
  const committedMs = toMs(committedDeliveryDate);
  if (Number.isNaN(internalMs) && Number.isNaN(committedMs)) return Number.NaN;
  if (Number.isNaN(internalMs)) return committedMs;
  if (Number.isNaN(committedMs)) return internalMs;
  return Math.min(internalMs, committedMs);
}

function isHighPriority(task: Task, questionnaire: Questionnaire | null) {
  if (task.priority === "HIGH" || task.priority === "URGENT") return true;
  const meta = safeJsonParse(questionnaire?.specialNotes || null);
  const raw = meta && typeof meta === "object" && !Array.isArray(meta) ? (meta as Record<string, unknown>).priority : null;
  return typeof raw === "string" && raw.toLowerCase().includes("high");
}

export function getKeyProjects(data: WorkflowData, opts?: { now?: Date; limit?: number }) {
  if (hasV2ProjectData(data)) {
    const now = opts?.now ?? new Date();
    const nowMs = now.getTime();
    const limit = opts?.limit ?? 6;
    const rows = getV2WorkbenchRows(data);

    const candidates = rows
      .filter(row => row.project.status !== "已完成" && row.project.status !== "已取消")
      .map(row => {
        const breakdown = getProjectTaskBreakdown(row.packages);
        const assigneeIds = getAssigneeAvatarGroup(row.packages);
        const dueSoon = row.packages.filter(pkg => {
          const diff = getPackageDueDiffDays(pkg, nowMs);
          return isOpenTypeTaskPackage(pkg) && typeof diff === "number" && diff >= 0 && diff <= 2;
        });
        const overdue = row.packages.filter(pkg => {
          const diff = getPackageDueDiffDays(pkg, nowMs);
          return isOpenTypeTaskPackage(pkg) && typeof diff === "number" && diff < 0;
        });
        const waitingLong = row.packages.filter(pkg => {
          const age = getWaitingSignoffAgeDays(pkg, data, nowMs);
          return typeof age === "number" && age >= 3;
        });
        const remainingCount = Math.max(0, breakdown.total - breakdown.passed);
        const latestPromisedAt = getNearestOutstandingPromisedAt(row.packages) || getProjectLatestPromisedAt(row.packages);
        const progress = breakdown.total > 0 ? Math.round((breakdown.passed / breakdown.total) * 100) : 0;

        const riskText = (() => {
          if (breakdown.revise > 0) return `${breakdown.revise} 个需修改`;
          if (overdue.length > 0) return `${overdue.length} 个交付任务已逾期`;
          if (dueSoon.length > 0) return `${dueSoon.length} 个交付任务临近承诺时间`;
          if (waitingLong.length > 0) return `${waitingLong.length} 个待需求方审核超过 3 天`;
          if (remainingCount > 0) return `仍有 ${remainingCount} 个交付任务未通过`;
          return "进度稳定";
        })();

        const reviewStatus: ReviewDisplayStatus | null = breakdown.revise > 0
          ? "已退回"
          : (breakdown.waiting > 0 ? "待审核" : null);

        const barColor = breakdown.revise > 0
          ? "#f59e0b"
          : overdue.length > 0
            ? "#ef4444"
            : dueSoon.length > 0
              ? "#c8a30a"
              : breakdown.waiting > 0
                ? "#2563eb"
                : "#2563eb";

        const shouldInclude =
          breakdown.revise > 0
          || overdue.length > 0
          || dueSoon.length > 0
          || waitingLong.length > 0
          || (breakdown.total > 1 && remainingCount > 0);

        if (!shouldInclude) return null;

        const dueMs = toMs(latestPromisedAt);
        return {
          projectId: row.project.id,
          projectName: row.project.projectName,
          brand: row.project.brandTeam || "-",
          stakeholder: row.project.requestorName || "-",
          assigneeIds,
          assigneeId: assigneeIds[0] || null,
          projectStatus: row.project.status,
          deliverablesCount: breakdown.total,
          latestReviewStatus: reviewStatus,
          stageProgress: progress,
          barColor,
          progressText: `${breakdown.passed} / ${breakdown.total} 已通过`,
          riskText,
          latestPromisedAt,
          passedCount: breakdown.passed,
          totalCount: breakdown.total,
          rankA: breakdown.revise,
          rankB: overdue.length,
          rankC: dueSoon.length,
          rankD: waitingLong.length,
          rankE: remainingCount,
          dueMs: Number.isNaN(dueMs) ? Number.POSITIVE_INFINITY : dueMs,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => {
        if (a.rankA !== b.rankA) return b.rankA - a.rankA;
        if (a.rankB !== b.rankB) return b.rankB - a.rankB;
        if (a.rankC !== b.rankC) return b.rankC - a.rankC;
        if (a.rankD !== b.rankD) return b.rankD - a.rankD;
        if (a.rankE !== b.rankE) return b.rankE - a.rankE;
        return a.dueMs - b.dueMs;
      });

    return candidates.slice(0, limit).map(item => ({
      taskId: item.projectId,
      projectId: item.projectId,
      projectName: item.projectName,
      brand: item.brand,
      stakeholder: item.stakeholder,
      assigneeId: item.assigneeId,
      assigneeIds: item.assigneeIds,
      projectStatus: item.projectStatus,
      deliverablesCount: item.deliverablesCount,
      latestReviewStatus: item.latestReviewStatus,
      stageProgress: item.stageProgress,
      barColor: item.barColor,
      progressText: item.progressText,
      riskText: item.riskText,
      latestPromisedAt: item.latestPromisedAt,
      passedCount: item.passedCount,
      totalCount: item.totalCount,
    })) satisfies WorkbenchKeyProject[];
  }

  const now = opts?.now ?? new Date();
  const nowMs = now.getTime();
  const qById = new Map(data.questionnaires.map(q => [q.id, q] as const));

  const candidates = data.tasks
    .filter(isProjectLikeTask)
    .map(task => {
      const questionnaire = task.questionnaireId ? qById.get(task.questionnaireId) || null : null;
      const projectStatus = projectStatusFromTask(task);
      if (projectStatus === "已完成" || projectStatus === "已取消") return null;

      const fields = getProjectDisplayFields(data, task.id);
      const review = getProjectReviewDisplay(data, task.id);
      const stageProgress = getStageProgress(data, task.id);

      const internalDueDate = fields.ok ? fields.internalDueDate : task.internalDueDate || task.dueDate || null;
      const committedDeliveryDate = fields.ok ? fields.committedDeliveryDate : task.committedDeliveryDate || task.stakeholderExpectedDueDate || null;
      const nearestDueMs = getNearestDueDateMs(internalDueDate, committedDeliveryDate);
      const dueDiff = Number.isNaN(nearestDueMs) ? null : daysBetween(nowMs, nearestDueMs);
      const overdue = typeof dueDiff === "number" ? dueDiff < 0 : false;
      const dueToday = typeof dueDiff === "number" ? dueDiff === 0 : false;
      const dueSoon3 = typeof dueDiff === "number" ? dueDiff >= 0 && dueDiff <= 3 : false;

      const needsRevision = review.latestReviewStatus === "已退回";
      const pendingReview = Boolean(review.latestReviewStatus === "待审核" && review.latestVersion);
      const highPriority = isHighPriority(task, questionnaire);
      const dueAttention = overdue || dueToday || dueSoon3;

      const shouldInclude = pendingReview || needsRevision || dueAttention || highPriority;
      if (!shouldInclude) return null;

      const rank = (() => {
        if (overdue) return 0;
        if (dueToday) return 1;
        if (dueSoon3) return 2;
        if (needsRevision) return 3;
        if (pendingReview) return 4;
        if (highPriority) return 5;
        return 6;
      })();

      const deliverablesCount = (() => {
        if (!fields.ok) return 1;
        const total = fields.deliverables.reduce((sum, item) => sum + Math.max(1, item.quantity || 0), 0);
        return Math.max(1, total);
      })();

      const barColor = overdue || dueToday ? "#ef4444" : dueSoon3 ? "#c8a30a" : pendingReview ? "#2563eb" : needsRevision ? "#c8a30a" : highPriority ? "#2563eb" : "#2563eb";

      return {
        task,
        questionnaire,
        projectStatus,
        fields: fields.ok ? fields : null,
        review,
        stageProgress,
        deliverablesCount,
        dueMs: nearestDueMs,
        rank,
        tieRevision: needsRevision ? 0 : 1,
        barColor,
      };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const sorted = candidates
    .slice()
    .sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      if (a.rank === 3 && a.tieRevision !== b.tieRevision) return a.tieRevision - b.tieRevision;
      const aDue = Number.isNaN(a.dueMs) ? Number.POSITIVE_INFINITY : a.dueMs;
      const bDue = Number.isNaN(b.dueMs) ? Number.POSITIVE_INFINITY : b.dueMs;
      if (aDue !== bDue) return aDue - bDue;
      return String(a.task.updatedAt || "").localeCompare(String(b.task.updatedAt || ""));
    });

  const limit = opts?.limit ?? 6;
  return sorted.slice(0, limit).map(item => ({
    taskId: item.task.id,
    projectId: item.task.id,
    projectName: item.task.title,
    brand: item.fields?.brand || item.task.brand || "-",
    stakeholder: item.fields?.stakeholder || "-",
    assigneeId: (typeof item.task.primaryAssigneeId === "string" && item.task.primaryAssigneeId.trim())
      ? item.task.primaryAssigneeId
      : (typeof item.task.assigneeId === "string" && item.task.assigneeId.trim() ? item.task.assigneeId : null),
    assigneeIds: [
      (typeof item.task.primaryAssigneeId === "string" && item.task.primaryAssigneeId.trim())
        ? item.task.primaryAssigneeId
        : (typeof item.task.assigneeId === "string" && item.task.assigneeId.trim() ? item.task.assigneeId : null),
    ].filter((id): id is string => Boolean(id)),
    projectStatus: item.projectStatus,
    deliverablesCount: item.deliverablesCount,
    latestReviewStatus: item.review.latestReviewStatus,
    stageProgress: item.stageProgress,
    barColor: item.barColor,
    progressText: `${Math.max(0, Math.round(item.stageProgress))}%`,
    riskText: item.review.latestReviewStatus ? `审核 ${item.review.latestReviewStatus}` : "项目跟进",
    latestPromisedAt: item.fields?.committedDeliveryDate || item.task.committedDeliveryDate || null,
    passedCount: 0,
    totalCount: item.deliverablesCount,
  })) satisfies WorkbenchKeyProject[];
}

function sortRiskItems(items: WorkbenchRiskItem[], nowMs: number) {
  return items.slice().sort((a, b) => {
    const aOverdue = a.ms < nowMs ? 0 : 1;
    const bOverdue = b.ms < nowMs ? 0 : 1;
    if (aOverdue !== bOverdue) return aOverdue - bOverdue;
    const aToday = daysBetween(nowMs, a.ms) === 0 ? 0 : 1;
    const bToday = daysBetween(nowMs, b.ms) === 0 ? 0 : 1;
    if (aToday !== bToday) return aToday - bToday;
    return a.ms - b.ms;
  });
}

export function getRecentRisks(data: WorkflowData, opts?: { now?: Date; windowDays?: number; limitPerType?: number }): WorkbenchRecentRisks {
  if (hasV2ProjectData(data)) {
    const now = opts?.now ?? new Date();
    const nowMs = now.getTime();
    const limit = opts?.limitPerType ?? 3;
    const rows = getV2WorkbenchRows(data).filter(row => row.project.status !== "已完成" && row.project.status !== "已取消");

    const dueAll: WorkbenchRiskItem[] = [];
    const followUpAll: WorkbenchRiskItem[] = [];

    rows.forEach(row => {
      const breakdown = getProjectTaskBreakdown(row.packages);
      row.packages.forEach(pkg => {
        const diff = getPackageDueDiffDays(pkg, nowMs);
        if (isOpenTypeTaskPackage(pkg) && typeof diff === "number" && diff <= 2 && pkg.promisedAt) {
          dueAll.push({
            taskId: row.project.id,
            title: row.project.projectName,
            dueDate: pkg.promisedAt,
            ms: toMs(pkg.promisedAt),
            note: diff < 0
              ? `${pkg.deliverableType} × 1 已超过承诺交付时间。`
              : `${pkg.deliverableType} × 1 即将到达承诺交付时间。`,
          });
        }

        if (pkg.status === "需修改") {
          followUpAll.push({
            taskId: row.project.id,
            title: row.project.projectName,
            dueDate: pkg.promisedAt || row.project.createdAt,
            ms: toMs(pkg.promisedAt || row.project.createdAt),
            note: `需求方退回 ${pkg.deliverableType} × 1，请尽快修改。`,
          });
          return;
        }

        const waitingDays = getWaitingSignoffAgeDays(pkg, data, nowMs);
        if (typeof waitingDays === "number" && waitingDays >= 3) {
          followUpAll.push({
            taskId: row.project.id,
            title: row.project.projectName,
            dueDate: pkg.promisedAt || row.project.createdAt,
            ms: toMs(pkg.promisedAt || row.project.createdAt),
            note: `${pkg.deliverableType} × 1 已等待需求方审核 ${waitingDays} 天。`,
          });
        }
      });

      if (breakdown.passed > 0 && breakdown.passed < breakdown.total) {
        const dueDate = getNearestOutstandingPromisedAt(row.packages) || row.project.createdAt;
        followUpAll.push({
          taskId: row.project.id,
          title: row.project.projectName,
          dueDate,
          ms: toMs(dueDate),
          note: `项目仍有 ${breakdown.total - breakdown.passed} 个交付任务未通过。`,
        });
      }
    });

    const dueSorted = sortRiskItems(dueAll, nowMs);
    const followUpSorted = sortRiskItems(followUpAll, nowMs);
    return {
      internal: dueSorted.slice(0, limit),
      external: followUpSorted.slice(0, limit),
      internalCount: dueSorted.length,
      externalCount: followUpSorted.length,
    };
  }

  const now = opts?.now ?? new Date();
  const nowMs = now.getTime();
  const windowDays = opts?.windowDays ?? 7;
  const limit = opts?.limitPerType ?? 3;

  const qById = new Map(data.questionnaires.map(q => [q.id, q] as const));

  const internalAll: WorkbenchRiskItem[] = [];
  const externalAll: WorkbenchRiskItem[] = [];

  data.tasks.filter(isProjectLikeTask).forEach(task => {
    const projectStatus = projectStatusFromTask(task);
    if (projectStatus === "已完成" || projectStatus === "已取消") return;

    const questionnaire = task.questionnaireId ? qById.get(task.questionnaireId) || null : null;
    const fields = getProjectDisplayFields(data, task.id);
    const internalDueDate = fields.ok ? fields.internalDueDate : task.internalDueDate || task.dueDate || null;
    const committedDeliveryDate = fields.ok ? fields.committedDeliveryDate : task.committedDeliveryDate || questionnaire?.deadline || null;

    const stageProgress = getStageProgress(data, task.id);
    const internalMs = toMs(internalDueDate);
    const externalMs = toMs(committedDeliveryDate);

    if (!Number.isNaN(internalMs)) {
      const diff = daysBetween(nowMs, internalMs);
      if (diff <= windowDays && stageProgress < 75) {
        internalAll.push({
          taskId: task.id,
          title: task.title,
          dueDate: internalDueDate as string,
          ms: internalMs,
          note: "成员内部提交风险 · 内部交付风险",
        });
      }
    }

    if (!Number.isNaN(externalMs)) {
      const diff = daysBetween(nowMs, externalMs);
      if (diff <= windowDays) {
        externalAll.push({
          taskId: task.id,
          title: task.title,
          dueDate: committedDeliveryDate as string,
          ms: externalMs,
          note: "项目对外交付风险 · 对外交付风险",
        });
      }
    }
  });

  const internalSorted = sortRiskItems(internalAll, nowMs);
  const externalSorted = sortRiskItems(externalAll, nowMs);
  return {
    internal: internalSorted.slice(0, limit),
    external: externalSorted.slice(0, limit),
    internalCount: internalSorted.length,
    externalCount: externalSorted.length,
  };
}

export function getStudioSuggestion(data: WorkflowData, opts?: { now?: Date }) {
  if (hasV2ProjectData(data)) {
    const now = opts?.now ?? new Date();
    const summary = getMonthlyWorkbenchSummary(data, now);
    const risks = getRecentRisks(data, { now, windowDays: 7, limitPerType: 9999 });
    if (summary.revisionPackageCount > 0) return `当前有 ${summary.revisionPackageCount} 个交付任务需修改，建议优先跟进重新提交。`;
    if (risks.external.some(item => item.note.includes("等待需求方审核"))) return "存在待需求方审核超时的交付任务，建议先推动审核反馈。";
    if (risks.internal.some(item => item.note.includes("超过承诺交付时间"))) return "存在已逾期交付任务，建议优先处理承诺时间风险。";
    if (risks.internalCount > 0) return "近期有交付任务临近承诺时间，建议提前确认提交进度。";
    if (summary.monthlyPassedPackageCount > 0) return `本月已有 ${summary.monthlyPassedPackageCount} 个交付任务通过，可持续跟进剩余项目。`;
    return "当前项目推进整体平稳，可持续关注待分配 Brief 与近期交付节点。";
  }

  const now = opts?.now ?? new Date();
  const keyProjects = getKeyProjects(data, { now, limit: 9999 });
  const pendingReviewCount = keyProjects.filter(p => p.latestReviewStatus === "待审核").length;
  const revisionCount = keyProjects.filter(p => p.latestReviewStatus === "已退回").length;
  const risks = getRecentRisks(data, { now, windowDays: 7, limitPerType: 9999 });

  if (pendingReviewCount >= 3) return "当前有多个项目等待内部审核，建议优先处理待审核提交。";
  if (revisionCount >= 2) return "当前存在多个退回修改项目，建议跟进成员重新提交进度。";
  if (risks.internalCount >= 2) return "当前有多个项目临近内部交付时间，建议提前确认成员提交进度。";
  if (risks.externalCount >= 1) return "当前有项目临近对外承诺交付日期，建议优先确认最终 FA 和验收安排。";
  return "当前项目推进整体平稳，可持续关注待审核与近期交付节点。";
}

function normalizeWorkbenchTaskType(task: Task, questionnaire: Questionnaire | null) {
  const deliverables = buildDeliverables(task, questionnaire);
  const types = Array.from(new Set(deliverables.map(d => d.type)));
  const primary = types[0] || "";
  if (primary.includes("文案")) return "文案";
  if (primary.includes("线下") || primary.includes("物料")) return "POSM";
  if (primary.includes("平面") || task.category === "DESIGN" || task.category === "ANIMATION") return "设计";
  if (primary.includes("3D")) return "3D";
  if (primary.includes("视频") || primary.includes("拍摄")) return "视频";
  if (task.category === "SCRIPT") return "文案";
  if (task.category === "SHOOTING") return "视频";
  if (task.category === "EDITING" || task.category === "POST_PRODUCTION") return "视频";
  return "其他";
}

export function getTeamTaskDistribution(data: WorkflowData): WorkbenchTaskDistributionItem[] {
  if (hasV2ProjectData(data)) {
    const activePackages = data.typeTaskPackages.filter(pkg => pkg.status !== "已结束");
    const total = activePackages.length;
    const buckets: Array<{ label: string; color: string }> = [
      { label: "平面设计", color: "#ff5b5b" },
      { label: "文案", color: "#f59e0b" },
      { label: "视频", color: "#facc15" },
      { label: "3D", color: "#60a5fa" },
      { label: "线下物料", color: "#34d399" },
      { label: "其他", color: "#94a3b8" },
    ];
    const counts = new Map(buckets.map(bucket => [bucket.label, 0]));
    activePackages.forEach(pkg => {
      const type = normalizeWorkbenchPackageType(pkg.deliverableType);
      const matched = buckets.some(bucket => bucket.label === type) ? type : "其他";
      counts.set(matched, (counts.get(matched) || 0) + 1);
    });
    return buckets.map(bucket => {
      const count = counts.get(bucket.label) || 0;
      return {
        label: bucket.label,
        count,
        ratio: total > 0 ? count / total : 0,
        color: bucket.color,
      };
    });
  }

  const qById = new Map(data.questionnaires.map(q => [q.id, q] as const));
  const activeTasks = data.tasks.filter(task => isProjectLikeTask(task) && projectStatusFromTask(task) !== "已完成" && projectStatusFromTask(task) !== "已取消");
  const total = activeTasks.length;

  const buckets: Array<{ label: string; color: string }> = [
    { label: "设计", color: "#ff5b5b" },
    { label: "文案", color: "#f59e0b" },
    { label: "视频", color: "#facc15" },
    { label: "3D", color: "#60a5fa" },
    { label: "POSM", color: "#34d399" },
    { label: "其他", color: "#94a3b8" },
  ];

  const counts = new Map(buckets.map(b => [b.label, 0]));
  activeTasks.forEach(task => {
    const q = task.questionnaireId ? qById.get(task.questionnaireId) || null : null;
    const type = normalizeWorkbenchTaskType(task, q);
    counts.set(type, (counts.get(type) || 0) + 1);
  });

  return buckets.map(b => {
    const count = counts.get(b.label) || 0;
    const ratio = total > 0 ? count / total : 0;
    return { label: b.label, count, ratio, color: b.color };
  });
}

export function getMonthlyWorkbenchSummary(data: WorkflowData, refDate: Date = new Date()): WorkbenchMonthlySummary {
  if (hasV2ProjectData(data)) {
    const rows = getV2WorkbenchRows(data);
    const waitingSignoffPackageCount = data.typeTaskPackages.filter(pkg => pkg.status === "待需求方审核").length;
    const revisionPackageCount = data.typeTaskPackages.filter(pkg => pkg.status === "需修改").length;
    const monthlyPassedPackageCount = data.typeTaskPackages.filter(pkg => inSameMonth(getLatestPassedAt(pkg, data.signoffRecords), refDate)).length;
    const inProgressProjectCount = rows.filter(row => row.project.status === "制作中").length;
    const monthlyCompletedProjectCount = rows.filter(row => row.project.status === "已完成" && inSameMonth(row.project.completedAt || null, refDate)).length;
    const pendingDispatchCount = getPendingDispatchCount(data);
    const submittedProjectRate = inProgressProjectCount > 0 ? waitingSignoffPackageCount / Math.max(1, inProgressProjectCount) : 0;
    return {
      monthLabel: `${refDate.getMonth() + 1}月`,
      inProgressProjectCount,
      submittedInProgressProjectCount: waitingSignoffPackageCount,
      submittedProjectRate,
      pendingDispatchCount,
      waitingSignoffPackageCount,
      revisionPackageCount,
      monthlyCompletedProjectCount,
      monthlyPassedPackageCount,
      pendingDispatchTrend: { pct: 12, source: "mock" },
      monthlyCompletedTrend: { pct: 8, source: "mock" },
    };
  }

  const inProgressProjectCount = getInProgressProjectCount(data);
  const submitted = getSubmittedProjectRate(data);
  const pendingDispatchCount = getPendingDispatchCount(data);
  const monthlyCompletedProjectCount = getMonthlyCompletedProjectCount(data, refDate);

  const monthLabel = `${refDate.getMonth() + 1}月`;
  const pendingDispatchTrend: WorkbenchTrend = { pct: 12, source: "mock" };
  const monthlyCompletedTrend: WorkbenchTrend = { pct: 8, source: "mock" };

  return {
    monthLabel,
    inProgressProjectCount,
    submittedInProgressProjectCount: submitted.submitted,
    submittedProjectRate: submitted.rate,
    pendingDispatchCount,
    waitingSignoffPackageCount: 0,
    revisionPackageCount: 0,
    monthlyCompletedProjectCount,
    monthlyPassedPackageCount: 0,
    pendingDispatchTrend,
    monthlyCompletedTrend,
  };
}

export type WorkflowConsistencyIssueKind =
  | "COMPLETED_HAS_PENDING_REVIEW"
  | "SIGNOFF_HAS_PENDING_REVIEW"
  | "CANCELED_HAS_PENDING_REVIEW"
  | "PENDING_QUEUE_HAS_NON_EXECUTING";

export type WorkflowConsistencyIssue = {
  kind: WorkflowConsistencyIssueKind;
  taskId: string;
  projectName: string;
  projectStatus: ProjectStatus | null;
  latestVersion: string | null;
  latestReviewStatus: string | null;
  hasPendingReview: boolean;
  inPendingQueue: boolean;
};

export function auditWorkflowConsistency(data: WorkflowData): WorkflowConsistencyIssue[] {
  const issues: WorkflowConsistencyIssue[] = [];

  for (const task of data.tasks.filter(isProjectLikeTask)) {
    const projectStatus = projectStatusFromTask(task);
    const { latestNumbered } = getSubmissionsByTask(data, task.id);
    const { submission, review } = getLatestReview(data, task.id);
    const pending = Boolean(latestNumbered && (!review || review.status === "PENDING"));
    const inPendingQueue = projectStatus === "制作中" && pending;
    const hasPending = pending;

    if (projectStatus === "已完成" && hasPending) {
      issues.push({
        kind: "COMPLETED_HAS_PENDING_REVIEW",
        taskId: task.id,
        projectName: task.title,
        projectStatus,
        latestVersion: submission?.version || null,
        latestReviewStatus: review?.status || null,
        hasPendingReview: hasPending,
        inPendingQueue,
      });
    }

    if (projectStatus === "待验收" && hasPending) {
      issues.push({
        kind: "SIGNOFF_HAS_PENDING_REVIEW",
        taskId: task.id,
        projectName: task.title,
        projectStatus,
        latestVersion: submission?.version || null,
        latestReviewStatus: review?.status || null,
        hasPendingReview: hasPending,
        inPendingQueue,
      });
    }

    if (projectStatus === "已取消" && hasPending) {
      issues.push({
        kind: "CANCELED_HAS_PENDING_REVIEW",
        taskId: task.id,
        projectName: task.title,
        projectStatus,
        latestVersion: submission?.version || null,
        latestReviewStatus: review?.status || null,
        hasPendingReview: hasPending,
        inPendingQueue,
      });
    }

    if (inPendingQueue && projectStatus !== "制作中") {
      issues.push({
        kind: "PENDING_QUEUE_HAS_NON_EXECUTING",
        taskId: task.id,
        projectName: task.title,
        projectStatus,
        latestVersion: submission?.version || null,
        latestReviewStatus: review?.status || null,
        hasPendingReview: hasPending,
        inPendingQueue,
      });
    }
  }

  return issues;
}
