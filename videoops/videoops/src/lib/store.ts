"use client";

import { create } from "zustand";
import {
  USERS,
  TASKS,
  QUESTIONNAIRES,
  REVIEWS,
  NOTIFICATIONS,
  PROJECTS,
  TYPE_TASK_PACKAGES,
  SIGNOFF_RECORDS,
  SUBMISSIONS,
  ACTIVITY_EVENTS,
  SYSTEM_EVENTS,
  type Task,
  type Questionnaire,
  type Review,
  type Notification,
  type SubmissionRecord,
  type ActivityEvent,
  type SystemEvent,
  type ProjectRecord,
  type TypeTaskPackage,
  type SignoffRecord,
  type DeliverableItem,
  type DeliverableTypeGroup,
} from "./mock-data";
import { getDispatchInfo } from "./taskAssignments";
import { VIDEO_TYPE_MAP } from "./utils";

function safeJsonParse(text: string | null) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getQuestionnaireMeta(questionnaire: Questionnaire | null) {
  if (!questionnaire) return null;
  const parsed = safeJsonParse(questionnaire.specialNotes || null);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
}

function getQuestionnairePriority(questionnaire: Questionnaire): Task["priority"] {
  const priority = getQuestionnaireMeta(questionnaire)?.priority;
  const raw = typeof priority === "string" ? priority.toUpperCase() : "MEDIUM";
  if (raw === "HIGH" || raw === "URGENT") return raw;
  if (raw === "LOW") return "LOW";
  return "MEDIUM";
}

function getQuestionnaireBrand(questionnaire: Questionnaire) {
  const brand = getQuestionnaireMeta(questionnaire)?.brand;
  return typeof brand === "string" && brand.trim() ? brand : null;
}

function getQuestionnaireBrandTeam(questionnaire: Questionnaire) {
  if (typeof questionnaire.requesterDept === "string" && questionnaire.requesterDept.trim()) return questionnaire.requesterDept.trim();
  const meta = getQuestionnaireMeta(questionnaire);
  const candidates = [meta?.brand, meta?.company, meta?.team];
  const matched = candidates.find(value => typeof value === "string" && value.trim());
  return typeof matched === "string" && matched.trim() ? matched.trim() : "-";
}

function getQuestionnaireRequestorEmail(questionnaire: Questionnaire) {
  if (typeof questionnaire.requesterEmail === "string" && questionnaire.requesterEmail.trim()) return questionnaire.requesterEmail.trim();
  return "";
}

function toDeliverableItem(row: Record<string, unknown>): DeliverableItem {
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

function mergeDeliverableGroups(groups: DeliverableTypeGroup[]) {
  const grouped = new Map<string, DeliverableItem[]>();
  groups.forEach(group => {
    const key = String(group.type || "").trim();
    if (!key) return;
    const nextItems = grouped.get(key) || [];
    grouped.set(key, [...nextItems, ...group.items]);
  });
  return Array.from(grouped.entries()).map(([type, items]) => ({ type, items }));
}

export function getQuestionnaireDeliverableTypes(questionnaire: Questionnaire): DeliverableTypeGroup[] {
  if (Array.isArray(questionnaire.deliverableTypes) && questionnaire.deliverableTypes.length > 0) {
    return mergeDeliverableGroups(
      questionnaire.deliverableTypes.map(group => ({
        type: String(group.type || "").trim(),
        items: Array.isArray(group.items) ? group.items.map(item => toDeliverableItem(item as unknown as Record<string, unknown>)) : [],
      }))
    ).filter(group => group.type && group.items.length > 0);
  }

  const meta = getQuestionnaireMeta(questionnaire);
  if (Array.isArray(meta?.deliverableTypes)) {
    return mergeDeliverableGroups(
      meta.deliverableTypes.flatMap(rawGroup => {
        if (!rawGroup || typeof rawGroup !== "object" || Array.isArray(rawGroup)) return [];
        const safe = rawGroup as Record<string, unknown>;
        const type = typeof safe.type === "string" ? safe.type.trim() : "";
        const items = Array.isArray(safe.items)
          ? safe.items
            .filter(item => item && typeof item === "object" && !Array.isArray(item))
            .map(item => toDeliverableItem(item as Record<string, unknown>))
          : [];
        return type ? [{ type, items }] : [];
      })
    ).filter(group => group.type && group.items.length > 0);
  }

  const legacyDeliverables = meta?.deliverables;
  if (legacyDeliverables && typeof legacyDeliverables === "object" && !Array.isArray(legacyDeliverables)) {
    return Object.entries(legacyDeliverables)
      .map(([type, rows]) => {
        const items = Array.isArray(rows)
          ? rows
            .filter(row => row && typeof row === "object" && !Array.isArray(row))
            .map(row => toDeliverableItem(row as Record<string, unknown>))
          : [];
        return { type, items };
      })
      .filter(group => group.type && group.items.length > 0);
  }

  const fallbackType = VIDEO_TYPE_MAP[questionnaire.videoType] || questionnaire.videoType;
  return fallbackType ? [{ type: fallbackType, items: [toDeliverableItem({})] }] : [];
}

function getResolvedDeliverableGroups(
  questionnaire: Questionnaire,
  preferredGroups?: DeliverableTypeGroup[] | null,
) {
  if (Array.isArray(preferredGroups) && preferredGroups.length > 0) {
    return mergeDeliverableGroups(
      preferredGroups.map(group => ({
        type: String(group.type || "").trim(),
        items: Array.isArray(group.items)
          ? group.items.map(item => {
            const row = item && typeof item === "object" && !Array.isArray(item)
              ? item as unknown as Record<string, unknown>
              : {};
            return toDeliverableItem(row);
          })
          : [],
      }))
    ).filter(group => group.type && group.items.length > 0);
  }
  return getQuestionnaireDeliverableTypes(questionnaire);
}

function toLegacyDeliverablesMap(groups: DeliverableTypeGroup[]) {
  return Object.fromEntries(groups.map(group => [
    group.type,
    group.items.map(item => ({
      name: item.name,
      quantity: String(item.quantity || 1),
      content: item.name,
      size: item.size,
      format: item.outputFormat,
      usage: item.usageScenario,
      note: item.remark,
      outputFormat: item.outputFormat,
      usageScenario: item.usageScenario,
      remark: item.remark,
    })),
  ]));
}

function uniqueMemberIds(ids: Array<string | null | undefined>) {
  return Array.from(new Set(ids.filter((id): id is string => typeof id === "string" && id.trim().length > 0)));
}

function normalizeSingleMemberIds(ids: Array<string | null | undefined>) {
  const unique = uniqueMemberIds(ids);
  return unique.length > 0 ? [unique[0]] : [];
}

function directTaskMemberIds(task: Task) {
  return uniqueMemberIds([
    ...(Array.isArray(task.assigneeIds) ? task.assigneeIds : []),
    task.primaryAssigneeId,
    task.assigneeId,
  ]);
}

function normalizeTaskMembers(task: Task, memberIds: string[]) {
  const normalizedIds = normalizeSingleMemberIds(memberIds);
  return {
    ...task,
    assigneeIds: normalizedIds,
    primaryAssigneeId: normalizedIds[0] || null,
    assigneeId: normalizedIds[0] || null,
  };
}

function ensureAssignedQuestionnaireTasks(tasks: Task[], questionnaires: Questionnaire[]) {
  const nextTasks = [...tasks];
  let nextNumber = nextTasks.reduce((max, task) => {
    const numeric = parseInt(String(task.taskNumber || "0").replace("VID-", ""), 10) || 0;
    return Math.max(max, numeric);
  }, 0);

  questionnaires.forEach(questionnaire => {
    if (questionnaire.status !== "ASSIGNED") return;
    const exists = nextTasks.some(task => task.questionnaireId === questionnaire.id);
    if (exists) return;

    nextNumber += 1;
    const dispatch = getDispatchInfo(questionnaire);
    const assigneeIds = normalizeSingleMemberIds(dispatch?.teamMemberIds || []);
    const dueDate = dispatch?.internalDueDate ? new Date(dispatch.internalDueDate).toISOString() : questionnaire.deadline;
    nextTasks.push({
      id: `task-from-${questionnaire.id}`,
      taskNumber: `VID-${String(nextNumber).padStart(3, "0")}`,
      title: questionnaire.title,
      description: questionnaire.description,
      status: "WIP",
      priority: getQuestionnairePriority(questionnaire),
      category: "OTHER",
      assigneeId: assigneeIds[0] || null,
      primaryAssigneeId: assigneeIds[0] || null,
      assigneeIds,
      createdById: questionnaire.assignedById || USERS[0]?.id || "",
      questionnaireId: questionnaire.id,
      dueDate,
      completedAt: null,
      createdAt: questionnaire.createdAt,
      updatedAt: questionnaire.createdAt,
      estimatedCost: dispatch?.estimatedCostRmb ?? null,
      marketCost: dispatch?.marketCostRmb ?? null,
      brand: getQuestionnaireBrand(questionnaire),
    });
  });

  return nextTasks;
}

function normalizeTasksByQuestionnaire(tasks: Task[], questionnaires: Questionnaire[]) {
  const normalizedTasks = ensureAssignedQuestionnaireTasks(tasks, questionnaires);
  const questionnaireById = new Map(questionnaires.map(q => [q.id, q]));
  const groupedMemberIds = new Map<string, string[]>();

  normalizedTasks.forEach(task => {
    if (!task.questionnaireId) return;
    const questionnaire = questionnaireById.get(task.questionnaireId) || null;
    const dispatchIds = getDispatchInfo(questionnaire)?.teamMemberIds || [];
    const merged = normalizeSingleMemberIds([
      ...(groupedMemberIds.get(task.questionnaireId) || []),
      ...dispatchIds,
      ...directTaskMemberIds(task),
    ]);
    groupedMemberIds.set(task.questionnaireId, merged);
  });

  return normalizedTasks.map(task => {
    if (!task.questionnaireId) {
      const directIds = directTaskMemberIds(task);
      return directIds.length > 0 ? normalizeTaskMembers(task, directIds) : task;
    }
    const groupedIds = groupedMemberIds.get(task.questionnaireId) || [];
    return groupedIds.length > 0 ? normalizeTaskMembers(task, groupedIds) : task;
  });
}

function getProjectStatusFromPackages(packages: TypeTaskPackage[]): ProjectRecord["status"] {
  if (packages.length === 0) return "制作中";
  if (packages.every(pkg => pkg.status === "已结束")) return "已取消";
  if (packages.every(pkg => pkg.status === "已通过")) return "已完成";
  const hasPending = packages.some(pkg => pkg.status === "待提交" || pkg.status === "需修改");
  const hasWaitingSignoff = packages.some(pkg => pkg.status === "待需求方审核");
  if (!hasPending && hasWaitingSignoff) return "待验收";
  return "制作中";
}

function getEarliestPromisedAt(packages: TypeTaskPackage[]) {
  const candidates = packages
    .map(pkg => String(pkg.promisedAt || ""))
    .filter(value => value.trim().length > 0)
    .sort((a, b) => a.localeCompare(b));
  return candidates[0] || "";
}

function buildDispatchSummary(packages: TypeTaskPackage[]) {
  const firstPackage = packages[0] || null;
  return {
    teamMemberIds: firstPackage?.assigneeId ? [firstPackage.assigneeId] : [],
    committedDeliveryDate: getEarliestPromisedAt(packages),
    internalDueDate: "",
    estimatedCostRmb: null,
    marketCostRmb: null,
    managerNote: firstPackage?.assignmentNote || "",
  };
}

type ActionResult = { ok: true } | { ok: false; error: string };

function ensureTypeTaskPackagesForAssignedProjects(
  projects: ProjectRecord[],
  typeTaskPackages: TypeTaskPackage[],
  questionnaires: Questionnaire[],
): TypeTaskPackage[] {
  const packagesByProjectId = new Map<string, TypeTaskPackage[]>();
  typeTaskPackages.forEach(pkg => {
    const existing = packagesByProjectId.get(pkg.projectId) || [];
    packagesByProjectId.set(pkg.projectId, [...existing, pkg]);
  });

  const questionnaireById = new Map(questionnaires.map(q => [q.id, q]));
  const generatedPackages: TypeTaskPackage[] = [];
  const at = new Date().toISOString();

  for (const project of projects) {
    const existingPackages = packagesByProjectId.get(project.id) || [];
    if (existingPackages.length > 0) continue;

    const questionnaire = questionnaireById.get(project.briefId);
    if (!questionnaire) continue;
    if (questionnaire.status !== "ASSIGNED") continue;

    const deliverableGroups = getQuestionnaireDeliverableTypes(questionnaire);
    if (deliverableGroups.length === 0) {
      deliverableGroups.push({ type: "其他", items: [toDeliverableItem({})] });
    }

    for (const group of deliverableGroups) {
      const pkgId = `ttp-auto-${project.id}-${group.type}`;
      if (typeTaskPackages.some(pkg => pkg.id === pkgId)) continue;

      const dispatch = getDispatchInfo(questionnaire);
      const assigneeId = dispatch?.teamMemberIds?.[0] || null;
      const assignee = assigneeId ? USERS.find(u => u.id === assigneeId) : null;
      const promisedAt = dispatch?.committedDeliveryDate ? new Date(dispatch.committedDeliveryDate).toISOString() : null;

      generatedPackages.push({
        id: pkgId,
        projectId: project.id,
        briefId: project.briefId,
        deliverableType: group.type,
        deliverableItems: group.items,
        assigneeId,
        assigneeName: assignee?.name || "待分配",
        promisedAt,
        estimatedWorkingHours: null,
        actualWorkingHours: null,
        assetCategory: "",
        assignmentNote: "",
        status: assigneeId ? "待提交" : "待提交",
        currentVersion: null,
        fileLinks: [],
        uploadedFiles: [],
        latestFeedback: null,
        submissions: [],
        signoffHistory: [],
        createdAt: at,
        updatedAt: at,
      });
    }
  }

  return [...typeTaskPackages, ...generatedPackages];
}

const PACKAGE_FILE_EXTENSIONS = new Set(["zip", "rar", "7z"]);
const ALLOWED_FILE_EXTENSIONS = new Set([
  "mp4",
  "mov",
  "avi",
  "mkv",
  "wmv",
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "pdf",
  "ppt",
  "pptx",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "txt",
  "zip",
  "rar",
  "7z",
]);

function getFileExtension(name: string | null | undefined) {
  const parts = String(name || "").trim().split(".");
  if (parts.length <= 1) return "";
  return parts[parts.length - 1].toLowerCase();
}

function parseVersionNumber(version: string | null | undefined) {
  const matched = String(version || "").trim().match(/^V(\d+)$/i);
  return matched ? Number(matched[1]) : null;
}

function getLatestNumberedSubmission(taskId: string, submissions: SubmissionRecord[]) {
  const numbered = submissions
    .filter(item => item.taskId === taskId && parseVersionNumber(item.version) !== null)
    .sort((a, b) => String(b.submittedAt || "").localeCompare(String(a.submittedAt || "")));
  return numbered[0] || null;
}

function getLatestReviewForSubmission(submissionId: string | null | undefined, reviews: Review[]) {
  if (!submissionId) return null;
  return reviews
    .filter(review => review.submissionId === submissionId)
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))[0] || null;
}

