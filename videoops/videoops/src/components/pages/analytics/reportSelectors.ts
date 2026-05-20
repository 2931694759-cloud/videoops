"use client";

import { BLUE, GREEN, RED } from "./reportUi";
import type { ReportData, ReportKpi, ReportMode } from "./reportData";
import type { WorkflowData } from "@/lib/workflowSelectors";
import { getProjectDisplayFields, getProjectStatus, getProjectStatusFromTypeTaskPackages } from "@/lib/workflowSelectors";

function toMs(iso: string | null | undefined) {
  const ms = Date.parse(String(iso || ""));
  return Number.isFinite(ms) ? ms : Number.NaN;
}

function formatPct(v: number) {
  const safe = Number.isFinite(v) ? v : 0;
  return `${(safe * 100).toFixed(1)}%`;
}

function formatInt(v: number) {
  return Math.round(v).toLocaleString();
}

function formatSignedPct(v: number) {
  const safe = Number.isFinite(v) ? v : 0;
  const sign = safe >= 0 ? "+" : "-";
  return `${sign}${Math.abs(safe).toFixed(0)}%`;
}

function parseMonthLabel(label: string) {
  const m = label.match(/^(\d{4})年(\d{1,2})月$/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
  return { year, month };
}

function parseQuarterLabel(label: string) {
  const m = label.match(/^(\d{4})年Q([1-4])$/i);
  if (!m) return null;
  const year = Number(m[1]);
  const q = Number(m[2]);
  if (!Number.isFinite(year) || !Number.isFinite(q)) return null;
  return { year, quarter: q };
}

export function getReportPeriodRange(mode: ReportMode, label: string) {
  if (mode === "month") {
    const v = parseMonthLabel(label);
    if (!v) return null;
    const start = new Date(v.year, v.month - 1, 1, 0, 0, 0, 0);
    const end = new Date(v.year, v.month, 1, 0, 0, 0, 0);
    return { startMs: start.getTime(), endMs: end.getTime() };
  }
  const v = parseQuarterLabel(label);
  if (!v) return null;
  const startMonth = (v.quarter - 1) * 3;
  const start = new Date(v.year, startMonth, 1, 0, 0, 0, 0);
  const end = new Date(v.year, startMonth + 3, 1, 0, 0, 0, 0);
  return { startMs: start.getTime(), endMs: end.getTime() };
}

function inRange(iso: string | null | undefined, range: { startMs: number; endMs: number }) {
  const ms = toMs(iso);
  if (!Number.isFinite(ms)) return false;
  return ms >= range.startMs && ms < range.endMs;
}

function isExternalBrand(brand: string) {
  const b = (brand || "").trim();
  if (!b) return false;
  if (b.includes("Team")) return false;
  if (b.includes("内部")) return false;
  if (b === "Corporate") return false;
  if (b === "Retail Team") return false;
  if (b === "E-commerce Team") return false;
  if (b === "HR Team") return false;
  if (b.includes("保乐力加")) return false;
  return true;
}

function getProjectWorkType(task: WorkflowData["tasks"][number], fields: ReturnType<typeof getProjectDisplayFields>) {
  const raw = typeof (task as any).workType === "string" ? String((task as any).workType || "").trim() : "";
  if (raw) {
    if (raw.includes("视频")) return "动效 / 视频";
    if (raw.includes("平面")) return "平面设计";
    if (raw.includes("线下")) return "本地化延展";
    if (raw.includes("策略")) return "品牌策略";
    return raw;
  }
  if (!fields.ok) return "其他";
  const types = fields.deliverables.map(d => d.type);
  if (types.some(t => t.includes("视频"))) return "动效 / 视频";
  if (types.some(t => t.includes("平面"))) return "平面设计";
  if (types.some(t => t.includes("线下"))) return "本地化延展";
  return "品牌策略";
}

function toReportProjectStatus(status: ReturnType<typeof getProjectStatus>) {
  if (status === "制作中" || status === "待验收" || status === "已完成" || status === "已取消") return status;
  return "制作中";
}

type ReportProjectRow = {
  projectId: string;
  projectName: string;
  brandTeam: string;
  status: "制作中" | "待验收" | "已完成" | "已取消";
  createdAt: string | null;
  completedAt: string | null;
  packages: NonNullable<WorkflowData["typeTaskPackages"]>[number][];
  legacyTask: WorkflowData["tasks"][number] | null;
};

function makeKpi(base: ReportKpi, patch: Partial<ReportKpi>): ReportKpi {
  return { ...base, ...patch };
}

function getPeriodAnchorIso(task: WorkflowData["tasks"][number], questionnaire: WorkflowData["questionnaires"][number] | null) {
  const taskCreatedAt = typeof (task as any).createdAt === "string" ? String((task as any).createdAt || "").trim() : "";
  if (taskCreatedAt) return taskCreatedAt;
  const qCreatedAt = typeof (questionnaire as any)?.createdAt === "string" ? String((questionnaire as any).createdAt || "").trim() : "";
  if (qCreatedAt) return qCreatedAt;
  const requestDate = typeof (task as any).requestDate === "string" ? String((task as any).requestDate || "").trim() : "";
  if (requestDate) return requestDate;
  const acceptedAt = typeof (task as any).acceptedAt === "string" ? String((task as any).acceptedAt || "").trim() : "";
  if (acceptedAt) return acceptedAt;
  const completedAt = typeof (task as any).completedAt === "string" ? String((task as any).completedAt || "").trim() : "";
  if (completedAt) return completedAt;
  return null;
}

function hasV2ReportData(workflowData: WorkflowData): workflowData is WorkflowData & {
  projects: NonNullable<WorkflowData["projects"]>;
  typeTaskPackages: NonNullable<WorkflowData["typeTaskPackages"]>;
} {
  return Array.isArray(workflowData.projects) && Array.isArray(workflowData.typeTaskPackages) && workflowData.projects.length > 0;
}

function getV2ReportRows(workflowData: WorkflowData): ReportProjectRow[] {
  if (!hasV2ReportData(workflowData)) return [];
  return workflowData.projects.map(project => {
    const packages = workflowData.typeTaskPackages.filter(pkg => pkg.projectId === project.id);
    const normalizedStatus = project.status === "已取消"
      ? "已取消"
      : project.status === "已完成"
        ? "已完成"
        : getProjectStatusFromTypeTaskPackages(packages);
    const legacyTask = project.legacyTaskId
      ? workflowData.tasks.find(task => task.id === project.legacyTaskId) || null
      : workflowData.tasks.find(task => task.questionnaireId === project.briefId) || null;
    return {
      projectId: project.id,
      projectName: project.projectName,
      brandTeam: project.brandTeam,
      status: normalizedStatus,
      createdAt: project.createdAt || null,
      completedAt: project.completedAt || null,
      packages,
      legacyTask,
    };
  });
}

function getLatestPassedAtByPackageId(workflowData: WorkflowData) {
  const map = new Map<string, string>();
  (workflowData.signoffRecords || [])
    .filter(record => record.result === "passed")
    .sort((a, b) => String(a.reviewedAt || "").localeCompare(String(b.reviewedAt || "")))
    .forEach(record => {
      if (record.reviewedAt) map.set(record.typeTaskPackageId, record.reviewedAt);
    });
  return map;
}

export function getBrandComplianceRate(params: { workflowData: WorkflowData; range: { startMs: number; endMs: number } }) {
  if (Array.isArray(params.workflowData.signoffRecords) && params.workflowData.signoffRecords.length > 0) {
    let completedCount = 0;
    let revisionCount = 0;
    for (const record of params.workflowData.signoffRecords) {
      if (!inRange(record.reviewedAt || null, params.range)) continue;
      if (record.result === "passed") completedCount += 1;
      if (record.result === "revision_requested") revisionCount += 1;
    }
    const denom = completedCount + revisionCount;
    return { completedCount, revisionCount, denom, rate: denom > 0 ? completedCount / denom : null };
  }

  const projectTasks = params.workflowData.tasks.filter(t => Boolean((t as any).questionnaireId));

  let completedCount = 0;
  let revisionCount = 0;

  for (const t of projectTasks) {
    const history = Array.isArray((t as any).acceptanceHistory) ? ((t as any).acceptanceHistory as any[]) : [];
    for (const h of history) {
      if (!h) continue;
      const result = String(h.result || "");
      const resultAt = h.resultAt || null;
      if (!inRange(resultAt, params.range)) continue;
      if (result === "completed") completedCount += 1;
      if (result === "revision_requested") revisionCount += 1;
    }
  }

  const denom = completedCount + revisionCount;
  const rate = denom > 0 ? completedCount / denom : null;
  return { completedCount, revisionCount, denom, rate };
}

export function buildReportData(params: {
  workflowData: WorkflowData;
  mode: ReportMode;
  selectedPeriodLabel: string;
  fallback: ReportData;
}) {
  const range = getReportPeriodRange(params.mode, params.selectedPeriodLabel);
  if (!range) return params.fallback;

  const v2Rows = getV2ReportRows(params.workflowData);
  const hasV2Rows = v2Rows.length > 0;

  const projectTasks = params.workflowData.tasks.filter(t => {
    return Boolean(t.questionnaireId);
  });

  const completedProjectsInPeriod = hasV2Rows
    ? v2Rows.filter(row => row.status === "已完成" && inRange(row.completedAt || null, range))
    : projectTasks.filter(t => toReportProjectStatus(getProjectStatus(params.workflowData, t.id)) === "已完成" && inRange((t as any).completedAt || null, range));

  const compliance = getBrandComplianceRate({ workflowData: params.workflowData, range });

  const prevLabel = (() => {
    const idx = params.fallback.periods.indexOf(params.selectedPeriodLabel);
    if (idx < 0) return null;
    return params.fallback.periods[idx + 1] || null;
  })();
  const prevRange = prevLabel ? getReportPeriodRange(params.mode, prevLabel) : null;
  const prevCompletedProjectsInPeriod = prevRange
    ? (
      hasV2Rows
        ? v2Rows.filter(row => row.status === "已完成" && inRange(row.completedAt || null, prevRange))
        : projectTasks.filter(t => toReportProjectStatus(getProjectStatus(params.workflowData, t.id)) === "已完成" && inRange((t as any).completedAt || null, prevRange))
    )
    : null;
  const prevCompliance = prevRange ? getBrandComplianceRate({ workflowData: params.workflowData, range: prevRange }) : null;

  const doneChange =
    prevCompletedProjectsInPeriod && prevCompletedProjectsInPeriod.length > 0
      ? formatSignedPct(((completedProjectsInPeriod.length - prevCompletedProjectsInPeriod.length) / prevCompletedProjectsInPeriod.length) * 100)
      : null;
  const complianceChange =
    prevCompliance && prevCompliance.rate != null && compliance.rate != null && prevCompliance.rate > 0
      ? formatSignedPct(((compliance.rate - prevCompliance.rate) / prevCompliance.rate) * 100)
      : null;

  const kpis = params.fallback.kpis.map(kpi => {
    if (kpi.key === "done") {
      return makeKpi(kpi, {
        value: `${completedProjectsInPeriod.length}`,
        change: doneChange || kpi.change,
        footnote: "按项目 completedAt 周期统计",
      });
    }
    if (kpi.key === "compliance") {
      if (compliance.rate == null) {
        return makeKpi(kpi, {
          value: formatPct(1),
          progress: 100,
          change: complianceChange || kpi.change,
          footnote: "本周期无需求方审核结果事件（passed / revision_requested）",
        });
      }
      return makeKpi(kpi, {
        value: formatPct(compliance.rate),
        progress: compliance.rate * 100,
        change: complianceChange || kpi.change,
        footnote: "需求方通过 /（需求方通过 + 退回修改），按 SignoffRecord.reviewedAt 落在周期内统计",
      });
    }
    if (kpi.key === "hours") return makeKpi(kpi, { footnote: "口径见数据说明" });
    if (kpi.key === "saving") return makeKpi(kpi, { footnote: "口径见数据说明" });
    return kpi;
  });

  const brandCount = new Map<string, number>();
  if (hasV2Rows) {
    for (const row of v2Rows) {
      if (row.status === "已取消") continue;
      if (!inRange(row.createdAt, range)) continue;
      const brand = row.brandTeam || "-";
      if (!isExternalBrand(brand)) continue;
      brandCount.set(brand, (brandCount.get(brand) || 0) + 1);
    }
  }
  if (brandCount.size === 0) {
    for (const t of projectTasks) {
      const ps = toReportProjectStatus(getProjectStatus(params.workflowData, t.id));
      if (ps === "已取消") continue;
      const q = params.workflowData.questionnaires.find(x => x.id === (t as any).questionnaireId) || null;
      const anchor = getPeriodAnchorIso(t, q);
      const within = inRange(anchor, range);
      if (!within) continue;

      const fields = getProjectDisplayFields(params.workflowData, t.id);
      if (!fields.ok) continue;
      const brand = fields.brand || "-";
      if (!isExternalBrand(brand)) continue;
      brandCount.set(brand, (brandCount.get(brand) || 0) + 1);
    }
  }

  const sortedBrands = Array.from(brandCount.entries()).sort((a, b) => b[1] - a[1]);
  const totalBrands = sortedBrands.reduce((sum, [, n]) => sum + n, 0);
  const top = sortedBrands.slice(0, 4);
  const rest = sortedBrands.slice(4);
  const otherCount = rest.reduce((sum, [, n]) => sum + n, 0);
  const slices = [
    ...top.map(([name, n], idx) => {
      const colors = [RED, "#c79a00", BLUE, GREEN];
      const percent = totalBrands > 0 ? Math.round((n / totalBrands) * 100) : 0;
      return { name, percent, color: colors[idx] || "#d1d5db" };
    }),
    ...(otherCount > 0 ? [{ name: "其他外部品牌", percent: totalBrands > 0 ? Math.max(0, 100 - top.reduce((sum, [, n]) => sum + Math.round((n / totalBrands) * 100), 0)) : 0, color: "#d1d5db" }] : []),
  ];

  const donut = slices.length > 0 ? { activeCount: brandCount.size, slices } : params.fallback.donut;

  const workTypeCount = new Map<string, number>();
  if (hasV2Rows) {
    for (const row of v2Rows) {
      if (row.status === "已取消") continue;
      if (!inRange(row.createdAt, range)) continue;
      row.packages.forEach(pkg => {
        const type = String(pkg.deliverableType || "");
        const wt = type.includes("视频")
          ? "动效 / 视频"
          : type.includes("平面")
            ? "平面设计"
            : type.includes("线下")
              ? "本地化延展"
              : type.includes("3D") || type.includes("Copy") || type.includes("文案")
                ? "品牌策略"
                : "其他";
        workTypeCount.set(wt, (workTypeCount.get(wt) || 0) + 1);
      });
    }
  }
  if (workTypeCount.size === 0) {
    for (const t of projectTasks) {
      const ps = toReportProjectStatus(getProjectStatus(params.workflowData, t.id));
      if (ps === "已取消") continue;
      const q = params.workflowData.questionnaires.find(x => x.id === (t as any).questionnaireId) || null;
      const anchor = getPeriodAnchorIso(t, q);
      const within = inRange(anchor, range);
      if (!within) continue;
      const fields = getProjectDisplayFields(params.workflowData, t.id);
      const wt = getProjectWorkType(t, fields);
      workTypeCount.set(wt, (workTypeCount.get(wt) || 0) + 1);
    }
  }
  const totalWorkType = Array.from(workTypeCount.values()).reduce((s, n) => s + n, 0);
  const workHours = params.fallback.workHours.map(card => {
    const count = workTypeCount.get(card.name) || 0;
    const share = totalWorkType > 0 ? Math.round((count / totalWorkType) * 100) : 0;
    return { ...card, share };
  });

  const v2SavingCandidates = hasV2Rows
    ? v2Rows
      .map(row => {
        if (row.status === "已取消" || !inRange(row.createdAt, range)) return null;
        const task = row.legacyTask;
        const internal = typeof (task as any)?.internalCost === "number" ? (task as any).internalCost : null;
        const market = typeof (task as any)?.marketReferenceCost === "number" ? (task as any).marketReferenceCost : null;
        const saving = internal != null && market != null ? Math.max(0, market - internal) : null;
        const leadType = row.packages[0]?.deliverableType || "";
        const category = leadType.includes("视频")
          ? "视频" as const
          : leadType.includes("平面")
            ? "设计" as const
            : leadType.includes("线下")
              ? "线下物料" as const
              : leadType.includes("Copy") || leadType.includes("文案")
                ? "文案" as const
                : "品牌策略" as const;
        return { category, projectName: row.projectName, projectStatus: row.status, internal, market, saving };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x))
      .sort((a, b) => (b.saving || 0) - (a.saving || 0))
    : [];

  const savingCandidates = (v2SavingCandidates.length > 0 ? v2SavingCandidates : projectTasks
    .map(t => {
      const ps = toReportProjectStatus(getProjectStatus(params.workflowData, t.id));
      if (ps === "已取消") return null;
      const q = params.workflowData.questionnaires.find(x => x.id === (t as any).questionnaireId) || null;
      const anchor = getPeriodAnchorIso(t, q);
      const within = inRange(anchor, range);
      if (!within) return null;
      const fields = getProjectDisplayFields(params.workflowData, t.id);
      if (!fields.ok) return null;
      const internal = typeof (t as any).internalCost === "number" ? (t as any).internalCost : null;
      const market = typeof (t as any).marketReferenceCost === "number" ? (t as any).marketReferenceCost : null;
      const saving = internal != null && market != null ? Math.max(0, market - internal) : null;
      const category = (() => {
        const wt = getProjectWorkType(t, fields);
        if (wt === "动效 / 视频") return "视频" as const;
        if (wt === "平面设计") return "设计" as const;
        if (wt === "本地化延展") return "线下物料" as const;
        return "品牌策略" as const;
      })();
      return { category, projectName: fields.projectName, projectStatus: ps, internal, market, saving };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .sort((a, b) => (b.saving || 0) - (a.saving || 0)));

  const savingDetails = savingCandidates.slice(0, 4).map(item => {
    const internalCost = item.internal == null ? "-" : `¥${formatInt(item.internal)}`;
    const agencyQuote = item.market == null ? "-" : `¥${formatInt(item.market)}`;
    const netSaving = item.saving == null ? "-" : `+¥${formatInt(item.saving)}`;
    return {
      category: item.category,
      projectName: item.projectName,
      internalCost,
      agencyQuote,
      netSaving,
      status: item.projectStatus,
    };
  });

  const savingDetailsOut = savingDetails.length > 0 ? savingDetails : params.fallback.savingDetails.map(r => ({ ...r, status: r.status }));

  return {
    ...params.fallback,
    kpis,
    donut,
    workHours,
    savingDetails: savingDetailsOut,
  } satisfies ReportData;
}
