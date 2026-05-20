import type { Notification, Questionnaire, Review, SubmissionRecord, Task } from "./mock-data";

function isoFromBaseDays(deltaDays: number) {
  const base = Date.parse("2026-05-12T09:00:00.000Z");
  return new Date(base + deltaDays * 86400000).toISOString();
}

function makeDeliverablesSpec(types: Array<{ type: string; count: number }>) {
  const deliverables: Record<string, Array<Record<string, unknown>>> = {};
  for (const row of types) {
    deliverables[row.type] = Array.from({ length: Math.max(1, row.count) }, () => ({}));
  }
  return deliverables;
}

function makeSpecialNotes(params: { brand: string; deliverables: Array<{ type: string; count: number }> }) {
  return JSON.stringify({
    brand: params.brand,
    deliverables: makeDeliverablesSpec(params.deliverables),
  });
}

type ScenarioStage =
  | "UNASSIGNED"
  | "ASSIGNED_NO_SUBMISSION"
  | "SUBMITTED_PENDING"
  | "APPROVED_NOT_SIGNOFF"
  | "APPROVED_SIGNOFF_SUBMITTED"
  | "REVISION_REQUESTED"
  | "RESUBMITTED_V2_PENDING"
  | "COMPLETED"
  | "CANCELED";

type Scenario = {
  index: number;
  id: string;
  taskId?: string;
  title: string;
  brand: string;
  requesterName: string;
  requesterEmail: string;
  requesterDept: string | null;
  assigneeId?: string;
  stage: ScenarioStage;
  deliverables: Array<{ type: string; count: number }>;
  multiType?: boolean;
  multiItem?: boolean;
};

const USERS = {
  zhanglei: { id: "u1", name: "张磊", email: "zhanglei@example.com" },
  wangfang: { id: "u2", name: "王芳", email: "wangfang@example.com" },
  limei: { id: "u3", name: "李梅", email: "limei@example.com" },
  wangjun: { id: "u4", name: "王骏", email: "wangjun@example.com" },
  chenyu: { id: "u5", name: "陈宇", email: "chenyu@example.com" },
  zhaolin: { id: "u6", name: "赵琳", email: "zhaolin@example.com" },
} as const;

