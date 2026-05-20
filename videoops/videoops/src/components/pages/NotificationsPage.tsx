"use client";

import { USERS, type Notification } from "@/lib/mock-data";
import { getNotificationAppTarget, getNotificationSignoffTarget } from "@/lib/notificationRouting";
import { useStore } from "@/lib/store";
import { timeAgo } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const BRAND_RED = "#e74c3c";

const CARD = {
  backgroundColor: "#ffffff",
  border: "1px solid #e8e8ec",
  borderRadius: 14,
};

type IdentityName = "张磊" | "王芳" | "李梅" | "王骏" | "陈宇" | "赵琳";
type ViewTab = "MINE" | "SENT";

type NotifTag = { text: string; color: string; bg: string };

const IDENTITIES: Array<{ name: IdentityName; note: string }> = [
  { name: "张磊", note: "项目管理员" },
  { name: "王芳", note: "执行成员" },
  { name: "李梅", note: "执行成员" },
  { name: "王骏", note: "执行成员" },
  { name: "陈宇", note: "执行成员" },
  { name: "赵琳", note: "执行成员" },
];

const TAGS: Record<string, NotifTag> = {
  NEW_TASK: { text: "新任务", color: "#6b47b8", bg: "#f0ebff" },
  SUBMITTED: { text: "提交成功", color: "#1a7a4a", bg: "#ebfff0" },
  PENDING_REVIEW: { text: "待审核", color: "#c0592b", bg: "#fff3eb" },
  PENDING_ASSIGN: { text: "待分配", color: "#b45309", bg: "rgba(245,158,11,0.14)" },
  MEMBER_SENT: { text: "成员通知", color: "#1a7a4a", bg: "#ebfff0" },
  STAKEHOLDER_SENT: { text: "邮件模拟", color: "#2563eb", bg: "rgba(37,99,235,0.10)" },
  ACCEPTANCE_EMAIL: { text: "审核邮件已发送", color: "#2563eb", bg: "rgba(37,99,235,0.10)" },
  ACCEPTANCE_PASS: { text: "需求方通过", color: "#1a7a4a", bg: "#ebfff0" },
  ACCEPTANCE_REVISION: { text: "需要修改", color: "#b45309", bg: "rgba(245,158,11,0.14)" },
  SIGNOFF_MAIL: { text: "审核链接已发送", color: "#2563eb", bg: "rgba(37,99,235,0.10)" },
  SIGNOFF_PASS: { text: "需求方通过", color: "#1a7a4a", bg: "#ebfff0" },
  SIGNOFF_REVISION: { text: "需求方退回", color: "#b45309", bg: "rgba(245,158,11,0.14)" },
  PROJECT_CANCELED: { text: "项目已取消", color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
  COMPLETED: { text: "已完成", color: "#1a7a4a", bg: "#ebfff0" },
};

function getReceiverId(n: Notification) {
  return n.receiverId || n.userId || "";
}

function isSentRecord(n: Notification) {
  return n.type === "assignment_sent" || n.type === "stakeholder_project_accepted" || n.type === "acceptance_email_sent";
}

function isUnreadForReceiver(n: Notification) {
  if (isSentRecord(n)) return false;
  if (n.notificationStatus) return n.notificationStatus === "未读";
  return n.isRead === false;
}

function isReadState(n: Notification) {
  if (isSentRecord(n)) return true;
  if (n.notificationStatus) return n.notificationStatus !== "未读";
  return Boolean(n.isRead);
}

function toYmd(dateStr: string | null | undefined) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return d.toISOString().slice(0, 10);
}

