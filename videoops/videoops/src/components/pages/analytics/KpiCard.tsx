"use client";

import { Card } from "./ReportPrimitives";
import { TEXT_MAIN, TEXT_SUB } from "./reportUi";
import { trendPillStyle } from "./reportUi";
import type { KpiCardData } from "./reportData";
import { Check, CircleDot, CircleDollarSign, LoaderCircle } from "lucide-react";

function KpiIcon({ kind, bg, color }: { kind: KpiCardData["icon"]; bg: string; color: string }) {
  const size = 16;
  const common = { size, color };
  const icon = kind === "check" ? <Check {...common} /> : kind === "yen" ? <CircleDollarSign {...common} /> : kind === "progress" ? <LoaderCircle {...common} /> : <CircleDot {...common} />;
  return (
    <div style={{ width: 34, height: 34, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {icon}
    </div>
  );
}

export default function KpiCard({ data }: { data: KpiCardData }) {
  const t = trendPillStyle(data.trend);
  return (
    <Card padding="14px 16px">
      <div className="flex items-start justify-between" style={{ marginBottom: 12 }}>
        <div className="flex items-center gap-[10px]">
          <KpiIcon kind={data.icon} bg={data.iconBg} color={data.iconColor} />
          <div style={{ fontSize: 12, fontWeight: 900, color: TEXT_SUB }}>{data.title}</div>
        </div>
        <span style={{ height: 22, padding: "0 10px", borderRadius: 999, background: t.bg, color: t.color, fontSize: 12, fontWeight: 900, display: "inline-flex", alignItems: "center" }}>
          {data.trend}
        </span>
      </div>

      <div style={{ fontSize: 28, fontWeight: 900, color: TEXT_MAIN, letterSpacing: "-0.5px", lineHeight: 1.1 }}>{data.value}</div>
      <div style={{ marginTop: 8, fontSize: 12, fontWeight: 800, color: TEXT_SUB }}>{data.note}</div>
    </Card>
  );
}

