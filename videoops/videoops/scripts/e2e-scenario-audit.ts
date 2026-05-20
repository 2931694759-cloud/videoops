import { E2E_SCENARIO_NOTIFICATIONS, E2E_SCENARIO_QUESTIONNAIRES, E2E_SCENARIO_REVIEWS, E2E_SCENARIO_SUBMISSIONS, E2E_SCENARIO_TASKS } from "../src/lib/e2e-scenario-data";
import type { WorkflowData } from "../src/lib/workflowSelectors";
import { getLatestReview, getMemberTaskDisplayStatus, getProjectDisplayFields, getProjectStatus, getSubmissionsByTask, hasPendingReview } from "../src/lib/workflowSelectors";

function safeJsonParse(text: string | null) {
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function getDeliverableTypesFromQuestionnaireSpecialNotes(q: { specialNotes: string | null }) {
  const meta = safeJsonParse(q.specialNotes);
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return [];
  const deliverables = (meta as any).deliverables;
  if (!deliverables || typeof deliverables !== "object" || Array.isArray(deliverables)) return [];
  return Object.keys(deliverables);
}

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

function toSorted(arr: string[]) {
  return arr.slice().sort((a, b) => a.localeCompare(b));
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

function run() {
  const workflowData: WorkflowData = {
    tasks: E2E_SCENARIO_TASKS,
    questionnaires: E2E_SCENARIO_QUESTIONNAIRES,
    submissions: E2E_SCENARIO_SUBMISSIONS,
    reviews: E2E_SCENARIO_REVIEWS,
  };

  const briefTotal = E2E_SCENARIO_QUESTIONNAIRES.length;
  const unassignedBriefs = E2E_SCENARIO_QUESTIONNAIRES.filter(q => q.status === "PENDING");
  const projectTotal = E2E_SCENARIO_TASKS.length;

  const reviewDotTaskIds = E2E_SCENARIO_TASKS
    .filter(t => getProjectStatus(workflowData, t.id) === "制作中" && hasPendingReview(workflowData, t.id))
    .map(t => t.id);

  const reviewPendingQueueTaskIds = E2E_SCENARIO_TASKS
    .filter(t => getProjectStatus(workflowData, t.id) === "制作中" && hasPendingReview(workflowData, t.id))
    .map(t => t.id);

  const reviewDotSet = new Set(reviewDotTaskIds);
  const pendingSet = new Set(reviewPendingQueueTaskIds);
  const reviewDotEqualsPending = reviewDotTaskIds.length === reviewPendingQueueTaskIds.length && reviewDotTaskIds.every(id => pendingSet.has(id));

  const memberStatusByTask = E2E_SCENARIO_TASKS.map(t => ({ taskId: t.id, status: getMemberTaskDisplayStatus(workflowData, t.id) }));
  const memberStatusCoverage = uniq(memberStatusByTask.map(x => x.status));

  const memberCounts = new Map<string, number>();
  for (const t of E2E_SCENARIO_TASKS) {
    const k = t.assigneeId || "(unassigned)";
    memberCounts.set(k, (memberCounts.get(k) || 0) + 1);
  }

  const requiredMembers = ["u1", "u2", "u3", "u4", "u5", "u6"];
  const hasAllMembers = requiredMembers.every(id => (memberCounts.get(id) || 0) >= 1);
  const wangfangCount = memberCounts.get("u2") || 0;

  const requiredBrands = ["百龄坛", "马爹利", "绝对伏特加", "皇家礼炮", "Jameson", "The Glenlivet"];
  const brands = uniq(E2E_SCENARIO_QUESTIONNAIRES.map(q => {
    const meta = safeJsonParse(q.specialNotes);
    const b = meta && typeof meta === "object" && !Array.isArray(meta) ? String((meta as any).brand || "") : "";
    return b || "-";
  }));
  const hasAllBrands = requiredBrands.every(b => brands.includes(b));

  const deliverableTypes = E2E_SCENARIO_QUESTIONNAIRES.flatMap(q => getDeliverableTypesFromQuestionnaireSpecialNotes(q));
  const deliverableTypeCounts = new Map<string, number>();
  for (const t of deliverableTypes) deliverableTypeCounts.set(t, (deliverableTypeCounts.get(t) || 0) + 1);
  const requiredDeliverableTypes = ["3D", "视频", "线下物料", "平面设计", "文案", "内容创意", "其他"];
  const hasAllDeliverableTypes = requiredDeliverableTypes.every(t => (deliverableTypeCounts.get(t) || 0) >= 3);

  const revisionRequestedTasks = E2E_SCENARIO_TASKS.filter(t => {
    const { review } = getLatestReview(workflowData, t.id);
    return review?.status === "REVISION_REQUESTED";
  });
  const revisionRequestedFeedbackOk = revisionRequestedTasks.every(t => {
    const { review } = getLatestReview(workflowData, t.id);
    return typeof review?.comment === "string" && review.comment.trim().length > 0;
  });

  const v2ResubmitTaskIds = ["e2e-t-032", "e2e-t-033", "e2e-t-034", "e2e-t-035"];
  const v2LatestOk = v2ResubmitTaskIds.every(taskId => {
    const { latestNumbered } = getSubmissionsByTask(workflowData, taskId);
    return latestNumbered?.version === "V2";
  });

  const signoffTaskIds = ["e2e-t-023", "e2e-t-024", "e2e-t-025", "e2e-t-026"];
  const signoffTasksOk = signoffTaskIds.every(taskId => {
    const t = E2E_SCENARIO_TASKS.find(x => x.id === taskId);
    if (!t) return false;
    const okFields = Boolean(t.faLink) && Boolean(t.faVersion) && Boolean(t.signOffLink);
    const okNotif = E2E_SCENARIO_NOTIFICATIONS.some(n => n.type === "acceptance_email_sent" && n.projectId === taskId);
    return okFields && okNotif;
  });

  const completedTaskIds = ["e2e-t-036", "e2e-t-037", "e2e-t-038"];
  const completedNotPendingOk = completedTaskIds.every(id => !reviewDotSet.has(id) && !pendingSet.has(id));
  const completedFieldsOk = completedTaskIds.every(taskId => {
    const t = E2E_SCENARIO_TASKS.find(x => x.id === taskId);
    if (!t) return false;
    return Boolean(t.completedAt) && Boolean(t.faLink) && Boolean(t.faVersion) && Boolean(t.signOffLink) && t.acceptanceEmailStatus === "sent";
  });

  const canceledTaskIds = ["e2e-t-039", "e2e-t-040"];
  const canceledNotPendingOk = canceledTaskIds.every(id => !reviewDotSet.has(id) && !pendingSet.has(id));
  const canceled039HasPendingReview = hasPendingReview(workflowData, "e2e-t-039");

  const allowedProjectStatuses = ["制作中", "待验收", "已完成", "已取消"];
  const hasNoExecutingText = E2E_SCENARIO_TASKS.every(t => {
    const ps = getProjectStatus(workflowData, t.id);
    return ps == null || allowedProjectStatuses.includes(ps);
  });

  const nonMissingReviews = E2E_SCENARIO_REVIEWS.filter(r => Boolean(r));
  const allReviewsBoundToSubmission = nonMissingReviews.every(r => typeof r.submissionId === "string" && r.submissionId.trim().length > 0);

  const brandIssues: Array<{
    dataType: "questionnaire" | "task" | "displayField";
    id: string;
    title: string;
    brand: string;
    suggestedField: string;
  }> = [];

  for (const q of E2E_SCENARIO_QUESTIONNAIRES) {
    const meta = safeJsonParse(q.specialNotes || null) as any;
    const brand = meta && typeof meta === "object" && !Array.isArray(meta) ? String(meta.brand || "") : "";
    if (brand && isInternalTeamName(brand)) {
      brandIssues.push({ dataType: "questionnaire", id: q.id, title: q.title, brand, suggestedField: "team / requesterDept / stakeholder" });
    }
  }

  for (const t of E2E_SCENARIO_TASKS) {
    const brand = typeof (t as any).brand === "string" ? String((t as any).brand || "") : "";
    if (brand && isInternalTeamName(brand)) {
      brandIssues.push({ dataType: "task", id: t.id, title: `${t.taskNumber} ${t.title}`, brand, suggestedField: "stakeholder / requesterTeam" });
    }
  }

  for (const t of E2E_SCENARIO_TASKS) {
    const fields = getProjectDisplayFields(workflowData, t.id);
    if (!fields.ok) continue;
    if (fields.brand && isInternalTeamName(fields.brand)) {
      brandIssues.push({ dataType: "displayField", id: t.id, title: `${fields.projectCode} ${fields.projectName}`, brand: fields.brand, suggestedField: "stakeholder / team" });
    }
  }

  const result = {
    counts: {
      briefTotal,
      unassignedBriefs: unassignedBriefs.length,
      projectTotal,
    },
    queue: {
      reviewDotTaskIds: toSorted(reviewDotTaskIds),
      reviewPendingQueueTaskIds: toSorted(reviewPendingQueueTaskIds),
      reviewDotEqualsPending,
    },
    members: {
      hasAllMembers,
      wangfangCount,
      memberCounts: Object.fromEntries(Array.from(memberCounts.entries()).sort((a, b) => a[0].localeCompare(b[0]))),
    },
    coverage: {
      memberTaskStatuses: toSorted(memberStatusCoverage as unknown as string[]),
      hasAllBrands,
      brands: toSorted(brands),
      hasAllDeliverableTypes,
      deliverableTypeCounts: Object.fromEntries(Array.from(deliverableTypeCounts.entries()).sort((a, b) => a[0].localeCompare(b[0]))),
    },
    invariants: {
      revisionRequestedFeedbackOk,
      v2LatestOk,
      signoffTasksOk,
      completedNotPendingOk,
      completedFieldsOk,
      canceledNotPendingOk,
      canceled039HasPendingReview,
      hasNoExecutingText,
      allReviewsBoundToSubmission,
      brandFieldHasInternalTeam: brandIssues.length > 0,
    },
    brandIssues,
  };

  console.log(JSON.stringify(result, null, 2));
}

run();