function getTag(n: Notification): NotifTag {
  if (n.type === "task_assigned" || n.type === "TASK_ASSIGNED") return TAGS.NEW_TASK;
  if (n.type === "deliverable_submitted") return TAGS.SUBMITTED;
  if (n.type === "assignment_sent") return TAGS.MEMBER_SENT;
  if (n.type === "stakeholder_project_accepted") return TAGS.STAKEHOLDER_SENT;
  if (n.type === "acceptance_email_sent") return TAGS.ACCEPTANCE_EMAIL;
  if (n.type === "stakeholder_confirmed") return TAGS.ACCEPTANCE_PASS;
  if (n.type === "stakeholder_revision_requested") return TAGS.ACCEPTANCE_REVISION;
  if (n.type === "signoff_email_sent") return TAGS.SIGNOFF_MAIL;
  if (n.type === "signoff_passed") return TAGS.SIGNOFF_PASS;
  if (n.type === "signoff_revision_requested") return TAGS.SIGNOFF_REVISION;
  if (n.type === "project_auto_completed") return TAGS.COMPLETED;
  if (n.type === "project_canceled") return TAGS.PROJECT_CANCELED;
  if (n.type === "review_pending" || n.type === "REVIEW_REQUESTED") return TAGS.PENDING_REVIEW;
  if (n.type === "pending_assign") return TAGS.PENDING_ASSIGN;
  if (n.type === "task_completed" || n.type === "TASK_COMPLETED") return TAGS.COMPLETED;
  return { text: "通知", color: "#8a8a96", bg: "#f5f5f7" };
}

function detailsForNotification(n: Notification): Array<{ label: string; value: string }> {
  if (n.type === "assignment_sent") {
    return [
      { label: "项目名称", value: n.projectName || n.projectCode || "-" },
      { label: "被分配成员", value: n.receiverName || "-" },
      { label: "承诺交付时间", value: toYmd(n.internalDueDate) },
      { label: "对外承诺交付日期", value: toYmd(n.committedDeliveryDate || n.stakeholderExpectedDueDate || n.clientDueDate) },
      { label: "通知方式", value: "系统通知 / 邮件模拟" },
      { label: "发送状态", value: n.notificationStatus || "已发送" },
    ];
  }
  if (n.type === "task_assigned" || n.type === "TASK_ASSIGNED") {
    return [
      { label: "项目名称", value: n.projectName || n.projectCode || "-" },
      { label: "Brief 摘要", value: n.briefSummary || "-" },
      { label: "分配人", value: n.senderName || "-" },
      { label: "承诺交付时间", value: toYmd(n.internalDueDate) },
      { label: "对外承诺交付日期", value: toYmd(n.committedDeliveryDate || n.stakeholderExpectedDueDate || n.clientDueDate) },
      { label: "分配备注", value: (n.assignNote || "-").trim() || "-" },
      { label: "通知状态", value: n.notificationStatus || (n.isRead ? "已读" : "未读") },
    ];
  }
  if (n.type === "stakeholder_project_accepted") {
    return [
      { label: "收件人", value: `${n.receiverName || "-"} / ${n.receiverEmail || "-"}` },
      { label: "项目编号", value: n.projectCode || "-" },
      { label: "项目名称", value: n.projectName || "-" },
      { label: "当前状态", value: n.projectStatus || "制作中" },
      { label: "执行团队", value: n.workTeam || "-" },
      { label: "对外承诺交付日期", value: toYmd(n.committedDeliveryDate) },
    ];
  }
  if (n.type === "acceptance_email_sent") {
    const baseOrigin = typeof window === "undefined" ? "https://themix.example.com" : window.location.origin;
    return [
      { label: "收件人 / 需求方", value: `${n.receiverName || "-"} / ${n.receiverEmail || "-"}` },
      { label: "邮件标题", value: `请确认项目交付：${n.projectCode || "-"} - ${(n.projectName || "-").replace(`${n.projectCode || ""} `, "")}` },
      { label: "项目编号", value: n.projectCode || "-" },
      { label: "项目名称", value: (n.projectName || "-").replace(`${n.projectCode || ""} `, "") },
      { label: "当前状态", value: "待需求方审核" },
      { label: "对外承诺交付日期", value: toYmd(n.committedDeliveryDate) },
      { label: "最终 FA Link", value: n.faLink || "-" },
      { label: "Sign-off Link", value: n.signOffLink ? `${baseOrigin}${n.signOffLink}` : "-" },
      { label: "邮件备注", value: (n.acceptanceNote || "-").trim() || "-" },
    ];
  }
  if (n.type === "stakeholder_confirmed") {
    return [
      { label: "项目编号", value: n.projectCode || "-" },
      { label: "项目名称", value: n.projectName || "-" },
      { label: "回执时间", value: toYmd(n.stakeholderActionTime || n.createdAt) },
      { label: "当前状态", value: "待需求方审核" },
    ];
  }
  if (n.type === "stakeholder_revision_requested") {
    return [
      { label: "项目编号", value: n.projectCode || "-" },
      { label: "项目名称", value: n.projectName || "-" },
      { label: "回执时间", value: toYmd(n.stakeholderActionTime || n.createdAt) },
      { label: "期望重新提交时间", value: toYmd(n.resubmitExpectedDate) },
      { label: "修改意见", value: (n.stakeholderFeedback || "-").trim() || "-" },
      { label: "当前状态", value: "待需求方审核" },
    ];
  }
  if (n.type === "signoff_email_sent") {
    const baseOrigin = typeof window === "undefined" ? "https://themix.example.com" : window.location.origin;
    return [
      { label: "项目编号", value: n.projectCode || "-" },
      { label: "项目名称", value: n.projectName || "-" },
      { label: "交付物类型", value: n.deliverableType || "-" },
      { label: "提交版本", value: n.submissionVersion || "-" },
      { label: "当前状态", value: n.projectStatus || "-" },
      { label: "审核链接", value: n.signoffUrl ? `${baseOrigin}${n.signoffUrl}` : n.signOffLink ? `${baseOrigin}${n.signOffLink}` : "-" },
    ];
  }
  if (n.type === "deliverable_submitted") {
    return [
      { label: "项目编号", value: n.projectCode || "-" },
      { label: "项目名称", value: n.projectName || "-" },
      { label: "交付物类型", value: n.deliverableType || "-" },
      { label: "提交版本", value: n.submissionVersion || "-" },
      { label: "当前状态", value: n.projectStatus || "-" },
    ];
  }
  if (n.type === "signoff_passed") {
    return [
      { label: "项目编号", value: n.projectCode || "-" },
      { label: "项目名称", value: n.projectName || "-" },
      { label: "交付物类型", value: n.deliverableType || "-" },
      { label: "提交版本", value: n.submissionVersion || "-" },
      { label: "当前状态", value: n.projectStatus || "-" },
      { label: "通知内容", value: n.content || n.message || n.title },
    ];
  }
  if (n.type === "signoff_revision_requested") {
    return [
      { label: "项目编号", value: n.projectCode || "-" },
      { label: "项目名称", value: n.projectName || "-" },
      { label: "交付物类型", value: n.deliverableType || "-" },
      { label: "提交版本", value: n.submissionVersion || "-" },
      { label: "当前状态", value: n.projectStatus || "-" },
      { label: "需求方反馈", value: (n.stakeholderFeedback || "-").trim() || "-" },
    ];
  }
  if (n.type === "project_auto_completed" || n.type === "project_canceled") {
    return [
      { label: "项目编号", value: n.projectCode || "-" },
      { label: "项目名称", value: n.projectName || "-" },
      { label: "当前状态", value: n.projectStatus || "-" },
      { label: "通知内容", value: n.content || n.message || n.title },
    ];
  }
  return [];
}

