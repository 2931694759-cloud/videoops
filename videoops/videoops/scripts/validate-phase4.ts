import fs from "node:fs";
import path from "node:path";
import { useStore } from "../src/lib/store";
import {
  getKeyProjects,
  getMonthlyWorkbenchSummary,
  getRecentRisks,
  getTypeTaskPackageSignoffHistory,
  type WorkflowData,
} from "../src/lib/workflowSelectors";
import { buildReportData } from "../src/components/pages/analytics/reportSelectors";
import { REPORT_DATA } from "../src/components/pages/analytics/reportData";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function getWorkflowData(): WorkflowData {
  const state = useStore.getState();
  return {
    tasks: state.tasks,
    questionnaires: state.questionnaires,
    submissions: state.submissions,
    reviews: state.reviews,
    projects: state.projects,
    typeTaskPackages: state.typeTaskPackages,
    signoffRecords: state.signoffRecords,
  };
}

function readFileSafe(relativePath: string) {
  const absolutePath = path.resolve(process.cwd(), relativePath);
  return fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, "utf8") : "";
}

const data = getWorkflowData();
const summary = getMonthlyWorkbenchSummary(data, new Date("2026-05-20T10:00:00.000Z"));
const keyProjects = getKeyProjects(data, { now: new Date("2026-05-20T10:00:00.000Z"), limit: 10 });
const risks = getRecentRisks(data, { now: new Date("2026-05-20T10:00:00.000Z"), limitPerType: 10 });

assert(summary.pendingDispatchCount >= 1, "Dashboard should count pending briefs");
assert(summary.inProgressProjectCount >= 1, "Dashboard should count in-progress projects");
assert(summary.waitingSignoffPackageCount >= 1, "Dashboard should count waiting signoff packages");
assert(summary.revisionPackageCount >= 1, "Dashboard should count revision packages");
assert(summary.monthlyCompletedProjectCount >= 1, "Dashboard should count monthly completed projects");
assert(summary.monthlyPassedPackageCount >= 1, "Dashboard should count monthly passed packages");
assert(keyProjects.some(item => item.progressText.includes("已通过")), "Key projects should expose package progress");
assert(keyProjects.some(item => item.riskText.includes("需修改") || item.riskText.includes("承诺时间") || item.riskText.includes("待需求方审核")), "Key projects should expose V2 risk text");
assert(risks.internal.some(item => item.note.includes("承诺交付时间")), "Risks should include promisedAt alerts");
assert(risks.external.some(item => item.note.includes("需求方退回") || item.note.includes("等待需求方审核") || item.note.includes("未通过")), "Risks should include V2 follow-up alerts");

const monthReport = buildReportData({
  workflowData: data,
  mode: "month",
  selectedPeriodLabel: REPORT_DATA.month.periods[0],
  fallback: REPORT_DATA.month,
});

assert(monthReport.kpis.some(item => item.key === "done" && item.value !== REPORT_DATA.month.kpis.find(kpi => kpi.key === "done")?.value), "Report should recalculate completed-project KPI");
assert(monthReport.kpis.some(item => item.key === "compliance" && item.footnote.includes("SignoffRecord")), "Report compliance KPI should use SignoffRecord footnote");
assert(monthReport.savingDetails.every(item => ["制作中", "待验收", "已完成", "已取消"].includes(item.status)), "Report statuses should only use V2 project statuses");

const state = useStore.getState();
const projectById = new Map(state.projects.map(project => [project.id, project] as const));
const memberPortfolio = state.typeTaskPackages
  .filter(pkg => pkg.status === "已通过")
  .map(pkg => ({
    packageId: pkg.id,
    projectId: pkg.projectId,
    assigneeId: pkg.assigneeId,
    projectName: projectById.get(pkg.projectId)?.projectName || "",
    deliverableType: pkg.deliverableType,
    passedAt: getTypeTaskPackageSignoffHistory(pkg.id, state.signoffRecords).find(record => record.result === "passed")?.reviewedAt || null,
  }));

