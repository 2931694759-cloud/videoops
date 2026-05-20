import { useStore } from "../src/lib/store";
import type { DeliverableTypeGroup, Questionnaire } from "../src/lib/mock-data";

function makeBrief(id: string, title: string, deliverableTypes: DeliverableTypeGroup[]): Questionnaire {
  const now = new Date().toISOString();
  return {
    id,
    title,
    description: `${title} 的验证 Brief`,
    videoType: "PROMO",
    duration: "30秒",
    deadline: new Date(Date.now() + 10 * 86400000).toISOString(),
    requesterName: "验证需求方",
    requesterEmail: "qa@example.com",
    requesterDept: "市场部",
    deliverableTypes,
    specialNotes: JSON.stringify({ brand: "验证品牌", deliverableTypes }),
    status: "PENDING",
    claimedById: null,
    assignedById: null,
    createdAt: now,
  };
}

function getState() {
  return useStore.getState();
}

function getProjectByBriefId(briefId: string) {
  return getState().projects.find(item => item.briefId === briefId)!;
}

function getPackage(briefId: string, deliverableType: string) {
  const project = getProjectByBriefId(briefId);
  return getState().typeTaskPackages.find(item => item.projectId === project.id && item.deliverableType === deliverableType)!;
}

function getLatestSubmission(packageId: string) {
  return getState().submissions
    .filter(item => item.typeTaskPackageId === packageId)
    .sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)))[0] || null;
}

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const s = getState();
const result: Record<string, unknown> = {};

// Flow A
const briefA = makeBrief("qa-flow-a", "流程A-单类型一次通过", [
  { type: "视频", items: [{ name: "宣传片", quantity: 1, size: "16:9", outputFormat: "MP4", usageScenario: "社媒", remark: "" }] },
]);
s.addQuestionnaire(briefA);
let r = getState().dispatchBrief({ questionnaireId: briefA.id, assignerId: "u1", packages: [{ deliverableType: "视频", assigneeId: "u3", promisedAt: new Date(Date.now() + 2 * 86400000).toISOString(), estimatedWorkingHours: 6, assetCategory: "视频", assignmentNote: "A-flow" }] });
assert(r.ok, `Flow A dispatch failed: ${r.ok ? "" : r.error}`);
const pkgA = getPackage(briefA.id, "视频");
r = getState().submitPackageDeliverable({ typeTaskPackageId: pkgA.id, submittedById: "u3", fileLinks: ["https://example.com/a-v1.mp4"], submitNote: "A V1", actualWorkingHours: 5, assetCategory: "视频" });
assert(r.ok, `Flow A submit failed: ${r.ok ? "" : r.error}`);
const subA = getLatestSubmission(pkgA.id)!;
assert(subA.version === "V1", "Flow A should create V1");
assert(!!subA.signoffToken, "Flow A should create signoff token");
r = getState().approvePackageSubmission({ token: subA.signoffToken!, reviewedByName: "需求方A", reviewedByEmail: "a@example.com", feedback: "通过" });
assert(r.ok, `Flow A approve failed: ${r.ok ? "" : r.error}`);
result.A = {
  projectStatus: getProjectByBriefId(briefA.id).status,
  packageStatus: getPackage(briefA.id, "视频").status,
  version: getLatestSubmission(pkgA.id)?.version,
};
assert(getProjectByBriefId(briefA.id).status === "已完成", "Flow A project should auto complete");

