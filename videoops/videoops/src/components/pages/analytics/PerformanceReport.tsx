"use client";

import { useMemo, useState } from "react";
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Check, ChevronDown, CircleDollarSign, Clock3, Download, ShieldCheck } from "lucide-react";
import { REPORT_DATA, type ReportMode } from "./reportData";
import { buildReportData } from "./reportSelectors";
import { Card, CardTitle, Segmented, Toast } from "./ReportPrimitives";
import { BLUE, BORDER, BORDER_WEAK, CARD_SHADOW, GREEN, ORANGE, PAGE_BG, RED, TEXT_MAIN, TEXT_SUB } from "./reportUi";
import { useStore } from "@/lib/store";

const tooltipStyle = { background: "#ffffff", border: "1px solid #e8e8ec", borderRadius: 12, fontSize: 12, boxShadow: "0 12px 40px rgba(15,23,42,0.10)" };

function ExportButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="transition-all"
      style={{ height: 36, padding: "0 14px", borderRadius: 999, background: "#facc15", border: "1px solid rgba(202,138,4,0.12)", color: "#111827", fontSize: 12, fontWeight: 900, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 12px 24px rgba(250, 204, 21, 0.25)" }}
      onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-1px)")}
      onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
    >
      <Download size={14} />
      导出 PDF
    </button>
  );
}

function DocButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="transition-all"
      style={{ height: 36, padding: "0 14px", borderRadius: 999, background: "#fff", border: `1px solid ${BORDER}`, color: TEXT_MAIN, fontSize: 12, fontWeight: 900, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 8px 20px rgba(15,23,42,0.04)" }}
      onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-1px)")}
      onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
    >
      数据说明
    </button>
  );
}

function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.55)" }} onMouseDown={onClose}>
      <div className="w-full" style={{ maxWidth: 860, maxHeight: "calc(100vh - 64px)", padding: "0 18px" }} onMouseDown={e => e.stopPropagation()}>
        <div style={{ borderRadius: 24, background: "#fff", border: `1px solid ${BORDER_WEAK}`, boxShadow: "0 22px 60px rgba(15, 23, 42, 0.18)", overflow: "hidden" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function SelectControl({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ height: 36, minWidth: 124, borderRadius: 999, border: `1px solid ${BORDER}`, background: "#fff", color: TEXT_MAIN, fontSize: 12, fontWeight: 900, padding: "0 34px 0 14px", outline: "none", appearance: "none", cursor: "pointer", boxShadow: "0 8px 20px rgba(15,23,42,0.04)" }}
      >
        {options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown size={14} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: TEXT_SUB, pointerEvents: "none" }} />
    </div>
  );
}

function KpiIcon({ kind, color }: { kind: "hours" | "saving" | "compliance" | "done"; color: string }) {
  if (kind === "saving") return <CircleDollarSign size={16} color={color} />;
  if (kind === "compliance") return <ShieldCheck size={16} color={color} />;
  if (kind === "done") return <Check size={16} color={color} />;
  return <Clock3 size={16} color={color} />;
}

