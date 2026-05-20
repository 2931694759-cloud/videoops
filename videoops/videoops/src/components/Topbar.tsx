"use client";

import { getNotificationAppTarget, getNotificationSignoffTarget } from "@/lib/notificationRouting";
import { useStore } from "@/lib/store";
import { timeAgo } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";

interface Props {
  title: string;
  onNavigate?: (page: string) => void;
  searchPlaceholder?: string;
  breadcrumbs?: string[];
  hideSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  searchResults?: Array<{ kind: "project" | "brief"; id: string; title: string; subtitle: string }>;
  onSearchSelect?: (r: { kind: "project" | "brief"; id: string; title: string; subtitle: string }) => void;
}

const BRAND_RED = "#e74c3c";

export default function Topbar({ title, onNavigate, searchPlaceholder, breadcrumbs, hideSearch, searchValue, onSearchChange, searchResults, onSearchSelect }: Props) {
  const { notifications, markNotifRead, markAllNotifsRead, currentUser, notifViewerUserId } = useStore();
  const [showNotifs, setShowNotifs] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const viewerId = notifViewerUserId || currentUser?.id || null;
  const myNotifs = notifications
    .filter(n => (n.receiverId || n.userId) === viewerId)
    .filter(n => n.type !== "assignment_sent" && n.type !== "stakeholder_project_accepted")
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
    .slice(0, 20);
  const unreadCount = myNotifs.filter(n => (n.notificationStatus ? n.notificationStatus === "未读" : n.isRead === false)).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
    };
    if (showNotifs) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showNotifs]);

  const handleNotifClick = (n: typeof myNotifs[0]) => {
    markNotifRead(n.id);
    setShowNotifs(false);
    const signoffTarget = getNotificationSignoffTarget(n);
    if (signoffTarget) {
      window.location.href = signoffTarget;
      return;
    }
    const appTarget = getNotificationAppTarget(n);
    if (onNavigate && appTarget) onNavigate(appTarget);
  };

  return (
    <header
      className="flex items-center justify-between shrink-0 sticky top-0 z-30"
      style={{
        height: 60,
        borderBottom: "1px solid #e8e8ec",
        background: "#ffffff",
        padding: "0 40px",
      }}
    >
      <div>
        {breadcrumbs?.length ? (
          <div style={{ fontSize: 12, color: "#a1a1aa", fontWeight: 600, lineHeight: 1.2, marginBottom: 2 }}>
            {breadcrumbs.join(" / ")}
          </div>
        ) : null}
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a2e", letterSpacing: "-0.3px" }}>{title}</h1>
      </div>

      <div className="flex items-center gap-[12px]">
        {/* 搜索框 */}
        {!hideSearch && (
          <div style={{ position: "relative", width: 240 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8a8a96" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={typeof searchValue === "string" ? searchValue : search}
              onChange={e => {
                if (onSearchChange) {
                  onSearchChange(e.target.value);
                } else {
                  setSearch(e.target.value);
                }
                setSearchOpen(true);
              }}
              placeholder={searchPlaceholder || "搜索项目..."}
              style={{
                width: "100%", height: 36, padding: "0 12px 0 34px",
                backgroundColor: "#f5f5f7",
                border: "1px solid #e8e8ec",
                borderRadius: 8,
                fontSize: 13, color: "#1a1a2e",
                outline: "none",
              }}
              onFocus={e => { e.currentTarget.style.borderColor = "#d0d0d6"; e.currentTarget.style.backgroundColor = "#ffffff"; setSearchOpen(true); }}
              onBlur={e => {
                e.currentTarget.style.borderColor = "#e8e8ec";
                e.currentTarget.style.backgroundColor = "#f5f5f7";
                window.setTimeout(() => setSearchOpen(false), 120);
              }}
              onKeyDown={e => {
                if (e.key !== "Enter") return;
                if (!searchResults?.length || !onSearchSelect) return;
                onSearchSelect(searchResults[0]);
                setSearchOpen(false);
              }}
            />

            {searchOpen && !!searchResults?.length && onSearchSelect ? (
              <div style={{ position: "absolute", left: 0, right: 0, top: 42, background: "#fff", border: "1px solid #e8e8ec", borderRadius: 12, boxShadow: "0 14px 44px rgba(0,0,0,0.10)", overflow: "hidden", zIndex: 60 }}>
                <div style={{ padding: "10px 12px", borderBottom: "1px solid #f0f0f2", fontSize: 12, fontWeight: 700, color: "#6b7280" }}>
                  搜索结果
                </div>
                <div style={{ maxHeight: 340, overflowY: "auto" }}>
                  {searchResults.map(r => (
                    <button
                      key={`${r.kind}-${r.id}`}
                      className="cursor-pointer transition-colors"
                      type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => { onSearchSelect(r); setSearchOpen(false); }}
                      style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderBottom: "1px solid #f5f5f7", background: "#fff", border: "none" }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#fafafa")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#fff")}
                    >
                      <div className="flex items-center justify-between gap-[10px]">
                        <div className="min-w-0">
                          <div className="truncate" style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{r.title}</div>
                          <div className="truncate" style={{ marginTop: 3, fontSize: 12, fontWeight: 500, color: "#6b7280" }}>{r.subtitle}</div>
                        </div>
                        <span style={{ height: 22, padding: "0 8px", borderRadius: 999, background: r.kind === "project" ? "rgba(37,99,235,0.10)" : "rgba(245,158,11,0.14)", color: r.kind === "project" ? "#2563eb" : "#f59e0b", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
                          {r.kind === "project" ? "项目" : "需求"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}

        <button
          onClick={() => onNavigate?.("settings")}
          className="relative flex items-center justify-center transition-colors"
          style={{ width: 36, height: 36, borderRadius: 8, color: "#52525b", background: "transparent", border: "none", cursor: "pointer" }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f5f5f7")}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
          aria-label="设置"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.7 1.7 0 0 0-1.82-.33 1.7 1.7 0 0 0-1 1.54V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09a1.7 1.7 0 0 0-1-1.54 1.7 1.7 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.7 1.7 0 0 0 .33-1.82 1.7 1.7 0 0 0-1.54-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09a1.7 1.7 0 0 0 1.54-1 1.7 1.7 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.7 1.7 0 0 0 1.82.33h0A1.7 1.7 0 0 0 9 3.09V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.7 1.7 0 0 0 1 1.54h0a1.7 1.7 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.7 1.7 0 0 0-.33 1.82v0A1.7 1.7 0 0 0 20.91 11H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.7 1.7 0 0 0-1.54 1Z" />
          </svg>
        </button>

        {/* 通知 */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative flex items-center justify-center transition-colors"
            style={{ width: 36, height: 36, borderRadius: 8, color: "#52525b", background: "transparent", border: "none", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f5f5f7")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span style={{ position: "absolute", top: 4, right: 4, minWidth: 16, height: 16, padding: "0 4px", borderRadius: 99, backgroundColor: BRAND_RED, color: "#fff", fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div style={{ position: "absolute", right: 0, top: 44, width: 380, background: "#ffffff", border: "1px solid #e8e8ec", borderRadius: 12, boxShadow: "0 12px 40px rgba(0,0,0,0.10)", overflow: "hidden", zIndex: 50 }}>
              <div className="flex items-center justify-between" style={{ padding: "0 20px", height: 52, borderBottom: "1px solid #f0f0f2" }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#1a1a2e" }}>通知</span>
                {unreadCount > 0 && (
                  <button onClick={markAllNotifsRead} style={{ fontSize: 13, color: BRAND_RED, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>全部已读</button>
                )}
              </div>
              <div style={{ maxHeight: 420, overflowY: "auto" }}>
                {myNotifs.length === 0 ? (
                  <div style={{ padding: "48px 0", textAlign: "center", fontSize: 14, color: "#a1a1aa" }}>暂无通知</div>
                ) : (
                  myNotifs.map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className="cursor-pointer transition-colors"
                      style={{ padding: "14px 20px", borderBottom: "1px solid #f0f0f2", backgroundColor: !n.isRead ? "rgba(231,76,60,0.04)" : "transparent" }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = !n.isRead ? "rgba(231,76,60,0.08)" : "#fafafa")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = !n.isRead ? "rgba(231,76,60,0.04)" : "transparent")}
                    >
                      <div className="flex items-start gap-[10px]">
                        {!n.isRead && <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: BRAND_RED, marginTop: 6, flexShrink: 0 }} />}
                        <div className="flex-1 min-w-0">
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a2e" }}>{n.title}</div>
                          <div style={{ fontSize: 13, color: "#52525b", marginTop: 3, lineHeight: 1.5 }}>{n.message}</div>
                          <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 5, fontWeight: 500 }}>{timeAgo(n.createdAt)}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 用户头像 */}
        <div
          className="shrink-0 cursor-pointer"
          style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: currentUser?.avatar || BRAND_RED, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 600 }}
        >
          {currentUser?.name?.charAt(0)}
        </div>
      </div>
    </header>
  );
}
