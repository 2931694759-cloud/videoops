"use client";

import { useMemo, useState } from "react";
import { USERS, type ProjectRecord, type TypeTaskPackage } from "@/lib/mock-data";
import { toMs, ymdHmSlash, ymdSlash } from "@/lib/runtime";
import {
  type ProjectGanttRiskTag,
  type ProjectGanttRow,
} from "@/lib/workflowSelectors";
import { getInitial } from "@/lib/utils";

const TEXT_MAIN = "#111827";
const TEXT_SUB = "#6b7280";
const BORDER = "#e5e7eb";
const BORDER_WEAK = "#eef1f6";
const SURFACE = "#f8fafc";
const RED = "#ef4444";
const BLUE = "#2563eb";
const GREEN = "#16a34a";
const ORANGE = "#f59e0b";

type TimeRange = "本月" | "近 30 天" | "全部";
type ProjectStatusFilter = "全部" | ProjectRecord["status"];
type PackageStatusFilter = "全部" | TypeTaskPackage["status"];
type RiskFilter = "全部" | Exclude<ProjectGanttRiskTag, "正常">;

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 86400000);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function getRangeFromTimeRange(range: TimeRange, now: Date) {
  if (range === "本月") {
    return {
      startMs: startOfMonth(now).getTime(),
      endMs: endOfMonth(now).getTime(),
    };
  }
  if (range === "近 30 天") {
    return {
      startMs: startOfDay(addDays(now, -30)).getTime(),
      endMs: endOfDay(addDays(now, 30)).getTime(),
    };
  }
  return null;
}

function getRiskStyle(risk: ProjectGanttRiskTag) {
  if (risk === "已逾期") return { color: RED, bg: "rgba(239,68,68,0.10)" };
  if (risk === "需修改") return { color: "#db2777", bg: "rgba(236,72,153,0.12)" };
  if (risk === "待审核过久") return { color: "#b45309", bg: "rgba(245,158,11,0.18)" };
  if (risk === "即将到期") return { color: ORANGE, bg: "rgba(249,115,22,0.14)" };
  return { color: GREEN, bg: "rgba(22,163,74,0.10)" };
}

function getStatusStyle(status: TypeTaskPackage["status"]) {
  if (status === "待提交") return { color: BLUE, bg: "rgba(37,99,235,0.10)" };
  if (status === "待需求方审核") return { color: ORANGE, bg: "rgba(245,158,11,0.16)" };
  if (status === "需修改") return { color: "#db2777", bg: "rgba(236,72,153,0.12)" };
  if (status === "已通过") return { color: GREEN, bg: "rgba(22,163,74,0.10)" };
  return { color: TEXT_SUB, bg: "rgba(107,114,128,0.12)" };
}

function getNodeStyle(type: ProjectGanttRow["timelineNodes"][number]["type"]) {
  if (type === "submitted") return { color: BLUE, bg: BLUE };
  if (type === "approved") return { color: GREEN, bg: GREEN };
  if (type === "revision") return { color: RED, bg: RED };
  if (type === "current") return { color: ORANGE, bg: ORANGE };
  if (type === "promised") return { color: "#7c3aed", bg: "#7c3aed" };
  return { color: "#94a3b8", bg: "#94a3b8" };
}

function buildAxisLabels(startMs: number, endMs: number) {
  const totalDays = Math.max(1, Math.ceil((endMs - startMs) / 86400000));
  const stepDays = totalDays <= 14 ? 2 : totalDays <= 31 ? 5 : totalDays <= 62 ? 10 : Math.ceil(totalDays / 6);
  const labels: Array<{ ms: number; text: string }> = [];
  for (let cursor = startMs; cursor <= endMs; cursor += stepDays * 86400000) {
    const date = new Date(cursor);
    labels.push({
      ms: cursor,
      text: `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`,
    });
  }
  if (labels[labels.length - 1]?.ms !== endMs) {
    const date = new Date(endMs);
    labels.push({
      ms: endMs,
      text: `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`,
    });
  }
  return labels;
}

function matchesTimeRange(row: ProjectGanttRow, range: TimeRange, now: Date) {
  const boundaries = getRangeFromTimeRange(range, now);
  if (!boundaries) return true;
  const dates = row.timelineNodes
    .map(node => node.date)
    .concat([row.promisedAt, row.anchorAt, row.startAt, row.endAt])
    .filter((value): value is string => Boolean(value));
  if (dates.length === 0) return false;
  return dates.some(date => {
    const ms = toMs(date);
    return !Number.isNaN(ms) && ms >= boundaries.startMs && ms <= boundaries.endMs;
  });
}