const SCENARIOS: Scenario[] = [
  { index: 1, id: "e2e-q-001", title: "E2E 待分配-新品开屏动效包", brand: "马爹利", requesterName: "Alice", requesterEmail: "alice@example.com", requesterDept: "市场部", stage: "UNASSIGNED", deliverables: [{ type: "3D", count: 1 }, { type: "视频", count: 2 }], multiType: true, multiItem: true },
  { index: 2, id: "e2e-q-002", title: "E2E 待分配-社媒KV延展", brand: "百龄坛", requesterName: "Bob", requesterEmail: "bob@example.com", requesterDept: "市场部", stage: "UNASSIGNED", deliverables: [{ type: "平面设计", count: 2 }], multiItem: true },
  { index: 3, id: "e2e-q-003", title: "E2E 待分配-EDM文案", brand: "Jameson", requesterName: "Cathy", requesterEmail: "cathy@example.com", requesterDept: null, stage: "UNASSIGNED", deliverables: [{ type: "文案", count: 1 }] },
  { index: 4, id: "e2e-q-004", title: "E2E 待分配-内容创意脚本", brand: "The Glenlivet", requesterName: "David", requesterEmail: "david@example.com", requesterDept: "传播部", stage: "UNASSIGNED", deliverables: [{ type: "内容创意", count: 1 }] },

  { index: 5, id: "e2e-q-005", taskId: "e2e-t-005", title: "E2E 已分配未提交-新品短视频", brand: "皇家礼炮", requesterName: "Evan", requesterEmail: "evan@example.com", requesterDept: "市场部", assigneeId: USERS.zhanglei.id, stage: "ASSIGNED_NO_SUBMISSION", deliverables: [{ type: "视频", count: 1 }] },
  { index: 6, id: "e2e-q-006", taskId: "e2e-t-006", title: "E2E 已分配未提交-社媒KV", brand: "马爹利", requesterName: "Fiona", requesterEmail: "fiona@example.com", requesterDept: "市场部", assigneeId: USERS.wangfang.id, stage: "ASSIGNED_NO_SUBMISSION", deliverables: [{ type: "平面设计", count: 1 }] },
  { index: 7, id: "e2e-q-007", taskId: "e2e-t-007", title: "E2E 已分配未提交-POSM套装", brand: "百龄坛", requesterName: "Grace", requesterEmail: "grace@example.com", requesterDept: "渠道部", assigneeId: USERS.limei.id, stage: "ASSIGNED_NO_SUBMISSION", deliverables: [{ type: "线下物料", count: 2 }], multiItem: true },
  { index: 8, id: "e2e-q-008", taskId: "e2e-t-008", title: "E2E 已分配未提交-3D产品建模", brand: "The Glenlivet", requesterName: "Henry", requesterEmail: "henry@example.com", requesterDept: null, assigneeId: USERS.wangjun.id, stage: "ASSIGNED_NO_SUBMISSION", deliverables: [{ type: "3D", count: 1 }] },
  { index: 9, id: "e2e-q-009", taskId: "e2e-t-009", title: "E2E 已分配未提交-活动物料包", brand: "Jameson", requesterName: "Ivy", requesterEmail: "ivy@example.com", requesterDept: "市场部", assigneeId: USERS.chenyu.id, stage: "ASSIGNED_NO_SUBMISSION", deliverables: [{ type: "平面设计", count: 2 }, { type: "文案", count: 1 }], multiType: true, multiItem: true },
  { index: 10, id: "e2e-q-010", taskId: "e2e-t-010", title: "E2E 已分配未提交-创意脚本+预告", brand: "马爹利", requesterName: "Jack", requesterEmail: "jack@example.com", requesterDept: "传播部", assigneeId: USERS.zhaolin.id, stage: "ASSIGNED_NO_SUBMISSION", deliverables: [{ type: "内容创意", count: 2 }, { type: "视频", count: 1 }], multiType: true, multiItem: true },

  { index: 11, id: "e2e-q-011", taskId: "e2e-t-011", title: "E2E 待审核-新品短视频V1", brand: "百龄坛", requesterName: "Kelly", requesterEmail: "kelly@example.com", requesterDept: "市场部", assigneeId: USERS.zhanglei.id, stage: "SUBMITTED_PENDING", deliverables: [{ type: "视频", count: 1 }] },
  { index: 12, id: "e2e-q-012", taskId: "e2e-t-012", title: "E2E 待审核-社媒KV V1", brand: "绝对伏特加", requesterName: "Leo", requesterEmail: "leo@example.com", requesterDept: null, assigneeId: USERS.wangfang.id, stage: "SUBMITTED_PENDING", deliverables: [{ type: "平面设计", count: 1 }] },
  { index: 13, id: "e2e-q-013", taskId: "e2e-t-013", title: "E2E 待审核-POSM V1", brand: "马爹利", requesterName: "Mia", requesterEmail: "mia@example.com", requesterDept: "渠道部", assigneeId: USERS.limei.id, stage: "SUBMITTED_PENDING", deliverables: [{ type: "线下物料", count: 1 }] },
  { index: 14, id: "e2e-q-014", taskId: "e2e-t-014", title: "E2E 待审核-3D+KV V1", brand: "The Glenlivet", requesterName: "Nina", requesterEmail: "nina@example.com", requesterDept: "市场部", assigneeId: USERS.wangjun.id, stage: "SUBMITTED_PENDING", deliverables: [{ type: "3D", count: 1 }, { type: "平面设计", count: 1 }], multiType: true },
  { index: 15, id: "e2e-q-015", taskId: "e2e-t-015", title: "E2E 待审核-EDM文案 V1", brand: "Jameson", requesterName: "Owen", requesterEmail: "owen@example.com", requesterDept: null, assigneeId: USERS.chenyu.id, stage: "SUBMITTED_PENDING", deliverables: [{ type: "文案", count: 1 }] },
  { index: 16, id: "e2e-q-016", taskId: "e2e-t-016", title: "E2E 待审核-内容创意V1", brand: "皇家礼炮", requesterName: "Penny", requesterEmail: "penny@example.com", requesterDept: "传播部", assigneeId: USERS.zhaolin.id, stage: "SUBMITTED_PENDING", deliverables: [{ type: "内容创意", count: 1 }] },
  { index: 17, id: "e2e-q-017", taskId: "e2e-t-017", title: "E2E 待审核-视频+POSM V1", brand: "马爹利", requesterName: "Quinn", requesterEmail: "quinn@example.com", requesterDept: "市场部", assigneeId: USERS.zhaolin.id, stage: "SUBMITTED_PENDING", deliverables: [{ type: "线下物料", count: 2 }, { type: "视频", count: 1 }], multiType: true, multiItem: true },
  { index: 18, id: "e2e-q-018", taskId: "e2e-t-018", title: "E2E 待审核-其他杂项V1", brand: "百龄坛", requesterName: "Ryan", requesterEmail: "ryan@example.com", requesterDept: null, assigneeId: USERS.zhanglei.id, stage: "SUBMITTED_PENDING", deliverables: [{ type: "其他", count: 1 }] },

  { index: 19, id: "e2e-q-019", taskId: "e2e-t-019", title: "E2E 已通过不验收-新品短视频V1", brand: "马爹利", requesterName: "Sara", requesterEmail: "sara@example.com", requesterDept: "市场部", assigneeId: USERS.wangjun.id, stage: "APPROVED_NOT_SIGNOFF", deliverables: [{ type: "视频", count: 1 }] },
  { index: 20, id: "e2e-q-020", taskId: "e2e-t-020", title: "E2E 已通过不验收-3D展示V1", brand: "绝对伏特加", requesterName: "Tom", requesterEmail: "tom@example.com", requesterDept: null, assigneeId: USERS.limei.id, stage: "APPROVED_NOT_SIGNOFF", deliverables: [{ type: "3D", count: 1 }] },
  { index: 21, id: "e2e-q-021", taskId: "e2e-t-021", title: "E2E 已通过不验收-平面+文案V1", brand: "The Glenlivet", requesterName: "Uma", requesterEmail: "uma@example.com", requesterDept: "市场部", assigneeId: USERS.chenyu.id, stage: "APPROVED_NOT_SIGNOFF", deliverables: [{ type: "平面设计", count: 2 }, { type: "文案", count: 1 }], multiType: true, multiItem: true },
  { index: 22, id: "e2e-q-022", taskId: "e2e-t-022", title: "E2E 已通过不验收-POSM V1", brand: "Jameson", requesterName: "Vince", requesterEmail: "vince@example.com", requesterDept: "渠道部", assigneeId: USERS.zhanglei.id, stage: "APPROVED_NOT_SIGNOFF", deliverables: [{ type: "线下物料", count: 1 }] },

  { index: 23, id: "e2e-q-023", taskId: "e2e-t-023", title: "E2E 已发起验收-视频+KV V1", brand: "百龄坛", requesterName: "Will", requesterEmail: "will@example.com", requesterDept: "市场部", assigneeId: USERS.wangfang.id, stage: "APPROVED_SIGNOFF_SUBMITTED", deliverables: [{ type: "视频", count: 2 }, { type: "平面设计", count: 2 }], multiType: true, multiItem: true },
  { index: 24, id: "e2e-q-024", taskId: "e2e-t-024", title: "E2E 已发起验收-POSM V1", brand: "马爹利", requesterName: "Xena", requesterEmail: "xena@example.com", requesterDept: "渠道部", assigneeId: USERS.limei.id, stage: "APPROVED_SIGNOFF_SUBMITTED", deliverables: [{ type: "线下物料", count: 1 }] },
  { index: 25, id: "e2e-q-025", taskId: "e2e-t-025", title: "E2E 已发起验收-文案+内容创意V1", brand: "绝对伏特加", requesterName: "Yuki", requesterEmail: "yuki@example.com", requesterDept: "传播部", assigneeId: USERS.wangjun.id, stage: "APPROVED_SIGNOFF_SUBMITTED", deliverables: [{ type: "内容创意", count: 1 }, { type: "文案", count: 1 }], multiType: true },
  { index: 26, id: "e2e-q-026", taskId: "e2e-t-026", title: "E2E 已发起验收-其他+视频V1", brand: "The Glenlivet", requesterName: "Zack", requesterEmail: "zack@example.com", requesterDept: null, assigneeId: USERS.chenyu.id, stage: "APPROVED_SIGNOFF_SUBMITTED", deliverables: [{ type: "其他", count: 1 }, { type: "视频", count: 1 }], multiType: true },

  { index: 27, id: "e2e-q-027", taskId: "e2e-t-027", title: "E2E 已退回待修改-平面V1", brand: "马爹利", requesterName: "Ava", requesterEmail: "ava@example.com", requesterDept: "市场部", assigneeId: USERS.zhanglei.id, stage: "REVISION_REQUESTED", deliverables: [{ type: "平面设计", count: 1 }] },
  { index: 28, id: "e2e-q-028", taskId: "e2e-t-028", title: "E2E 已退回待修改-视频V1", brand: "Jameson", requesterName: "Ben", requesterEmail: "ben@example.com", requesterDept: "市场部", assigneeId: USERS.wangfang.id, stage: "REVISION_REQUESTED", deliverables: [{ type: "视频", count: 1 }] },
  { index: 29, id: "e2e-q-029", taskId: "e2e-t-029", title: "E2E 已退回待修改-POSM+KV V1", brand: "百龄坛", requesterName: "Cora", requesterEmail: "cora@example.com", requesterDept: "渠道部", assigneeId: USERS.limei.id, stage: "REVISION_REQUESTED", deliverables: [{ type: "线下物料", count: 2 }, { type: "平面设计", count: 1 }], multiType: true, multiItem: true },
  { index: 30, id: "e2e-q-030", taskId: "e2e-t-030", title: "E2E 已退回待修改-文案V1", brand: "绝对伏特加", requesterName: "Drew", requesterEmail: "drew@example.com", requesterDept: null, assigneeId: USERS.chenyu.id, stage: "REVISION_REQUESTED", deliverables: [{ type: "文案", count: 1 }] },
  { index: 31, id: "e2e-q-031", taskId: "e2e-t-031", title: "E2E 已退回待修改-3D V1", brand: "The Glenlivet", requesterName: "Elle", requesterEmail: "elle@example.com", requesterDept: "传播部", assigneeId: USERS.zhaolin.id, stage: "REVISION_REQUESTED", deliverables: [{ type: "3D", count: 1 }] },

  { index: 32, id: "e2e-q-032", taskId: "e2e-t-032", title: "E2E V2重提待审核-视频", brand: "马爹利", requesterName: "Finn", requesterEmail: "finn@example.com", requesterDept: "市场部", assigneeId: USERS.wangjun.id, stage: "RESUBMITTED_V2_PENDING", deliverables: [{ type: "视频", count: 1 }] },
  { index: 33, id: "e2e-q-033", taskId: "e2e-t-033", title: "E2E V2重提待审核-平面设计", brand: "百龄坛", requesterName: "Gina", requesterEmail: "gina@example.com", requesterDept: "市场部", assigneeId: USERS.zhanglei.id, stage: "RESUBMITTED_V2_PENDING", deliverables: [{ type: "平面设计", count: 1 }] },
  { index: 34, id: "e2e-q-034", taskId: "e2e-t-034", title: "E2E V2重提待审核-POSM", brand: "Jameson", requesterName: "Hank", requesterEmail: "hank@example.com", requesterDept: "渠道部", assigneeId: USERS.wangfang.id, stage: "RESUBMITTED_V2_PENDING", deliverables: [{ type: "线下物料", count: 1 }] },
  { index: 35, id: "e2e-q-035", taskId: "e2e-t-035", title: "E2E V2重提待审核-内容创意+文案", brand: "绝对伏特加", requesterName: "Iris", requesterEmail: "iris@example.com", requesterDept: "传播部", assigneeId: USERS.zhaolin.id, stage: "RESUBMITTED_V2_PENDING", deliverables: [{ type: "内容创意", count: 2 }, { type: "文案", count: 1 }], multiType: true, multiItem: true },

  { index: 36, id: "e2e-q-036", taskId: "e2e-t-036", title: "E2E 已完成归档-新品短视频", brand: "马爹利", requesterName: "Jade", requesterEmail: "jade@example.com", requesterDept: "市场部", assigneeId: USERS.limei.id, stage: "COMPLETED", deliverables: [{ type: "视频", count: 2 }], multiItem: true },
  { index: 37, id: "e2e-q-037", taskId: "e2e-t-037", title: "E2E 已完成归档-社媒KV", brand: "百龄坛", requesterName: "Kyle", requesterEmail: "kyle@example.com", requesterDept: "市场部", assigneeId: USERS.wangjun.id, stage: "COMPLETED", deliverables: [{ type: "平面设计", count: 1 }] },
  { index: 38, id: "e2e-q-038", taskId: "e2e-t-038", title: "E2E 已完成归档-POSM+其他", brand: "The Glenlivet", requesterName: "Lena", requesterEmail: "lena@example.com", requesterDept: "渠道部", assigneeId: USERS.wangfang.id, stage: "COMPLETED", deliverables: [{ type: "线下物料", count: 2 }, { type: "其他", count: 1 }], multiType: true, multiItem: true },

  { index: 39, id: "e2e-q-039", taskId: "e2e-t-039", title: "E2E 已取消-中途终止（有历史提交）", brand: "皇家礼炮", requesterName: "Moss", requesterEmail: "moss@example.com", requesterDept: "市场部", assigneeId: USERS.chenyu.id, stage: "CANCELED", deliverables: [{ type: "3D", count: 1 }, { type: "视频", count: 1 }], multiType: true },
  { index: 40, id: "e2e-q-040", taskId: "e2e-t-040", title: "E2E 已取消-分配后取消（未提交）", brand: "Jameson", requesterName: "Nora", requesterEmail: "nora@example.com", requesterDept: "市场部", assigneeId: USERS.zhaolin.id, stage: "CANCELED", deliverables: [{ type: "文案", count: 1 }] },
];