function KpiReportCard({
  data,
}: {
  data: (typeof REPORT_DATA)[ReportMode]["kpis"][number];
}) {
  return (
    <Card padding="16px 18px" style={{ minHeight: 140 }}>
      <div className="flex items-start justify-between gap-[12px]" style={{ marginBottom: 16 }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: data.iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <KpiIcon kind={data.icon} color={data.accentColor} />
        </div>
        <div
          style={{
            height: 22,
            padding: "0 10px",
            borderRadius: 999,
            background: data.change.startsWith("-") ? "rgba(239,68,68,0.10)" : "rgba(37,99,235,0.10)",
            color: data.change.startsWith("-") ? RED : BLUE,
            fontSize: 12,
            fontWeight: 900,
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          {data.change}
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 900, color: TEXT_SUB }}>{data.title}</div>
      <div style={{ marginTop: 10, fontSize: 38, fontWeight: 900, lineHeight: 1, color: TEXT_MAIN, letterSpacing: "-0.6px" }}>{data.value}</div>

      {typeof data.progress === "number" ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ width: "100%", height: 6, borderRadius: 999, background: "rgba(199,154,0,0.18)", overflow: "hidden" }}>
            <div style={{ width: `${Math.max(0, Math.min(100, data.progress))}%`, height: "100%", borderRadius: 999, background: "#c79a00" }} />
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function TrendCard({ data }: { data: (typeof REPORT_DATA)[ReportMode]["totalHoursTrend"] }) {
  return (
    <Card padding="16px 16px">
      <CardTitle
        title="总工时波动"
        subtitle="周度资源投入趋势。"
        right={
          <div className="flex items-center gap-[12px]" style={{ marginTop: 2 }}>
            <div className="flex items-center gap-[6px]" style={{ fontSize: 12, fontWeight: 900, color: TEXT_SUB }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: RED }} />
              当前
            </div>
            <div className="flex items-center gap-[6px]" style={{ fontSize: 12, fontWeight: 900, color: TEXT_SUB }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: "#9dc2ff" }} />
              上期
            </div>
          </div>
        }
      />
      <div style={{ height: 260 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ left: 6, right: 12, top: 16, bottom: 0 }}>
            <XAxis dataKey="w" tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 800 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`${v}h`, "工时"]} />
            <Line type="monotone" dataKey="prev" stroke="#9dc2ff" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="current" stroke={RED} strokeWidth={3} dot={{ r: 3, strokeWidth: 3, stroke: RED, fill: "#fff" }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function DonutDistributionCard({ data }: { data: (typeof REPORT_DATA)[ReportMode]["donut"] }) {
  return (
    <Card padding="16px 16px">
      <CardTitle title="品牌 / 团队分布" subtitle="按品牌 / 团队统计项目投入分布。" />
      <div className="grid grid-cols-2 gap-[10px]" style={{ alignItems: "center" }}>
        <div style={{ height: 240, position: "relative" }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data.slices} dataKey="percent" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={84} paddingAngle={2} stroke="none">
                {data.slices.map(slice => (
                  <Cell key={slice.name} fill={slice.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`${String(v)}%`, "占比"]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -54%)", textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: TEXT_MAIN, lineHeight: 1 }}>{data.activeCount}</div>
            <div style={{ marginTop: 8, fontSize: 12, fontWeight: 900, color: TEXT_MAIN, lineHeight: 1.4 }}>活跃品牌</div>
          </div>
        </div>
        <div className="flex flex-col gap-[12px]">
          {data.slices.map(slice => (
            <div key={slice.name} className="flex items-center justify-between gap-[10px]">
              <div className="flex items-center gap-[8px]" style={{ minWidth: 0 }}>
                <span style={{ width: 10, height: 10, borderRadius: 999, background: slice.color }} />
                <span style={{ fontSize: 12, fontWeight: 900, color: TEXT_MAIN }} className="truncate">
                  {slice.name}
                </span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 900, color: TEXT_MAIN }}>{slice.percent}%</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function WorkHoursSection({
  mode,
  onModeChange,
  cards,
}: {
  mode: "按工时" | "按占比";
  onModeChange: (value: "按工时" | "按占比") => void;
  cards: (typeof REPORT_DATA)[ReportMode]["workHours"];
}) {
  return (
    <div
      style={{
        borderRadius: 24,
        background: "linear-gradient(180deg, rgba(122,92,255,0.08) 0%, rgba(122,92,255,0.05) 100%)",
        padding: 16,
        border: `1px solid rgba(122,92,255,0.08)`,
        boxShadow: CARD_SHADOW,
      }}
    >
      <CardTitle
        title="工作类型工时消耗"
        subtitle="按创意专业维度统计总工时。"
        right={
          <Segmented
            value={mode}
            options={[
              { key: "按工时", label: "按工时" },
              { key: "按占比", label: "按占比" },
            ]}
            onChange={key => onModeChange(key as "按工时" | "按占比")}
          />
        }
      />
      <div className="grid" style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 12 }}>
        {cards.map(card => (
          <div key={card.name} style={{ borderRadius: 16, background: "#fff", padding: "16px 14px", border: `1px solid ${BORDER_WEAK}` }}>
            <div style={{ fontSize: 34, fontWeight: 900, color: card.color, lineHeight: 1 }}>
              {mode === "按工时" ? `${card.hours.toLocaleString()}h` : `${card.share}%`}
            </div>
            <div style={{ marginTop: 10, fontSize: 12, fontWeight: 900, color: TEXT_MAIN }}>{card.name}</div>
            <div className="flex items-end gap-[4px]" style={{ marginTop: 16, height: 24 }}>
              {card.trendBars.map((bar, idx) => (
                <div key={idx} style={{ width: 4, height: bar, borderRadius: 4, background: card.color, opacity: 0.75 + idx * 0.06 }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function categoryTextStyle(category: "视频" | "设计" | "网页" | "品牌策略" | "线下物料" | "文案" | "其他") {
  if (category === "视频") return { color: RED };
  if (category === "设计") return { color: "#c79a00" };
  if (category === "网页") return { color: BLUE };
  if (category === "品牌策略") return { color: GREEN };
  return { color: TEXT_SUB };
}

function statusPillStyle(status: "制作中" | "待验收" | "已完成" | "已取消") {
  if (status === "制作中") return { bg: "rgba(37,99,235,0.10)", color: BLUE };
  if (status === "待验收") return { bg: "rgba(245,158,11,0.16)", color: ORANGE };
  if (status === "已完成") return { bg: "rgba(22,163,74,0.12)", color: GREEN };
  return { bg: "rgba(107,114,128,0.12)", color: TEXT_SUB };
}

export default function PerformanceReport() {
  const { tasks, questionnaires, submissions, reviews, projects, typeTaskPackages, signoffRecords } = useStore();
  const [mode, setMode] = useState<ReportMode>("month");
  const [selectedPeriod, setSelectedPeriod] = useState(REPORT_DATA.month.periods[0]);
  const [toast, setToast] = useState("");
  const [workHoursMode, setWorkHoursMode] = useState<"按工时" | "按占比">("按工时");
  const [showDoc, setShowDoc] = useState(false);

  const base = REPORT_DATA[mode];

  const data = useMemo(() => {
    return buildReportData({
      workflowData: { tasks, questionnaires, submissions, reviews, projects, typeTaskPackages, signoffRecords },
      mode,
      selectedPeriodLabel: selectedPeriod,
      fallback: base,
    });
  }, [base, mode, projects, questionnaires, reviews, selectedPeriod, signoffRecords, submissions, tasks, typeTaskPackages]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const setReportMode = (next: ReportMode) => {
    if (next === mode) return;
    setMode(next);
    setSelectedPeriod(REPORT_DATA[next].periods[0]);
    showToast(next === "month" ? "已切换到月度报表" : "已切换到季度报表");
  };

  const exportPdf = () => {
    showToast("正在导出 PDF 报表");
  };

  const savingRows = useMemo(() => data.savingDetails, [data.savingDetails]);

  return (
    <div className="flex-1 flex flex-col" style={{ padding: "24px 40px 34px", background: PAGE_BG }}>
      <div className="flex items-start justify-between gap-[16px]" style={{ marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 32, fontWeight: 900, color: TEXT_MAIN, letterSpacing: "-0.6px" }}>数据报表</div>
          <div style={{ marginTop: 8, fontSize: 13, color: TEXT_SUB, fontWeight: 800, lineHeight: 1.8, maxWidth: 760 }}>
            追踪项目与交付任务的完成情况，并保持现有报表结构对 V2 主流程的最小兼容。
          </div>
        </div>
        <div className="flex items-center gap-[10px]" style={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Segmented
            value={mode}
            options={[
              { key: "month", label: "月度报表" },
              { key: "quarter", label: "季度报表" },
            ]}
            onChange={key => setReportMode(key as ReportMode)}
          />
          <SelectControl value={selectedPeriod} options={data.periods} onChange={setSelectedPeriod} />
          <DocButton onClick={() => setShowDoc(true)} />
          <ExportButton onClick={exportPdf} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-[14px]" style={{ marginBottom: 18 }}>
        {data.kpis.map(item => (
          <KpiReportCard key={item.key} data={item} />
        ))}
      </div>

      <div className="grid" style={{ gridTemplateColumns: "minmax(0, 1.95fr) minmax(320px, 1fr)", gap: 14, marginBottom: 18 }}>
        <TrendCard data={data.totalHoursTrend} />
        <DonutDistributionCard data={data.donut} />
      </div>

      <div style={{ marginBottom: 18 }}>
        <WorkHoursSection mode={workHoursMode} onModeChange={setWorkHoursMode} cards={data.workHours} />
      </div>

      <Card padding="16px 16px">
        <CardTitle title="节省明细分析" subtitle="按项目对比内部执行成本与外部代理商报价。" />
        <div style={{ borderRadius: 16, border: `1px solid ${BORDER_WEAK}`, overflow: "hidden", background: "#fff" }}>
          <div style={{ display: "grid", gridTemplateColumns: "120px 1.7fr 1fr 1fr 1fr 0.9fr", background: "#f5f6fb", padding: "11px 14px", fontSize: 12, fontWeight: 900, color: "#94a3b8" }}>
            <div>类别</div>
            <div>项目名称</div>
            <div>内部成本</div>
            <div>代理商报价</div>
            <div>净节省</div>
            <div>状态</div>
          </div>

          {savingRows.map((row, idx) => {
            const status = statusPillStyle(row.status);
            const category = categoryTextStyle(row.category);
            return (
              <div key={`${row.projectName}-${idx}`} style={{ display: "grid", gridTemplateColumns: "120px 1.7fr 1fr 1fr 1fr 0.9fr", padding: "14px 14px", borderTop: idx === 0 ? "none" : `1px solid ${BORDER_WEAK}`, alignItems: "center", fontSize: 12, fontWeight: 900, color: TEXT_MAIN }}>
                <div style={{ color: category.color }}>{row.category}</div>
                <div>{row.projectName}</div>
                <div style={{ color: TEXT_SUB }}>{row.internalCost}</div>
                <div style={{ color: TEXT_SUB }}>{row.agencyQuote}</div>
                <div style={{ color: BLUE }}>{row.netSaving}</div>
                <div>
                  <span style={{ height: 22, padding: "0 10px", borderRadius: 999, background: status.bg, color: status.color, fontSize: 12, fontWeight: 900, display: "inline-flex", alignItems: "center" }}>
                    {row.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {showDoc && (
        <ModalShell onClose={() => setShowDoc(false)}>
          <div className="flex items-start justify-between" style={{ padding: "18px 18px", borderBottom: `1px solid ${BORDER_WEAK}`, background: "#fff" }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: TEXT_MAIN }}>数据说明</div>
              <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: TEXT_SUB, lineHeight: 1.7 }}>
                本页报表的数据来源与口径说明如下。
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowDoc(false)}
              style={{ width: 38, height: 38, borderRadius: 14, border: `1px solid ${BORDER}`, background: "#fff", color: "#6b7280", fontSize: 18, cursor: "pointer" }}
            >
              ×
            </button>
          </div>
          <div style={{ padding: 18, maxHeight: "calc(100vh - 220px)", overflow: "auto" }}>
            <div style={{ borderRadius: 16, border: `1px solid ${BORDER_WEAK}`, background: PAGE_BG, padding: 14, fontSize: 12, fontWeight: 800, color: TEXT_SUB, lineHeight: 1.8, marginBottom: 12 }}>
              <div>提示：顶部 KPI 卡片右上角标签表示当前周期较上月的变化值（环比）。</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 900, color: TEXT_MAIN, marginBottom: 10 }}>动态指标</div>
            <div style={{ borderRadius: 16, border: `1px solid ${BORDER_WEAK}`, background: PAGE_BG, padding: 14, fontSize: 12, fontWeight: 800, color: TEXT_SUB, lineHeight: 1.8 }}>
              <div>1) 已完成需求：按项目 completedAt 落在周期内统计（项目状态 = 已完成）。</div>
              <div>2) 交付通过率：需求方通过 /（需求方通过 + 需修改），用于衡量交付任务审核结果；优先按 SignoffRecord.reviewedAt 落在周期内统计。</div>
              <div>3) 品牌 / 团队分布：按项目品牌 / 团队字段统计。周期过滤优先 task.createdAt / questionnaire.createdAt / requestDate；如缺失可兜底 acceptedAt / completedAt；排除已取消。</div>
              <div>4) 工作类型分布：优先按交付任务的交付物类型做兼容统计；若缺少 V2 数据则回退到旧字段。</div>
              <div>5) 节省明细：保留现有结构；项目名称、类别和状态优先读取 V2 项目数据，成本字段按当前可用字段兜底展示。</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 900, color: TEXT_MAIN, margin: "14px 0 10px" }}>mock 指标</div>
            <div style={{ borderRadius: 16, border: `1px solid ${BORDER_WEAK}`, background: PAGE_BG, padding: 14, fontSize: 12, fontWeight: 800, color: TEXT_SUB, lineHeight: 1.8 }}>
              <div>1) 总记录工时：缺少 actualWorkingHours，暂使用模拟数据。</div>
              <div>2) 内部节省金额：缺少 internalCost / marketReferenceCost 稳定口径，暂使用模拟数据。</div>
              <div>3) 总工时波动折线图：缺少按周期沉淀的工时数据，暂使用模拟趋势。</div>
              <div>4) 工作类型工时消耗：按工时暂使用模拟数据；按占比可优先按项目量/交付物量统计。</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 900, color: TEXT_MAIN, margin: "14px 0 10px" }}>V2 审核口径</div>
            <div style={{ borderRadius: 16, border: `1px solid ${BORDER_WEAK}`, background: PAGE_BG, padding: 14, fontSize: 12, fontWeight: 800, color: TEXT_SUB, lineHeight: 1.8 }}>
              <div>1) 执行成员提交交付任务后，系统生成 Submission 与 Sign-off Link，对应交付任务进入待需求方审核。</div>
              <div>2) 需求方通过或退回后，系统写入 SignoffRecord；退回结果会让交付任务进入需修改。</div>
              <div>3) 当项目下所有交付任务均已通过时，项目自动进入已完成；项目取消时状态为已取消，未完成交付任务进入已结束。</div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-[10px]" style={{ padding: "14px 18px", borderTop: `1px solid ${BORDER_WEAK}`, background: "#fff" }}>
            <button type="button" onClick={() => setShowDoc(false)} style={{ height: 36, padding: "0 16px", borderRadius: 12, background: RED, border: "none", color: "#fff", fontSize: 12, fontWeight: 900 }}>
              我知道了
            </button>
          </div>
        </ModalShell>
      )}

      {toast && <Toast text={toast} />}
    </div>
  );
}
