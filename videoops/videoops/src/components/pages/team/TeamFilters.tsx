"use client";

import type { MemberRoleFilter, MemberSortField, SortDirection } from "./teamTypes";
import { BORDER, BORDER_WEAK, PAGE_BG, TEXT_MAIN, TEXT_SUB } from "./teamUi";

export default function TeamFilters({
  roleFilter,
  setRoleFilter,
  sortField,
  sortDirection,
  onToggleSort,
  search,
  setSearch,
}: {
  roleFilter: MemberRoleFilter;
  setRoleFilter: (v: MemberRoleFilter) => void;
  sortField: MemberSortField;
  sortDirection: SortDirection;
  onToggleSort: (field: MemberSortField) => void;
  search: string;
  setSearch: (v: string) => void;
}) {
  const roleFilters: Array<{ key: MemberRoleFilter; label: string }> = [
    { key: "all", label: "全部成员" },
    { key: "项目管理员", label: "项目管理员" },
    { key: "执行成员", label: "执行成员" },
  ];

  const sortLabel = (field: MemberSortField, label: string) => `${label} ${sortField === field ? (sortDirection === "desc" ? "↓" : "↑") : "↓"}`;

  return (
    <div style={{ borderRadius: 18, border: `1px solid ${BORDER_WEAK}`, background: "#fff", boxShadow: "0 18px 50px rgba(15, 23, 42, 0.06)", padding: "12px 12px", marginBottom: 14 }}>
      <div className="flex items-center justify-between gap-[12px]" style={{ flexWrap: "wrap" }}>
        <div className="flex items-center gap-[8px]" style={{ flexWrap: "wrap" }}>
          {roleFilters.map(f => {
            const active = roleFilter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setRoleFilter(f.key)}
                className="transition-colors"
                style={{ height: 32, padding: "0 12px", borderRadius: 999, border: `1px solid ${active ? "rgba(239,68,68,0.22)" : BORDER}`, background: active ? "rgba(239,68,68,0.08)" : "#fff", color: active ? "#ef4444" : TEXT_SUB, fontSize: 12, fontWeight: 900, cursor: "pointer" }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-[10px]" style={{ flexWrap: "wrap" }}>
          <div className="flex items-center gap-[8px]" style={{ flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => onToggleSort("currentTasks")}
              className="transition-colors"
              style={{ height: 32, padding: "0 12px", borderRadius: 999, border: `1px solid ${sortField === "currentTasks" ? "rgba(37,99,235,0.22)" : BORDER}`, background: sortField === "currentTasks" ? "rgba(37,99,235,0.08)" : "#fff", color: sortField === "currentTasks" ? "#2563eb" : TEXT_SUB, fontSize: 12, fontWeight: 900, cursor: "pointer" }}
            >
              {sortLabel("currentTasks", "当前交付任务数")}
            </button>
            <button
              type="button"
              onClick={() => onToggleSort("monthDone")}
              className="transition-colors"
              style={{ height: 32, padding: "0 12px", borderRadius: 999, border: `1px solid ${sortField === "monthDone" ? "rgba(37,99,235,0.22)" : BORDER}`, background: sortField === "monthDone" ? "rgba(37,99,235,0.08)" : "#fff", color: sortField === "monthDone" ? "#2563eb" : TEXT_SUB, fontSize: 12, fontWeight: 900, cursor: "pointer" }}
            >
              {sortLabel("monthDone", "本月已通过数")}
            </button>
          </div>

          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索成员、邮箱、能力标签…"
            style={{ width: 280, height: 32, borderRadius: 999, border: `1px solid ${BORDER}`, background: PAGE_BG, padding: "0 12px", fontSize: 12, fontWeight: 800, color: TEXT_MAIN, outline: "none" }}
            onFocus={e => { e.currentTarget.style.backgroundColor = "#fff"; e.currentTarget.style.borderColor = "#d1d5db"; }}
            onBlur={e => { e.currentTarget.style.backgroundColor = PAGE_BG; e.currentTarget.style.borderColor = BORDER; }}
          />
        </div>
      </div>
    </div>
  );
}