export const E2E_SCENARIO_QUESTIONNAIRES: Questionnaire[] = SCENARIOS.map((s, idx) => {
  const createdAt = isoFromBaseDays(-(60 - idx));
  const deadline = isoFromBaseDays(14 + idx);
  const isUnassigned = s.stage === "UNASSIGNED";
  return {
    id: s.id,
    title: s.title,
    description: `${s.title}（E2E 回归数据）`,
    videoType: "OTHER",
    duration: "-",
    deadline,
    requesterName: s.requesterName,
    requesterEmail: s.requesterEmail,
    requesterDept: s.requesterDept,
    specialNotes: makeSpecialNotes({ brand: s.brand, deliverables: s.deliverables }),
    status: isUnassigned ? "PENDING" : "ASSIGNED",
    claimedById: null,
    assignedById: isUnassigned ? null : USERS.wangfang.id,
    createdAt,
  };
});

export const E2E_SCENARIO_TASKS: Task[] = SCENARIOS.filter(s => s.stage !== "UNASSIGNED").map((s, idx) => {
  const taskId = s.taskId!;
  const createdAt = isoFromBaseDays(-(40 - idx));
  const updatedAt = isoFromBaseDays(-(10 - idx));
  const committedDeliveryDate = isoFromBaseDays(20 + idx);
  const internalDueDate = isoFromBaseDays(17 + idx);
  const taskNumber = `E2E-${String(s.index).padStart(3, "0")}`;
  const projectCode = `E2E-PRJ-${String(s.index).padStart(3, "0")}`;

  const baseTask: Task = {
    id: taskId,
    taskNumber,
    title: s.title,
    description: `${s.title}（E2E 回归数据）`,
    status: "WIP",
    priority: "MEDIUM",
    category: "OTHER",
    assigneeId: s.assigneeId || null,
    primaryAssigneeId: s.assigneeId || null,
    assigneeIds: s.assigneeId ? [s.assigneeId] : [],
    createdById: USERS.zhanglei.id,
    questionnaireId: s.id,
    dueDate: committedDeliveryDate,
    completedAt: null,
    acceptedAt: null,
    acceptanceHistory: null,
    faLink: null,
    faVersion: null,
    acceptanceNote: null,
    acceptanceEmailStatus: null,
    signOffLink: null,
    stakeholderAction: null,
    stakeholderFeedback: null,
    stakeholderActionTime: null,
    resubmitExpectedDate: null,
    brand: s.brand,
    projectCode,
    requestDate: isoFromBaseDays(-(55 - idx)),
    stakeholderExpectedDueDate: committedDeliveryDate,
    committedDeliveryDate,
    internalDueDate,
    workType: null,
    createdAt,
    updatedAt,
  };

  if (s.stage === "APPROVED_SIGNOFF_SUBMITTED") {
    const acceptedAt = isoFromBaseDays(-(3 + idx));
    const signOffPath = `/signoff/${taskId}`;
    const faVersion = "FA V1";
    const faLink = `https://share.example.com/e2e/${taskNumber}/final`;
    return {
      ...baseTask,
      status: "PENDING_SIGNOFF",
      acceptedAt,
      faLink,
      faVersion,
      acceptanceEmailStatus: "sent",
      signOffLink: signOffPath,
      acceptanceHistory: [
        {
          round: 1,
          acceptedAt,
          faLink,
          faVersion,
          result: "pending",
          resultAt: null,
          feedback: null,
        },
      ],
    };
  }

  if (s.stage === "COMPLETED") {
    const acceptedAt = isoFromBaseDays(-(8 + idx));
    const completedAt = isoFromBaseDays(-(1 + idx));
    const signOffPath = `/signoff/${taskId}`;
    const faVersion = "FA V2";
    const faLink = `https://share.example.com/e2e/${taskNumber}/final`;
    return {
      ...baseTask,
      status: "COMPLETED",
      acceptedAt,
      completedAt,
      faLink,
      faVersion,
      acceptanceEmailStatus: "sent",
      signOffLink: signOffPath,
      acceptanceHistory: [
        {
          round: 1,
          acceptedAt,
          faLink,
          faVersion,
          result: "completed",
          resultAt: completedAt,
          feedback: null,
        },
      ],
    };
  }

  if (s.stage === "CANCELED") {
    return {
      ...baseTask,
      status: "CANCELED",
      completedAt: null,
    };
  }

  return baseTask;
});