export default function NotificationsPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const router = useRouter();
  const { notifications, notifViewerUserId, setNotifViewerUserId, markNotifRead, markAllNotifsRead } = useStore();
  const viewerUserId = notifViewerUserId || USERS[0]?.id || "";
  const viewer = USERS.find(u => u.id === viewerUserId) || null;
  const viewerName = (viewer?.name as IdentityName) || "张磊";
  const baseOrigin = typeof window === "undefined" ? "https://themix.example.com" : window.location.origin;

  const [tab, setTab] = useState<ViewTab>("MINE");
  const [identityOpen, setIdentityOpen] = useState(false);
  const [preview, setPreview] = useState<Notification | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIdentityOpen(false);
    };
    if (identityOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [identityOpen]);

  const receiverNotifs = useMemo(() => {
    return notifications
      .filter(n => getReceiverId(n) === viewerUserId)
      .filter(n => !isSentRecord(n))
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  }, [notifications, viewerUserId]);

  const sentNotifs = useMemo(() => {
    return notifications
      .filter(n => n.senderId === viewerUserId && isSentRecord(n))
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  }, [notifications, viewerUserId]);

  const unreadCount = receiverNotifs.filter(isUnreadForReceiver).length;

  const ActionButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button
      type="button"
      className="transition-colors"
      style={{
        height: 30,
        padding: "0 12px",
        borderRadius: 10,
        background: "#ffffff",
        border: "1px solid #e8e8ec",
        fontSize: 12,
        fontWeight: 700,
        color: "#1a1a2e",
        cursor: "pointer",
      }}
      onClick={e => {
        e.stopPropagation();
        onClick();
      }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#fafafa")}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#ffffff")}
    >
      {label}
    </button>
  );

  const NotifItem = ({ n, isLast }: { n: Notification; isLast: boolean }) => {
    const readState = isReadState(n);
    const tag = getTag(n);
    const details = detailsForNotification(n);
    return (
      <div
        className="flex items-start gap-[14px] cursor-pointer transition-colors"
        style={{
          padding: "16px 22px",
          borderBottom: isLast ? "none" : "1px solid #f0f0f2",
          borderLeft: !readState ? `3px solid ${BRAND_RED}` : "3px solid transparent",
          backgroundColor: !readState ? "rgba(231,76,60,0.04)" : "transparent",
        }}
        onClick={() => {
          if (!isSentRecord(n)) markNotifRead(n.id);
        }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = !readState ? "rgba(231,76,60,0.06)" : "#fafafa")}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = !readState ? "rgba(231,76,60,0.04)" : "transparent")}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-[10px]" style={{ marginBottom: 5 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#1a1a2e" }}>{n.title}</span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 99, backgroundColor: tag.bg, color: tag.color }}>{tag.text}</span>
          </div>
          <div style={{ fontSize: 13, color: "#52525b", lineHeight: 1.6 }}>{n.content || n.message || ""}</div>

          {details.length ? (
            <div style={{ marginTop: 10, background: "#f5f5f7", border: "1px solid #e8e8ec", borderRadius: 12, padding: "10px 12px" }}>
              {details.map(row => (
                <div
                  key={`${n.id}-${row.label}`}
                  style={{
                    padding: "4px 0",
                    lineHeight: 1.55,
                    maxWidth: 640,
                  }}
                >
                  <span style={{ fontSize: 12, color: "#8a8a96", fontWeight: 650 }}>
                    {row.label}：
                  </span>
                  <span style={{ fontSize: 12, color: "#1a1a2e", fontWeight: 600, marginLeft: 6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          {(n.type === "task_assigned" || n.type === "TASK_ASSIGNED") ? (
            <div className="flex items-center gap-[10px]" style={{ marginTop: 10 }}>
              <ActionButton
                label={n.actionText || "查看任务"}
                onClick={() => {
                  markNotifRead(n.id);
                  if (onNavigate) onNavigate("my-tasks");
                  else console.log("[Demo] 跳转：我的任务", { projectId: n.projectId });
                }}
              />
            </div>
          ) : null}

          {n.type === "assignment_sent" ? (
            <div className="flex items-center gap-[10px]" style={{ marginTop: 10 }}>
              <ActionButton
                label="查看项目"
                onClick={() => openNotificationTarget(n, "tasks")}
              />
              <ActionButton
                label={n.actionText || "查看通知内容"}
                onClick={() => setPreview(n)}
              />
            </div>
          ) : null}

          {n.type === "stakeholder_project_accepted" ? (
            <div className="flex items-center gap-[10px]" style={{ marginTop: 10 }}>
              <ActionButton
                label={n.actionText || "查看通知内容"}
                onClick={() => setPreview(n)}
              />
            </div>
          ) : null}

          {n.type === "acceptance_email_sent" ? (
            <div className="flex items-center gap-[10px]" style={{ marginTop: 10 }}>
              <ActionButton
                label={n.actionText || "查看通知内容"}
                onClick={() => setPreview(n)}
              />
              <ActionButton
                label={n.secondaryActionText || "打开 Sign-off 模拟"}
                onClick={() => {
                  const target = n.secondaryActionTarget || n.signOffLink || "";
                  if (target) router.push(target);
                }}
              />
            </div>
          ) : null}

          {(n.type === "stakeholder_confirmed" || n.type === "stakeholder_revision_requested") ? (
            <div className="flex items-center gap-[10px]" style={{ marginTop: 10 }}>
              <ActionButton
                label={n.actionText || "去处理"}
                onClick={() => {
                  markNotifRead(n.id);
                  if (onNavigate && n.actionTarget) onNavigate(n.actionTarget);
                }}
              />
            </div>
          ) : null}

          {(n.type === "deliverable_submitted" || n.type === "signoff_email_sent" || n.type === "signoff_passed" || n.type === "signoff_revision_requested" || n.type === "project_auto_completed" || n.type === "project_canceled") ? (
            <div className="flex items-center gap-[10px]" style={{ marginTop: 10 }}>
              <ActionButton
                label={n.actionText || (n.actionTarget === "tasks" ? "查看项目" : "查看任务")}
                onClick={() => {
                  markNotifRead(n.id);
                  openNotificationTarget(n, n.actionTarget === "tasks" ? "tasks" : "my-tasks");
                }}
              />
              {getNotificationSignoffTarget(n) ? (
                <ActionButton
                  label={n.secondaryActionText || "打开审核页"}
                  onClick={() => openSignoffPage(n)}
                />
              ) : null}
            </div>
          ) : null}

          <div style={{ fontSize: 12, color: "#8a8a96", marginTop: 8, fontWeight: 500 }}>{timeAgo(n.createdAt)}</div>
        </div>
      </div>
    );
  };

  const openSignoffPage = (notification: Notification) => {
    const target = getNotificationSignoffTarget(notification);
    if (!target) return;
    router.push(target);
  };

  const openNotificationTarget = (notification: Notification, fallback: string) => {
    const target = getNotificationAppTarget(notification);
    if (target && onNavigate) {
      onNavigate(target);
      return;
    }
    if (onNavigate) onNavigate(fallback);
  };

  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: "32px 48px" }}>
      {preview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.55)" }} onClick={() => setPreview(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: "min(860px, calc(100vw - 96px))", maxHeight: "calc(100vh - 64px)", background: "#fff", borderRadius: 18, border: "1px solid #e8e8ec", boxShadow: "0 22px 60px rgba(15, 23, 42, 0.18)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div className="flex items-start justify-between" style={{ padding: "18px 18px", borderBottom: "1px solid #f0f0f2" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#111827" }}>
                  {preview.type === "stakeholder_project_accepted"
                    ? "项目受理邮件预览"
                    : preview.type === "acceptance_email_sent"
                      ? "审核邮件预览"
                      : "交付任务通知预览"}
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280", fontWeight: 700 }}>
                  {(preview.type === "stakeholder_project_accepted" || preview.type === "acceptance_email_sent")
                    ? `收件人：${preview.receiverName || "-"} / ${preview.receiverEmail || "-"}`
                    : `收件人：${preview.receiverName || "-"}`
                  }
                </div>
              </div>
              <button type="button" onClick={() => setPreview(null)} style={{ width: 36, height: 36, borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: 18, cursor: "pointer" }}>×</button>
            </div>

            <div style={{ padding: 18, overflowY: "auto" }}>
              {preview.type === "stakeholder_project_accepted" ? (
                <div style={{ fontSize: 13, color: "#111827", lineHeight: 1.75 }}>
                  <div style={{ fontWeight: 900, marginBottom: 10 }}>{preview.content || preview.message || preview.title}</div>
                  <div>项目编号：{preview.projectCode || "-"}</div>
                  <div>项目名称：{preview.projectName || "-"}</div>
                  <div>当前状态：{preview.projectStatus || "制作中"}</div>
                  <div>执行团队：{preview.workTeam || "-"}</div>
                  <div>项目管理员：张磊</div>
                  <div style={{ marginTop: 10 }}>对外承诺交付日期：{toYmd(preview.committedDeliveryDate)}</div>
                  <div style={{ marginTop: 10, fontWeight: 900 }}>Brief 摘要：</div>
                  <div style={{ whiteSpace: "pre-wrap" }}>{preview.briefSummary || "-"}</div>
                  <div style={{ marginTop: 10, fontWeight: 900 }}>交付物：</div>
                  <div style={{ whiteSpace: "pre-wrap" }}>{preview.deliverablesSummary || "-"}</div>
                </div>
              ) : preview.type === "acceptance_email_sent" ? (
                <div style={{ fontSize: 13, color: "#111827", lineHeight: 1.75 }}>
                  <div style={{ fontWeight: 900, marginBottom: 10 }}>请确认项目交付：{preview.projectCode || "-"} - {(preview.projectName || "-").replace(`${preview.projectCode || ""} `, "")}</div>
                  <div>项目编号：{preview.projectCode || "-"}</div>
                  <div>项目名称：{preview.projectName ? preview.projectName.replace(`${preview.projectCode || ""} `, "") : "-"}</div>
                  <div>当前状态：待需求方审核</div>
                  <div style={{ marginTop: 10 }}>对外承诺交付日期：{toYmd(preview.committedDeliveryDate)}</div>
                  <div style={{ marginTop: 10, fontWeight: 900 }}>最终 FA Link：</div>
                  <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{preview.faLink || "-"}</div>
                  <div style={{ marginTop: 10, fontWeight: 900 }}>审核说明：</div>
                  <div style={{ whiteSpace: "pre-wrap" }}>{(preview.acceptanceNote || "-").trim() || "-"}</div>
                  <div style={{ marginTop: 10, fontWeight: 900 }}>Sign-off Link：</div>
                  <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{preview.signOffLink ? `${baseOrigin}${preview.signOffLink}` : "-"}</div>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "#111827", lineHeight: 1.75 }}>
                  <div style={{ fontWeight: 900, marginBottom: 10 }}>{preview.title}</div>
                  <div>项目名称：{preview.projectName || preview.projectCode || "-"}</div>
                  <div style={{ marginTop: 10, fontWeight: 900 }}>Brief 摘要：</div>
                  <div style={{ whiteSpace: "pre-wrap" }}>{preview.briefSummary || "-"}</div>
                  <div style={{ marginTop: 10 }}>分配人：{preview.senderName || "张磊"}</div>
                  <div>承诺交付时间：{toYmd(preview.internalDueDate)}</div>
                  <div>对外承诺交付日期：{toYmd(preview.committedDeliveryDate || preview.stakeholderExpectedDueDate || preview.clientDueDate)}</div>
                  <div style={{ marginTop: 10, fontWeight: 900 }}>分配备注：</div>
                  <div style={{ whiteSpace: "pre-wrap" }}>{(preview.assignNote || "-").trim() || "-"}</div>
                </div>
              )}
            </div>

            {preview.type === "acceptance_email_sent" ? (
              <div className="flex items-center justify-end gap-[10px]" style={{ padding: "14px 18px", borderTop: "1px solid #f0f0f2" }}>
                <button
                  type="button"
                  onClick={() => {
                    openSignoffPage(preview);
                  }}
                  style={{ height: 36, padding: "0 14px", borderRadius: 12, background: "#2563eb", border: "none", color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer" }}
                >
                  打开 Sign-off 模拟
                </button>
              </div>
            ) : preview.type !== "stakeholder_project_accepted" ? (
              <div className="flex items-center justify-end gap-[10px]" style={{ padding: "14px 18px", borderTop: "1px solid #f0f0f2" }}>
                {getNotificationSignoffTarget(preview) ? (
                  <button
                    type="button"
                    onClick={() => {
                      markNotifRead(preview.id);
                      setPreview(null);
                      openSignoffPage(preview);
                    }}
                    style={{ height: 36, padding: "0 14px", borderRadius: 12, background: "#2563eb", border: "none", color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer" }}
                  >
                    打开审核页
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    markNotifRead(preview.id);
                    setPreview(null);
                    openNotificationTarget(preview, preview.actionTarget === "tasks" ? "tasks" : "my-tasks");
                  }}
                  style={{ height: 36, padding: "0 14px", borderRadius: 12, background: BRAND_RED, border: "none", color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer" }}
                >
                  {preview.actionText || (preview.actionTarget === "tasks" ? "查看项目" : "查看记录")}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      <div style={{ maxWidth: 820 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
          <div className="flex items-center gap-[10px]">
            <div style={{ fontSize: 13, fontWeight: 700, color: "#8a8a96" }}>当前身份</div>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                className="transition-colors"
                style={{
                  height: 36,
                  padding: "0 12px",
                  borderRadius: 10,
                  background: "#ffffff",
                  border: "1px solid #e8e8ec",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#1a1a2e",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
                onClick={() => setIdentityOpen(v => !v)}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#fafafa")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#ffffff")}
              >
                {viewerName}
                <span style={{ fontSize: 12, color: "#8a8a96", fontWeight: 800 }}>▼</span>
              </button>

              {identityOpen ? (
                <div style={{ position: "absolute", left: 0, top: 44, width: 220, background: "#fff", border: "1px solid #e8e8ec", borderRadius: 12, boxShadow: "0 14px 44px rgba(0,0,0,0.10)", overflow: "hidden", zIndex: 20 }}>
                  {IDENTITIES.map(u => (
                    <button
                      key={u.name}
                      type="button"
                      className="cursor-pointer transition-colors"
                      style={{ width: "100%", textAlign: "left", padding: "10px 12px", background: "#fff", border: "none", borderBottom: "1px solid #f5f5f7" }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#fafafa")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#fff")}
                      onClick={() => {
                        const user = USERS.find(x => x.name === u.name) || null;
                        if (user) setNotifViewerUserId(user.id);
                        setTab("MINE");
                        setIdentityOpen(false);
                      }}
                    >
                      <div className="flex items-center justify-between gap-[10px]">
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#1a1a2e" }}>{u.name}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#8a8a96" }}>{u.note}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {viewerName === "张磊" ? (
            <div
              className="flex items-center"
              style={{
                border: "1px solid #e8e8ec",
                borderRadius: 999,
                background: "#ffffff",
                overflow: "hidden",
              }}
            >
              <button
                type="button"
                className="transition-colors"
                onClick={() => setTab("MINE")}
                style={{
                  height: 34,
                  padding: "0 14px",
                  borderRadius: 999,
                  background: tab === "MINE" ? "#1a1a2e" : "transparent",
                  border: "none",
                  color: tab === "MINE" ? "#ffffff" : "#1a1a2e",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
                onMouseEnter={e => { if (tab !== "MINE") e.currentTarget.style.backgroundColor = "#fafafa"; }}
                onMouseLeave={e => { if (tab !== "MINE") e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                我的通知
              </button>
              <div style={{ width: 1, height: 22, background: "#e8e8ec" }} />
              <button
                type="button"
                className="transition-colors"
                onClick={() => setTab("SENT")}
                style={{
                  height: 34,
                  padding: "0 14px",
                  borderRadius: 999,
                  background: tab === "SENT" ? "#1a1a2e" : "transparent",
                  border: "none",
                  color: tab === "SENT" ? "#ffffff" : "#1a1a2e",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
                onMouseEnter={e => { if (tab !== "SENT") e.currentTarget.style.backgroundColor = "#fafafa"; }}
                onMouseLeave={e => { if (tab !== "SENT") e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                我发出的通知
              </button>
            </div>
          ) : null}
        </div>

        {((tab === "SENT" ? sentNotifs : receiverNotifs).length > 0) ? (
          <div style={{ marginBottom: 28 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1a1a2e" }}>{unreadCount} 条未读</h3>
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={markAllNotifsRead}
                  style={{ fontSize: 13, fontWeight: 600, color: BRAND_RED, background: "transparent", border: "none", cursor: "pointer" }}
                >
                  全部已读
                </button>
              ) : null}
            </div>

            {tab === "SENT" ? (
              <>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#8a8a96", marginBottom: 12 }}>发出的通知记录</h3>
                <div className="overflow-hidden" style={{ ...CARD }}>
                  {sentNotifs.map((n, i) => <NotifItem key={n.id} n={n} isLast={i === sentNotifs.length - 1} />)}
                </div>
              </>
            ) : (
              <>
                {receiverNotifs.filter(isUnreadForReceiver).length > 0 ? (
                  <div className="overflow-hidden" style={{ ...CARD, marginBottom: 18 }}>
                    {receiverNotifs.filter(isUnreadForReceiver).map((n, i, arr) => <NotifItem key={n.id} n={n} isLast={i === arr.length - 1} />)}
                  </div>
                ) : null}

                {receiverNotifs.filter(n => !isUnreadForReceiver(n)).length > 0 ? (
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "#8a8a96", marginBottom: 12 }}>历史通知</h3>
                    <div className="overflow-hidden" style={{ ...CARD }}>
                      {receiverNotifs.filter(n => !isUnreadForReceiver(n)).map((n, i, arr) => <NotifItem key={n.id} n={n} isLast={i === arr.length - 1} />)}
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#8a8a96", fontSize: 14 }}>暂无通知</div>
        )}
      </div>
    </div>
  );
}