// Flow B
const briefB = makeBrief("qa-flow-b", "流程B-多类型分批通过", [
  { type: "3D", items: [{ name: "建模", quantity: 1, size: "按Brief", outputFormat: "PNG", usageScenario: "KV", remark: "" }, { name: "渲染", quantity: 1, size: "按Brief", outputFormat: "PNG", usageScenario: "KV", remark: "" }] },
  { type: "视频", items: [{ name: "15s 视频", quantity: 1, size: "9:16", outputFormat: "MP4", usageScenario: "社媒", remark: "" }] },
  { type: "Copy", items: [{ name: "文案", quantity: 1, size: "-", outputFormat: "DOCX", usageScenario: "社媒", remark: "" }] },
]);
s.addQuestionnaire(briefB);
r = getState().dispatchBrief({ questionnaireId: briefB.id, assignerId: "u1", packages: [
  { deliverableType: "3D", assigneeId: "u3", promisedAt: new Date(Date.now() + 2 * 86400000).toISOString(), estimatedWorkingHours: 8, assetCategory: "3D", assignmentNote: "B-3D" },
  { deliverableType: "视频", assigneeId: "u4", promisedAt: new Date(Date.now() + 3 * 86400000).toISOString(), estimatedWorkingHours: 6, assetCategory: "视频", assignmentNote: "B-video" },
  { deliverableType: "Copy", assigneeId: "u5", promisedAt: new Date(Date.now() + 4 * 86400000).toISOString(), estimatedWorkingHours: 3, assetCategory: "文案", assignmentNote: "B-copy" },
]});
assert(r.ok, `Flow B dispatch failed: ${r.ok ? "" : r.error}`);
const pkgB3d = getPackage(briefB.id, "3D");
const pkgBVideo = getPackage(briefB.id, "视频");
const pkgBCopy = getPackage(briefB.id, "Copy");
r = getState().submitPackageDeliverable({ typeTaskPackageId: pkgB3d.id, submittedById: "u3", fileLinks: ["https://example.com/b-3d-v1.zip"], submitNote: "3D V1" });
assert(r.ok, `Flow B 3D submit failed: ${r.ok ? "" : r.error}`);
const subB3d = getLatestSubmission(pkgB3d.id)!;
r = getState().approvePackageSubmission({ token: subB3d.signoffToken!, reviewedByName: "需求方B", reviewedByEmail: "b@example.com", feedback: "3D通过" });
assert(r.ok, `Flow B 3D approve failed: ${r.ok ? "" : r.error}`);
r = getState().submitPackageDeliverable({ typeTaskPackageId: pkgBVideo.id, submittedById: "u4", fileLinks: ["https://example.com/b-video-v1.mp4"], submitNote: "Video V1" });
assert(r.ok, `Flow B video submit failed: ${r.ok ? "" : r.error}`);
result.B = {
  projectStatus: getProjectByBriefId(briefB.id).status,
  packageStatuses: {
    "3D": getPackage(briefB.id, "3D").status,
    "视频": getPackage(briefB.id, "视频").status,
    "Copy": getPackage(briefB.id, "Copy").status,
  },
};
assert(getProjectByBriefId(briefB.id).status === "制作中", "Flow B project should remain 制作中");
assert(getPackage(briefB.id, "3D").status === "已通过", "Flow B 3D should be passed");
assert(getPackage(briefB.id, "视频").status === "待需求方审核", "Flow B video should wait signoff");
assert(getPackage(briefB.id, "Copy").status === "待提交", "Flow B copy should stay pending");