export const E2E_SCENARIO_SUBMISSIONS: SubmissionRecord[] = (() => {
  const rows: SubmissionRecord[] = [];
  for (const s of SCENARIOS) {
    if (s.stage === "UNASSIGNED" || s.stage === "ASSIGNED_NO_SUBMISSION") continue;
    const taskId = s.taskId!;
    const submitterId = s.assigneeId || USERS.zhanglei.id;
    const v1Id = `e2e-sub-${String(s.index).padStart(3, "0")}-v1`;
    rows.push({
      id: v1Id,
      taskId,
      submitterId,
      version: "V1",
      submittedAt: isoFromBaseDays(-(12 + s.index)),
      fileName: `${taskId}-v1.zip`,
      link: `https://files.example.com/${taskId}/v1`,
      note: "E2E 提交 V1",
    });

    if (s.stage === "RESUBMITTED_V2_PENDING" || s.stage === "COMPLETED") {
      const v2Id = `e2e-sub-${String(s.index).padStart(3, "0")}-v2`;
      rows.push({
        id: v2Id,
        taskId,
        submitterId,
        version: "V2",
        submittedAt: isoFromBaseDays(-(6 + s.index)),
        fileName: `${taskId}-v2.zip`,
        link: `https://files.example.com/${taskId}/v2`,
        note: "E2E 重新提交 V2",
      });
    }
  }
  return rows;
})();

