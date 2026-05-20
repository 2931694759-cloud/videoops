"use client";

import { useMemo } from "react";
import type { ProjectRecord, Questionnaire, SignoffRecord, SubmissionRecord, TypeTaskPackage } from "@/lib/mock-data";
import { nowMs, toMs, yearMonthFromMs, ymdSlash } from "@/lib/runtime";
import type { MemberPerformance, MemberProfile, MemberRoleFilter, MemberSortField, MemberStats, MemberTaskRow, SortDirection } from "./teamTypes";
import { PERF_FALLBACKS } from "./teamLogic";
import { getLatestTypeTaskPackageFeedback, getLatestTypeTaskPackageSubmission } from "@/lib/workflowSelectors";

function computePerformance(memberId: string, packages: TypeTaskPackage[], submissions: SubmissionRecord[], signoffRecords: SignoffRecord[], fallback: { passRate: number; avgRework: number; onTimeRate: number }): MemberPerformance {
  const mine = packages.filter(pkg => pkg.assigneeId === memberId);
  if (mine.length === 0) return fallback;

  const passedCount = mine.filter(pkg => pkg.status === "已通过").length;
  const revisionCount = signoffRecords.filter(record => mine.some(pkg => pkg.id === record.typeTaskPackageId) && record.result === "revision_requested").length;
  const packageWithRevision = new Set(
    signoffRecords
      .filter(record => mine.some(pkg => pkg.id === record.typeTaskPackageId) && record.result === "revision_requested")
      .map(record => record.typeTaskPackageId)
  );

  const completed = mine.filter(pkg => pkg.status === "已通过");
  const onTime = completed.filter(pkg => {
    const latestSubmission = getLatestTypeTaskPackageSubmission(pkg.id, submissions);
    const submittedAt = toMs(latestSubmission?.submittedAt || "");
    const promisedAt = toMs(pkg.promisedAt || "");
    return !Number.isNaN(submittedAt) && !Number.isNaN(promisedAt) && submittedAt <= promisedAt;
  }).length;

  const passRate = (passedCount / mine.length) * 100;
  const avgRework = packageWithRevision.size > 0 ? revisionCount / packageWithRevision.size : 0;
  const onTimeRate = completed.length > 0 ? (onTime / completed.length) * 100 : fallback.onTimeRate;

  return {
    passRate: Number.isFinite(passRate) ? passRate : fallback.passRate,
    avgRework: Number.isFinite(avgRework) ? avgRework : fallback.avgRework,
    onTimeRate: Number.isFinite(onTimeRate) ? onTimeRate : fallback.onTimeRate,
  };
}

