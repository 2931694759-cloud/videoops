import { BLUE, GREEN, RED } from "./reportUi";

export type ReportMode = "month" | "quarter";

export type KpiCardData = {
  key: string;
  iconBg: string;
  iconColor: string;
  icon: "dot" | "check" | "yen" | "progress";
  title: string;
  value: string;
  trend: string;
  note: string;
};

export type TrendSeriesPoint = { w: string; current: number; prev: number };

export type DonutSlice = { name: string; percent: number; color: string };

export type BarListRow = { name: string; percent: number; color: string };

export type WorkHoursCard = {
  name: string;
  hours: number;
  share: number;
  color: string;
  trendBars: number[];
};

export type CostSavingRow = {
  category: "视频" | "设计" | "网页" | "品牌策略" | "线下物料" | "文案" | "其他";
  projectName: string;
  internalCost: string;
  agencyQuote: string;
  netSaving: string;
  status: "制作中" | "待验收" | "已完成" | "已取消";
};

export type ReportKpi = {
  key: string;
  title: string;
  value: string;
  description: string;
  change: string;
  footnote: string;
  accentColor: string;
  iconBg: string;
  icon: "hours" | "saving" | "compliance" | "done";
  progress?: number;
  badge?: string;
};

export type ReportData = {
  periods: string[];
  kpis: ReportKpi[];
  totalHoursTrend: TrendSeriesPoint[];
  donut: { activeCount: number; slices: DonutSlice[] };
  workHours: WorkHoursCard[];
  savingDetails: CostSavingRow[];
};

