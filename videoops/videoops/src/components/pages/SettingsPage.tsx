"use client";

import { useStore } from "@/lib/store";
import { E2E_SCENARIO_NOTIFICATIONS, E2E_SCENARIO_QUESTIONNAIRES, E2E_SCENARIO_REVIEWS, E2E_SCENARIO_SUBMISSIONS, E2E_SCENARIO_TASKS } from "@/lib/e2e-scenario-data";

const BRAND_RED = "#e74c3c";

const CARD = {
  backgroundColor: "#ffffff",
  border: "1px solid #e8e8ec",
  borderRadius: 14,
};

export default function SettingsPage() {
  const { currentUser, logout } = useStore();
  const hasE2E = useStore(s => s.tasks.some(t => t.id.startsWith("e2e-")) || s.questionnaires.some(q => q.id.startsWith("e2e-")));
  const e2eQuestionnaireCount = useStore(s => s.questionnaires.filter(q => q.id.startsWith("e2e-")).length);
  const e2eTaskCount = useStore(s => s.tasks.filter(t => t.id.startsWith("e2e-")).length);
  const e2eSubmissionCount = useStore(s => s.submissions.filter(sub => sub.id.startsWith("e2e-")).length);
  const e2eReviewCount = useStore(s => s.reviews.filter(r => r.id.startsWith("e2e-")).length);
  const e2eNotificationCount = useStore(s => s.notifications.filter(n => n.id.startsWith("e2e-")).length);

  const sectionTitleStyle = { fontSize: 16, fontWeight: 700, color: "#1a1a2e", marginBottom: 12 };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: "#8a8a96", marginBottom: 6 };
  const valueBoxStyle = { height: 40, padding: "0 14px", backgroundColor: "#f5f5f7", borderRadius: 8, border: "1px solid #e8e8ec", display: "flex", alignItems: "center", fontSize: 13, color: "#1a1a2e" };

  const loadE2E = () => {
    useStore.setState(s => {
      const already =
        s.questionnaires.some(q => q.id.startsWith("e2e-")) ||
        s.tasks.some(t => t.id.startsWith("e2e-")) ||
        s.submissions.some(sub => sub.id.startsWith("e2e-")) ||
        s.reviews.some(r => r.id.startsWith("e2e-")) ||
        s.notifications.some(n => n.id.startsWith("e2e-"));
      if (already) return s;
      return {
        ...s,
        questionnaires: [...E2E_SCENARIO_QUESTIONNAIRES, ...s.questionnaires],
        tasks: [...E2E_SCENARIO_TASKS, ...s.tasks],
        submissions: [...E2E_SCENARIO_SUBMISSIONS, ...s.submissions],
        reviews: [...E2E_SCENARIO_REVIEWS, ...s.reviews],
        notifications: [...E2E_SCENARIO_NOTIFICATIONS, ...s.notifications],
      };
    });
  };

  const clearE2E = () => {
    useStore.setState(s => ({
      ...s,
      questionnaires: s.questionnaires.filter(q => !q.id.startsWith("e2e-")),
      tasks: s.tasks.filter(t => !t.id.startsWith("e2e-")),
      submissions: s.submissions.filter(sub => !sub.id.startsWith("e2e-")),
      reviews: s.reviews.filter(r => !r.id.startsWith("e2e-")),
      notifications: s.notifications.filter(n => !n.id.startsWith("e2e-")),
    }));
  };

  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: "32px 48px" }}>
      <div style={{ maxWidth: 720, marginLeft: "auto", marginRight: "auto" }}>

        <div style={{ marginBottom: 28 }}>
          <h3 style={sectionTitleStyle}>个人信息</h3>
          <div style={{ ...CARD, padding: "24px 28px" }}>
            <div className="flex items-center gap-[16px]" style={{ marginBottom: 22 }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", backgroundColor: currentUser?.avatar || BRAND_RED, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 22, fontWeight: 700 }}>
                {currentUser?.name?.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a2e" }}>{currentUser?.name}</div>
                <div style={{ fontSize: 13, color: "#8a8a96", marginTop: 2 }}>{currentUser?.email}</div>
              </div>
              <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, padding: "3px 12px", borderRadius: 99, backgroundColor: currentUser?.role === "LEADER" ? "rgba(231,76,60,0.08)" : "#f5f5f7", color: currentUser?.role === "LEADER" ? BRAND_RED : "#8a8a96" }}>
                {currentUser?.role === "LEADER" ? "项目管理员" : "执行成员"}
              </span>
            </div>
            <div style={{ borderTop: "1px solid #f0f0f2", paddingTop: 18 }}>
              <div className="grid grid-cols-2 gap-[14px]">
                <div>
                  <div style={labelStyle}>姓名</div>
                  <div style={valueBoxStyle}>{currentUser?.name}</div>
                </div>
                <div>
                  <div style={labelStyle}>邮箱</div>
                  <div style={valueBoxStyle}>{currentUser?.email}</div>
                </div>
                <div>
                  <div style={labelStyle}>角色</div>
                  <div style={valueBoxStyle}>{currentUser?.role === "LEADER" ? "项目管理员" : "执行成员"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <h3 style={sectionTitleStyle}>通知偏好</h3>
          <div style={{ ...CARD, padding: "4px 0" }}>
            {[
              { label: "新需求问卷提交", desc: "有人提交新的视频制作需求时通知我", on: true },
              { label: "任务指派通知", desc: "任务被分配给我时通知我", on: true },
              { label: "审核结果通知", desc: "我提交的任务审核通过或被打回时通知我", on: true },
              { label: "截止日期提醒", desc: "任务截止日期前一天提醒我", on: true },
              { label: "邮件通知", desc: "同时发送邮件到我的邮箱", on: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between" style={{ padding: "14px 24px", borderBottom: i < 4 ? "1px solid #f0f0f2" : "none" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a2e" }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: "#8a8a96", marginTop: 2 }}>{item.desc}</div>
                </div>
                <div
                  style={{
                    width: 40, height: 22, borderRadius: 11, cursor: "pointer", position: "relative",
                    backgroundColor: item.on ? BRAND_RED : "#d0d0d6",
                    transition: "background-color 0.2s",
                  }}
                >
                  <div style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: "#fff", position: "absolute", top: 2, left: item.on ? 20 : 2, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <h3 style={sectionTitleStyle}>系统信息</h3>
          <div style={{ ...CARD, padding: "20px 24px" }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: "#8a8a96" }}>版本</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>VideoOps v1.0.0</span>
            </div>
            <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: "#8a8a96" }}>描述</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>视频制作部门任务管理系统</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 13, color: "#8a8a96" }}>时区</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>Asia/Shanghai (UTC+8)</span>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <h3 style={sectionTitleStyle}>回归测试</h3>
          <div style={{ ...CARD, padding: "18px 18px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#8a8a96", marginBottom: 12 }}>
              E2E 回归数据默认不启用，可手动加载/清除。加载后可在各页面按 e2e- 前缀识别。
            </div>
            <div className="flex items-center gap-[10px]">
              <button
                type="button"
                onClick={loadE2E}
                disabled={hasE2E}
                style={{
                  height: 38,
                  padding: "0 14px",
                  borderRadius: 10,
                  border: "1px solid #111827",
                  background: hasE2E ? "#f3f4f6" : "#111827",
                  color: hasE2E ? "#6b7280" : "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: hasE2E ? "not-allowed" : "pointer",
                }}
              >
                加载 E2E 回归数据
              </button>
              <button
                type="button"
                onClick={clearE2E}
                disabled={!hasE2E}
                style={{
                  height: 38,
                  padding: "0 14px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  background: !hasE2E ? "#f3f4f6" : "#ffffff",
                  color: !hasE2E ? "#6b7280" : "#111827",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: !hasE2E ? "not-allowed" : "pointer",
                }}
              >
                清除 E2E 回归数据
              </button>
              <div style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: hasE2E ? "#16a34a" : "#8a8a96" }}>
                {hasE2E ? "E2E 已加载" : "E2E 未加载"}
              </div>
            </div>
            {hasE2E ? (
              <div style={{ marginTop: 12, fontSize: 12, fontWeight: 700, color: "#6b7280" }}>
                已加载：Brief {e2eQuestionnaireCount} / 项目 {e2eTaskCount} / 提交 {e2eSubmissionCount} / 审核 {e2eReviewCount} / 通知 {e2eNotificationCount}
              </div>
            ) : null}
          </div>
        </div>

        <div>
          <button
            onClick={logout}
            className="transition-all duration-150"
            style={{
              width: "100%",
              height: 44,
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              color: BRAND_RED,
              backgroundColor: "transparent",
              border: `1px solid ${BRAND_RED}`,
              cursor: "pointer",
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(231,76,60,0.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
}
