"use client";

import { useState, type ComponentProps } from "react";
import { useStore } from "@/lib/store";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Dashboard from "./pages/Dashboard";
import TaskBoard from "./pages/TaskBoard";
import MyTasks from "./pages/MyTasks";
import Questionnaires from "./pages/Questionnaires";
import QuestionnaireForm from "./pages/QuestionnaireForm";
import TeamPage from "./pages/TeamPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import NotificationsPage from "./pages/NotificationsPage";
import SettingsPage from "./pages/SettingsPage";
import ReviewPage from "./pages/ReviewPage";
import PortfolioPage from "./pages/PortfolioPage";
import { formatTaskAssigneeNames } from "@/lib/taskAssignments";

const PAGE_TITLES: Record<string, string> = {
  dashboard: "工作台",
  tasks: "项目看板",
  "my-tasks": "我的任务",
  questionnaire: "需求分发中心",
  "quest-form": "提交视频制作需求",
  review: "旧审核流程兼容页",
  team: "团队管理",
  analytics: "数据报表",
  portfolio: "成员作品集",
  notifications: "通知",
  settings: "设置",
};

const LEADER_ONLY = ["dashboard", "team", "review", "questionnaire"];

export default function AppShell() {
  const currentUser = useStore(s => s.currentUser);
  const tasks = useStore(s => s.tasks);
  const questionnaires = useStore(s => s.questionnaires);
  const isLeader = currentUser?.role === "LEADER";

  const [page, setPage] = useState(() => isLeader ? "dashboard" : "my-tasks");
  const [showNewBrief, setShowNewBrief] = useState(false);
  const [topbarSearch, setTopbarSearch] = useState("");
  const [navParams, setNavParams] = useState<{ tab?: string; open?: string; memberId?: string; highlight?: string; source?: string }>({});

  const navigate = (raw: string) => {
    const idx = raw.indexOf("?");
    const p = idx >= 0 ? raw.slice(0, idx) : raw;
    const qs = idx >= 0 ? raw.slice(idx + 1) : "";
    const params = new URLSearchParams(qs);
    setNavParams({
      tab: params.get("tab") || undefined,
      open: params.get("open") || undefined,
      memberId: params.get("memberId") || undefined,
      highlight: params.get("highlight") || undefined,
      source: params.get("source") || undefined,
    });

    if (!isLeader && LEADER_ONLY.includes(p)) {
      setPage("my-tasks");
      return;
    }
    if (p !== page) setTopbarSearch("");
    setPage(p);
  };

  const handleNewBrief = () => {
    setShowNewBrief(true);
  };

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard onNavigate={navigate} />;
      case "tasks": return <TaskBoard onNavigate={navigate} initialTab={navParams.tab as unknown as ComponentProps<typeof TaskBoard>["initialTab"]} openTaskId={navParams.open} highlightTaskId={navParams.highlight} highlightQuestionnaireId={navParams.source} />;
      case "my-tasks": return <MyTasks />;
      case "questionnaire": return <Questionnaires onNavigate={navigate} initialTab={navParams.tab as unknown as ComponentProps<typeof Questionnaires>["initialTab"]} openQuestionnaireId={navParams.open} />;
      case "quest-form": return <QuestionnaireForm onBack={() => setPage("questionnaire")} />;
      case "team": return <TeamPage onNavigate={navigate} />;
      case "analytics": return <AnalyticsPage />;
      case "portfolio": return <PortfolioPage initialMemberId={navParams.memberId} />;
      case "notifications": return <NotificationsPage onNavigate={navigate} />;
      case "review": return <ReviewPage initialTab={navParams.tab as unknown as NonNullable<ComponentProps<typeof ReviewPage>>["initialTab"]} openTaskId={navParams.open} />;
      case "settings": return <SettingsPage />;
      default: return <TaskBoard />;
    }
  };

  const searchResults = (() => {
    if (page !== "dashboard") return [];
    const q = (topbarSearch || "").trim().toLowerCase();
    if (!q) return [];

    const pickBrand = (text: string | null) => {
      if (!text) return null;
      try {
        const v: unknown = JSON.parse(text);
        if (v && typeof v === "object" && !Array.isArray(v)) {
          const brand = (v as Record<string, unknown>).brand;
          return typeof brand === "string" ? brand : null;
        }
        return null;
      } catch {
        return null;
      }
    };

    const pickCompany = (text: string | null) => {
      if (!text) return null;
      try {
        const v: unknown = JSON.parse(text);
        if (v && typeof v === "object" && !Array.isArray(v)) {
          const company = (v as Record<string, unknown>).company;
          return typeof company === "string" ? company : null;
        }
        return null;
      } catch {
        return null;
      }
    };

    const qById = new Map(questionnaires.map(b => [b.id, b] as const));

    const projects = tasks
      .filter(t => t.status !== "BRIEF_REVIEW")
      .map(t => {
        const brief = t.questionnaireId ? qById.get(t.questionnaireId) || null : null;
        const assignees = formatTaskAssigneeNames(t, null, 2);
        const hay = [t.title, brief?.title, t.brand, brief?.requesterName, brief?.requesterDept, assignees].filter(Boolean).join(" ").toLowerCase();
        return { t, hay };
      })
      .filter(x => x.hay.includes(q))
      .slice(0, 4)
      .map(x => ({
        kind: "project" as const,
        id: x.t.id,
        title: `${x.t.taskNumber || ""} ${x.t.title}`.trim(),
        subtitle: `项目 · ${formatTaskAssigneeNames(x.t, null, 2)} · ${x.t.brand || "—"}`,
      }));

    const briefs = questionnaires
      .map(b => {
        const brand = pickBrand(b.specialNotes);
        const company = pickCompany(b.specialNotes);
        const hay = [b.title, b.requesterName, b.requesterDept, brand, company].filter(Boolean).join(" ").toLowerCase();
        return { b, hay, brand, company };
      })
      .filter(x => x.hay.includes(q))
      .slice(0, 3)
      .map(x => ({
        kind: "brief" as const,
        id: x.b.id,
        title: x.b.title,
        subtitle: `需求 · ${x.brand || x.company || "—"} · ${x.b.requesterName || "—"}`,
      }));

    return [...projects, ...briefs].slice(0, 8);
  })();

  return (
    <div className="flex w-screen h-screen">
      <Sidebar currentPage={page} onNavigate={navigate} onNewBrief={handleNewBrief} />
      <main
        className="flex-1 min-w-0 overflow-y-auto flex flex-col"
        style={{
          background: "#f5f5f7",
          fontFamily: "'Inter', 'Helvetica Neue', 'PingFang SC', 'Noto Sans SC', sans-serif",
        }}
      >
        <Topbar
          title={
            page === "analytics"
              ? "运营看板>数据报表"
              : page === "portfolio"
                ? "运营看板 > 成员作品集"
                : (PAGE_TITLES[page] || "")
          }
          onNavigate={navigate}
          hideSearch={page === "portfolio"}
          searchValue={page === "dashboard" ? topbarSearch : undefined}
          onSearchChange={page === "dashboard" ? setTopbarSearch : undefined}
          searchResults={searchResults}
          onSearchSelect={r => {
            if (r.kind === "project") navigate(`tasks?open=${encodeURIComponent(r.id)}`);
            if (r.kind === "brief") navigate(`questionnaire?open=${encodeURIComponent(r.id)}`);
          }}
          searchPlaceholder={
            page === "dashboard"
              ? "搜索项目或需求..."
              : page === "questionnaire"
              ? "搜索项目、品牌、需求人..."
              : page === "tasks"
                ? "搜索项目、品牌、成员..."
                : page === "team"
                  ? "搜索成员、邮箱、角色、能力…"
                  : page === "analytics"
                    ? "搜索报表、项目、品牌..."
                : undefined
          }
        />
        <div className="flex-1 flex flex-col">
          {renderPage()}
        </div>
        {showNewBrief && (
          <QuestionnaireForm
            mode="modal"
            headerTitle="新建需求"
            onCancel={() => setShowNewBrief(false)}
            onSubmitted={() => setShowNewBrief(false)}
          />
        )}
      </main>
    </div>
  );
}
