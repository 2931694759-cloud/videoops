"use client";

import { useStore } from "@/lib/store";
import { useMemo, useState } from "react";
import type { Review, SubmissionRecord, Task, TypeTaskPackage } from "@/lib/mock-data";

interface NavItem {
  id: string;
  label: string;
  leaderOnly?: boolean;
  badgeKey?: "myTasks" | "quests" | "notifs" | "reviews";
  children?: NavItem[];
  defaultChildId?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "概览",
    items: [
      { id: "dashboard", label: "工作台", leaderOnly: true },
    ],
  },
  {
    title: "工作",
    items: [
      { id: "tasks", label: "项目看板" },
      { id: "my-tasks", label: "我的任务", badgeKey: "myTasks" },
      { id: "questionnaire", label: "需求分发中心", badgeKey: "quests", leaderOnly: true },
    ],
  },
  {
    title: "管理",
    items: [
      { id: "team", label: "团队管理", leaderOnly: true },
      {
        id: "ops",
        label: "运营看板",
        defaultChildId: "analytics",
        children: [
          { id: "analytics", label: "数据报表" },
          { id: "portfolio", label: "成员作品集" },
        ],
      },
    ],
  },
];

const BOTTOM_ITEMS: NavItem[] = [
  { id: "notifications", label: "通知", badgeKey: "notifs" },
  { id: "settings", label: "设置" },
];

const BRAND_RED = "#e74c3c";
const BG = "#eef2f8";
const TEXT_MAIN = "#0f172a";
const TEXT_SUB = "#64748b";
const BORDER = "rgba(148,163,184,0.25)";
const SHADOW = "0 18px 50px rgba(15, 23, 42, 0.08)";

interface Props {
  currentPage: string;
  onNavigate: (p: string) => void;
  onNewBrief?: () => void;
}

function sortBySubmittedAtDesc<T extends { submittedAt?: string | null }>(items: T[]) {
  return items.slice().sort((a, b) => String(b.submittedAt || "").localeCompare(String(a.submittedAt || "")));
}

function sortByCreatedAtDesc<T extends { createdAt?: string | null }>(items: T[]) {
  return items.slice().sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}

function isFormalSubmissionVersion(version: string | null | undefined) {
  const raw = String(version || "").trim();
  return /^V\d+$/i.test(raw) || /^Final$/i.test(raw);
}

function deriveSidebarMyTaskStatus(task: Task, reviews: Review[], submissions: SubmissionRecord[]) {
  const sortedSubs = sortBySubmittedAtDesc(submissions);
  const latestFormalSubmission = sortedSubs.find(sub => isFormalSubmissionVersion(sub.version)) || null;
  const currentSubmissionId = latestFormalSubmission?.id || null;
  const currentReview = currentSubmissionId
    ? sortByCreatedAtDesc(reviews.filter(review => review.submissionId === currentSubmissionId))[0] || null
    : null;

  if (task.status === "COMPLETED" || task.status === "CANCELED") return "ENDED" as const;
  if (!latestFormalSubmission) return "TO_SUBMIT" as const;
  if (/^Final$/i.test(String(latestFormalSubmission.version || "").trim())) return "PASSED" as const;
  if (currentReview?.status === "REVISION_REQUESTED") return "NEED_FIX" as const;
  if (currentReview?.status === "APPROVED") return "PASSED" as const;
  return "TO_REVIEW" as const;
}

function computeReviewBatchStatus(task: Task, latestSubmission: SubmissionRecord, reviews: Review[]) {
  const currentReview = reviews.find(review => review.submissionId === latestSubmission.id) || null;
  if (currentReview?.status === "APPROVED" || task.status === "PENDING_SIGNOFF") return "APPROVED" as const;
  if (currentReview?.status === "REVISION_REQUESTED") return "RETURNED" as const;
  return "PENDING" as const;
}

