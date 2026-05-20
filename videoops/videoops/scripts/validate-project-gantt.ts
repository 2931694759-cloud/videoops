import { useStore } from "../src/lib/store";
import {
  getProjectGanttRows,
  getProjectStatusFromTypeTaskPackages,
  type WorkflowData,
} from "../src/lib/workflowSelectors";

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

const data = getWorkflowData();
const rows = getProjectGanttRows(data, { now: new Date("2026-05-20T10:00:00.000Z") });

assert((data.projects || []).length >= 1, "Gantt should have at least one project");
assert((data.typeTaskPackages || []).length >= 1, "Gantt should have at least one type task package");
assert(rows.length >= 1, "Gantt should build at least one row");

const projectById = new Map((data.projects || []).map(project => [project.id, project] as const));
const packagesById = new Map((data.typeTaskPackages || []).map(pkg => [pkg.id, pkg] as const));

rows.forEach(row => {
  assert(packagesById.has(row.typeTaskPackageId), `Each gantt row should map to a type task package: ${row.typeTaskPackageId}`);
  assert(Boolean(row.projectName), `Row should expose projectName: ${row.typeTaskPackageId}`);
  assert(Boolean(row.deliverableType), `Row should expose deliverableType: ${row.typeTaskPackageId}`);
  assert(Boolean(row.assigneeName), `Row should expose assigneeName: ${row.typeTaskPackageId}`);
  assert(["待提交", "待需求方审核", "需修改", "已通过", "已结束"].includes(row.packageStatus), `Row should expose V2 package status: ${row.typeTaskPackageId}`);
  assert(["制作中", "待验收", "已完成", "已取消"].includes(row.projectStatus), `Row should expose V2 project status: ${row.typeTaskPackageId}`);
  assert(row.timelineNodes.length >= 3, `Each row should have timeline nodes: ${row.typeTaskPackageId}`);
  assert(row.timelineNodes.some(node => node.type === "assigned" && node.label.includes("已分配")), `Row should include assigned node: ${row.typeTaskPackageId}`);
  assert(row.timelineNodes.some(node => node.type === "current" && node.label === row.packageStatus), `Row should include current status node: ${row.typeTaskPackageId}`);
});

const multiTypeProject = (data.projects || []).find(project => {
  const count = (data.typeTaskPackages || []).filter(pkg => pkg.projectId === project.id).length;
  return count >= 3;
});

assert(Boolean(multiTypeProject), "Gantt should have at least one multi-package project");
if (multiTypeProject) {
  const packageCount = (data.typeTaskPackages || []).filter(pkg => pkg.projectId === multiTypeProject.id).length;
  const rowCount = rows.filter(row => row.projectId === multiTypeProject.id).length;
  assert(rowCount === packageCount, "A multi-package project should render one gantt row per type task package");
}

const waitingRow = rows.find(row => row.packageStatus === "待需求方审核") || null;
const reviseRow = rows.find(row => row.packageStatus === "需修改") || null;
const passedRow = rows.find(row => row.packageStatus === "已通过") || null;
const todoRow = rows.find(row => row.packageStatus === "待提交") || null;

assert(Boolean(waitingRow), "Gantt should include a waiting-signoff package");
assert(Boolean(reviseRow), "Gantt should include a revision package");
assert(Boolean(passedRow), "Gantt should include a passed package");
assert(Boolean(todoRow), "Gantt should include a todo package");

assert(waitingRow?.timelineNodes.some(node => node.type === "submitted" && /^V\d+/.test(node.label)), "Waiting row should include submission node");
assert(reviseRow?.timelineNodes.some(node => node.type === "revision" && node.label === "需求方退回"), "Revision row should include signoff revision node");
assert(passedRow?.timelineNodes.some(node => node.type === "approved" && node.label === "需求方通过"), "Passed row should include approval node");
assert(todoRow?.timelineNodes.some(node => node.type === "promised"), "Todo row should include promised node");

assert(rows.some(row => row.riskTag === "已逾期"), "Gantt should compute overdue risk");
assert(rows.some(row => row.riskTag === "即将到期"), "Gantt should compute near-due risk");
assert(rows.some(row => row.riskTag === "待审核过久"), "Gantt should compute waiting-signoff-too-long risk");
assert(rows.some(row => row.riskTag === "需修改"), "Gantt should compute revision risk");

(data.projects || []).forEach(project => {
  const packages = (data.typeTaskPackages || []).filter(pkg => pkg.projectId === project.id);
  if (packages.length === 0) return;
  const computedStatus = project.status === "已取消" || project.status === "已完成"
    ? project.status
    : getProjectStatusFromTypeTaskPackages(packages);
  const rowStatuses = Array.from(new Set(rows.filter(row => row.projectId === project.id).map(row => row.projectStatus)));
  assert(rowStatuses.every(status => status === computedStatus), `Project rows should preserve V2 project status mapping: ${project.id}`);
});

console.log(JSON.stringify({
  ok: true,
  result: {
    rowCount: rows.length,
    multiPackageProjectId: multiTypeProject?.id || null,
    riskCounts: {
      overdue: rows.filter(row => row.riskTag === "已逾期").length,
      nearDue: rows.filter(row => row.riskTag === "即将到期").length,
      waitingTooLong: rows.filter(row => row.riskTag === "待审核过久").length,
      revision: rows.filter(row => row.riskTag === "需修改").length,
    },
    sampleRows: rows.slice(0, 4).map(row => ({
      projectName: row.projectName,
      deliverable: `${row.deliverableType} × ${row.itemCount}`,
      assigneeName: row.assigneeName,
      promisedAt: row.promisedAt,
      packageStatus: row.packageStatus,
      projectStatus: row.projectStatus,
      riskTag: row.riskTag,
      timeline: row.timelineNodes.map(node => ({ type: node.type, label: node.label })),
    })),
  },
}, null, 2));
