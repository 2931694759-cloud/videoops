import { getNotificationAppTarget, getNotificationSignoffTarget } from "../src/lib/notificationRouting";
import { useStore } from "../src/lib/store";
import type { DeliverableTypeGroup, Questionnaire, TypeTaskPackage } from "../src/lib/mock-data";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function makeBrief(id: string, title: string, deliverableTypes: DeliverableTypeGroup[]): Questionnaire {
  const now = new Date().toISOString();
  return {
    id,
    title,
    description: `${title} 的第三阶段验证 Brief`,
    videoType: "PROMO",
    duration: "30秒",
    deadline: new Date(Date.now() + 10 * 86400000).toISOString(),
    requesterName: "第三阶段验证需求方",
    requesterEmail: "phase3@example.com",
    requesterDept: "市场部",
    deliverableTypes,
    specialNotes: JSON.stringify({ brand: "第三阶段验证品牌", deliverableTypes }),
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

function countMemberPackages(packages: TypeTaskPackage[], memberId: string) {
  const mine = packages.filter(pkg => pkg.assigneeId === memberId);
  return {
    currentTasks: mine.filter(pkg => pkg.status !== "已结束").length,
    toSubmit: mine.filter(pkg => pkg.status === "待提交").length,
    waitingSignoff: mine.filter(pkg => pkg.status === "待需求方审核").length,
    needFix: mine.filter(pkg => pkg.status === "需修改").length,
    passed: mine.filter(pkg => pkg.status === "已通过").length,
  };
}

const s = getState();
const result: Record<string, unknown> = {};

// 1. 生成新的审核链接通知，并验证通知打开目标
const brief = makeBrief("qa-phase3-notification", "第三阶段-通知审核页", [
  { type: "视频", items: [{ name: "品牌短片", quantity: 1, size: "16:9", outputFormat: "MP4", usageScenario: "社媒", remark: "" }] },
]);
s.addQuestionnaire(brief);
let r = getState().dispatchBrief({
  questionnaireId: brief.id,
  assignerId: "u1",
  packages: [{
    deliverableType: "视频",
    assigneeId: "u3",
    promisedAt: new Date(Date.now() + 2 * 86400000).toISOString(),
    estimatedWorkingHours: 6,
    assetCategory: "视频",
    assignmentNote: "phase3 notification",
  }],
});
assert(r.ok, `Phase3 dispatch failed: ${r.ok ? "" : r.error}`);

const pkg = getPackage(brief.id, "视频");
r = getState().submitPackageDeliverable({
  typeTaskPackageId: pkg.id,
  submittedById: "u3",
  fileLinks: ["https://example.com/phase3-v1.mp4"],
  submitNote: "phase3 V1",
  actualWorkingHours: 4,
  assetCategory: "视频",
});
assert(r.ok, `Phase3 submit failed: ${r.ok ? "" : r.error}`);

const latestSubmission = getLatestSubmission(pkg.id)!;
assert(Boolean(latestSubmission.signoffToken), "Phase3 should create signoff token");
assert(Boolean(latestSubmission.signoffUrl), "Phase3 should create signoff url");

const signoffNotif = getState().notifications.find(item => item.type === "signoff_email_sent" && item.submissionId === latestSubmission.id) || null;
assert(Boolean(signoffNotif), "Phase3 should create signoff_email_sent notification");
assert(Boolean(signoffNotif?.signoffToken), "signoff_email_sent should include signoffToken");
assert(Boolean(signoffNotif?.signoffUrl || signoffNotif?.signOffLink), "signoff_email_sent should include signoffUrl/signOffLink");
assert(Boolean(signoffNotif?.typeTaskPackageId), "signoff_email_sent should include typeTaskPackageId");
assert(Boolean(signoffNotif?.projectId), "signoff_email_sent should include projectId");

const signoffTarget = signoffNotif ? getNotificationSignoffTarget(signoffNotif) : null;
assert(signoffTarget === latestSubmission.signoffUrl, "Notification signoff target should resolve to submission signoff url");
assert(signoffTarget !== "/review" && signoffTarget !== "/reviews", "Notification signoff target must not point to review routes");

const appTarget = signoffNotif ? getNotificationAppTarget(signoffNotif) : null;
assert(appTarget === "my-tasks" || appTarget === "tasks", "Notification record button should still point to app page");

// 2. 已读历史通知仍可打开
getState().markNotifRead(signoffNotif!.id);
const historyNotif = getState().notifications.find(item => item.id === signoffNotif!.id)!;
assert(getNotificationSignoffTarget(historyNotif) === latestSubmission.signoffUrl, "History signoff notification should still resolve to signoff page");

// 3. 审核动作可正常回写
r = getState().approvePackageSubmission({
  token: latestSubmission.signoffToken!,
  reviewedByName: "第三阶段需求方",
  reviewedByEmail: "phase3-reviewer@example.com",
  feedback: "通过",
});
assert(r.ok, `Phase3 approve failed: ${r.ok ? "" : r.error}`);
assert(getPackage(brief.id, "视频").status === "已通过", "Package should become 已通过 after approve");

const approveAgain = getState().approvePackageSubmission({
  token: latestSubmission.signoffToken!,
  reviewedByName: "第三阶段需求方",
  reviewedByEmail: "phase3-reviewer@example.com",
});
assert(!approveAgain.ok, "Processed token should become read-only");

// 4. 团队管理统计口径按 TypeTaskPackage
const memberStats = countMemberPackages(getState().typeTaskPackages, "u6");
assert(memberStats.currentTasks === 4, "u6 should have 4 type task packages in phase4 seeded data");
assert(memberStats.toSubmit === 1, "u6 should have 1 to-submit package in phase4 seeded data");
assert(memberStats.waitingSignoff === 1, "u6 should have 1 waiting signoff package in phase4 seeded data");
assert(memberStats.needFix === 1, "u6 should have 1 revision package in phase4 seeded data");
assert(memberStats.passed === 1, "u6 should have 1 passed package in phase4 seeded data");

result.signoffNotification = {
  submissionId: latestSubmission.id,
  signoffToken: latestSubmission.signoffToken,
  signoffUrl: latestSubmission.signoffUrl,
  notificationId: signoffNotif?.id || null,
  notificationTarget: signoffTarget,
  historyTarget: getNotificationSignoffTarget(historyNotif),
  appTarget,
  packageStatusAfterApprove: getPackage(brief.id, "视频").status,
  repeatedApproveBlocked: approveAgain.ok === false,
};

result.teamStats = memberStats;
result.reviewCompatibility = {
  reviewPagePreserved: true,
  reviewRouteNotUsedAsMainTarget: [signoffTarget, historyNotif.secondaryActionTarget].every(target => target !== "/review" && target !== "/reviews"),
};

console.log(JSON.stringify({ ok: true, result }, null, 2));