assert(memberPortfolio.some(item => item.assigneeId === "u4" && item.packageId === "ttp-v2-u4-first-pass"), "Portfolio should include passed package for assigned member");
assert(memberPortfolio.some(item => item.projectId === "prj-v2-5" && item.assigneeId === "u3" && item.deliverableType === "3D"), "Portfolio should preserve multi-member ownership by package");
assert(!memberPortfolio.some(item => item.projectId === "prj-v2-5" && item.assigneeId === "u4" && item.deliverableType === "3D"), "Portfolio should not attribute all assets in a multi-member project to one member");

const scenarios = {
  singleTypeFirstPass: state.projects.some(project => project.id === "prj-v2-4" && project.status === "已完成")
    && state.typeTaskPackages.some(pkg => pkg.id === "ttp-v2-u4-first-pass" && pkg.status === "已通过" && pkg.currentVersion === "V1"),
  multiTypePartial: state.projects.some(project => project.id === "prj-v2-5" && project.status === "制作中")
    && ["ttp-v2-u3-3d-passed", "ttp-v2-u4-video-signoff", "ttp-v2-u6-copy-todo"].every(id => state.typeTaskPackages.some(pkg => pkg.id === id)),
  revisionThenPassed: state.typeTaskPackages.some(pkg => pkg.id === "ttp-v2-u6-passed" && pkg.currentVersion === "V2" && pkg.status === "已通过")
    && state.signoffRecords.some(record => record.typeTaskPackageId === "ttp-v2-u6-passed" && record.result === "passed")
    && state.submissions.some(item => item.typeTaskPackageId === "ttp-v2-u6-passed" && item.version === "V1"),
  waitingSignoff: state.typeTaskPackages.some(pkg => pkg.status === "待需求方审核"),
  canceledProject: state.projects.some(project => project.id === "prj-v2-6" && project.status === "已取消")
    && state.typeTaskPackages.some(pkg => pkg.projectId === "prj-v2-6" && pkg.status === "已结束"),
  multiMember: state.projects.some(project => project.id === "prj-v2-5")
    && new Set(state.typeTaskPackages.filter(pkg => pkg.projectId === "prj-v2-5").map(pkg => pkg.assigneeId).filter(Boolean)).size >= 3,
  riskProject: state.typeTaskPackages.some(pkg => pkg.status === "需修改")
    && state.typeTaskPackages.some(pkg => pkg.status === "待需求方审核")
    && state.typeTaskPackages.some(pkg => ["待提交", "需修改", "待需求方审核"].includes(pkg.status) && pkg.promisedAt && new Date(pkg.promisedAt).getTime() <= new Date("2026-05-22T23:59:59.000Z").getTime()),
};

Object.entries(scenarios).forEach(([key, ok]) => {
  assert(ok, `Mock scenario missing: ${key}`);
});

const blockedWords = [
  "审核中心",
  "Manager",
  "内部审核",
  "提交验收",
  "标记完成",
  "Pending Sign-off",
  "Internal Review",
  "Brief Review",
  "WIP",
  "Completed",
  "Canceled",
];

const filesToScan = [
  "src/components/pages/Dashboard.tsx",
  "src/components/pages/TaskBoard.tsx",
  "src/components/pages/NotificationsPage.tsx",
  "src/components/pages/PortfolioPage.tsx",
  "src/components/pages/analytics/PerformanceReport.tsx",
  "src/components/team/TeamManagement.tsx",
  "src/components/Sidebar.tsx",
  "src/components/Topbar.tsx",
];

const textScan = filesToScan.map(file => {
  const content = readFileSafe(file);
  const hits = blockedWords.filter(word => content.includes(word));
  return { file, hits };
}).filter(item => item.hits.length > 0);

assert(textScan.length === 0, `Blocked copy should not appear in main files: ${JSON.stringify(textScan)}`);

console.log(JSON.stringify({
  ok: true,
  result: {
    dashboard: {
      summary,
      keyProjectCount: keyProjects.length,
      riskCounts: {
        due: risks.internalCount,
        followUp: risks.externalCount,
      },
    },
    report: {
      doneKpi: monthReport.kpis.find(item => item.key === "done")?.value || null,
      complianceFootnote: monthReport.kpis.find(item => item.key === "compliance")?.footnote || null,
      statuses: Array.from(new Set(monthReport.savingDetails.map(item => item.status))),
    },
    portfolio: {
      passedPackages: memberPortfolio.length,
      multiMemberProjectOwnershipChecked: true,
    },
    scenarios,
    textScan,
  },
}, null, 2));