export const REPORT_DATA: Record<ReportMode, ReportData> = {
  month: {
    periods: ["2026年5月", "2026年4月", "2026年3月", "2026年2月"],
    kpis: [
      {
        key: "hours",
        title: "总记录工时",
        value: "4,280h",
        description: "本期记录的总工时",
        change: "+12%",
        footnote: "较上期增长 12%",
        accentColor: RED,
        iconBg: "rgba(239,68,68,0.10)",
        icon: "hours",
      },
      {
        key: "saving",
        title: "内部节省金额",
        value: "¥128,400",
        description: "对比外部代理商报价",
        change: "+12%",
        footnote: "口径见数据说明",
        accentColor: BLUE,
        iconBg: "rgba(37,99,235,0.12)",
        icon: "saving",
      },
      {
        key: "compliance",
        title: "交付通过率",
        value: "98.4%",
        description: "按交付任务的需求方审核结果统计",
        change: "-2%",
        footnote: "口径见数据说明",
        accentColor: "#c79a00",
        iconBg: "rgba(245,158,11,0.16)",
        icon: "compliance",
        progress: 98.4,
      },
      {
        key: "done",
        title: "已完成需求",
        value: "842",
        description: "本期已完成需求数量",
        change: "+2%",
        footnote: "口径见数据说明",
        accentColor: GREEN,
        iconBg: "rgba(22,163,74,0.12)",
        icon: "done",
      },
    ],
    totalHoursTrend: [
      { w: "W1", current: 330, prev: 260 },
      { w: "W2", current: 410, prev: 320 },
      { w: "W3", current: 460, prev: 360 },
      { w: "W4", current: 580, prev: 430 },
      { w: "W5", current: 610, prev: 470 },
      { w: "W6", current: 760, prev: 560 },
      { w: "W7", current: 860, prev: 660 },
      { w: "W8", current: 980, prev: 810 },
    ],
    donut: {
      activeCount: 6,
      slices: [
        { name: "马爹利", percent: 34, color: RED },
        { name: "绝对伏特加", percent: 22, color: "#c79a00" },
        { name: "百龄坛", percent: 18, color: BLUE },
        { name: "皇家礼炮", percent: 12, color: GREEN },
        { name: "其他外部品牌", percent: 14, color: "#d1d5db" },
      ],
    },
    workHours: [
      { name: "动效 / 视频", hours: 1926, share: 45, color: RED, trendBars: [8, 14, 20, 12] },
      { name: "平面设计", hours: 941, share: 22, color: "#c79a00", trendBars: [10, 16, 12, 18] },
      { name: "3D / 社媒", hours: 642, share: 15, color: BLUE, trendBars: [6, 10, 18, 24] },
      { name: "品牌策略", hours: 428, share: 10, color: "#6b7280", trendBars: [8, 14, 9, 16] },
      { name: "本地化延展", hours: 342, share: 8, color: "#fb7185", trendBars: [10, 20, 8, 16] },
    ],
    savingDetails: [
      { category: "视频", projectName: "产品上市短片", internalCost: "¥4,200", agencyQuote: "¥18,500", netSaving: "+¥14,300", status: "已完成" },
      { category: "设计", projectName: "投递人简报 2024", internalCost: "¥1,850", agencyQuote: "¥5,000", netSaving: "+¥3,150", status: "已完成" },
      { category: "网页", projectName: "微站改版", internalCost: "¥8,900", agencyQuote: "¥22,000", netSaving: "+¥13,100", status: "制作中" },
      { category: "品牌策略", projectName: "新品传播策略包", internalCost: "¥6,800", agencyQuote: "¥15,600", netSaving: "+¥8,800", status: "待验收" },
    ],
  },
  quarter: {
    periods: ["2026年Q2", "2026年Q1", "2025年Q4", "2025年Q3"],
    kpis: [
      {
        key: "hours",
        title: "总记录工时",
        value: "12,640h",
        description: "本期记录的总工时",
        change: "+18%",
        footnote: "较上期增长 18%",
        accentColor: RED,
        iconBg: "rgba(239,68,68,0.10)",
        icon: "hours",
      },
      {
        key: "saving",
        title: "内部节省金额",
        value: "¥386,900",
        description: "对比外部代理商报价",
        change: "+12%",
        footnote: "口径见数据说明",
        accentColor: BLUE,
        iconBg: "rgba(37,99,235,0.12)",
        icon: "saving",
      },
      {
        key: "compliance",
        title: "交付通过率",
        value: "97.8%",
        description: "按交付任务的需求方审核结果统计",
        change: "-1%",
        footnote: "口径见数据说明",
        accentColor: "#c79a00",
        iconBg: "rgba(245,158,11,0.16)",
        icon: "compliance",
        progress: 97.8,
      },
      {
        key: "done",
        title: "已完成需求",
        value: "2,184",
        description: "本期已完成需求数量",
        change: "+2%",
        footnote: "口径见数据说明",
        accentColor: GREEN,
        iconBg: "rgba(22,163,74,0.12)",
        icon: "done",
      },
    ],
    totalHoursTrend: [
      { w: "W1", current: 1120, prev: 980 },
      { w: "W2", current: 1260, prev: 1080 },
      { w: "W3", current: 1380, prev: 1160 },
      { w: "W4", current: 1540, prev: 1280 },
      { w: "W5", current: 1660, prev: 1370 },
      { w: "W6", current: 1820, prev: 1490 },
      { w: "W7", current: 1960, prev: 1640 },
      { w: "W8", current: 2140, prev: 1780 },
    ],
    donut: {
      activeCount: 6,
      slices: [
        { name: "马爹利", percent: 31, color: RED },
        { name: "绝对伏特加", percent: 24, color: "#c79a00" },
        { name: "百龄坛", percent: 17, color: BLUE },
        { name: "皇家礼炮", percent: 14, color: GREEN },
        { name: "其他外部品牌", percent: 14, color: "#d1d5db" },
      ],
    },
    workHours: [
      { name: "动效 / 视频", hours: 5680, share: 45, color: RED, trendBars: [12, 18, 26, 20] },
      { name: "平面设计", hours: 2730, share: 22, color: "#c79a00", trendBars: [10, 20, 14, 22] },
      { name: "3D / 社媒", hours: 1920, share: 15, color: BLUE, trendBars: [8, 14, 24, 28] },
      { name: "品牌策略", hours: 1310, share: 10, color: "#6b7280", trendBars: [10, 16, 12, 18] },
      { name: "本地化延展", hours: 1000, share: 8, color: "#fb7185", trendBars: [12, 24, 10, 18] },
    ],
    savingDetails: [
      { category: "视频", projectName: "新品上市主视频", internalCost: "¥18,000", agencyQuote: "¥68,000", netSaving: "+¥50,000", status: "已完成" },
      { category: "设计", projectName: "投递人简报 2024", internalCost: "¥9,600", agencyQuote: "¥26,000", netSaving: "+¥16,400", status: "已完成" },
      { category: "网页", projectName: "微站改版", internalCost: "¥22,500", agencyQuote: "¥58,000", netSaving: "+¥35,500", status: "制作中" },
      { category: "品牌策略", projectName: "新品传播策略包", internalCost: "¥12,400", agencyQuote: "¥31,800", netSaving: "+¥19,400", status: "待验收" },
    ],
  },
};