function getExpectedDeliverableCount(task: Task, questionnaires: Questionnaire[]) {
  const questionnaire = task.questionnaireId
    ? questionnaires.find(item => item.id === task.questionnaireId) || null
    : null;
  const meta = getQuestionnaireMeta(questionnaire);
  const deliverables = meta?.deliverables;
  if (deliverables && typeof deliverables === "object" && !Array.isArray(deliverables)) {
    const total = Object.values(deliverables as Record<string, unknown>).reduce<number>((sum, item) => {
      if (Array.isArray(item)) return sum + Math.max(1, item.length);
      return sum + 1;
    }, 0);
    if (total > 0) return total;
  }
  return 1;
}

function isHttpsLink(link: string | null | undefined) {
  return /^https:\/\/\S+/i.test(String(link || "").trim());
}

function validateUploadedFiles(files: Array<{ name: string; size: number; type: string | null }> | undefined) {
  if (!files || files.length === 0) return null;
  for (const file of files) {
    const ext = getFileExtension(file.name);
    if (!ALLOWED_FILE_EXTENSIONS.has(ext)) {
      return `文件「${file.name}」格式不符合要求，请重新上传标准格式文件。`;
    }
  }
  return null;
}

function getPackageSubmissions(typeTaskPackageId: string, submissions: SubmissionRecord[]) {
  return submissions
    .filter(item => item.typeTaskPackageId === typeTaskPackageId)
    .sort((a, b) => String(b.submittedAt || "").localeCompare(String(a.submittedAt || "")));
}

function getLatestPackageSubmission(typeTaskPackageId: string, submissions: SubmissionRecord[]) {
  return getPackageSubmissions(typeTaskPackageId, submissions)[0] || null;
}

function getLatestPackageSignoff(typeTaskPackageId: string, signoffRecords: SignoffRecord[]) {
  return signoffRecords
    .filter(item => item.typeTaskPackageId === typeTaskPackageId)
    .sort((a, b) => String(b.reviewedAt || "").localeCompare(String(a.reviewedAt || "")))[0] || null;
}

function mapProjectStatusToLegacyTaskStatus(status: ProjectRecord["status"]): Task["status"] {
  if (status === "待验收") return "PENDING_SIGNOFF";
  if (status === "已完成") return "COMPLETED";
  if (status === "已取消") return "CANCELED";
  return "WIP";
}

function getProjectManagerId(project: ProjectRecord, tasks: Task[], questionnaires: Questionnaire[]) {
  const legacyTask = project.legacyTaskId ? tasks.find(task => task.id === project.legacyTaskId) || null : null;
  if (legacyTask?.createdById) return legacyTask.createdById;
  const questionnaire = questionnaires.find(item => item.id === project.briefId) || null;
  if (questionnaire?.assignedById) return questionnaire.assignedById;
  return USERS.find(user => user.role === "LEADER")?.id || null;
}

function buildProjectProjection(
  project: ProjectRecord,
  packages: TypeTaskPackage[],
  questionnaires: Questionnaire[],
  tasks: Task[],
  completedAt?: string | null
) {
  const nextStatus = getProjectStatusFromPackages(packages);
  const earliestPromisedAt = getEarliestPromisedAt(packages);
  const questionnaire = questionnaires.find(item => item.id === project.briefId) || null;
  const completedTime = nextStatus === "已完成" ? (completedAt || new Date().toISOString()) : null;
  const nextProject: ProjectRecord = {
    ...project,
    status: nextStatus,
    typeTaskPackageIds: packages.map(item => item.id),
    completedAt: completedTime,
    canceledAt: nextStatus === "已取消" ? (project.canceledAt || new Date().toISOString()) : project.canceledAt,
  };
  const legacyTaskId = project.legacyTaskId || null;
  const nextTasks = legacyTaskId
    ? tasks.map(task => task.id === legacyTaskId ? {
      ...task,
      status: mapProjectStatusToLegacyTaskStatus(nextStatus),
      assigneeId: packages[0]?.assigneeId || task.assigneeId || null,
      primaryAssigneeId: packages[0]?.assigneeId || task.primaryAssigneeId || null,
      assigneeIds: normalizeSingleMemberIds(packages.map(item => item.assigneeId)),
      dueDate: earliestPromisedAt ? new Date(earliestPromisedAt).toISOString() : task.dueDate || questionnaire?.deadline || null,
      committedDeliveryDate: earliestPromisedAt ? new Date(earliestPromisedAt).toISOString() : task.committedDeliveryDate || null,
      stakeholderExpectedDueDate: questionnaire?.deadline || task.stakeholderExpectedDueDate || null,
      completedAt: nextStatus === "已完成" ? completedTime : null,
      updatedAt: new Date().toISOString(),
    } : task)
    : tasks;
  return { project: nextProject, tasks: nextTasks };
}

function findSubmissionByToken(token: string, submissions: SubmissionRecord[]) {
  return submissions.find(item => item.signoffToken === token) || null;
}

interface AppState {
  currentUser: typeof USERS[0] | null;
  notifViewerUserId: string | null;
  tasks: Task[];
  questionnaires: Questionnaire[];
  projects: ProjectRecord[];
  typeTaskPackages: TypeTaskPackage[];
  reviews: Review[];
  notifications: Notification[];
  submissions: SubmissionRecord[];
  signoffRecords: SignoffRecord[];
  activityEvents: ActivityEvent[];
  systemEvents: SystemEvent[];
  setNotifViewerUserId: (userId: string) => void;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  updateTask: (id: string, data: Partial<Task>) => void;
  addTask: (task: Task) => void;
  addReview: (review: Review) => void;
  submitDeliverable: (params: {
    taskId: string;
    version: string;
    fileName: string | null;
    uploadedFiles?: Array<{
      name: string;
      size: number;
      type: string | null;
    }>;
    link: string | null;
    note: string;
  }) => ActionResult;
  returnDeliverable: (params: {
    taskId: string;
    submissionId: string;
    reason: string;
    newDueDate?: string | null;
  }) => ActionResult;
  submitPackageDeliverable: (params: {
    typeTaskPackageId: string;
    uploadedFiles?: Array<{
      name: string;
      size: number;
      type: string | null;
    }>;
    fileLinks?: string[];
    submitNote?: string;
    actualWorkingHours?: number | null;
    assetCategory?: string;
    submittedById?: string | null;
  }) => ActionResult;
  approvePackageSubmission: (params: {
    token: string;
    reviewedByName: string;
    reviewedByEmail: string;
    feedback?: string;
  }) => ActionResult;
  requestPackageRevision: (params: {
    token: string;
    reviewedByName: string;
    reviewedByEmail: string;
    feedback: string;
  }) => ActionResult;
  cancelProject: (params: {
    projectId: string;
    reason: string;
  }) => ActionResult;
  claimQuest: (id: string, userId: string) => void;
  assignQuest: (id: string, assigneeId: string, assignerId: string) => void;
  rejectQuest: (id: string) => void;
  addQuestionnaire: (q: Questionnaire) => void;
  updateQuestionnaire: (id: string, data: Partial<Questionnaire>) => void;
  dispatchBrief: (params: {
    questionnaireId: string;
    packages: Array<{
      deliverableType: string;
      assigneeId: string;
      promisedAt: string;
      estimatedWorkingHours: number | null;
      assetCategory: string;
      assignmentNote: string;
    }>;
    assignerId: string;
    resolvedDeliverableGroups?: DeliverableTypeGroup[];
  }) => ActionResult;
  updateBriefDispatch: (params: {
    questionnaireId: string;
    packages: Array<{
      deliverableType: string;
      assigneeId: string;
      promisedAt: string;
      estimatedWorkingHours: number | null;
      assetCategory: string;
      assignmentNote: string;
    }>;
    assignerId: string;
    resolvedDeliverableGroups?: DeliverableTypeGroup[];
  }) => ActionResult;
  markNotifRead: (id: string) => void;
  markAllNotifsRead: () => void;
  addNotification: (n: Notification) => void;
  addActivityEvent: (e: ActivityEvent) => void;
  addSystemEvent: (e: SystemEvent) => void;
}