const REVIEW_MISSING_ALL_IDS = new Set(["e2e-q-014", "e2e-q-018"]);

export const E2E_SCENARIO_REVIEWS: Review[] = (() => {
  const rows: Review[] = [];
  const reviewerId = USERS.wangfang.id;

  function pushReview(params: { taskId: string; submissionId: string; status: "PENDING" | "APPROVED" | "REVISION_REQUESTED"; comment: string }) {
    rows.push({
      id: `e2e-review-${params.submissionId}`,
      taskId: params.taskId,
      reviewerId,
      status: params.status,
      comment: params.comment,
      timestamp: null,
      submissionId: params.submissionId,
      createdAt: isoFromBaseDays(-(5 + rows.length)),
    });
  }

  for (const s of SCENARIOS) {
    if (s.stage === "UNASSIGNED" || s.stage === "ASSIGNED_NO_SUBMISSION") continue;
    if (REVIEW_MISSING_ALL_IDS.has(s.id)) continue;

    const taskId = s.taskId!;
    const v1SubId = `e2e-sub-${String(s.index).padStart(3, "0")}-v1`;
    const v2SubId = `e2e-sub-${String(s.index).padStart(3, "0")}-v2`;

    if (s.stage === "SUBMITTED_PENDING") {
      pushReview({ taskId, submissionId: v1SubId, status: "PENDING", comment: "" });
    } else if (s.stage === "APPROVED_NOT_SIGNOFF") {
      pushReview({ taskId, submissionId: v1SubId, status: "APPROVED", comment: "审核通过" });
    } else if (s.stage === "APPROVED_SIGNOFF_SUBMITTED") {
      pushReview({ taskId, submissionId: v1SubId, status: "APPROVED", comment: "审核通过，可提交验收" });
    } else if (s.stage === "REVISION_REQUESTED") {
      const feedback =
        s.id === "e2e-q-027"
          ? "请调整字号与版式，需符合品牌规范。"
          : s.id === "e2e-q-028"
            ? "请补充镜头与字幕校对后重新提交。"
            : s.id === "e2e-q-029"
              ? "POSM 尺寸需补齐，KV 文案需更新。"
              : s.id === "e2e-q-030"
                ? "文案语气需调整，避免禁用词。"
                : "3D 模型材质与细节需优化。";
      pushReview({ taskId, submissionId: v1SubId, status: "REVISION_REQUESTED", comment: feedback });
    } else if (s.stage === "RESUBMITTED_V2_PENDING") {
      pushReview({ taskId, submissionId: v1SubId, status: "REVISION_REQUESTED", comment: "V1 已退回，请按意见修改后提交 V2。" });
      if (s.id !== "e2e-q-034") {
        pushReview({ taskId, submissionId: v2SubId, status: "PENDING", comment: "" });
      }
    } else if (s.stage === "COMPLETED") {
      pushReview({ taskId, submissionId: v2SubId, status: "APPROVED", comment: "最终版审核通过" });
    } else if (s.stage === "CANCELED") {
      if (s.id === "e2e-q-039") {
        pushReview({ taskId, submissionId: v1SubId, status: "PENDING", comment: "" });
      }
    }
  }

  return rows;
})();

