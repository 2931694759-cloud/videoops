"use client";

import { USERS, type Questionnaire, type Task } from "./mock-data";

type DispatchInfo = {
  teamMemberIds: string[];
  committedDeliveryDate: string;
  internalDueDate: string;
  estimatedCostRmb: number | null;
  marketCostRmb: number | null;
  managerNote: string;
};

function safeJsonParse(text: string | null) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function getDispatchInfo(questionnaire: Questionnaire | null | undefined): DispatchInfo | null {
  const parsed = safeJsonParse(questionnaire?.specialNotes || null);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const dispatch = (parsed as Record<string, unknown>).dispatch;
  if (!dispatch || typeof dispatch !== "object" || Array.isArray(dispatch)) return null;

  return {
    teamMemberIds: Array.isArray((dispatch as Record<string, unknown>).teamMemberIds)
      ? ((dispatch as Record<string, unknown>).teamMemberIds as unknown[]).filter((id): id is string => typeof id === "string" && id.trim().length > 0)
      : [],
    committedDeliveryDate: typeof (dispatch as Record<string, unknown>).committedDeliveryDate === "string" ? (dispatch as Record<string, unknown>).committedDeliveryDate as string : "",
    internalDueDate: typeof (dispatch as Record<string, unknown>).internalDueDate === "string" ? (dispatch as Record<string, unknown>).internalDueDate as string : "",
    estimatedCostRmb: typeof (dispatch as Record<string, unknown>).estimatedCostRmb === "number" ? (dispatch as Record<string, unknown>).estimatedCostRmb as number : null,
    marketCostRmb: typeof (dispatch as Record<string, unknown>).marketCostRmb === "number" ? (dispatch as Record<string, unknown>).marketCostRmb as number : null,
    managerNote: typeof (dispatch as Record<string, unknown>).managerNote === "string" ? (dispatch as Record<string, unknown>).managerNote as string : "",
  };
}

function uniqueIds(ids: Array<string | null | undefined>) {
  return Array.from(new Set(ids.filter((id): id is string => typeof id === "string" && id.trim().length > 0)));
}

function normalizeSingleAssignee(ids: Array<string | null | undefined>) {
  const unique = uniqueIds(ids);
  return unique.length > 0 ? [unique[0]] : [];
}

export function getTaskAssigneeIds(task: Task, questionnaire?: Questionnaire | null) {
  const direct = Array.isArray(task.assigneeIds) ? normalizeSingleAssignee(task.assigneeIds) : [];
  if (direct.length > 0) return direct;

  const dispatchIds = normalizeSingleAssignee(getDispatchInfo(questionnaire)?.teamMemberIds || []);
  if (dispatchIds.length > 0) return uniqueIds(dispatchIds);

  return normalizeSingleAssignee([task.primaryAssigneeId, task.assigneeId]);
}

export function getTaskPrimaryAssigneeId(task: Task, questionnaire?: Questionnaire | null) {
  const direct = typeof task.primaryAssigneeId === "string" && task.primaryAssigneeId.trim() ? task.primaryAssigneeId : null;
  if (direct) return direct;
  if (typeof task.assigneeId === "string" && task.assigneeId.trim()) return task.assigneeId;
  return getTaskAssigneeIds(task, questionnaire)[0] || null;
}

export function isTaskAssignedToUser(task: Task, userId: string | null | undefined, questionnaire?: Questionnaire | null) {
  if (!userId) return false;
  return getTaskAssigneeIds(task, questionnaire).includes(userId);
}

export function getTaskAssignees(task: Task, questionnaire?: Questionnaire | null) {
  const ids = getTaskAssigneeIds(task, questionnaire);
  return ids
    .map(id => USERS.find(u => u.id === id) || null)
    .filter((user): user is (typeof USERS)[number] => Boolean(user));
}

export function formatTaskAssigneeNames(task: Task, questionnaire?: Questionnaire | null, limit?: number) {
  const names = getTaskAssignees(task, questionnaire).map(user => user.name);
  if (limit && names.length > limit) {
    return `${names.slice(0, limit).join("、")} 等 ${names.length} 人`;
  }
  return names.join("、") || "-";
}

export function getAssigneeAvatarGroupFromPackages<T extends { assigneeId: string | null | undefined }>(packages: T[]) {
  return uniqueIds(packages.map(pkg => pkg.assigneeId));
}
