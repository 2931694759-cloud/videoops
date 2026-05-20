"use client";

import { useStore } from "@/lib/store";
import { USERS } from "@/lib/mock-data";
import { getTaskAssigneeIds } from "@/lib/taskAssignments";
import { STATUS_MAP, PRIORITY_MAP, CATEGORY_MAP, formatDate, getInitial } from "@/lib/utils";
import { useState } from "react";
import { makeId } from "@/lib/runtime";

const BRAND_RED = "#e74c3c";
const PANEL_BG = { background: "#ffffff" };

interface FrameComment {
  id: string;
  time: string;
  x?: number;
  y?: number;
  author: string;
  authorAvatar: string;
  text: string;
  createdAt: string;
}

const MOCK_FRAME_COMMENTS: FrameComment[] = [
  { id: "fc1", time: "0:15", x: 0.3, y: 0.4, author: "张磊", authorAvatar: "#5e6ad2", text: "这里 logo 的动画过渡需要更流畅一些，当前有明显的跳帧", createdAt: "2026-05-06T10:30:00Z" },
  { id: "fc2", time: "1:02", author: "张磊", authorAvatar: "#5e6ad2", text: "BGM 在这个节点转场有点突兀，建议加一个淡入淡出", createdAt: "2026-05-06T10:35:00Z" },
  { id: "fc3", time: "2:18", x: 0.7, y: 0.25, author: "张磊", authorAvatar: "#5e6ad2", text: "字幕位置偏高，下移 20px 左右", createdAt: "2026-05-06T10:40:00Z" },
];

