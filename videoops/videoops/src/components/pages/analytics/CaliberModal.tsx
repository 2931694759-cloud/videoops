"use client";

import { X } from "lucide-react";
import { BORDER, BORDER_WEAK, TEXT_MAIN, TEXT_SUB } from "./reportUi";

function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.55)" }} onMouseDown={onClose}>
      <div className="w-full" style={{ maxWidth: 980, maxHeight: "calc(100vh - 64px)", padding: "0 18px" }} onMouseDown={e => e.stopPropagation()}>
        <div style={{ borderRadius: 28, background: "#fff", border: `1px solid ${BORDER_WEAK}`, boxShadow: "0 22px 60px rgba(15, 23, 42, 0.18)", overflow: "hidden" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function Block({ title, text }: { title: string; text: string }) {
  return (
    <div style={{ borderRadius: 16, border: `1px solid ${BORDER_WEAK}`, background: "#fff", padding: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 900, color: TEXT_MAIN, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_SUB, lineHeight: 1.85, whiteSpace: "pre-wrap" }}>{text}</div>
    </div>
  );
}

export default function CaliberModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-start justify-between" style={{ padding: "20px 22px", borderBottom: `1px solid ${BORDER_WEAK}`, background: "#fff" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: TEXT_MAIN }}>数据口径说明</div>
          <div style={{ marginTop: 6, fontSize: 13, color: TEXT_SUB, fontWeight: 700, lineHeight: 1.7 }}>
            用于解释报表指标的计算方式，避免管理复盘时口径不一致。
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="transition-colors"
          style={{ width: 38, height: 38, borderRadius: 14, border: `1px solid ${BORDER}`, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", cursor: "pointer" }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f9fafb")}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#fff")}
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ padding: 22, background: "#fff", overflowY: "auto", maxHeight: "calc(100vh - 220px)" }}>
        <div className="flex flex-col gap-[12px]">
          <Block
            title="成本节省"
            text="净节省 = 市场报价 - 内部成本；节省率 = 净节省 / 市场报价。内部成本来自项目看板的预估成本，市场报价来自项目创建时录入的市场参考成本。"
          />
          <Block
            title="工作类型"
            text="按工作类型统计，例如视频、平面设计、POSM、文案、3D。工作类型工时消耗保留小时口径，用于展示内部投入工时。"
          />
          <Block
            title="资产类型"
            text="按资产颗粒度统计，例如主视觉素材、本地化延展、社媒短视频、二次物料。它比工作类型更关注最终沉淀出的资产形态。"
          />
          <Block
            title="资产库使用"
            text="用于观察最终 FA 是否进入资产库，以及过往素材是否被后续项目复用。资产库使用率 = 已进入资产库或被复用的 FA 资产 / 总 FA 资产。"
          />
        </div>
      </div>

      <div className="flex items-center justify-end" style={{ padding: "14px 18px", borderTop: `1px solid ${BORDER_WEAK}`, background: "#fff" }}>
        <button
          type="button"
          onClick={onClose}
          className="transition-all"
          style={{ height: 36, padding: "0 18px", borderRadius: 12, background: "#ef4444", border: "none", color: "#fff", fontSize: 12, fontWeight: 900, cursor: "pointer", boxShadow: "0 10px 22px rgba(239, 68, 68, 0.22)" }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.92")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >
          知道了
        </button>
      </div>
    </ModalShell>
  );
}