const initializedTypeTaskPackages = ensureTypeTaskPackagesForAssignedProjects([...PROJECTS], [...TYPE_TASK_PACKAGES], [...QUESTIONNAIRES]);

export const useStore = create<AppState>((set, get) => ({
  currentUser: USERS[0],
  notifViewerUserId: USERS[0]?.id || null,
  tasks: normalizeTasksByQuestionnaire([...TASKS], [...QUESTIONNAIRES]),
  questionnaires: [...QUESTIONNAIRES],
  projects: [...PROJECTS],
  typeTaskPackages: initializedTypeTaskPackages,
  reviews: [...REVIEWS],
  notifications: [...NOTIFICATIONS],
  submissions: [...SUBMISSIONS],
  signoffRecords: [...SIGNOFF_RECORDS],
  activityEvents: [...ACTIVITY_EVENTS],
  systemEvents: [...SYSTEM_EVENTS],

  setNotifViewerUserId: (userId) => set(() => ({ notifViewerUserId: userId })),

  login: (email, password) => {
    const user = USERS.find(u => u.email === email && u.password === password);
    if (user) {
      const at = new Date().toISOString();
      set(s => ({
        currentUser: user,
        notifViewerUserId: user.id,
        activityEvents: [{
          id: `evt-${Date.now()}-login`,
          level: "INFO",
          actorId: user.id,
          entityType: "auth",
          entityId: user.id,
          action: "AUTH_LOGIN",
          message: `${user.name} 登录`,
          meta: null,
          createdAt: at,
        }, ...s.activityEvents],
      }));
      return true;
    }
    return false;
  },
  logout: () => {
    const actor = get().currentUser;
    const at = new Date().toISOString();
    set(s => ({
      currentUser: null,
      notifViewerUserId: null,
      activityEvents: [{
        id: `evt-${Date.now()}-logout`,
        level: "INFO",
        actorId: actor?.id || null,
        entityType: "auth",
        entityId: actor?.id || null,
        action: "AUTH_LOGOUT",
        message: `${actor?.name || "用户"} 登出`,
        meta: null,
        createdAt: at,
      }, ...s.activityEvents],
    }));
  },

  updateTask: (id, data) => {
    const actorId = get().currentUser?.id ?? null;
    const at = new Date().toISOString();
    set(s => {
      const prev = s.tasks.find(t => t.id === id) || null;
      const normalizedData: Partial<Task> = { ...data };
      if ("assigneeId" in data && typeof data.assigneeId === "string" && data.assigneeId.trim()) {
        normalizedData.primaryAssigneeId = data.assigneeId;
        normalizedData.assigneeIds = [data.assigneeId];
      }
      if ("assigneeId" in data && data.assigneeId === null) {
        normalizedData.primaryAssigneeId = null;
        normalizedData.assigneeIds = [];
      }
      if ("primaryAssigneeId" in data && typeof data.primaryAssigneeId === "string" && data.primaryAssigneeId.trim()) {
        const currentIds = Array.isArray(data.assigneeIds) ? data.assigneeIds : prev?.assigneeIds || [];
        normalizedData.assigneeId = data.primaryAssigneeId;
        normalizedData.assigneeIds = Array.from(new Set([data.primaryAssigneeId, ...currentIds]));
      }
      if (Array.isArray(data.assigneeIds)) {
        const ids = normalizeSingleMemberIds(data.assigneeIds);
        normalizedData.assigneeIds = ids;
        normalizedData.primaryAssigneeId = ids[0] || null;
        normalizedData.assigneeId = ids[0] || null;
      }
      const tasks = s.tasks.map(t => t.id === id ? { ...t, ...normalizedData, updatedAt: at } : t);
      const next = tasks.find(t => t.id === id) || null;
      const events: ActivityEvent[] = [];

      if (prev && next) {
        if (data.status && prev.status !== next.status) {
          events.push({
            id: `evt-${Date.now()}-task-status`,
            level: "INFO",
            actorId,
            entityType: "task",
            entityId: next.id,
            action: "TASK_STATUS_CHANGED",
            message: `任务状态变更：${next.taskNumber} ${next.title}`,
            meta: { from: prev.status, to: next.status },
            createdAt: at,
          });
        }
        if (typeof data.faLink === "string" && data.faLink.trim()) {
          events.push({
            id: `evt-${Date.now()}-fa`,
            level: "INFO",
            actorId,
            entityType: "task",
            entityId: next.id,
            action: "FA_LINK_UPDATED",
            message: `更新 FA：${next.taskNumber} ${next.title}`,
            meta: { hasFaLink: true },
            createdAt: at,
          });
        }
        if (typeof data.dueDate === "string" && data.dueDate !== prev.dueDate) {
          events.push({
            id: `evt-${Date.now()}-due`,
            level: "INFO",
            actorId,
            entityType: "task",
            entityId: next.id,
            action: "INTERNAL_DUE_DATE_UPDATED",
            message: `更新交付时间：${next.taskNumber} ${next.title}`,
            meta: { from: prev.dueDate, to: next.dueDate },
            createdAt: at,
          });
        }
      }

      return {
        tasks,
        activityEvents: events.length ? [...events, ...s.activityEvents] : s.activityEvents,
      };
    });
  },

  addTask: (task) => {
    const actorId = get().currentUser?.id ?? null;
    const at = new Date().toISOString();
    set(s => ({
      tasks: [task, ...s.tasks],
      activityEvents: [{
        id: `evt-${Date.now()}-task-created`,
        level: "INFO",
        actorId,
        entityType: "task",
        entityId: task.id,
        action: "TASK_CREATED",
        message: `创建任务：${task.taskNumber} ${task.title}`,
        meta: { status: task.status },
        createdAt: at,
      }, ...s.activityEvents],
    }));
  },

  addReview: (review) => {
    const actorId = get().currentUser?.id ?? null;
    const at = new Date().toISOString();
    set(s => ({
      reviews: [review, ...s.reviews],
      activityEvents: [{
        id: `evt-${Date.now()}-review`,
        level: "INFO",
        actorId,
        entityType: "review",
        entityId: review.id,
        action: "REVIEW_CREATED",
        message: `新增审核记录：${review.status}`,
        meta: { taskId: review.taskId, reviewerId: review.reviewerId, submissionId: review.submissionId || null },
        createdAt: at,
      }, ...s.activityEvents],
    }));
  },

  submitDeliverable: ({ taskId, version, fileName, uploadedFiles, link, note }) => {
    const state = get();
    const actor = state.currentUser;
    if (!actor) return { ok: false, error: "当前用户未登录，无法提交交付物。" };
    if (!fileName && !link && (!uploadedFiles || uploadedFiles.length === 0)) {
      return { ok: false, error: "请至少上传一个文件或填写一个交付链接。" };
    }

    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return { ok: false, error: "未找到对应任务，无法提交交付物。" };
    if (task.status === "COMPLETED" || task.status === "CANCELED") {
      return { ok: false, error: "当前任务已结束，不能再提交交付物。" };
    }

    const normalizedVersion = version.trim().toUpperCase();
    const versionNumber = parseVersionNumber(normalizedVersion);
    if (versionNumber === null) {
      return { ok: false, error: "重新提交时必须使用系统生成的 V 版本号。" };
    }

    const numberedVersions = state.submissions
      .filter(item => item.taskId === taskId)
      .map(item => parseVersionNumber(item.version))
      .filter((num): num is number => typeof num === "number" && Number.isFinite(num));
    const expectedVersion = `V${(numberedVersions.length ? Math.max(...numberedVersions) : 0) + 1}`;
    if (normalizedVersion !== expectedVersion) {
      return { ok: false, error: `版本号校验失败，当前任务下一次提交必须使用 ${expectedVersion}。` };
    }

    const linkText = link?.trim() || null;
    if (linkText && !isHttpsLink(linkText)) {
      return { ok: false, error: "交付链接格式不符合要求，请填写有效的 HTTPS 链接。" };
    }

    const fileValidationError = validateUploadedFiles(uploadedFiles);
    if (fileValidationError) return { ok: false, error: fileValidationError };

    const expectedDeliverableCount = getExpectedDeliverableCount(task, state.questionnaires);
    const providedFileCount = uploadedFiles && uploadedFiles.length > 0 ? uploadedFiles.length : fileName ? 1 : 0;
    const canTreatAsPackage = Boolean(
      uploadedFiles &&
      uploadedFiles.length === 1 &&
      PACKAGE_FILE_EXTENSIONS.has(getFileExtension(uploadedFiles[0].name))
    );
    if (!linkText && expectedDeliverableCount > 1 && providedFileCount < expectedDeliverableCount && !canTreatAsPackage) {
      return { ok: false, error: `文件完整性校验失败，当前任务需重新提交全部 ${expectedDeliverableCount} 个交付物，或提供包含全部内容的统一交付链接/压缩包。` };
    }

    const latestNumberedSubmission = getLatestNumberedSubmission(taskId, state.submissions);
    const latestNumberedReview = latestNumberedSubmission
      ? getLatestReviewForSubmission(latestNumberedSubmission.id, state.reviews)
      : null;
    const isResubmissionAfterReturn = latestNumberedReview?.status === "REVISION_REQUESTED";
    if (isResubmissionAfterReturn && !note.trim()) {
      return { ok: false, error: "请填写本次修改说明，并与退回意见一一对应后再重新提交。" };
    }

    const at = new Date().toISOString();
    const submissionId = `sub-${Date.now()}-${taskId}`;
    const submission: SubmissionRecord = {
      id: submissionId,
      taskId,
      submitterId: actor.id,
      version: normalizedVersion || "V1",
      submittedAt: at,
      fileName,
      uploadedFiles: uploadedFiles && uploadedFiles.length > 0 ? uploadedFiles : undefined,
      link: linkText,
      note,
    };

    const reviewerId = (() => {
      const createdBy = USERS.find(u => u.id === task.createdById);
      if (createdBy?.role === "LEADER") return createdBy.id;
      return USERS.find(u => u.role === "LEADER")?.id || actor.id;
    })();

    const review: Review = {
      id: `r-${Date.now()}-${taskId}`,
      taskId,
      reviewerId,
      status: "PENDING",
      comment: note.trim() || null,
      timestamp: null,
      submissionId,
      createdAt: at,
    };

    const notif: Notification = {
      id: `n-${Date.now()}-${reviewerId}-review`,
      userId: reviewerId,
      type: "REVIEW_REQUESTED",
      title: "有任务等待审核",
      message: `${actor.name} 提交了「${task.taskNumber} ${task.title}」等待你的审核`,
      linkTo: "/review",
      isRead: false,
      createdAt: at,
    };

    set(s => {
      const prev = s.tasks.find(t => t.id === taskId) || null;
      const tasks = s.tasks.map(t => t.id === taskId ? { ...t, status: "INTERNAL_REVIEW", updatedAt: at } : t);
      const events: ActivityEvent[] = [
        {
          id: `evt-${Date.now()}-submission`,
          level: "INFO",
          actorId: actor.id,
          entityType: "submission",
          entityId: submissionId,
          action: "SUBMISSION_CREATED",
          message: `提交交付物：${task.taskNumber} ${task.title}（${submission.version}）`,
          meta: {
            taskId,
            fileName,
            fileCount: uploadedFiles?.length || 0,
            hasLink: !!linkText,
            expectedDeliverableCount,
            resubmissionOf: isResubmissionAfterReturn ? latestNumberedSubmission?.id || null : null,
            resubmissionReason: isResubmissionAfterReturn ? latestNumberedReview?.comment || null : null,
          },
          createdAt: at,
        },
        {
          id: `evt-${Date.now()}-notif`,
          level: "INFO",
          actorId: actor.id,
          entityType: "notification",
          entityId: notif.id,
          action: "NOTIF_CREATED",
          message: `发送审核通知：${notif.title}`,
          meta: { userId: reviewerId, taskId },
          createdAt: at,
        },
      ];

      if (prev?.status !== "INTERNAL_REVIEW") {
        events.unshift({
          id: `evt-${Date.now()}-task-status`,
          level: "INFO",
          actorId: actor.id,
          entityType: "task",
          entityId: taskId,
          action: "TASK_STATUS_CHANGED",
          message: `进入审核队列：${task.taskNumber} ${task.title}`,
          meta: { from: prev?.status || null, to: "INTERNAL_REVIEW" },
          createdAt: at,
        });
      }

      return {
        submissions: [submission, ...s.submissions],
        reviews: [review, ...s.reviews],
        notifications: [notif, ...s.notifications],
        tasks,
        activityEvents: [...events, ...s.activityEvents],
        systemEvents: [{
          id: `sys-${Date.now()}-queue`,
          level: "INFO",
          scope: "notification",
          message: "已将审核通知加入队列",
          meta: { to: reviewerId, taskId },
          createdAt: at,
        }, ...s.systemEvents],
      };
    });
    return { ok: true };
  },

  returnDeliverable: ({ taskId, submissionId, reason, newDueDate }) => {
    const state = get();
    const actor = state.currentUser;
    if (!actor) return { ok: false, error: "当前用户未登录，无法执行退回操作。" };
    if (!reason.trim()) return { ok: false, error: "退回修改时必须填写明确的退回原因。" };

    const task = state.tasks.find(item => item.id === taskId) || null;
    if (!task) return { ok: false, error: "未找到对应任务，无法执行退回。" };

    const targetSubmission = state.submissions.find(item => item.id === submissionId && item.taskId === taskId) || null;
    if (!targetSubmission) return { ok: false, error: "未找到当前提交版本，无法执行退回。" };

    const latestReview = getLatestReviewForSubmission(submissionId, state.reviews);
    if (latestReview?.status === "REVISION_REQUESTED") {
      return { ok: false, error: "当前版本已经处于待重新提交状态，请勿重复退回。" };
    }

    const at = new Date().toISOString();
    const assigneeIds = directTaskMemberIds(task);
    const reviewId = `r-${Date.now()}-${taskId}-returned`;
    const dueDate = newDueDate && newDueDate.trim() ? new Date(newDueDate).toISOString() : task.dueDate || null;
    const clearedSnapshot = {
      fileName: targetSubmission.fileName,
      uploadedFiles: targetSubmission.uploadedFiles || [],
      link: targetSubmission.link,
      note: targetSubmission.note,
      version: targetSubmission.version,
    };

    const review: Review = {
      id: reviewId,
      taskId,
      reviewerId: actor.id,
      status: "REVISION_REQUESTED",
      comment: reason.trim(),
      timestamp: null,
      submissionId,
      createdAt: at,
    };

    const notifications: Notification[] = assigneeIds.map(userId => ({
      id: `n-${Date.now()}-${userId}-returned`,
      userId,
      type: "REVIEW_COMPLETED",
      title: "交付物已被退回",
      message: `「${task.taskNumber} ${task.title}」已被退回，请根据退回意见重新上传全部交付物后再提交审核。`,
      linkTo: "/my-tasks",
      isRead: false,
      createdAt: at,
    }));

    set(s => {
      const tasks = s.tasks.map(item => item.id === taskId ? {
        ...item,
        status: "WIP",
        dueDate,
        videoUrl: null,
        supportingLink: null,
        faLink: item.status === "PENDING_SIGNOFF" ? null : item.faLink,
        acceptanceHistory:
          item.status === "PENDING_SIGNOFF" && Array.isArray(item.acceptanceHistory) && item.acceptanceHistory.length > 0
            ? item.acceptanceHistory.map((h, idx) => (idx === item.acceptanceHistory!.length - 1 ? { ...h, result: "revision_requested" as const, resultAt: at, feedback: reason.trim() } : h))
            : item.acceptanceHistory,
        updatedAt: at,
      } : item);
      const submissions = s.submissions.map(item => item.id === submissionId ? {
        ...item,
        fileName: null,
        uploadedFiles: undefined,
        link: null,
        note: "",
      } : item);
      const events: ActivityEvent[] = [
        {
          id: `evt-${Date.now()}-review`,
          level: "WARN",
          actorId: actor.id,
          entityType: "review",
          entityId: reviewId,
          action: "REVIEW_CREATED",
          message: `退回修改：${task.taskNumber} ${task.title}`,
          meta: { taskId, reviewerId: actor.id, submissionId, status: "REVISION_REQUESTED" },
          createdAt: at,
        },
        {
          id: `evt-${Date.now()}-task-status`,
          level: "WARN",
          actorId: actor.id,
          entityType: "task",
          entityId: taskId,
          action: "TASK_STATUS_CHANGED",
          message: `任务退回重提：${task.taskNumber} ${task.title}`,
          meta: { from: task.status, to: "WIP", reason: reason.trim(), submissionId, returnedAt: at, dueDate },
          createdAt: at,
        },
        {
          id: `evt-${Date.now()}-submission-cleared`,
          level: "WARN",
          actorId: actor.id,
          entityType: "submission",
          entityId: submissionId,
          action: "SUBMISSION_CLEARED_FOR_RESUBMIT",
          message: `已清空退回版本交付内容：${task.taskNumber} ${task.title}（${targetSubmission.version}）`,
          meta: {
            taskId,
            reason: reason.trim(),
            operatorId: actor.id,
            returnedAt: at,
            submissionVersion: targetSubmission.version,
            clearedSnapshot,
            lockedUntilResubmit: true,
          },
          createdAt: at,
        },
        ...notifications.map(notif => ({
          id: `evt-${Date.now()}-${notif.userId}-notif`,
          level: "INFO" as const,
          actorId: actor.id,
          entityType: "notification" as const,
          entityId: notif.id,
          action: "NOTIF_CREATED",
          message: `发送退回通知：${notif.title}`,
          meta: { userId: notif.userId, taskId, submissionId },
          createdAt: at,
        })),
      ];

      return {
        tasks,
        submissions,
        reviews: [review, ...s.reviews],
        notifications: [...notifications, ...s.notifications],
        activityEvents: [...events, ...s.activityEvents],
        systemEvents: [{
          id: `sys-${Date.now()}-return`,
          level: "WARN",
          scope: "store",
          message: "交付物已退回并清空当前内容，等待重新提交",
          meta: { taskId, submissionId, operatorId: actor.id, returnedAt: at },
          createdAt: at,
        }, ...s.systemEvents],
      };
    });

    return { ok: true };
  },

  submitPackageDeliverable: ({ typeTaskPackageId, uploadedFiles, fileLinks, submitNote, actualWorkingHours, assetCategory, submittedById }) => {
    const state = get();
    const actor = submittedById
      ? USERS.find(user => user.id === submittedById) || null
      : state.currentUser;
    if (!actor) return { ok: false, error: "当前用户未登录，无法提交交付任务。" };

    const pkg = state.typeTaskPackages.find(item => item.id === typeTaskPackageId) || null;
    if (!pkg) return { ok: false, error: "未找到对应交付任务，无法提交。" };
    const project = state.projects.find(item => item.id === pkg.projectId) || null;
    if (!project) return { ok: false, error: "未找到对应项目，无法提交。" };
    if (project.status === "已取消" || pkg.status === "已结束") return { ok: false, error: "当前项目已结束，不能继续提交交付任务。" };
    if (pkg.status === "已通过") return { ok: false, error: "该交付任务已通过需求方审核，无需重复提交。" };
    if (pkg.status === "待需求方审核") return { ok: false, error: "该交付任务正在等待需求方审核，请勿重复提交。" };
    if (pkg.assigneeId && pkg.assigneeId !== actor.id && actor.role !== "LEADER") return { ok: false, error: "只有当前交付任务的执行成员可以提交。" };

    const normalizedLinks = Array.from(new Set((fileLinks || []).map(item => String(item || "").trim()).filter(Boolean)));
    if ((!uploadedFiles || uploadedFiles.length === 0) && normalizedLinks.length === 0) {
      return { ok: false, error: "请至少上传一个文件或填写一个文件链接后再提交。" };
    }
    const fileValidationError = validateUploadedFiles(uploadedFiles);
    if (fileValidationError) return { ok: false, error: fileValidationError };
    if (normalizedLinks.some(link => !isHttpsLink(link))) {
      return { ok: false, error: "文件链接格式不符合要求，请填写有效的 HTTPS 链接。" };
    }

    const history = getPackageSubmissions(pkg.id, state.submissions);
    const nextVersion = `V${history.length + 1}`;
    const at = new Date().toISOString();
    const signoffToken = `signoff-${pkg.id}-${Date.now()}`;
    const signoffUrl = `/signoff/${signoffToken}`;
    const submissionId = `pkg-sub-${pkg.id}-${Date.now()}`;
    const fileName = uploadedFiles && uploadedFiles.length > 0
      ? (uploadedFiles.length === 1 ? uploadedFiles[0].name : `${uploadedFiles[0].name} 等 ${uploadedFiles.length} 个文件`)
      : null;
    const submission: SubmissionRecord = {
      id: submissionId,
      taskId: pkg.id,
      typeTaskPackageId: pkg.id,
      projectId: project.id,
      submitterId: actor.id,
      submittedBy: actor.name,
      version: nextVersion,
      submittedAt: at,
      fileName,
      uploadedFiles: uploadedFiles && uploadedFiles.length > 0 ? uploadedFiles : undefined,
      link: normalizedLinks[0] || null,
      fileLinks: normalizedLinks,
      note: String(submitNote || "").trim(),
      submitNote: String(submitNote || "").trim(),
      signoffToken,
      signoffUrl,
      emailSentStatus: "sent",
      result: "pending",
      reviewedAt: null,
      reviewedByName: null,
      reviewedByEmail: null,
    };

    const nextPackages = state.typeTaskPackages.map(item => item.id === pkg.id ? {
      ...item,
      status: "待需求方审核" as const,
      currentVersion: nextVersion,
      fileLinks: normalizedLinks,
      uploadedFiles: uploadedFiles && uploadedFiles.length > 0 ? uploadedFiles : [],
      actualWorkingHours: typeof actualWorkingHours === "number" && Number.isFinite(actualWorkingHours) ? actualWorkingHours : item.actualWorkingHours,
      assetCategory: typeof assetCategory === "string" && assetCategory.trim() ? assetCategory.trim() : item.assetCategory,
      submissions: [...item.submissions, submissionId],
      updatedAt: at,
    } : item);
    const projectPackages = nextPackages.filter(item => item.projectId === project.id);
    const projection = buildProjectProjection(project, projectPackages, state.questionnaires, state.tasks, state.projects.find(item => item.id === project.id)?.completedAt || null);
    const nextProjects = state.projects.map(item => item.id === project.id ? projection.project : item);
    const nextTasks = normalizeTasksByQuestionnaire(projection.tasks, state.questionnaires);
    const managerId = getProjectManagerId(project, state.tasks, state.questionnaires);
    const notificationReceivers = uniqueMemberIds([actor.id, managerId]);
    const notifications: Notification[] = [
      ...notificationReceivers.map(receiverId => ({
        id: `n-${Date.now()}-${receiverId}-deliverable-submitted`,
        type: "deliverable_submitted",
        title: receiverId === actor.id ? "交付任务已提交" : "执行成员已提交交付任务",
        content:
          receiverId === actor.id
            ? `你已提交「${project.projectCode} ${project.projectName} / ${pkg.deliverableType}」的 ${nextVersion} 版本。`
            : `${actor.name} 已提交「${project.projectCode} ${project.projectName} / ${pkg.deliverableType}」的 ${nextVersion} 版本。`,
        message:
          receiverId === actor.id
            ? `你已提交「${project.projectCode} ${project.projectName} / ${pkg.deliverableType}」的 ${nextVersion} 版本。`
            : `${actor.name} 已提交「${project.projectCode} ${project.projectName} / ${pkg.deliverableType}」的 ${nextVersion} 版本。`,
        senderId: actor.id,
        senderName: actor.name,
        receiverId,
        receiverName: USERS.find(user => user.id === receiverId)?.name || "",
        projectId: project.id,
        projectCode: project.projectCode,
        projectName: project.projectName,
        projectStatus: projection.project.status,
        submissionId,
        submissionVersion: nextVersion,
        typeTaskPackageId: pkg.id,
        deliverableType: pkg.deliverableType,
        actionText: receiverId === actor.id ? "查看记录" : "查看项目",
        actionTarget: receiverId === actor.id ? "my-tasks" : "tasks",
        userId: receiverId,
        isRead: receiverId === actor.id,
        notificationStatus: (receiverId === actor.id ? "已读" : "未读") as "已读" | "未读",
        createdAt: at,
      })),
      ...notificationReceivers.map(receiverId => ({
        id: `n-${Date.now()}-${receiverId}-signoff-mail`,
        type: "signoff_email_sent",
        title: "审核链接已发送给需求方",
        content: `「${project.projectCode} ${project.projectName} / ${pkg.deliverableType}」已提交 ${nextVersion}，系统已向需求方发送审核链接。`,
        message: `「${project.projectCode} ${project.projectName} / ${pkg.deliverableType}」已提交 ${nextVersion}，系统已向需求方发送审核链接。`,
        senderId: actor.id,
        senderName: actor.name,
        receiverId,
        receiverName: USERS.find(user => user.id === receiverId)?.name || "",
        projectId: project.id,
        projectCode: project.projectCode,
        projectName: project.projectName,
        projectStatus: projection.project.status,
        submissionId,
        submissionVersion: nextVersion,
        typeTaskPackageId: pkg.id,
        deliverableType: pkg.deliverableType,
        signOffLink: signoffUrl,
        signoffUrl,
        signoffToken,
        actionText: receiverId === actor.id ? "查看记录" : "查看项目",
        actionTarget: receiverId === actor.id ? "my-tasks" : "tasks",
        secondaryActionText: "打开审核页",
        secondaryActionTarget: signoffUrl,
        userId: receiverId,
        isRead: receiverId === actor.id,
        notificationStatus: (receiverId === actor.id ? "已读" : "未读") as "已读" | "未读",
        createdAt: at,
      })),
    ];

    set(s => ({
      submissions: [submission, ...s.submissions],
      typeTaskPackages: nextPackages,
      projects: nextProjects,
      tasks: nextTasks,
      notifications: [...notifications, ...s.notifications],
      signoffRecords: s.signoffRecords,
      activityEvents: [{
        id: `evt-${Date.now()}-package-submit`,
        level: "INFO",
        actorId: actor.id,
        entityType: "submission",
        entityId: submissionId,
        action: "PACKAGE_SUBMITTED",
        message: `提交交付任务：${project.projectCode} ${pkg.deliverableType}（${nextVersion}）`,
        meta: { projectId: project.id, typeTaskPackageId: pkg.id, signoffToken, receiverCount: notificationReceivers.length },
        createdAt: at,
      }, ...s.activityEvents],
      systemEvents: [{
        id: `sys-${Date.now()}-package-submit`,
        level: "INFO",
        scope: "store",
        message: "交付任务已提交并生成需求方审核链接",
        meta: { projectId: project.id, typeTaskPackageId: pkg.id, version: nextVersion },
        createdAt: at,
      }, ...s.systemEvents],
    }));
    return { ok: true };
  },

  approvePackageSubmission: ({ token, reviewedByName, reviewedByEmail, feedback }) => {
    const state = get();
    const submission = findSubmissionByToken(token, state.submissions);
    if (!submission || !submission.typeTaskPackageId || !submission.projectId) return { ok: false, error: "未找到对应审核记录，请确认审核链接是否正确。" };
    const pkg = state.typeTaskPackages.find(item => item.id === submission.typeTaskPackageId) || null;
    const project = state.projects.find(item => item.id === submission.projectId) || null;
    if (!pkg || !project) return { ok: false, error: "当前交付任务或项目不存在，无法提交审核结果。" };
    if (project.status === "已取消" || pkg.status === "已结束") return { ok: false, error: "当前项目已结束，审核链接已失效。" };
    if (pkg.status === "已通过") return { ok: false, error: "该交付任务已通过审核，请勿重复提交结果。" };
    const latestSubmission = getLatestPackageSubmission(pkg.id, state.submissions);
    if (!latestSubmission || latestSubmission.id !== submission.id) return { ok: false, error: "该审核链接已失效，系统已有更新版本待审核。" };
    if (submission.result && submission.result !== "pending") return { ok: false, error: "该审核链接已处理，不能重复提交。" };

    const at = new Date().toISOString();
    const signoffRecordId = `signoff-${Date.now()}-${pkg.id}`;
    const signoffRecord: SignoffRecord = {
      id: signoffRecordId,
      typeTaskPackageId: pkg.id,
      projectId: project.id,
      submissionId: submission.id,
      signoffToken: token,
      version: submission.version,
      result: "passed",
      feedback: String(feedback || "").trim(),
      reviewedByName: reviewedByName.trim() || "需求方",
      reviewedByEmail: reviewedByEmail.trim(),
      reviewedAt: at,
    };
    const nextSubmissions = state.submissions.map(item => item.id === submission.id ? {
      ...item,
      result: "passed" as const,
      reviewedAt: at,
      reviewedByName: signoffRecord.reviewedByName,
      reviewedByEmail: signoffRecord.reviewedByEmail,
    } : item);
    const nextPackages = state.typeTaskPackages.map(item => item.id === pkg.id ? {
      ...item,
      status: "已通过" as const,
      latestFeedback: String(feedback || "").trim() || item.latestFeedback,
      signoffHistory: [...item.signoffHistory, signoffRecordId],
      updatedAt: at,
    } : item);
    const projectPackages = nextPackages.filter(item => item.projectId === project.id);
    const projection = buildProjectProjection(project, projectPackages, state.questionnaires, state.tasks, at);
    const nextProjects = state.projects.map(item => item.id === project.id ? projection.project : item);
    const nextTasks = normalizeTasksByQuestionnaire(projection.tasks, state.questionnaires);
    const managerId = getProjectManagerId(project, state.tasks, state.questionnaires);
    const notifiedUsers = uniqueMemberIds([pkg.assigneeId, managerId]);
    const notifications: Notification[] = notifiedUsers.map(userId => ({
      id: `n-${Date.now()}-${userId}-signoff-passed`,
      type: "signoff_passed",
      title: "需求方已通过交付任务",
      content: `需求方已通过「${project.projectCode} ${project.projectName} / ${pkg.deliverableType} / ${submission.version}」。`,
      message: `需求方已通过「${project.projectCode} ${project.projectName} / ${pkg.deliverableType} / ${submission.version}」。`,
      receiverId: userId,
      receiverName: USERS.find(user => user.id === userId)?.name || "",
      projectId: project.id,
      projectCode: project.projectCode,
      projectName: project.projectName,
      projectStatus: projection.project.status,
      submissionId: submission.id,
      submissionVersion: submission.version,
      typeTaskPackageId: pkg.id,
      deliverableType: pkg.deliverableType,
      signoffToken: token,
      signoffUrl: submission.signoffUrl || undefined,
      signOffLink: submission.signoffUrl || undefined,
      actionText: userId === pkg.assigneeId ? "查看任务" : "查看项目",
      actionTarget: userId === pkg.assigneeId ? "my-tasks" : "tasks",
      userId,
      isRead: false,
      notificationStatus: "未读",
      createdAt: at,
    }));
    const completionNotifications: Notification[] = projection.project.status === "已完成"
      ? uniqueMemberIds([managerId, ...projectPackages.map(item => item.assigneeId)]).map(userId => ({
        id: `n-${Date.now()}-${userId}-project-completed`,
        type: "project_auto_completed",
        title: "项目已自动完成",
        content: `项目「${project.projectCode} ${project.projectName}」下全部交付任务均已通过，系统已自动标记为已完成。`,
        message: `项目「${project.projectCode} ${project.projectName}」下全部交付任务均已通过，系统已自动标记为已完成。`,
        receiverId: userId,
        receiverName: USERS.find(user => user.id === userId)?.name || "",
        projectId: project.id,
        projectCode: project.projectCode,
        projectName: project.projectName,
        projectStatus: "已完成",
        typeTaskPackageId: pkg.id,
        actionText: "查看项目",
        actionTarget: "tasks",
        userId,
        isRead: false,
        notificationStatus: "未读",
        createdAt: at,
      }))
      : [];

    set(s => ({
      submissions: nextSubmissions,
      signoffRecords: [signoffRecord, ...s.signoffRecords],
      typeTaskPackages: nextPackages,
      projects: nextProjects,
      tasks: nextTasks,
      notifications: [...completionNotifications, ...notifications, ...s.notifications],
      activityEvents: [{
        id: `evt-${Date.now()}-signoff-passed`,
        level: "INFO",
        actorId: null,
        entityType: "review",
        entityId: signoffRecordId,
        action: "SIGNOFF_PASSED",
        message: `需求方通过交付任务：${project.projectCode} ${pkg.deliverableType} ${submission.version}`,
        meta: { projectId: project.id, typeTaskPackageId: pkg.id, token },
        createdAt: at,
      }, ...s.activityEvents],
      systemEvents: [{
        id: `sys-${Date.now()}-signoff-passed`,
        level: "INFO",
        scope: "store",
        message: projection.project.status === "已完成" ? "需求方审核通过，项目已自动完成" : "需求方审核通过，交付任务已更新为已通过",
        meta: { projectId: project.id, typeTaskPackageId: pkg.id, token },
        createdAt: at,
      }, ...s.systemEvents],
    }));
    return { ok: true };
  },

  requestPackageRevision: ({ token, reviewedByName, reviewedByEmail, feedback }) => {
    const state = get();
    if (!feedback.trim()) return { ok: false, error: "退回时必须填写修改意见。" };
    const submission = findSubmissionByToken(token, state.submissions);
    if (!submission || !submission.typeTaskPackageId || !submission.projectId) return { ok: false, error: "未找到对应审核记录，请确认审核链接是否正确。" };
    const pkg = state.typeTaskPackages.find(item => item.id === submission.typeTaskPackageId) || null;
    const project = state.projects.find(item => item.id === submission.projectId) || null;
    if (!pkg || !project) return { ok: false, error: "当前交付任务或项目不存在，无法提交审核结果。" };
    if (project.status === "已取消" || pkg.status === "已结束" || pkg.status === "已通过") return { ok: false, error: "当前审核链接已失效，不能再退回修改。" };
    const latestSubmission = getLatestPackageSubmission(pkg.id, state.submissions);
    if (!latestSubmission || latestSubmission.id !== submission.id) return { ok: false, error: "该审核链接已失效，系统已有更新版本待审核。" };
    if (submission.result && submission.result !== "pending") return { ok: false, error: "该审核链接已处理，不能重复提交。" };

    const at = new Date().toISOString();
    const signoffRecordId = `signoff-${Date.now()}-${pkg.id}`;
    const signoffRecord: SignoffRecord = {
      id: signoffRecordId,
      typeTaskPackageId: pkg.id,
      projectId: project.id,
      submissionId: submission.id,
      signoffToken: token,
      version: submission.version,
      result: "revision_requested",
      feedback: feedback.trim(),
      reviewedByName: reviewedByName.trim() || "需求方",
      reviewedByEmail: reviewedByEmail.trim(),
      reviewedAt: at,
    };
    const nextSubmissions = state.submissions.map(item => item.id === submission.id ? {
      ...item,
      result: "revision_requested" as const,
      reviewedAt: at,
      reviewedByName: signoffRecord.reviewedByName,
      reviewedByEmail: signoffRecord.reviewedByEmail,
    } : item);
    const nextPackages = state.typeTaskPackages.map(item => item.id === pkg.id ? {
      ...item,
      status: "需修改" as const,
      latestFeedback: feedback.trim(),
      signoffHistory: [...item.signoffHistory, signoffRecordId],
      updatedAt: at,
    } : item);
    const projectPackages = nextPackages.filter(item => item.projectId === project.id);
    const projection = buildProjectProjection(project, projectPackages, state.questionnaires, state.tasks, null);
    const nextProjects = state.projects.map(item => item.id === project.id ? projection.project : item);
    const nextTasks = normalizeTasksByQuestionnaire(projection.tasks, state.questionnaires);
    const managerId = getProjectManagerId(project, state.tasks, state.questionnaires);
    const notifications: Notification[] = uniqueMemberIds([pkg.assigneeId, managerId]).map(userId => ({
      id: `n-${Date.now()}-${userId}-signoff-revision`,
      type: "signoff_revision_requested",
      title: "需求方退回了交付任务",
      content: `需求方退回了「${project.projectCode} ${project.projectName} / ${pkg.deliverableType} / ${submission.version}」，请根据反馈修改后重新提交。`,
      message: `需求方退回了「${project.projectCode} ${project.projectName} / ${pkg.deliverableType} / ${submission.version}」，请根据反馈修改后重新提交。`,
      receiverId: userId,
      receiverName: USERS.find(user => user.id === userId)?.name || "",
      projectId: project.id,
      projectCode: project.projectCode,
      projectName: project.projectName,
      projectStatus: projection.project.status,
      submissionId: submission.id,
      submissionVersion: submission.version,
      typeTaskPackageId: pkg.id,
      deliverableType: pkg.deliverableType,
      signoffToken: token,
      signoffUrl: submission.signoffUrl || undefined,
      signOffLink: submission.signoffUrl || undefined,
      stakeholderFeedback: feedback.trim(),
      actionText: userId === pkg.assigneeId ? "查看反馈" : "查看项目",
      actionTarget: userId === pkg.assigneeId ? "my-tasks" : "tasks",
      userId,
      isRead: false,
      notificationStatus: "未读",
      createdAt: at,
    }));

    set(s => ({
      submissions: nextSubmissions,
      signoffRecords: [signoffRecord, ...s.signoffRecords],
      typeTaskPackages: nextPackages,
      projects: nextProjects,
      tasks: nextTasks,
      notifications: [...notifications, ...s.notifications],
      activityEvents: [{
        id: `evt-${Date.now()}-signoff-revision`,
        level: "WARN",
        actorId: null,
        entityType: "review",
        entityId: signoffRecordId,
        action: "SIGNOFF_REVISION_REQUESTED",
        message: `需求方退回交付任务：${project.projectCode} ${pkg.deliverableType} ${submission.version}`,
        meta: { projectId: project.id, typeTaskPackageId: pkg.id, token, feedback: feedback.trim() },
        createdAt: at,
      }, ...s.activityEvents],
      systemEvents: [{
        id: `sys-${Date.now()}-signoff-revision`,
        level: "WARN",
        scope: "store",
        message: "需求方退回交付任务，项目状态已重新计算",
        meta: { projectId: project.id, typeTaskPackageId: pkg.id, token },
        createdAt: at,
      }, ...s.systemEvents],
    }));
    return { ok: true };
  },

  cancelProject: ({ projectId, reason }) => {
    const state = get();
    const actor = state.currentUser;
    const project = state.projects.find(item => item.id === projectId) || null;
    if (!actor) return { ok: false, error: "当前用户未登录，无法取消项目。" };
    if (!project) return { ok: false, error: "未找到对应项目，无法取消。" };
    if (!reason.trim()) return { ok: false, error: "请填写取消项目原因。" };
    if (project.status === "已取消") return { ok: false, error: "当前项目已取消，请勿重复操作。" };
    const at = new Date().toISOString();
    const nextPackages = state.typeTaskPackages.map(item => item.projectId === project.id && item.status !== "已通过" ? {
      ...item,
      status: "已结束" as const,
      updatedAt: at,
    } : item);
    const nextProjects = state.projects.map(item => item.id === project.id ? {
      ...item,
      status: "已取消" as const,
      canceledAt: at,
      cancelReason: reason.trim(),
      completedAt: null,
    } : item);
    const nextTasks = normalizeTasksByQuestionnaire(state.tasks.map(task => task.id === project.legacyTaskId ? {
      ...task,
      status: "CANCELED",
      updatedAt: at,
    } : task), state.questionnaires);
    const notifications = uniqueMemberIds([
      getProjectManagerId(project, state.tasks, state.questionnaires),
      ...state.typeTaskPackages.filter(item => item.projectId === project.id).map(item => item.assigneeId),
    ]).map(userId => ({
      id: `n-${Date.now()}-${userId}-project-canceled`,
      type: "project_canceled",
      title: "项目已取消",
      content: `项目「${project.projectCode} ${project.projectName}」已取消，未完成的交付任务已结束。`,
      message: `项目「${project.projectCode} ${project.projectName}」已取消，未完成的交付任务已结束。`,
      receiverId: userId,
      receiverName: USERS.find(user => user.id === userId)?.name || "",
      projectId: project.id,
      projectCode: project.projectCode,
      projectName: project.projectName,
      projectStatus: "已取消" as const,
      actionText: "查看项目",
      actionTarget: "tasks",
      userId,
      isRead: false,
      notificationStatus: "未读" as const,
      createdAt: at,
    }));

    set(s => ({
      projects: nextProjects,
      typeTaskPackages: nextPackages,
      tasks: nextTasks,
      notifications: [...notifications, ...s.notifications],
      activityEvents: [{
        id: `evt-${Date.now()}-project-canceled`,
        level: "WARN",
        actorId: actor.id,
        entityType: "task",
        entityId: project.legacyTaskId || project.id,
        action: "PROJECT_CANCELED",
        message: `项目已取消：${project.projectCode} ${project.projectName}`,
        meta: { projectId: project.id, reason: reason.trim() },
        createdAt: at,
      }, ...s.activityEvents],
      systemEvents: [{
        id: `sys-${Date.now()}-project-canceled`,
        level: "WARN",
        scope: "store",
        message: "项目已取消，未完成交付任务已结束",
        meta: { projectId: project.id },
        createdAt: at,
      }, ...s.systemEvents],
    }));
    return { ok: true };
  },

  claimQuest: (id, userId) => set(s => ({
    questionnaires: s.questionnaires.map(q => q.id === id ? { ...q, claimedById: userId, status: "UNDER_REVIEW" } : q),
    activityEvents: [{
      id: `evt-${Date.now()}-brief-claim`,
      level: "INFO",
      actorId: userId,
      entityType: "questionnaire",
      entityId: id,
      action: "BRIEF_CLAIMED",
      message: "Brief 已被认领",
      meta: null,
      createdAt: new Date().toISOString(),
    }, ...s.activityEvents],
  })),

  assignQuest: (id, assigneeId, assignerId) => {
    const state = get();
    const quest = state.questionnaires.find(q => q.id === id);
    if (!quest) return;

    const nextNum = state.tasks.length
      ? Math.max(...state.tasks.map(t => parseInt(String(t.taskNumber || "0").replace("VID-", ""), 10) || 0)) + 1
      : 1;
    const newTask = {
      id: `t-${Date.now()}`,
      taskNumber: `VID-${String(nextNum).padStart(3, "0")}`,
      title: quest.title,
      description: quest.description,
      status: "BRIEF_REVIEW",
      priority: "MEDIUM",
      category: "OTHER",
      assigneeId,
      createdById: assignerId,
      dueDate: quest.deadline,
      completedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set(s => ({
      tasks: [newTask, ...s.tasks],
      questionnaires: s.questionnaires.map(q => q.id === id ? { ...q, status: "ASSIGNED", assignedById: assignerId } : q),
      notifications: [{
        id: `n-${Date.now()}-assign`,
        userId: assigneeId,
        type: "TASK_ASSIGNED",
        title: "你有新任务",
        message: `你被指派了「${newTask.taskNumber} ${quest.title}」`,
        linkTo: "/tasks",
        isRead: false,
        createdAt: new Date().toISOString(),
      }, ...s.notifications],
      activityEvents: [{
        id: `evt-${Date.now()}-brief-assign`,
        level: "INFO",
        actorId: assignerId,
        entityType: "questionnaire",
        entityId: id,
        action: "BRIEF_DISPATCHED",
        message: `完成分配并生成项目：${quest.title}`,
        meta: { assigneeId, taskId: newTask.id },
        createdAt: new Date().toISOString(),
      }, ...s.activityEvents],
    }));
  },

  rejectQuest: (id) => set(s => ({
    questionnaires: s.questionnaires.map(q => q.id === id ? { ...q, status: "REJECTED" } : q),
    activityEvents: [{
      id: `evt-${Date.now()}-brief-reject`,
      level: "WARN",
      actorId: get().currentUser?.id ?? null,
      entityType: "questionnaire",
      entityId: id,
      action: "BRIEF_REJECTED",
      message: "Brief 被拒绝",
      meta: null,
      createdAt: new Date().toISOString(),
    }, ...s.activityEvents],
  })),

  addQuestionnaire: (q) => set(s => {
    const memberNotifs = USERS.filter(u => u.role === "MEMBER").map(u => ({
      id: `n-${Date.now()}-${u.id}`,
      userId: u.id,
      type: "NEW_QUESTIONNAIRE",
      title: "新的视频需求",
      message: `${q.requesterName} 提交了「${q.title}」`,
      linkTo: "/questionnaire",
      isRead: false,
      createdAt: new Date().toISOString(),
    }));
    const at = new Date().toISOString();
    return {
      questionnaires: [q, ...s.questionnaires],
      notifications: [...memberNotifs, ...s.notifications],
      activityEvents: [{
        id: `evt-${Date.now()}-brief-submit`,
        level: "INFO",
        actorId: get().currentUser?.id ?? null,
        entityType: "questionnaire",
        entityId: q.id,
        action: "BRIEF_SUBMITTED",
        message: `收到新 Brief：${q.title}`,
        meta: { requesterName: q.requesterName },
        createdAt: at,
      }, ...s.activityEvents],
      systemEvents: [{
        id: `sys-${Date.now()}-new-brief`,
        level: "INFO",
        scope: "store",
        message: "新 Brief 已入库并已生成通知",
        meta: { briefId: q.id, notifications: memberNotifs.length },
        createdAt: at,
      }, ...s.systemEvents],
    };
  }),

  updateQuestionnaire: (id, data) => set(s => {
    const questionnaires = s.questionnaires.map(q => q.id === id ? { ...q, ...data } : q);
    return {
      questionnaires,
      tasks: normalizeTasksByQuestionnaire(s.tasks, questionnaires),
    };
  }),

  updateBriefDispatch: ({ questionnaireId, packages, assignerId, resolvedDeliverableGroups }) => {
    const state = get();
    const quest = state.questionnaires.find(q => q.id === questionnaireId);
    if (!quest) return { ok: false, error: "未找到对应 Brief，无法调整分配。" };

    const existingProject = state.projects.find(project => project.briefId === questionnaireId) || null;
    if (!existingProject) {
      return get().dispatchBrief({ questionnaireId, packages, assignerId });
    }

    const deliverableTypes = getResolvedDeliverableGroups(quest, resolvedDeliverableGroups);
    if (deliverableTypes.length === 0) return { ok: false, error: "当前 Brief 缺少交付物类型分组，无法调整分配。" };
    if (packages.length !== deliverableTypes.length) return { ok: false, error: "交付任务数量与交付物类型数量不一致，无法调整分配。" };

    const assigner = USERS.find(user => user.id === assignerId) || null;
    if (!assigner) return { ok: false, error: "当前分发人不存在，无法调整分配。" };

    const existingPackages = state.typeTaskPackages.filter(pkg => pkg.projectId === existingProject.id);
    const existingByType = new Map(existingPackages.map(pkg => [pkg.deliverableType, pkg] as const));
    let normalizedPackages: TypeTaskPackage[] = [];
    try {
      normalizedPackages = deliverableTypes.map(group => {
        const payload = packages.find(item => item.deliverableType === group.type);
        if (!payload) throw new Error(`缺少「${group.type}」的分配信息。`);
        if (!payload.assigneeId) throw new Error(`请选择「${group.type}」的执行成员。`);
        if (!payload.promisedAt || !String(payload.promisedAt).trim()) throw new Error(`请选择「${group.type}」的承诺交付时间。`);
        const promisedMs = new Date(payload.promisedAt).getTime();
        if (Number.isNaN(promisedMs)) throw new Error(`「${group.type}」的承诺交付时间格式不合法。`);
        const member = USERS.find(user => user.id === payload.assigneeId) || null;
        if (!member) throw new Error(`「${group.type}」的执行成员不存在。`);
        const prev = existingByType.get(group.type) || null;
        const at = new Date().toISOString();
        return {
          id: prev?.id || `ttp-${Date.now()}-${group.type}`,
          projectId: existingProject.id,
          briefId: questionnaireId,
          deliverableType: group.type,
          deliverableItems: group.items,
          assigneeId: member.id,
          assigneeName: member.name,
          promisedAt: new Date(payload.promisedAt).toISOString(),
          estimatedWorkingHours: typeof payload.estimatedWorkingHours === "number" && Number.isFinite(payload.estimatedWorkingHours) ? payload.estimatedWorkingHours : null,
          actualWorkingHours: prev?.actualWorkingHours ?? null,
          assetCategory: String(payload.assetCategory || "").trim(),
          assignmentNote: String(payload.assignmentNote || "").trim(),
          status: prev?.status || "待提交",
          currentVersion: prev?.currentVersion ?? null,
          fileLinks: prev?.fileLinks || [],
          uploadedFiles: prev?.uploadedFiles || [],
          latestFeedback: prev?.latestFeedback ?? null,
          submissions: prev?.submissions || [],
          signoffHistory: prev?.signoffHistory || [],
          createdAt: prev?.createdAt || at,
          updatedAt: at,
        } satisfies TypeTaskPackage;
      });
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "交付任务分配信息不完整。" };
    }

    const at = new Date().toISOString();
    const summary = buildDispatchSummary(normalizedPackages);
    const existingMeta = getQuestionnaireMeta(quest) || {};
    const mergedMeta: Record<string, unknown> = {
      ...existingMeta,
      deliverableTypes,
      deliverables: toLegacyDeliverablesMap(deliverableTypes),
      dispatch: {
        ...summary,
        assignedAt: at,
      },
    };
    const prevIds = uniqueMemberIds(existingPackages.map(pkg => pkg.assigneeId));
    const nextIds = uniqueMemberIds(normalizedPackages.map(pkg => pkg.assigneeId));
    const legacyTask = state.tasks.find(task => task.questionnaireId === questionnaireId) || null;
    const projectStatus = getProjectStatusFromPackages(normalizedPackages);
    const earliestPromisedAt = getEarliestPromisedAt(normalizedPackages);
    const requestDateIso = (() => {
      const requestDate = typeof mergedMeta.requestDate === "string" ? mergedMeta.requestDate.trim() : "";
      if (!requestDate) return quest.createdAt;
      const ms = new Date(requestDate).getTime();
      return Number.isNaN(ms) ? quest.createdAt : new Date(requestDate).toISOString();
    })();

    const notifications: Notification[] = nextIds.map(uid => {
      const receiver = USERS.find(user => user.id === uid) || null;
      return {
        id: `n-${Date.now()}-${uid}-dispatch-updated`,
        userId: uid,
        receiverId: uid,
        receiverName: receiver?.name,
        type: "TASK_REASSIGNED",
        title: prevIds.includes(uid) ? "交付任务分配已更新" : "你被加入新的交付任务",
        message: prevIds.includes(uid) ? `「${existingProject.projectCode} ${quest.title}」的分配信息已更新` : `你被加入「${existingProject.projectCode} ${quest.title}」`,
        linkTo: "/my-tasks",
        isRead: false,
        createdAt: at,
      };
    });

    const events: ActivityEvent[] = [
      {
        id: `evt-${Date.now()}-brief-reassigned`,
        level: "INFO",
        actorId: assignerId,
        entityType: "questionnaire",
        entityId: questionnaireId,
        action: "BRIEF_REASSIGNED",
        message: `调整交付任务分配：${quest.title}`,
        meta: { projectId: existingProject.id, previousMemberIds: prevIds, nextMemberIds: nextIds },
        createdAt: at,
      },
    ];

    set(s => {
      const questionnaires = s.questionnaires.map(q => q.id === questionnaireId ? {
        ...q,
        status: "ASSIGNED",
        assignedById: assignerId,
        deliverableTypes,
        specialNotes: JSON.stringify(mergedMeta),
      } : q);
      const typeTaskPackages = [
        ...s.typeTaskPackages.filter(pkg => pkg.projectId !== existingProject.id),
        ...normalizedPackages,
      ];
      const projects = s.projects.map(project => project.id === existingProject.id ? {
        ...project,
        brandTeam: getQuestionnaireBrandTeam(quest),
        requestorName: quest.requesterName,
        requestorEmail: getQuestionnaireRequestorEmail(quest),
        status: projectStatus,
        typeTaskPackageIds: normalizedPackages.map(pkg => pkg.id),
      } : project);
      const tasks = legacyTask
        ? s.tasks.map(task => task.id === legacyTask.id ? {
          ...task,
          assigneeId: nextIds[0] || null,
          primaryAssigneeId: nextIds[0] || null,
          assigneeIds: normalizeSingleMemberIds(nextIds),
          dueDate: earliestPromisedAt ? new Date(earliestPromisedAt).toISOString() : task.dueDate || null,
          requestDate: task.requestDate || requestDateIso,
          stakeholderExpectedDueDate: task.stakeholderExpectedDueDate || quest.deadline || null,
          committedDeliveryDate: earliestPromisedAt ? new Date(earliestPromisedAt).toISOString() : task.committedDeliveryDate || null,
          updatedAt: at,
        } : task)
        : s.tasks;
      return {
        questionnaires,
        projects,
        typeTaskPackages,
        tasks: normalizeTasksByQuestionnaire(tasks, questionnaires),
        notifications: [...notifications, ...s.notifications],
        activityEvents: [...events, ...s.activityEvents],
        systemEvents: [{
          id: `sys-${Date.now()}-reassign`,
          level: "INFO",
          scope: "store",
          message: "调整分配完成：已更新交付任务",
          meta: { questionnaireId, projectId: existingProject.id, packageCount: normalizedPackages.length },
          createdAt: at,
        }, ...s.systemEvents],
      };
    });
    return { ok: true };
  },

  dispatchBrief: ({ questionnaireId, packages, assignerId, resolvedDeliverableGroups }) => {
    const state = get();
    const quest = state.questionnaires.find(q => q.id === questionnaireId);
    if (!quest) return { ok: false, error: "未找到对应 Brief，无法分配。" };
    if (state.projects.some(project => project.briefId === questionnaireId)) {
      return { ok: false, error: "该 Brief 已转为项目，请勿重复生成。" };
    }

    const deliverableTypes = getResolvedDeliverableGroups(quest, resolvedDeliverableGroups);
    if (deliverableTypes.length === 0) return { ok: false, error: "当前 Brief 缺少交付物类型分组，无法分配。" };
    if (packages.length !== deliverableTypes.length) return { ok: false, error: "交付任务数量与交付物类型数量不一致，无法分配。" };

    const assigner = USERS.find(user => user.id === assignerId) || null;
    if (!assigner) return { ok: false, error: "当前分发人不存在，无法分配。" };

    const at = new Date().toISOString();
    const nextProjectNumber = (() => {
      const numbers = [
        ...state.projects.map(project => Number(String(project.projectCode || "").replace(/\D/g, "")) || 0),
        ...state.tasks.map(task => Number(String(task.projectCode || "").replace(/\D/g, "")) || 0),
      ];
      return (numbers.length ? Math.max(...numbers) : 1000) + 1;
    })();
    const nextTaskNumber = (() => {
      const numbers = state.tasks.map(task => parseInt(String(task.taskNumber || "0").replace("VID-", ""), 10) || 0);
      return (numbers.length ? Math.max(...numbers) : 0) + 1;
    })();

    let normalizedPackages: TypeTaskPackage[] = [];
    try {
      normalizedPackages = deliverableTypes.map(group => {
        const payload = packages.find(item => item.deliverableType === group.type);
        if (!payload) throw new Error(`缺少「${group.type}」的分配信息。`);
        if (!payload.assigneeId) throw new Error(`请选择「${group.type}」的执行成员。`);
        if (!payload.promisedAt || !String(payload.promisedAt).trim()) throw new Error(`请选择「${group.type}」的承诺交付时间。`);
        const promisedMs = new Date(payload.promisedAt).getTime();
        if (Number.isNaN(promisedMs)) throw new Error(`「${group.type}」的承诺交付时间格式不合法。`);
        const member = USERS.find(user => user.id === payload.assigneeId) || null;
        if (!member) throw new Error(`「${group.type}」的执行成员不存在。`);
        return {
          id: `ttp-${questionnaireId}-${group.type}`,
          projectId: `prj-${questionnaireId}`,
          briefId: questionnaireId,
          deliverableType: group.type,
          deliverableItems: group.items,
          assigneeId: member.id,
          assigneeName: member.name,
          promisedAt: new Date(payload.promisedAt).toISOString(),
          estimatedWorkingHours: typeof payload.estimatedWorkingHours === "number" && Number.isFinite(payload.estimatedWorkingHours) ? payload.estimatedWorkingHours : null,
          actualWorkingHours: null,
          assetCategory: String(payload.assetCategory || "").trim(),
          assignmentNote: String(payload.assignmentNote || "").trim(),
          status: "待提交",
          currentVersion: null,
          fileLinks: [],
          uploadedFiles: [],
          latestFeedback: null,
          submissions: [],
          signoffHistory: [],
          createdAt: at,
          updatedAt: at,
        } satisfies TypeTaskPackage;
      });
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "交付任务分配信息不完整。" };
    }

    const earliestPromisedAt = getEarliestPromisedAt(normalizedPackages);
    const projectStatus = getProjectStatusFromPackages(normalizedPackages);
    const requestDateIso = (() => {
      const meta = getQuestionnaireMeta(quest);
      const requestDate = typeof meta?.requestDate === "string" ? meta.requestDate.trim() : "";
      if (!requestDate) return quest.createdAt;
      const ms = new Date(requestDate).getTime();
      return Number.isNaN(ms) ? quest.createdAt : new Date(requestDate).toISOString();
    })();
    const project: ProjectRecord = {
      id: `prj-${questionnaireId}`,
      projectCode: `PRJ-${String(nextProjectNumber).padStart(4, "0")}`,
      briefId: questionnaireId,
      projectName: quest.title,
      brandTeam: getQuestionnaireBrandTeam(quest),
      requestorName: quest.requesterName,
      requestorEmail: getQuestionnaireRequestorEmail(quest),
      status: projectStatus,
      typeTaskPackageIds: normalizedPackages.map(pkg => pkg.id),
      createdAt: at,
      completedAt: null,
      canceledAt: null,
      cancelReason: null,
      legacyTaskId: `t-${questionnaireId}`,
    };
    const dispatchSummary = buildDispatchSummary(normalizedPackages);
    const existingMeta = getQuestionnaireMeta(quest) || {};
    const mergedMeta: Record<string, unknown> = {
      ...existingMeta,
      deliverableTypes,
      deliverables: toLegacyDeliverablesMap(deliverableTypes),
      dispatch: {
        ...dispatchSummary,
        assignedAt: at,
      },
      generatedProjectId: project.id,
    };
    const legacyTask: Task = {
      id: `t-${questionnaireId}`,
      taskNumber: `VID-${String(nextTaskNumber).padStart(3, "0")}`,
      title: quest.title,
      description: quest.description,
      status: "WIP",
      priority: getQuestionnairePriority(quest),
      category: "OTHER",
      assigneeId: normalizedPackages[0]?.assigneeId || null,
      primaryAssigneeId: normalizedPackages[0]?.assigneeId || null,
      assigneeIds: normalizeSingleMemberIds(normalizedPackages.map(pkg => pkg.assigneeId)),
      createdById: assigner.id,
      questionnaireId,
      dueDate: earliestPromisedAt ? new Date(earliestPromisedAt).toISOString() : quest.deadline,
      requestDate: requestDateIso,
      stakeholderExpectedDueDate: quest.deadline,
      committedDeliveryDate: earliestPromisedAt ? new Date(earliestPromisedAt).toISOString() : null,
      completedAt: null,
      createdAt: at,
      updatedAt: at,
      projectCode: project.projectCode,
      brand: getQuestionnaireBrand(quest),
    };

    const uniqueAssigneeIds = uniqueMemberIds(normalizedPackages.map(pkg => pkg.assigneeId));
    const notifications: Notification[] = uniqueAssigneeIds.flatMap(uid => {
      const receiver = USERS.find(user => user.id === uid) || null;
      if (!receiver) return [];
      return [
        {
          id: `n-${Date.now()}-${uid}-task-assigned`,
          type: "task_assigned",
          title: "你被分配了新的交付任务",
          content: `${assigner.name}已将「${project.projectCode} ${quest.title}」中的部分交付任务分配给你。`,
          message: `${assigner.name}已将「${project.projectCode} ${quest.title}」中的部分交付任务分配给你。`,
          senderId: assigner.id,
          senderName: assigner.name,
          receiverId: receiver.id,
          receiverName: receiver.name,
          projectId: legacyTask.id,
          projectCode: project.projectCode,
          projectName: `${project.projectCode} ${quest.title}`,
          briefSummary: quest.description || "",
          requestDate: requestDateIso,
          stakeholderExpectedDueDate: quest.deadline,
          committedDeliveryDate: earliestPromisedAt ? new Date(earliestPromisedAt).toISOString() : undefined,
          assignNote: normalizedPackages.filter(pkg => pkg.assigneeId === uid).map(pkg => `${pkg.deliverableType} × ${pkg.deliverableItems.length}`).join(" / "),
          projectStatus,
          notificationStatus: "未读",
          actionText: "查看任务",
          actionTarget: "my-tasks",
          linkTo: "/my-tasks",
          userId: receiver.id,
          isRead: false,
          createdAt: at,
        },
        {
          id: `n-${Date.now()}-${assigner.id}-assignment-sent-${uid}`,
          type: "assignment_sent",
          title: "已通知成员接收新任务包",
          content: `已将「${project.projectCode} ${quest.title}」中的交付任务分配给${receiver.name}。`,
          message: `已将「${project.projectCode} ${quest.title}」中的交付任务分配给${receiver.name}。`,
          senderId: assigner.id,
          senderName: assigner.name,
          receiverId: receiver.id,
          receiverName: receiver.name,
          projectId: legacyTask.id,
          projectCode: project.projectCode,
          projectName: `${project.projectCode} ${quest.title}`,
          briefSummary: quest.description || "",
          committedDeliveryDate: earliestPromisedAt ? new Date(earliestPromisedAt).toISOString() : undefined,
          stakeholderExpectedDueDate: quest.deadline,
          assignNote: normalizedPackages.filter(pkg => pkg.assigneeId === uid).map(pkg => `${pkg.deliverableType} × ${pkg.deliverableItems.length}`).join(" / "),
          projectStatus,
          notificationStatus: "已发送",
          actionText: "查看通知内容",
          actionTarget: "notifications",
          linkTo: "/notifications",
          userId: receiver.id,
          isRead: true,
          createdAt: at,
        },
      ];
    });

    const deliverablesSummary = deliverableTypes.map(group => `${group.type} × ${group.items.length}`).join(" / ");
    const stakeholderNotif: Notification = {
      id: `n-${Date.now()}-${assigner.id}-stakeholder-accepted-${questionnaireId}`,
      type: "stakeholder_project_accepted",
      title: "已向需求方发送项目受理通知",
      content: `你的需求已被接收：${project.projectCode} - ${quest.title}`,
      message: `你的需求已被接收：${project.projectCode} - ${quest.title}`,
      senderId: assigner.id,
      senderName: assigner.name,
      receiverId: `stakeholder-${questionnaireId}`,
      receiverName: quest.requesterName,
      receiverEmail: quest.requesterEmail,
      projectId: legacyTask.id,
      projectCode: project.projectCode,
      projectName: quest.title,
      projectStatus,
      workTeam: `TheMIX Studio`,
      committedDeliveryDate: earliestPromisedAt ? new Date(earliestPromisedAt).toISOString() : undefined,
      stakeholderExpectedDueDate: quest.deadline,
      requestDate: requestDateIso,
      briefSummary: quest.description || "",
      deliverablesSummary,
      notificationStatus: "已发送",
      actionText: "查看通知内容",
      actionTarget: "notifications",
      linkTo: "/notifications",
      isRead: true,
      createdAt: at,
    };

    const events: ActivityEvent[] = [
      {
        id: `evt-${Date.now()}-brief-dispatch`,
        level: "INFO",
        actorId: assignerId,
        entityType: "questionnaire",
        entityId: questionnaireId,
        action: "BRIEF_DISPATCHED",
        message: `完成按类型分配并生成项目：${quest.title}`,
        meta: { projectId: project.id, typeTaskPackageCount: normalizedPackages.length },
        createdAt: at,
      },
      {
        id: `evt-${Date.now()}-task-created`,
        level: "INFO",
        actorId: assignerId,
        entityType: "task",
        entityId: legacyTask.id,
        action: "TASK_CREATED",
        message: `创建兼容项目记录：${legacyTask.taskNumber} ${legacyTask.title}`,
        meta: { questionnaireId, projectId: project.id },
        createdAt: at,
      },
    ];

    set(s => {
      const questionnaires = s.questionnaires.map(q => q.id === questionnaireId ? {
        ...q,
        status: "ASSIGNED",
        assignedById: assignerId,
        deliverableTypes,
        specialNotes: JSON.stringify(mergedMeta),
      } : q);
      return {
        questionnaires,
        projects: [project, ...s.projects],
        typeTaskPackages: [...normalizedPackages, ...s.typeTaskPackages],
        tasks: normalizeTasksByQuestionnaire([legacyTask, ...s.tasks], questionnaires),
        notifications: [stakeholderNotif, ...notifications, ...s.notifications],
        activityEvents: [...events, ...s.activityEvents],
        systemEvents: [{
          id: `sys-${Date.now()}-dispatch`,
          level: "INFO",
          scope: "store",
          message: "分发完成：已生成 Project 与 TypeTaskPackage",
          meta: { questionnaireId, projectId: project.id, packageCount: normalizedPackages.length, legacyTaskId: legacyTask.id },
          createdAt: at,
        }, ...s.systemEvents],
      };
    });
    return { ok: true };
  },

  markNotifRead: (id) => set(s => {
    const viewerId = s.notifViewerUserId || s.currentUser?.id || null;
    return {
      notifications: s.notifications.map(n => {
        if (n.id !== id) return n;
        const receiverId = n.receiverId || n.userId || null;
        if (viewerId && receiverId && receiverId !== viewerId) return n;
        if (n.type === "assignment_sent" || n.type === "stakeholder_project_accepted") return n;
        return { ...n, notificationStatus: "已读", isRead: true };
      }),
    activityEvents: [{
      id: `evt-${Date.now()}-notif-read`,
      level: "INFO",
      actorId: get().currentUser?.id ?? null,
      entityType: "notification",
      entityId: id,
      action: "NOTIF_READ",
      message: "通知已读",
      meta: null,
      createdAt: new Date().toISOString(),
    }, ...s.activityEvents],
    };
  }),

  markAllNotifsRead: () => set(s => {
    const viewerId = s.notifViewerUserId || s.currentUser?.id || null;
    return {
      notifications: s.notifications.map(n => {
        const receiverId = n.receiverId || n.userId || null;
        if (!viewerId || receiverId !== viewerId) return n;
        if (n.type === "assignment_sent" || n.type === "stakeholder_project_accepted") return n;
        if (n.notificationStatus === "未读" || n.isRead === false) return { ...n, notificationStatus: "已读", isRead: true };
        return n;
      }),
    activityEvents: [{
      id: `evt-${Date.now()}-notif-read-all`,
      level: "INFO",
      actorId: s.currentUser?.id ?? null,
      entityType: "notification",
      entityId: s.currentUser?.id ?? null,
      action: "NOTIF_READ_ALL",
      message: "全部通知已读",
      meta: null,
      createdAt: new Date().toISOString(),
    }, ...s.activityEvents],
    };
  }),

  addNotification: (n) => {
    const actorId = get().currentUser?.id ?? null;
    const at = new Date().toISOString();
    set(s => ({
      notifications: [n, ...s.notifications],
      activityEvents: [{
        id: `evt-${Date.now()}-notif`,
        level: "INFO",
        actorId,
        entityType: "notification",
        entityId: n.id,
        action: "NOTIF_CREATED",
        message: `新增通知：${n.title}`,
        meta: { userId: n.userId, type: n.type },
        createdAt: at,
      }, ...s.activityEvents],
    }));
  },

  addActivityEvent: (e) => set(s => ({ activityEvents: [e, ...s.activityEvents] })),
  addSystemEvent: (e) => set(s => ({ systemEvents: [e, ...s.systemEvents] })),
}));