export const E2E_SCENARIO_NOTIFICATIONS: Notification[] = (() => {
  const rows: Notification[] = [];
  const sender = USERS.wangfang;

  for (const s of SCENARIOS) {
    if (s.stage !== "APPROVED_SIGNOFF_SUBMITTED" && s.stage !== "COMPLETED") continue;
    const taskId = s.taskId!;
    const taskNumber = `E2E-${String(s.index).padStart(3, "0")}`;
    const signOffPath = `/signoff/${taskId}`;
    rows.push({
      id: `e2e-notif-${String(s.index).padStart(3, "0")}`,
      type: "acceptance_email_sent",
      title: "已向 Stakeholder 发送验收邮件",
      createdAt: isoFromBaseDays(-(2 + s.index)),
      senderId: sender.id,
      senderName: sender.name,
      receiverId: `stakeholder-${taskId}`,
      receiverName: s.requesterDept ? `${s.requesterName} · ${s.requesterDept}` : s.requesterName,
      receiverEmail: s.requesterEmail,
      projectId: taskId,
      projectCode: taskNumber,
      projectName: `${taskNumber} ${s.title}`,
      projectStatus: s.stage === "COMPLETED" ? "已完成" : "待验收",
      committedDeliveryDate: isoFromBaseDays(20 + s.index),
      faLink: `https://share.example.com/e2e/${taskNumber}/final`,
      faVersion: s.stage === "COMPLETED" ? "FA V2" : "FA V1",
      acceptanceNote: "E2E 验收邮件备注",
      signOffLink: signOffPath,
      notificationStatus: "已发送",
      actionText: "查看通知内容",
      actionTarget: "notifications",
      secondaryActionText: "打开 Sign-off 模拟",
      secondaryActionTarget: signOffPath,
      userId: sender.id,
      isRead: true,
    });
  }

  return rows;
})();

export function mergeE2EScenarioData<T extends { questionnaires: Questionnaire[]; tasks: Task[]; submissions: SubmissionRecord[]; reviews: Review[]; notifications: Notification[] }>(
  base: T
): T {
  return {
    ...base,
    questionnaires: [...E2E_SCENARIO_QUESTIONNAIRES, ...base.questionnaires],
    tasks: [...E2E_SCENARIO_TASKS, ...base.tasks],
    submissions: [...E2E_SCENARIO_SUBMISSIONS, ...base.submissions],
    reviews: [...E2E_SCENARIO_REVIEWS, ...base.reviews],
    notifications: [...E2E_SCENARIO_NOTIFICATIONS, ...base.notifications],
  };
}