export function useTeamComputed({
  members,
  typeTaskPackages,
  projects,
  questionnaires,
  submissions,
  signoffRecords,
  roleFilter,
  sortField,
  sortDirection,
  search,
  selectedId,
}: {
  members: MemberProfile[];
  typeTaskPackages: TypeTaskPackage[];
  projects: ProjectRecord[];
  questionnaires: Questionnaire[];
  submissions: SubmissionRecord[];
  signoffRecords: SignoffRecord[];
  roleFilter: MemberRoleFilter;
  sortField: MemberSortField;
  sortDirection: SortDirection;
  search: string;
  selectedId: string | null;
}) {
  const qById = useMemo(() => {
    const m = new Map<string, Questionnaire>();
    for (const q of questionnaires) m.set(q.id, q);
    return m;
  }, [questionnaires]);

  const projectById = useMemo(() => {
    const m = new Map<string, ProjectRecord>();
    for (const project of projects) m.set(project.id, project);
    return m;
  }, [projects]);

  const statsById = useMemo(() => {
    const now = nowMs();
    const ym = yearMonthFromMs(now);
    const m: Record<string, MemberStats> = {};
    for (const u of members) {
      const mine = typeTaskPackages.filter(pkg => pkg.assigneeId === u.id);
      const currentTasks = mine.filter(pkg => pkg.status !== "已结束").length;
      const toSubmit = mine.filter(pkg => pkg.status === "待提交").length;
      const waitingSignoff = mine.filter(pkg => pkg.status === "待需求方审核").length;
      const needFix = mine.filter(pkg => pkg.status === "需修改").length;
      const passed = mine.filter(pkg => pkg.status === "已通过").length;
      const monthDone = mine.filter(pkg => {
        if (pkg.status !== "已通过") return false;
        const latest = signoffRecords
          .filter(record => record.typeTaskPackageId === pkg.id && record.result === "passed")
          .sort((a, b) => String(b.reviewedAt || "").localeCompare(String(a.reviewedAt || "")))[0];
        if (!latest?.reviewedAt) return false;
        const ms = toMs(latest.reviewedAt);
        if (Number.isNaN(ms)) return false;
        const y = yearMonthFromMs(ms);
        return y.year === ym.year && y.month === ym.month;
      }).length;
      const revisionCount = signoffRecords.filter(record => record.result === "revision_requested" && mine.some(pkg => pkg.id === record.typeTaskPackageId)).length;
      m[u.id] = { currentTasks, toSubmit, waitingSignoff, needFix, passed, monthDone, revisionCount };
    }
    return m;
  }, [members, signoffRecords, typeTaskPackages]);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = members.filter(m => {
      if (roleFilter !== "all" && m.roleLabel !== roleFilter) return false;
      if (!q) return true;
      const hay = `${m.name} ${m.email} ${m.skills.join(" ")}`.toLowerCase();
      return hay.includes(q);
    });

    list.sort((a, b) => {
      const av = statsById[a.id]?.[sortField] ?? 0;
      const bv = statsById[b.id]?.[sortField] ?? 0;
      if (av !== bv) return sortDirection === "desc" ? bv - av : av - bv;
      return a.name.localeCompare(b.name, "zh-CN");
    });
    return list;
  }, [members, roleFilter, search, sortDirection, sortField, statsById]);

  const selected = useMemo(() => (selectedId ? members.find(m => m.id === selectedId) || null : null), [members, selectedId]);

  const selectedStats = useMemo(() => (selected ? statsById[selected.id] || null : null), [selected, statsById]);

  const selectedPerformance = useMemo((): MemberPerformance | null => {
    if (!selected) return null;
    const fb = PERF_FALLBACKS[selected.id] || { passRate: 86, avgRework: 1.2, onTimeRate: 91 };
    return computePerformance(selected.id, typeTaskPackages, submissions, signoffRecords, fb);
  }, [selected, signoffRecords, submissions, typeTaskPackages]);

  const selectedTasks = useMemo(() => {
    if (!selected) return [] as MemberTaskRow[];
    const now = nowMs();
    const list = typeTaskPackages
      .filter(pkg => pkg.assigneeId === selected.id)
      .map(pkg => {
        const project = projectById.get(pkg.projectId) || null;
        const questionnaire = qById.get(pkg.briefId) || null;
        const deliverables = `${pkg.deliverableType} × ${Math.max(1, pkg.deliverableItems.length)}`;
        const ms = pkg.promisedAt ? toMs(pkg.promisedAt) : NaN;
        const overdue = !Number.isNaN(ms) && now > ms && pkg.status !== "已通过" && pkg.status !== "已结束";
        const urgent = !overdue && !Number.isNaN(ms) && ms - now <= 2 * 86400000 && ms - now >= 0;
        const riskLabel: MemberTaskRow["riskLabel"] = overdue ? "已逾期" : urgent ? "紧急" : "正常";
        const feedback = getLatestTypeTaskPackageFeedback(pkg, signoffRecords);
        const statusLabel: MemberTaskRow["statusLabel"] = pkg.status;
        const title = `${project?.projectCode || "项目"} ${project?.projectName || questionnaire?.title || pkg.deliverableType}${feedback ? ` · ${feedback}` : ""}`;

        return {
          id: pkg.id,
          title,
          deliverables,
          statusLabel,
          dueLabel: pkg.promisedAt ? ymdSlash(pkg.promisedAt) : "-",
          riskLabel,
        };
      });
    list.sort((a, b) => String(a.dueLabel).localeCompare(String(b.dueLabel)));
    return list;
  }, [projectById, qById, selected, signoffRecords, typeTaskPackages]);

  return {
    statsById,
    filteredMembers,
    selected,
    selectedStats,
    selectedPerformance,
    selectedTasks,
  };
}
