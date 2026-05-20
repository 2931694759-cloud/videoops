"use client";

const PAGE_BG = "#f6f7fb";
const TEXT_MAIN = "#111827";
const TEXT_SUB = "#6b7280";
const BORDER_WEAK = "#eef1f6";
const BLUE = "#2563eb";

type ReviewPageProps = {
  initialTab?: string;
  openTaskId?: string;
};

export default function ReviewPage(_: ReviewPageProps) {
  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: "32px 48px", background: PAGE_BG }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <div style={{ borderRadius: 24, background: "#fff", border: `1px solid ${BORDER_WEAK}`, boxShadow: "0 22px 60px rgba(15, 23, 42, 0.10)", padding: "28px 30px" }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: TEXT_MAIN, marginBottom: 12 }}>旧审核中心已停用</div>
          <div style={{ fontSize: 14, lineHeight: 1.8, color: TEXT_SUB, fontWeight: 700 }}>
            请通过 Sign-off 审核链接完成需求方审核，或在项目看板查看交付任务状态。
            当前页面仅保留兼容挂载，避免旧链接访问时报错，不再作为用户主流程入口。
          </div>
          <div className="flex items-center gap-[10px]" style={{ marginTop: 18 }}>
            <span style={{ height: 28, padding: "0 12px", borderRadius: 999, background: "rgba(37,99,235,0.10)", color: BLUE, fontSize: 12, fontWeight: 900, display: "inline-flex", alignItems: "center" }}>
              {"新流程：我的任务 -> Sign-off 审核页"}
            </span>
            <span style={{ height: 28, padding: "0 12px", borderRadius: 999, background: "rgba(107,114,128,0.12)", color: "#6b7280", fontSize: 12, fontWeight: 900, display: "inline-flex", alignItems: "center" }}>
              兼容保留，不物理删除
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