export default function ProjectGanttModal({
  rows,
  hasProjects,
  hasPackages,
  onClose,
}: {
  rows: ProjectGanttRow[];
  hasProjects: boolean;
  hasPackages: boolean;
  onClose: () => void;
}) {
  const [timeRange, setTimeRange] = useState<TimeRange>("本月");
  const [projectStatus, setProjectStatus] = useState<ProjectStatusFilter>("全部");
  const [packageStatus, setPackageStatus] = useState<PackageStatusFilter>("全部");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("全部");
  const now = useMemo(() => new Date(), []);

  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      if (!matchesTimeRange(row, timeRange, now)) return false;
      if (projectStatus !== "全部" && row.projectStatus !== projectStatus) return false;
      if (packageStatus !== "全部" && row.packageStatus !== packageStatus) return false;
      if (riskFilter !== "全部" && row.riskTag !== riskFilter) return false;
      return true;
    });
  }, [now, packageStatus, projectStatus, riskFilter, rows, timeRange]);

  const timelineRange = useMemo(() => {
    const fixed = getRangeFromTimeRange(timeRange, now);
    if (fixed) return fixed;

    const allDates = filteredRows.flatMap(row =>
      row.timelineNodes
        .map(node => node.date)
        .concat([row.promisedAt, row.startAt, row.endAt])
        .filter((value): value is string => Boolean(value))
        .map(value => toMs(value))
        .filter(ms => !Number.isNaN(ms))
    );

    if (allDates.length === 0) {
      return {
        startMs: startOfDay(addDays(now, -7)).getTime(),
        endMs: endOfDay(addDays(now, 7)).getTime(),
      };
    }

    return {
      startMs: startOfDay(new Date(Math.min(...allDates) - 86400000)).getTime(),
      endMs: endOfDay(new Date(Math.max(...allDates) + 86400000)).getTime(),
    };
  }, [filteredRows, now, timeRange]);

  const axisLabels = useMemo(
    () => buildAxisLabels(timelineRange.startMs, timelineRange.endMs),
    [timelineRange.endMs, timelineRange.startMs]
  );

  const timelineWidth = useMemo(() => {
    const days = Math.max(10, Math.ceil((timelineRange.endMs - timelineRange.startMs) / 86400000) + 1);
    return Math.max(720, days * 34);
  }, [timelineRange.endMs, timelineRange.startMs]);

  const getOffset = (date: string | null) => {
    if (!date) return timelineWidth - 40;
    const ms = toMs(date);
    if (Number.isNaN(ms)) return timelineWidth - 40;
    const ratio = (ms - timelineRange.startMs) / Math.max(1, timelineRange.endMs - timelineRange.startMs);
    return Math.min(timelineWidth - 24, Math.max(20, ratio * (timelineWidth - 40) + 20));
  };

  const emptyMessage = !hasProjects
    ? "暂无项目数据，无法生成甘特图。"
    : !hasPackages
      ? "当前项目暂无交付任务。"
      : "当前筛选条件下没有交付任务。";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(15, 23, 42, 0.45)" }}
      onClick={onClose}
    >
      <div
        className="w-[88vw]"
        style={{ maxHeight: "78vh", minHeight: "70vh" }}
        onClick={event => event.stopPropagation()}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 26,
            background: "#fff",
            border: `1px solid ${BORDER_WEAK}`,
            boxShadow: "0 24px 70px rgba(15, 23, 42, 0.22)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            className="flex items-start justify-between gap-[16px]"
            style={{ padding: "20px 22px", borderBottom: `1px solid ${BORDER_WEAK}` }}
          >
            <div>
              <div style={{ fontSize: 20, fontWeight: 950, color: TEXT_MAIN }}>项目甘特图</div>
              <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: TEXT_SUB, lineHeight: 1.8 }}>
                按项目和交付任务查看承诺交付时间、提交节点与需求方审核状态。
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                border: `1px solid ${BORDER}`,
                background: "#fff",
                color: TEXT_SUB,
                cursor: "pointer",
              }}
              aria-label="关闭项目甘特图"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          <div
            className="flex items-center gap-[12px]"
            style={{ padding: "14px 22px", borderBottom: `1px solid ${BORDER_WEAK}`, flexWrap: "wrap" }}
          >
            {[
              {
                label: "时间范围",
                value: timeRange,
                onChange: setTimeRange as (value: string) => void,
                options: ["本月", "近 30 天", "全部"],
              },
              {
                label: "项目状态",
                value: projectStatus,
                onChange: setProjectStatus as (value: string) => void,
                options: ["全部", "制作中", "待验收", "已完成", "已取消"],
              },
              {
                label: "交付任务状态",
                value: packageStatus,
                onChange: setPackageStatus as (value: string) => void,
                options: ["全部", "待提交", "待需求方审核", "需修改", "已通过", "已结束"],
              },
              {
                label: "风险筛选",
                value: riskFilter,
                onChange: setRiskFilter as (value: string) => void,
                options: ["全部", "已逾期", "即将到期", "待审核过久", "需修改"],
              },
            ].map(item => (
              <label
                key={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  height: 38,
                  padding: "0 12px",
                  borderRadius: 12,
                  border: `1px solid ${BORDER}`,
                  background: "#fff",
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 900, color: TEXT_SUB }}>{item.label}</span>
                <select
                  value={item.value}
                  onChange={event => item.onChange(event.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontSize: 12,
                    fontWeight: 900,
                    color: TEXT_MAIN,
                    cursor: "pointer",
                  }}
                >
                  {item.options.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <div
            className="flex items-center gap-[10px]"
            style={{ padding: "12px 22px", borderBottom: `1px solid ${BORDER_WEAK}`, flexWrap: "wrap" }}
          >
            {[
              ["已分配", "#94a3b8"],
              ["已提交", BLUE],
              ["需求方通过", GREEN],
              ["需求方退回", RED],
              ["待审核", ORANGE],
              ["需修改", "#db2777"],
              ["已通过", GREEN],
            ].map(([label, color]) => (
              <div key={label} className="flex items-center gap-[6px]">
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: TEXT_SUB }}>{label}</span>
              </div>
            ))}
          </div>

          <div style={{ flex: 1, overflow: "auto", background: SURFACE }}>
            {!hasProjects || !hasPackages || filteredRows.length === 0 ? (
              <div style={{ padding: "80px 24px", textAlign: "center", color: TEXT_SUB, fontSize: 14, fontWeight: 800 }}>
                {emptyMessage}
              </div>
            ) : (
              <div style={{ minWidth: 560 + timelineWidth }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `560px ${timelineWidth}px`,
                    borderBottom: `1px solid ${BORDER_WEAK}`,
                    position: "sticky",
                    top: 0,
                    zIndex: 3,
                    background: "#fff",
                  }}
                >
                  <div
                    style={{
                      position: "sticky",
                      left: 0,
                      zIndex: 4,
                      background: "#fff",
                      borderRight: `1px solid ${BORDER_WEAK}`,
                      padding: "14px 16px",
                      fontSize: 12,
                      fontWeight: 900,
                      color: TEXT_SUB,
                    }}
                  >
                    项目 / 交付任务 / 执行成员 / 状态
                  </div>
                  <div style={{ position: "relative", height: 58, borderLeft: `1px solid ${BORDER_WEAK}` }}>
                    {axisLabels.map(label => (
                      <div
                        key={`${label.ms}-${label.text}`}
                        style={{
                          position: "absolute",
                          left: getOffset(new Date(label.ms).toISOString()) - 20,
                          top: 18,
                          width: 40,
                          textAlign: "center",
                          fontSize: 11,
                          fontWeight: 900,
                          color: TEXT_SUB,
                        }}
                      >
                        {label.text}
                      </div>
                    ))}
                  </div>
                </div>

                {filteredRows.map(row => {
                  const statusStyle = getStatusStyle(row.packageStatus);
                  const riskStyle = getRiskStyle(row.riskTag);
                  const user = USERS.find(item => item.id === row.assigneeId) || null;
                  return (
                    <div
                      key={row.typeTaskPackageId}
                      style={{
                        display: "grid",
                        gridTemplateColumns: `560px ${timelineWidth}px`,
                        minHeight: 108,
                        borderBottom: `1px solid ${BORDER_WEAK}`,
                        background: "#fff",
                      }}
                    >
                      <div
                        style={{
                          position: "sticky",
                          left: 0,
                          zIndex: 2,
                          background: "#fff",
                          borderRight: `1px solid ${BORDER_WEAK}`,
                          padding: "14px 16px",
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1.45fr 0.7fr 0.8fr 0.8fr",
                            gap: 12,
                            alignItems: "start",
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 900, color: TEXT_MAIN }}>{row.projectName}</div>
                            <div style={{ marginTop: 4, fontSize: 12, fontWeight: 800, color: TEXT_SUB }}>
                              {row.projectCode} · {row.brandTeam || "-"}
                            </div>
                            <div style={{ marginTop: 10, fontSize: 13, fontWeight: 900, color: TEXT_MAIN }}>
                              {row.deliverableType} × {row.itemCount}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: 11, fontWeight: 900, color: "#94a3b8" }}>执行成员</div>
                            <div className="flex items-center gap-[8px]" style={{ marginTop: 8 }}>
                              <div
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: "50%",
                                  background: user?.avatar || "rgba(37,99,235,0.10)",
                                  color: "#fff",
                                  fontSize: 12,
                                  fontWeight: 900,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                {getInitial(row.assigneeName || "未")}
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 800, color: TEXT_MAIN }}>
                                {row.assigneeName || "未分配"}
                              </span>
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: 11, fontWeight: 900, color: "#94a3b8" }}>承诺交付</div>
                            <div style={{ marginTop: 8, fontSize: 12, fontWeight: 800, color: TEXT_MAIN }}>
                              {row.promisedAt ? ymdSlash(row.promisedAt) : "未设置承诺时间"}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: 11, fontWeight: 900, color: "#94a3b8" }}>状态 / 风险</div>
                            <div className="flex items-center gap-[8px]" style={{ marginTop: 8, flexWrap: "wrap" }}>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  height: 24,
                                  padding: "0 10px",
                                  borderRadius: 999,
                                  background: statusStyle.bg,
                                  color: statusStyle.color,
                                  fontSize: 12,
                                  fontWeight: 900,
                                }}
                              >
                                {row.packageStatus}
                              </span>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  height: 24,
                                  padding: "0 10px",
                                  borderRadius: 999,
                                  background: riskStyle.bg,
                                  color: riskStyle.color,
                                  fontSize: 12,
                                  fontWeight: 900,
                                }}
                              >
                                {row.riskTag}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ position: "relative", overflow: "hidden" }}>
                        <div
                          style={{
                            position: "absolute",
                            left: 20,
                            right: 20,
                            top: 54,
                            height: 2,
                            background: "linear-gradient(90deg, rgba(148,163,184,0.35) 0%, rgba(148,163,184,0.18) 100%)",
                          }}
                        />

                        {axisLabels.map(label => (
                          <div
                            key={`${row.typeTaskPackageId}-${label.ms}`}
                            style={{
                              position: "absolute",
                              left: getOffset(new Date(label.ms).toISOString()),
                              top: 0,
                              bottom: 0,
                              width: 1,
                              background: "rgba(148,163,184,0.10)",
                            }}
                          />
                        ))}

                        {row.timelineNodes.map((node, index) => {
                          const style = getNodeStyle(node.type);
                          const above = index % 2 === 0;
                          const offset = getOffset(node.date);
                          return (
                            <div
                              key={`${row.typeTaskPackageId}-${node.type}-${node.label}-${index}`}
                              title={[node.label, node.date ? ymdHmSlash(node.date) : "", node.note || ""].filter(Boolean).join(" · ")}
                              style={{
                                position: "absolute",
                                left: offset,
                                top: 0,
                                width: 108,
                                transform: "translateX(-50%)",
                              }}
                            >
                              <div
                                style={{
                                  position: "absolute",
                                  top: 50,
                                  left: "50%",
                                  transform: "translate(-50%, -50%)",
                                  width: 10,
                                  height: 10,
                                  borderRadius: "50%",
                                  background: style.bg,
                                  boxShadow: `0 0 0 4px ${style.bg}22`,
                                  zIndex: 2,
                                }}
                              />
                              <div
                                style={{
                                  position: "absolute",
                                  top: above ? 10 : 62,
                                  left: "50%",
                                  transform: "translateX(-50%)",
                                  width: 108,
                                  padding: "6px 8px",
                                  borderRadius: 12,
                                  background: "#fff",
                                  border: `1px solid ${BORDER}`,
                                  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
                                  textAlign: "center",
                                }}
                              >
                                <div style={{ fontSize: 11, fontWeight: 900, color: style.color, lineHeight: 1.4 }}>
                                  {node.label}
                                </div>
                                {node.date ? (
                                  <div style={{ marginTop: 4, fontSize: 10, fontWeight: 800, color: TEXT_SUB, lineHeight: 1.4 }}>
                                    {ymdSlash(node.date)}
                                  </div>
                                ) : null}
                                {node.note ? (
                                  <div
                                    style={{
                                      marginTop: 4,
                                      fontSize: 10,
                                      fontWeight: 700,
                                      color: TEXT_SUB,
                                      lineHeight: 1.4,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {node.note}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div
            className="flex items-center justify-end"
            style={{ padding: "14px 22px", borderTop: `1px solid ${BORDER_WEAK}` }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                height: 38,
                padding: "0 14px",
                borderRadius: 12,
                border: `1px solid ${BORDER}`,
                background: "#fff",
                color: TEXT_MAIN,
                fontSize: 12,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
