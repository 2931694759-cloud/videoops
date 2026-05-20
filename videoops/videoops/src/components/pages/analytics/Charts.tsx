"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { BORDER_WEAK, SLATE, TEXT_MAIN, TEXT_SUB } from "./reportUi";
import { Card } from "./ReportPrimitives";
import { CardTitle } from "./ReportPrimitives";
import type { BarListRow, DonutSlice, TrendSeriesPoint } from "./reportData";

const tooltipStyle = { background: "#ffffff", border: "1px solid #e8e8ec", borderRadius: 12, fontSize: 12, boxShadow: "0 12px 40px rgba(15,23,42,0.10)" };

export function HoursTrendCard({ data }: { data: TrendSeriesPoint[] }) {
  return (
    <Card padding="16px 16px">
      <CardTitle
        title="总工时趋势"
        subtitle="按周统计内部资源投入"
        right={
          <div className="flex items-center gap-[12px]" style={{ marginTop: 2 }}>
            <div className="flex items-center gap-[6px]" style={{ fontSize: 12, fontWeight: 900, color: TEXT_SUB }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: "#ef4444" }} />
              当前周期
            </div>
            <div className="flex items-center gap-[6px]" style={{ fontSize: 12, fontWeight: 900, color: TEXT_SUB }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: "#93c5fd" }} />
              上一周期
            </div>
          </div>
        }
      />
      <div style={{ height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ left: 8, right: 12, top: 10, bottom: 0 }}>
            <XAxis dataKey="w" tick={{ fill: SLATE, fontSize: 12, fontWeight: 800 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [String(v), "工时"]} />
            <Line type="monotone" dataKey="prev" stroke="#93c5fd" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="current" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 3, stroke: "#ef4444", fill: "#fff" }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function DonutCard({ activeCount, slices }: { activeCount: number; slices: DonutSlice[] }) {
  return (
    <Card padding="16px 16px">
      <CardTitle title="品牌 / 团队分布" subtitle="资源服务对象占比" />
      <div className="grid grid-cols-2 gap-[10px]" style={{ alignItems: "center" }}>
        <div style={{ height: 260, position: "relative" }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={slices} dataKey="percent" nameKey="name" cx="50%" cy="50%" innerRadius={64} outerRadius={92} paddingAngle={2} stroke="none">
                {slices.map(s => <Cell key={s.name} fill={s.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`${String(v)}%`, "占比"]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -56%)", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: TEXT_MAIN }}>{activeCount}</div>
            <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: TEXT_SUB }}>活跃品牌/团队</div>
          </div>
        </div>

        <div className="flex flex-col gap-[10px]">
          {slices.map(s => (
            <div key={s.name} className="flex items-center justify-between" style={{ gap: 10 }}>
              <div className="flex items-center gap-[8px]" style={{ minWidth: 0 }}>
                <span style={{ width: 10, height: 10, borderRadius: 999, background: s.color }} />
                <span style={{ fontSize: 12, fontWeight: 900, color: TEXT_MAIN }} className="truncate">{s.name}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 900, color: TEXT_SUB }}>{s.percent}%</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function BarListCard({ title, subtitle, rows }: { title: string; subtitle: string; rows: BarListRow[] }) {
  return (
    <Card padding="16px 16px">
      <CardTitle title={title} subtitle={subtitle} />
      <div className="flex flex-col gap-[12px]">
        {rows.map(r => (
          <div key={r.name} className="flex items-center" style={{ gap: 12 }}>
            <div style={{ width: 92, fontSize: 12, fontWeight: 900, color: TEXT_MAIN }}>{r.name}</div>
            <div style={{ flex: 1, height: 8, borderRadius: 999, background: "#eef2f7", overflow: "hidden" }}>
              <div style={{ width: `${Math.max(0, Math.min(100, r.percent))}%`, height: "100%", background: r.color, borderRadius: 999 }} />
            </div>
            <div style={{ width: 46, textAlign: "right", fontSize: 12, fontWeight: 900, color: TEXT_SUB }}>{r.percent}%</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function WorkHoursCardGroup({
  modeLabel,
  onToggleMode,
  cards,
}: {
  modeLabel: "按工时" | "按占比";
  onToggleMode: (v: "按工时" | "按占比") => void;
  cards: Array<{ name: string; valueLabel: string; color: string }>;
}) {
  return (
    <Card padding="16px 16px" style={{ background: "#fff" }}>
      <CardTitle
        title="工作类型工时消耗"
        subtitle="按工作类型统计内部投入工时：视频、平面设计、POSM、文案、3D 等"
        right={
          <div style={{ padding: 3, borderRadius: 999, border: `1px solid ${BORDER_WEAK}`, background: "#fff", display: "inline-flex", gap: 2 }}>
            {(["按工时", "按占比"] as const).map(k => {
              const active = k === modeLabel;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => onToggleMode(k)}
                  className="transition-colors"
                  style={{ height: 28, padding: "0 12px", borderRadius: 999, border: "none", background: active ? "#ef4444" : "transparent", color: active ? "#fff" : "#6b7280", fontSize: 12, fontWeight: 900, cursor: "pointer" }}
                >
                  {k}
                </button>
              );
            })}
          </div>
        }
      />

      <div className="grid" style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 12 }}>
        {cards.map(c => (
          <div key={c.name} style={{ borderRadius: 16, border: `1px solid ${BORDER_WEAK}`, background: "#fff", padding: "14px 12px", boxShadow: "0 14px 40px rgba(15, 23, 42, 0.05)" }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: TEXT_MAIN, letterSpacing: "-0.3px" }}>{c.valueLabel}</div>
            <div style={{ marginTop: 6, fontSize: 12, fontWeight: 900, color: TEXT_SUB }}>{c.name}</div>
            <div className="flex items-end gap-[4px]" style={{ marginTop: 12, height: 24 }}>
              {[6, 12, 18, 10].map((h, idx) => (
                <div key={idx} style={{ width: 4, height: h, borderRadius: 4, background: c.color }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