// Flow C
const briefC = makeBrief("qa-flow-c", "流程C-退回后重新提交", [
  { type: "视频", items: [{ name: "返修视频", quantity: 1, size: "16:9", outputFormat: "MP4", usageScenario: "社媒", remark: "" }] },
]);
s.addQuestionnaire(briefC);
r = getState().dispatchBrief({ questionnaireId: briefC.id, assignerId: "u1", packages: [{ deliverableType: "视频", assigneeId: "u6", promisedAt: new Date(Date.now() + 2 * 86400000).toISOString(), estimatedWorkingHours: 5, assetCategory: "视频", assignmentNote: "C-flow" }] });
assert(r.ok, `Flow C dispatch failed: ${r.ok ? "" : r.error}`);
const pkgC = getPackage(briefC.id, "视频");
r = getState().submitPackageDeliverable({ typeTaskPackageId: pkgC.id, submittedById: "u6", fileLinks: ["https://example.com/c-v1.mp4"], submitNote: "C V1" });
assert(r.ok, `Flow C submit V1 failed: ${r.ok ? "" : r.error}`);
const subC1 = getLatestSubmission(pkgC.id)!;
r = getState().requestPackageRevision({ token: subC1.signoffToken!, reviewedByName: "需求方C", reviewedByEmail: "c@example.com", feedback: "请调整节奏" });
assert(r.ok, `Flow C request revision failed: ${r.ok ? "" : r.error}`);
assert(getPackage(briefC.id, "视频").status === "需修改", "Flow C package should become 需修改");
r = getState().submitPackageDeliverable({ typeTaskPackageId: pkgC.id, submittedById: "u6", fileLinks: ["https://example.com/c-v2.mp4"], submitNote: "C V2" });
assert(r.ok, `Flow C submit V2 failed: ${r.ok ? "" : r.error}`);
const subC2 = getLatestSubmission(pkgC.id)!;
assert(subC2.version === "V2", "Flow C should create V2");
r = getState().approvePackageSubmission({ token: subC2.signoffToken!, reviewedByName: "需求方C", reviewedByEmail: "c@example.com", feedback: "第二版通过" });
assert(r.ok, `Flow C approve V2 failed: ${r.ok ? "" : r.error}`);
const submissionsC = getState().submissions.filter(item => item.typeTaskPackageId === pkgC.id).sort((a, b) => a.version.localeCompare(b.version));
result.C = {
  projectStatus: getProjectByBriefId(briefC.id).status,
  packageStatus: getPackage(briefC.id, "视频").status,
  history: submissionsC.map(item => ({ version: item.version, result: item.result })),
  latestFeedback: getPackage(briefC.id, "视频").latestFeedback,
};
assert(submissionsC.length === 2, "Flow C should keep V1 and V2 history");
assert(submissionsC[0]?.result === "revision_requested", "Flow C V1 should be returned");
assert(submissionsC[1]?.result === "passed", "Flow C V2 should be passed");

// Flow D
const briefD = makeBrief("qa-flow-d", "流程D-项目自动完成", [
  { type: "3D", items: [{ name: "主视觉", quantity: 1, size: "1:1", outputFormat: "PNG", usageScenario: "KV", remark: "" }] },
  { type: "视频", items: [{ name: "开屏视频", quantity: 1, size: "9:16", outputFormat: "MP4", usageScenario: "社媒", remark: "" }] },
]);
s.addQuestionnaire(briefD);
r = getState().dispatchBrief({ questionnaireId: briefD.id, assignerId: "u1", packages: [
  { deliverableType: "3D", assigneeId: "u3", promisedAt: new Date(Date.now() + 2 * 86400000).toISOString(), estimatedWorkingHours: 4, assetCategory: "3D", assignmentNote: "D-3D" },
  { deliverableType: "视频", assigneeId: "u4", promisedAt: new Date(Date.now() + 2 * 86400000).toISOString(), estimatedWorkingHours: 4, assetCategory: "视频", assignmentNote: "D-video" },
]});
assert(r.ok, `Flow D dispatch failed: ${r.ok ? "" : r.error}`);
for (const pair of [{ type: "3D", userId: "u3" }, { type: "视频", userId: "u4" }] as const) {
  const pkg = getPackage(briefD.id, pair.type);
  r = getState().submitPackageDeliverable({ typeTaskPackageId: pkg.id, submittedById: pair.userId, fileLinks: [`https://example.com/${pair.type}-done`] });
  assert(r.ok, `Flow D submit ${pair.type} failed: ${r.ok ? "" : r.error}`);
  const sub = getLatestSubmission(pkg.id)!;
  r = getState().approvePackageSubmission({ token: sub.signoffToken!, reviewedByName: "需求方D", reviewedByEmail: "d@example.com" });
  assert(r.ok, `Flow D approve ${pair.type} failed: ${r.ok ? "" : r.error}`);
}
const projectD = getProjectByBriefId(briefD.id);
const completedNotif = getState().notifications.find(item => item.type === "project_auto_completed" && item.projectId === projectD.id) || null;
result.D = {
  projectStatus: projectD.status,
  packageStatuses: getState().typeTaskPackages.filter(item => item.projectId === projectD.id).map(item => ({ type: item.deliverableType, status: item.status })),
  hasCompletionNotification: Boolean(completedNotif),
};
assert(projectD.status === "已完成", "Flow D project should auto complete");
assert(Boolean(completedNotif), "Flow D should create completion notification");

console.log(JSON.stringify({ ok: true, result }, null, 2));
