"use client";

import { Plus } from "lucide-react";
import { TEXT_SUB } from "./teamUi";

export default function TeamHeader({
  onAdd,
}: {
  onAdd: () => void;
}) {
  return (
    <div className="flex items-start justify-between" style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 13, color: TEXT_SUB, fontWeight: 700, lineHeight: 1.8, maxWidth: 820 }}>
        查看团队成员、能力标签、交付任务负载与交付表现，辅助项目管理员进行人员管理和分配参考。
      </div>
      <div className="flex items-center gap-[10px]">
        <button
          type="button"
          onClick={onAdd}
          className="transition-all"
          style={{ height: 36, padding: "0 14px", borderRadius: 12, background: "#ef4444", color: "#fff", border: "none", fontSize: 12, fontWeight: 900, cursor: "pointer", boxShadow: "0 10px 22px rgba(239, 68, 68, 0.22)", display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <Plus size={14} />
          新增成员
        </button>
      </div>
    </div>
  );
}