export default function Sidebar({ currentPage, onNavigate, onNewBrief }: Props) {
  const { currentUser, notifViewerUserId, tasks, questionnaires, notifications, reviews, submissions, typeTaskPackages, logout } = useStore();
  const isLeader = currentUser?.role === "LEADER";

  const childIdToParentId = useMemo(() => {
    const m = new Map<string, string>();
    for (const group of NAV_GROUPS) {
      for (const item of group.items) {
        if (!item.children?.length) continue;
        for (const child of item.children) m.set(child.id, item.id);
      }
    }
    return m;
  }, []);

  const getActiveRoot = (page: string) => childIdToParentId.get(page) || page;

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const activeRoot = getActiveRoot(currentPage);

  const submissionsByTaskId = useMemo(() => {
    const map: Record<string, SubmissionRecord[]> = {};
    submissions.forEach(submission => {
      (map[submission.taskId] ||= []).push(submission);
    });
    Object.keys(map).forEach(taskId => {
      map[taskId] = sortBySubmittedAtDesc(map[taskId]);
    });
    return map;
  }, [submissions]);

  const reviewsByTaskId = useMemo(() => {
    const map: Record<string, Review[]> = {};
    reviews.forEach(review => {
      (map[review.taskId] ||= []).push(review);
    });
    Object.keys(map).forEach(taskId => {
      map[taskId] = sortByCreatedAtDesc(map[taskId]);
    });
    return map;
  }, [reviews]);

  const myTasksBadge = useMemo(() => {
    if (!currentUser?.id) return 0;
    return typeTaskPackages.filter((pkg: TypeTaskPackage) => {
      if (pkg.assigneeId !== currentUser.id) return false;
      return pkg.status === "待提交" || pkg.status === "需修改";
    }).length;
  }, [currentUser?.id, typeTaskPackages]);

  const pendingReviewBadge = useMemo(() => {
    let count = 0;
    tasks.forEach(task => {
      if (task.status === "COMPLETED" || task.status === "CANCELED" || task.status === "BRIEF_REVIEW") return;
      const taskSubmissions = submissionsByTaskId[task.id] || [];
      if (taskSubmissions.length === 0) return;
      const batchStatus = computeReviewBatchStatus(task, taskSubmissions[0], reviewsByTaskId[task.id] || []);
      if (batchStatus === "PENDING") count += 1;
    });
    return count;
  }, [reviewsByTaskId, submissionsByTaskId, tasks]);

  const badges: Record<string, number> = {
    myTasks: myTasksBadge,
    quests: questionnaires.filter(q => q.status === "PENDING").length,
    notifs: (() => {
      const viewerId = notifViewerUserId || currentUser?.id || null;
      if (!viewerId) return 0;
      return notifications.filter(n => {
        const receiverId = n.receiverId || n.userId || null;
        if (receiverId !== viewerId) return false;
        if (n.type === "assignment_sent" || n.type === "stakeholder_project_accepted") return false;
        if (n.notificationStatus) return n.notificationStatus === "未读";
        return n.isRead === false;
      }).length;
    })(),
    reviews: pendingReviewBadge,
  };

  const renderItem = (item: NavItem) => {
    if (item.leaderOnly && !isLeader) return null;
    const childActive = item.children?.some(c => c.id === currentPage) || false;
    const active = currentPage === item.id || childActive;
    const badge = item.badgeKey ? badges[item.badgeKey] : 0;

    const isExpanded = (expanded[item.id] ?? false) || item.id === activeRoot;
    const hasChildren = !!item.children?.length;

    return (
      <div key={item.id}>
        <button
          onClick={() => {
            if (!hasChildren) {
              onNavigate(item.id);
              return;
            }

            setExpanded(prev => ({
              ...prev,
              [item.id]: !((prev[item.id] ?? false) || item.id === activeRoot),
            }));
            if (!childActive) {
              const next = item.defaultChildId || item.children![0].id;
              onNavigate(next);
            }
          }}
          className="w-full text-left transition-all duration-150"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 14px",
            fontSize: 15,
            fontWeight: active ? 800 : 650,
            color: active ? TEXT_MAIN : TEXT_SUB,
            backgroundColor: active ? "#ffffff" : "transparent",
            border: active ? `1px solid ${BORDER}` : "1px solid transparent",
            boxShadow: active ? SHADOW : "none",
            borderRadius: 999,
            position: "relative",
            cursor: "pointer",
            outline: "none",
          }}
          onMouseEnter={e => {
            if (!active) {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.65)";
              e.currentTarget.style.color = TEXT_MAIN;
            }
          }}
          onMouseLeave={e => {
            if (!active) {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = TEXT_SUB;
            }
          }}
        >
          <span className="flex-1">{item.label}</span>
          {badge > 0 && (
            <span style={{ minWidth: 22, height: 22, padding: "0 7px", borderRadius: 99, backgroundColor: BRAND_RED, color: "#ffffff", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              {badge}
            </span>
          )}
          {hasChildren && (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke={active ? TEXT_MAIN : TEXT_SUB}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 150ms ease-out" }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
        </button>

        {hasChildren && isExpanded && (
          <div className="flex flex-col" style={{ gap: 6, padding: "8px 0 12px" }}>
            {item.children!.map(child => {
              if (child.leaderOnly && !isLeader) return null;
              const childIsActive = currentPage === child.id;
              return (
                <button
                  key={child.id}
                  onClick={() => onNavigate(child.id)}
                  className="w-full text-left transition-all duration-150"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "9px 14px 9px 34px",
                    fontSize: 14,
                    fontWeight: childIsActive ? 850 : 650,
                    color: childIsActive ? TEXT_MAIN : TEXT_SUB,
                    backgroundColor: childIsActive ? "#ffffff" : "transparent",
                    border: childIsActive ? `1px solid ${BORDER}` : "1px solid transparent",
                    boxShadow: childIsActive ? SHADOW : "none",
                    borderRadius: 999,
                    position: "relative",
                    cursor: "pointer",
                    outline: "none",
                  }}
                  onMouseEnter={e => {
                    if (!childIsActive) {
                      e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.60)";
                      e.currentTarget.style.color = TEXT_MAIN;
                    }
                  }}
                  onMouseLeave={e => {
                    if (!childIsActive) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = TEXT_SUB;
                    }
                  }}
                >
                  <span className="flex-1">{child.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className="h-screen flex flex-col shrink-0"
      style={{
        width: 260,
        background: BG,
        fontFamily: "'Inter', 'Helvetica Neue', 'PingFang SC', 'Noto Sans SC', sans-serif",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "24px 20px 0" }}>
        <div className="flex items-center gap-[12px]">
          <div style={{ width: 38, height: 38, borderRadius: 14, background: BRAND_RED, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 26px rgba(239,68,68,0.28)" }}>
            <span style={{ color: "#ffffff", fontSize: 17, fontWeight: 800 }}>V</span>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 850, letterSpacing: "-0.3px", color: TEXT_MAIN, lineHeight: 1.2 }}>VideoOps</div>
            <div style={{ fontSize: 12, fontWeight: 650, color: TEXT_SUB, marginTop: 2 }}>Creative Ops</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "26px 16px 14px" }}>
        {NAV_GROUPS.map(group => {
          const visibleItems = group.items.filter(it => !it.leaderOnly || isLeader);
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.title} style={{ marginBottom: 8 }}>
              <div style={{ padding: "0 6px", marginBottom: 10, fontSize: 11, fontWeight: 850, color: "#94a3b8", letterSpacing: "1px", textTransform: "uppercase" }}>
                {group.title}
              </div>
              <div className="flex flex-col" style={{ gap: 8 }}>
                {visibleItems.map(renderItem)}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Brief button */}
      {onNewBrief && isLeader && currentPage !== "tasks" && (
        <div style={{ padding: "0 16px 14px" }}>
          <button
            onClick={onNewBrief}
            className="transition-all"
            style={{
              width: "100%", height: 40, borderRadius: 14,
              backgroundColor: BRAND_RED, color: "#ffffff",
              fontSize: 14, fontWeight: 600,
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              boxShadow: "0 14px 34px rgba(239,68,68,0.26)",
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#d63d2c")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = BRAND_RED)}
          >
            <span style={{ fontSize: 16, fontWeight: 700 }}>+</span>
            新建需求
          </button>
        </div>
      )}

      {/* Bottom items */}
      <div style={{ padding: "0 0 8px", borderTop: `1px solid ${BORDER}` }}>
        <div className="flex flex-col" style={{ gap: 8, padding: "10px 16px" }}>
          {BOTTOM_ITEMS.map(renderItem)}
        </div>
      </div>

      {/* User */}
      <div style={{ borderTop: `1px solid ${BORDER}` }}>
        <div
          className="flex items-center gap-[12px] cursor-pointer transition-all duration-150"
          style={{ padding: "14px 16px" }}
          onClick={logout}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.60)")}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: currentUser?.avatar || BRAND_RED, display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontSize: 14, fontWeight: 800, flexShrink: 0, boxShadow: "0 12px 28px rgba(15, 23, 42, 0.12)" }}>
            {currentUser?.name?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate" style={{ fontSize: 14, fontWeight: 850, color: TEXT_MAIN }}>{currentUser?.name}</div>
            <div className="truncate" style={{ fontSize: 12, fontWeight: 650, color: TEXT_SUB }}>{currentUser?.role === "LEADER" ? "项目管理员" : "执行成员"}</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT_SUB} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>
      </div>
    </aside>
  );
}