export default function TaskDetailPanel({ taskId, onClose }: { taskId: string; onClose: () => void }) {
  const { tasks, reviews, currentUser, updateTask, addReview, addNotification } = useStore();
  const task = tasks.find(t => t.id === taskId);
  const taskReviews = reviews.filter(r => r.taskId === taskId).sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  const [comment, setComment] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [descDraft, setDescDraft] = useState("");
  const [workflowNotice, setWorkflowNotice] = useState<string | null>(null);

  const [faLink, setFaLink] = useState(task?.faLink || "");
  const [supportingLink, setSupportingLink] = useState(task?.supportingLink || "");
  const [estimatedCost, setEstimatedCost] = useState(task?.estimatedCost?.toString() || "");
  const [marketCost, setMarketCost] = useState(task?.marketCost?.toString() || "");

  const [frameComments, setFrameComments] = useState<FrameComment[]>(MOCK_FRAME_COMMENTS);
  const [fcText, setFcText] = useState("");
  const [fcTime, setFcTime] = useState("0:00");
  const [fcCoord, setFcCoord] = useState<{ x: number; y: number } | null>(null);
  const [scrubPos, setScrubPos] = useState(0.1);
  const [showFcInput, setShowFcInput] = useState(false);

  const isLeader = currentUser?.role === "LEADER";
  const isOwner = task?.assigneeId === currentUser?.id;
  if (!task) return null;
  const canEdit = isLeader || isOwner;
  const internalDueForDisplay = task.internalDueDate || task.dueDate || null;
  const blockedManualStatuses = new Set(["INTERNAL_REVIEW", "PENDING_SIGNOFF", "COMPLETED"]);

  const handleSubmitForReview = () => {
    setWorkflowNotice("旧内部审核入口已停用。请在“我的任务”中提交交付物，并通过新的需求方审核链路流转。");
  };

  const handleLegacyComplete = () => {
    setWorkflowNotice("旧签收完成入口已停用。项目完成状态会根据新的交付审核结果自动联动。");
  };

  const handleStatusChange = (nextStatus: string) => {
    if (blockedManualStatuses.has(nextStatus)) {
      setWorkflowNotice("旧审核状态流转已停用，请通过新的交付提交与需求方审核链路推进。");
      return;
    }
    if (nextStatus === "CANCELED") return;
    updateTask(taskId, { status: nextStatus });
  };

  const submitReview = (status: string) => {
    const nextText = status === "APPROVED"
      ? "旧审核通过入口已停用，请使用新的需求方审核结果回写链路。"
      : "旧退回入口已停用，请使用新的需求方审核结果回写链路。";
    setWorkflowNotice(nextText);
    setComment("");
    setTimestamp("");
  };

  const saveCostField = (field: string, value: string) => {
    const numVal = value ? parseFloat(value) : null;
    updateTask(taskId, { [field]: field.includes("Link") ? (value || null) : numVal });
  };

  const costSaving = (() => {
    const est = parseFloat(estimatedCost);
    const mkt = parseFloat(marketCost);
    if (!isNaN(est) && !isNaN(mkt) && mkt > 0) {
      return Math.round(((mkt - est) / mkt) * 100);
    }
    return null;
  })();

  const handleScrubClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setScrubPos(pos);
    const totalSec = Math.round(pos * 180);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    setFcTime(`${m}:${String(s).padStart(2, "0")}`);
    setShowFcInput(true);
    setFcCoord(null);
  };

  const handleVideoClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setFcCoord({ x, y });
    setShowFcInput(true);
  };

  const submitFrameComment = () => {
    if (!fcText.trim() || !currentUser) return;
    const newFc: FrameComment = {
      id: makeId("fc"),
      time: fcTime,
      x: fcCoord?.x,
      y: fcCoord?.y,
      author: currentUser.name,
      authorAvatar: currentUser.avatar,
      text: fcText,
      createdAt: new Date().toISOString(),
    };
    setFrameComments(prev => [newFc, ...prev]);
    setFcText("");
    setFcCoord(null);
    setShowFcInput(false);
  };

  const reviewLabels: Record<string, { t: string; color: string; bg: string }> = {
    PENDING: { t: "待审核", color: "#c0592b", bg: "#fff3eb" },
    APPROVED: { t: "已通过", color: "#1a7a4a", bg: "#ebfff0" },
    REVISION_REQUESTED: { t: "需修改", color: BRAND_RED, bg: "rgba(231,76,60,0.08)" },
  };

  const selectStyle = {
    width: "100%", height: 40, padding: "0 12px",
    backgroundColor: "#ffffff", border: "1px solid #d0d0d6",
    borderRadius: 8, fontSize: 13, color: "#1a1a2e", outline: "none",
  };

  const inputStyle = {
    width: "100%", height: 40, padding: "0 12px",
    backgroundColor: "#ffffff", border: "1px solid #d0d0d6",
    borderRadius: 8, fontSize: 13, color: "#1a1a2e", outline: "none",
  };

  const btnPrimary = {
    width: "100%", height: 42, borderRadius: 8, fontSize: 14, fontWeight: 600,
    color: "#fff", background: BRAND_RED,
    boxShadow: "0 2px 6px rgba(231,76,60,0.3)", cursor: "pointer", border: "none",
  };

  const markerDots = frameComments.filter(c => c.time).map(c => {
    const parts = c.time.split(":");
    const sec = parseInt(parts[0]) * 60 + parseInt(parts[1] || "0");
    return { ...c, pct: sec / 180 };
  });

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex flex-col" style={{ width: 520, ...PANEL_BG, borderLeft: "1px solid #e8e8ec", boxShadow: "-8px 0 30px rgba(0,0,0,0.08)", animation: "slideIn .2s ease" }}>
        <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

        <div className="flex items-center justify-between shrink-0" style={{ padding: "0 24px", height: 56, borderBottom: "1px solid #e8e8ec" }}>
          <div className="flex items-center gap-[8px]">
            <span style={{ fontSize: 13, fontWeight: 500, color: "#8a8a96", fontFamily: "monospace" }}>{task.taskNumber}</span>
            {task.projectCode && <span style={{ fontSize: 12, fontWeight: 500, color: BRAND_RED, fontFamily: "monospace" }}>{task.projectCode}</span>}
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#8a8a96", background: "transparent", border: "none", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f5f5f7")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
          >×</button>
        </div>

        <div className="flex-1 overflow-y-auto" style={{ padding: "28px 28px" }}>

          {workflowNotice ? (
            <div style={{ marginBottom: 16, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(245,158,11,0.22)", background: "rgba(245,158,11,0.08)", color: "#b45309", fontSize: 12, fontWeight: 800, lineHeight: 1.7 }}>
              {workflowNotice}
            </div>
          ) : null}

          {editingTitle ? (
            <input autoFocus value={titleDraft} onChange={e => setTitleDraft(e.target.value)}
              onBlur={() => { updateTask(taskId, { title: titleDraft }); setEditingTitle(false); }}
              onKeyDown={e => { if (e.key === "Enter") { updateTask(taskId, { title: titleDraft }); setEditingTitle(false); } }}
              style={{ width: "100%", fontSize: 19, fontWeight: 700, color: "#1a1a2e", border: "none", borderBottom: `2px solid ${BRAND_RED}`, outline: "none", background: "transparent", paddingBottom: 4, marginBottom: 18 }}
            />
          ) : (
            <h2
              style={{ fontSize: 19, fontWeight: 700, color: "#1a1a2e", lineHeight: 1.4, marginBottom: 18, cursor: canEdit ? "pointer" : "default" }}
              onClick={() => { if (canEdit) { setTitleDraft(task.title); setEditingTitle(true); } }}
            >{task.title}</h2>
          )}

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#8a8a96", marginBottom: 8 }}>描述</div>
            {editingDesc ? (
              <textarea autoFocus value={descDraft} onChange={e => setDescDraft(e.target.value)}
                onBlur={() => { updateTask(taskId, { description: descDraft || null }); setEditingDesc(false); }}
                rows={4}
                style={{ width: "100%", padding: "12px 14px", backgroundColor: "#ffffff", border: "1px solid #d0d0d6", borderRadius: 8, fontSize: 13, color: "#1a1a2e", outline: "none", resize: "none", lineHeight: 1.6 }}
              />
            ) : (
              <div
                style={{ fontSize: 13, color: "#52525b", lineHeight: 1.7, cursor: canEdit ? "pointer" : "default", padding: canEdit ? "10px 12px" : 0, borderRadius: 8, transition: "background-color 0.15s" }}
                onClick={() => { if (canEdit) { setDescDraft(task.description || ""); setEditingDesc(true); } }}
                onMouseEnter={e => { if (canEdit) e.currentTarget.style.backgroundColor = "#f5f5f7"; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                {task.description || <span style={{ color: "#a1a1aa", fontStyle: "italic" }}>点击添加描述…</span>}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-[12px]" style={{ marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#8a8a96", marginBottom: 6 }}>状态</div>
              <select value={task.status} onChange={e => handleStatusChange(e.target.value)} disabled={!canEdit} style={{ ...selectStyle, opacity: canEdit ? 1 : 0.6 }}>
                {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k} disabled={k === "INTERNAL_REVIEW" || k === "PENDING_SIGNOFF" || k === "COMPLETED" || k === "CANCELED"}>{v}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#8a8a96", marginBottom: 6 }}>负责人</div>
              <select value={task.assigneeId || ""} onChange={e => updateTask(taskId, { assigneeId: e.target.value || null, primaryAssigneeId: e.target.value || null, assigneeIds: e.target.value ? [e.target.value] : [] })} disabled={!isLeader} style={{ ...selectStyle, opacity: isLeader ? 1 : 0.6 }}>
                <option value="">未指派</option>
                {USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#8a8a96", marginBottom: 6 }}>优先级</div>
              <select value={task.priority} onChange={e => updateTask(taskId, { priority: e.target.value })} disabled={!isLeader} style={{ ...selectStyle, opacity: isLeader ? 1 : 0.6 }}>
                {Object.entries(PRIORITY_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#8a8a96", marginBottom: 6 }}>类型</div>
              <select value={task.category} onChange={e => updateTask(taskId, { category: e.target.value })} disabled={!isLeader} style={{ ...selectStyle, opacity: isLeader ? 1 : 0.6 }}>
                {Object.entries(CATEGORY_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#8a8a96", marginBottom: 6 }}>时间安排</div>

            <div className="grid grid-cols-2 gap-[12px]">
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#8a8a96", marginBottom: 6 }}>对外承诺交付日期</div>
                <input
                  type="date"
                  value={task.committedDeliveryDate ? String(task.committedDeliveryDate).slice(0, 10) : ""}
                  onChange={e => updateTask(taskId, { committedDeliveryDate: e.target.value || null })}
                  disabled={!isLeader}
                  style={{ ...selectStyle, opacity: isLeader ? 1 : 0.6 }}
                />
                {task.committedDeliveryDate && <div style={{ fontSize: 12, color: "#8a8a96", marginTop: 6 }}>{formatDate(task.committedDeliveryDate)}</div>}
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#8a8a96", marginBottom: 6 }}>内部交付日期</div>
                <input
                  type="date"
                  value={internalDueForDisplay ? String(internalDueForDisplay).slice(0, 10) : ""}
                  onChange={e => updateTask(taskId, { dueDate: e.target.value || null, internalDueDate: e.target.value || null })}
                  disabled={!isLeader}
                  style={{ ...selectStyle, opacity: isLeader ? 1 : 0.6 }}
                />
                {internalDueForDisplay && <div style={{ fontSize: 12, color: "#8a8a96", marginTop: 6 }}>{formatDate(internalDueForDisplay)}</div>}
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #f0f0f2", paddingTop: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e", marginBottom: 14 }}>交付与成本</div>
            <div className="flex flex-col gap-[12px]">
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#8a8a96", marginBottom: 6 }}>FA 成品链接</div>
                <input value={faLink} onChange={e => setFaLink(e.target.value)} onBlur={() => saveCostField("faLink", faLink)} placeholder="粘贴成品链接…" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#8a8a96", marginBottom: 6 }}>支持素材链接</div>
                <input value={supportingLink} onChange={e => setSupportingLink(e.target.value)} onBlur={() => saveCostField("supportingLink", supportingLink)} placeholder="Stakeholder 提供的素材链接…" style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-[12px]">
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#8a8a96", marginBottom: 6 }}>预估成本（元）</div>
                  <input type="number" value={estimatedCost} onChange={e => setEstimatedCost(e.target.value)} onBlur={() => saveCostField("estimatedCost", estimatedCost)} placeholder="0" style={inputStyle} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#8a8a96", marginBottom: 6 }}>市场均价（元）</div>
                  <input type="number" value={marketCost} onChange={e => setMarketCost(e.target.value)} onBlur={() => saveCostField("marketCost", marketCost)} placeholder="0" style={inputStyle} />
                </div>
              </div>
              {costSaving !== null && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, backgroundColor: costSaving > 0 ? "#ebfff0" : "rgba(231,76,60,0.06)" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: costSaving > 0 ? "#1a7a4a" : BRAND_RED }}>
                    {costSaving > 0 ? `节省 ${costSaving}%` : `超出 ${Math.abs(costSaving)}%`}
                  </span>
                  <span style={{ fontSize: 12, color: "#8a8a96" }}>
                    （预估 ¥{estimatedCost} / 市场 ¥{marketCost}）
                  </span>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            {task.status === "BRIEF_REVIEW" && canEdit && (
              <button onClick={() => updateTask(taskId, { status: "WIP" })} style={btnPrimary}>
                开始制作
              </button>
            )}
            {task.status === "WIP" && (isOwner || isLeader) && (
              <button onClick={handleSubmitForReview} style={btnPrimary}>
                按新链路提交交付物
              </button>
            )}
            {task.status === "INTERNAL_REVIEW" && isLeader && (
              <div className="flex gap-[10px]">
                <button onClick={() => submitReview("APPROVED")} style={{ flex: 1, height: 42, borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#fff", backgroundColor: "#1a7a4a", border: "none", cursor: "pointer" }}>
                  旧通过入口已停用
                </button>
                <button onClick={() => submitReview("REVISION_REQUESTED")} style={{ flex: 1, height: 42, borderRadius: 8, fontSize: 14, fontWeight: 600, color: BRAND_RED, backgroundColor: "transparent", border: `1px solid ${BRAND_RED}`, cursor: "pointer" }}>
                  旧退回入口已停用
                </button>
              </div>
            )}
            {task.status === "PENDING_SIGNOFF" && (isLeader) && (
              <button onClick={handleLegacyComplete} style={{ ...btnPrimary, background: "#1a7a4a", boxShadow: "0 2px 6px rgba(26,122,74,0.3)" }}>
                旧完成入口已停用
              </button>
            )}
            {task.status !== "COMPLETED" && task.status !== "CANCELED" && canEdit && (
              <button onClick={() => updateTask(taskId, { status: "CANCELED" })}
                style={{ width: "100%", height: 36, borderRadius: 8, fontSize: 13, fontWeight: 500, color: "#8a8a96", backgroundColor: "transparent", border: "1px solid #d0d0d6", cursor: "pointer", marginTop: 10 }}
                onMouseEnter={e => { e.currentTarget.style.color = BRAND_RED; e.currentTarget.style.borderColor = BRAND_RED; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#8a8a96"; e.currentTarget.style.borderColor = "#d0d0d6"; }}
              >
                取消任务
              </button>
            )}
          </div>

          <div style={{ borderTop: "1px solid #f0f0f2", paddingTop: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e", marginBottom: 14 }}>视频预览与标注</div>

            <div
              onClick={handleVideoClick}
              style={{ position: "relative", width: "100%", aspectRatio: "16/9", backgroundColor: "#1a1a2e", borderRadius: 10, overflow: "hidden", cursor: "crosshair", marginBottom: 0 }}
            >
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 0, height: 0, borderLeft: "20px solid rgba(255,255,255,0.9)", borderTop: "12px solid transparent", borderBottom: "12px solid transparent", marginLeft: 4 }} />
                </div>
              </div>
              <div style={{ position: "absolute", top: 12, left: 14, fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.5)" }}>{task.taskNumber}</div>
              <div style={{ position: "absolute", bottom: 12, right: 14, fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>3:00</div>

              {fcCoord && (
                <div style={{ position: "absolute", left: `${fcCoord.x * 100}%`, top: `${fcCoord.y * 100}%`, transform: "translate(-50%,-50%)", width: 24, height: 24, borderRadius: "50%", backgroundColor: BRAND_RED, border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                  +
                </div>
              )}
              {frameComments.filter(c => c.x != null && c.y != null).map((c, i) => (
                <div key={c.id} style={{ position: "absolute", left: `${c.x! * 100}%`, top: `${c.y! * 100}%`, transform: "translate(-50%,-50%)", width: 22, height: 22, borderRadius: "50%", backgroundColor: BRAND_RED, border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700, boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }}>
                  {i + 1}
                </div>
              ))}
            </div>

            <div onClick={handleScrubClick} style={{ position: "relative", width: "100%", height: 32, cursor: "pointer", display: "flex", alignItems: "center", marginBottom: 14 }}>
              <div style={{ width: "100%", height: 4, backgroundColor: "#e8e8ec", borderRadius: 2, position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: 0, height: 4, width: `${scrubPos * 100}%`, backgroundColor: BRAND_RED, borderRadius: 2 }} />
                <div style={{ position: "absolute", left: `${scrubPos * 100}%`, top: "50%", transform: "translate(-50%,-50%)", width: 12, height: 12, borderRadius: "50%", backgroundColor: BRAND_RED, border: "2px solid #fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
                {markerDots.map(d => (
                  <div key={d.id} style={{ position: "absolute", left: `${d.pct * 100}%`, top: "50%", transform: "translate(-50%,-50%)", width: 8, height: 8, borderRadius: "50%", backgroundColor: d.x != null ? BRAND_RED : "#2558a6", border: "1.5px solid #fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                ))}
              </div>
            </div>

            {showFcInput && (
              <div style={{ padding: "12px 14px", backgroundColor: "rgba(231,76,60,0.04)", border: "1px solid rgba(231,76,60,0.2)", borderRadius: 10, marginBottom: 14 }}>
                <div className="flex items-center gap-[8px]" style={{ marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: BRAND_RED, backgroundColor: "rgba(231,76,60,0.1)", padding: "3px 10px", borderRadius: 6, fontFamily: "monospace" }}>@{fcTime}</span>
                  {fcCoord && <span style={{ fontSize: 12, fontWeight: 500, color: "#c0592b", backgroundColor: "#fff3eb", padding: "3px 10px", borderRadius: 6 }}>画面标注</span>}
                  <button onClick={() => { setShowFcInput(false); setFcCoord(null); }} style={{ marginLeft: "auto", fontSize: 13, color: "#8a8a96", background: "none", border: "none", cursor: "pointer" }}>取消</button>
                </div>
                <div className="flex gap-[8px]">
                  <input value={fcText} onChange={e => setFcText(e.target.value)} placeholder="输入标注评论…"
                    onKeyDown={e => { if (e.key === "Enter") submitFrameComment(); }}
                    style={{ flex: 1, height: 36, padding: "0 12px", backgroundColor: "#ffffff", border: "1px solid #d0d0d6", borderRadius: 6, fontSize: 13, color: "#1a1a2e", outline: "none" }}
                    autoFocus
                  />
                  <button onClick={submitFrameComment} style={{ height: 36, padding: "0 16px", borderRadius: 6, fontSize: 13, fontWeight: 600, color: "#fff", backgroundColor: BRAND_RED, border: "none", cursor: "pointer" }}>发送</button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-[10px]">
              {frameComments.map(fc => (
                <div key={fc.id} className="flex gap-[10px]" style={{ padding: "12px 14px", backgroundColor: "#f5f5f7", borderRadius: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", backgroundColor: fc.authorAvatar, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 600, flexShrink: 0, marginTop: 2 }}>
                    {getInitial(fc.author)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-[6px] flex-wrap" style={{ marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>{fc.author}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: BRAND_RED, backgroundColor: "rgba(231,76,60,0.08)", padding: "2px 7px", borderRadius: 5, fontFamily: "monospace" }}>@{fc.time}</span>
                      {fc.x != null && <span style={{ fontSize: 11, fontWeight: 500, color: "#c0592b", backgroundColor: "#fff3eb", padding: "2px 7px", borderRadius: 5 }}>画面标注</span>}
                    </div>
                    <div style={{ fontSize: 13, color: "#52525b", lineHeight: 1.6 }}>{fc.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: "1px solid #f0f0f2", paddingTop: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e", marginBottom: 14 }}>审核记录</div>
            {taskReviews.length === 0 ? (
              <div style={{ fontSize: 13, color: "#a1a1aa", padding: "28px 0", textAlign: "center", border: "1px dashed #d0d0d6", borderRadius: 8 }}>暂无审核记录</div>
            ) : (
              <div style={{ marginBottom: 18 }}>
                {taskReviews.map((r, idx) => {
                  const reviewer = USERS.find(u => u.id === r.reviewerId);
                  const label = reviewLabels[r.status];
                  return (
                    <div key={r.id}>
                      {idx > 0 && <div style={{ borderTop: "1px solid #f0f0f2", margin: "14px 0" }} />}
                      <div className="flex gap-[10px]">
                        <div style={{ width: 30, height: 30, borderRadius: "50%", backgroundColor: reviewer?.avatar || BRAND_RED, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 600, flexShrink: 0, marginTop: 2 }}>
                          {getInitial(reviewer?.name || "?")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-[8px]">
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>{reviewer?.name}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 99, backgroundColor: label?.bg, color: label?.color }}>{label?.t}</span>
                            <span style={{ fontSize: 12, color: "#a1a1aa", marginLeft: "auto" }}>{formatDate(r.createdAt)}</span>
                          </div>
                          {r.comment && (
                            <div style={{ fontSize: 13, color: "#52525b", marginTop: 6, lineHeight: 1.6 }}>
                              {r.timestamp && <span style={{ fontSize: 11, fontWeight: 600, color: BRAND_RED, backgroundColor: "rgba(231,76,60,0.08)", padding: "2px 7px", borderRadius: 5, fontFamily: "monospace", marginRight: 6 }}>@{r.timestamp}</span>}
                              {r.comment}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {isLeader && task.status === "INTERNAL_REVIEW" && (
              <div style={{ borderTop: "1px solid #f0f0f2", paddingTop: 18 }}>
                <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
                  style={{ width: "100%", padding: "10px 12px", backgroundColor: "#ffffff", border: "1px solid #d0d0d6", borderRadius: 8, fontSize: 13, color: "#1a1a2e", outline: "none", resize: "none", lineHeight: 1.6, marginBottom: 10 }}
                  placeholder="输入审核意见…"
                />
                <input value={timestamp} onChange={e => setTimestamp(e.target.value)}
                  style={{ width: 140, height: 34, padding: "0 12px", backgroundColor: "#ffffff", border: "1px solid #d0d0d6", borderRadius: 6, fontSize: 13, color: "#1a1a2e", fontFamily: "monospace", outline: "none", marginBottom: 14 }}
                  placeholder="时间点 如 1:23"
                />
                <div className="flex gap-[10px]">
                  <button onClick={() => submitReview("APPROVED")} style={{ flex: 1, height: 38, borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#fff", backgroundColor: "#1a7a4a", border: "none", cursor: "pointer" }}>旧通过入口已停用</button>
                  <button onClick={() => submitReview("REVISION_REQUESTED")} style={{ flex: 1, height: 38, borderRadius: 8, fontSize: 13, fontWeight: 600, color: BRAND_RED, backgroundColor: "transparent", border: `1px solid ${BRAND_RED}`, cursor: "pointer" }}>旧退回入口已停用</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
