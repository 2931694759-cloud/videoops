"use client";

import { useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import {
  USERS,
  type ProjectRecord,
  type Questionnaire,
  type SignoffRecord,
  type SubmissionRecord,
  type TypeTaskPackage,
} from "@/lib/mock-data";
import { getInitial } from "@/lib/utils";
import {
  getLatestTypeTaskPackageFeedback,
  getLatestTypeTaskPackageSubmission,
  getTypeTaskPackageSignoffHistory,
  getTypeTaskPackageSubmissions,
} from "@/lib/workflowSelectors";
import { ymdHmSlash, ymdSlash } from "@/lib/runtime";

const PAGE_BG = "#f6f7fb";
const TEXT_MAIN = "#111827";
const TEXT_SUB = "#6b7280";
const BORDER = "#e5e7eb";
const BORDER_WEAK = "#eef1f6";
const RED = "#ef4444";
const BLUE = "#2563eb";
const GREEN = "#16a34a";

const STATUS_ORDER = ["全部", "待提交", "待需求方审核", "需修改", "已通过", "已结束"] as const;
type StatusTab = (typeof STATUS_ORDER)[number];

type UploadFile = {
  id: string;
  name: string;
  size: number;
  type: string | null;
};

type TaskRow = {
  pkg: TypeTaskPackage;
  project: ProjectRecord | null;
  questionnaire: Questionnaire | null;
  latestSubmission: SubmissionRecord | null;
  signoffHistory: SignoffRecord[];
  latestFeedback: string | null;
};

function safeJsonParse(text: string | null) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getQuestionnaireMeta(questionnaire: Questionnaire | null) {
  if (!questionnaire) return null;
  const parsed = safeJsonParse(questionnaire.specialNotes || null);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
}

function extractLinks(questionnaire: Questionnaire | null) {
  const meta = getQuestionnaireMeta(questionnaire);
  const values = [
    ...(Array.isArray(meta?.materialLinks) ? meta.materialLinks : []),
    ...(Array.isArray(meta?.referenceLinks) ? meta.referenceLinks : []),
  ];
  return values
    .map(item => String(item || "").trim())
    .filter(Boolean);
}

function statusPillStyle(status: TypeTaskPackage["status"]) {
  if (status === "待提交") return { bg: "rgba(239,68,68,0.10)", color: RED };
  if (status === "待需求方审核") return { bg: "rgba(37,99,235,0.10)", color: BLUE };
  if (status === "需修改") return { bg: "rgba(245,158,11,0.16)", color: "#b45309" };
  if (status === "已通过") return { bg: "rgba(22,163,74,0.12)", color: GREEN };
  return { bg: "rgba(107,114,128,0.12)", color: TEXT_SUB };
}

function formatFileSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) return "-";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatFileType(file: { name: string; type: string | null }) {
  if (file.type && file.type.trim()) return file.type;
  const parts = file.name.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "未知类型";
}

function ModalShell({ children, onClose, maxWidth = 980 }: { children: ReactNode; onClose: () => void; maxWidth?: number }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div className="w-full" style={{ maxWidth, maxHeight: "calc(100vh - 56px)" }} onClick={e => e.stopPropagation()}>
        <div style={{ borderRadius: 26, background: "#fff", border: `1px solid ${BORDER_WEAK}`, boxShadow: "0 22px 60px rgba(15, 23, 42, 0.18)", overflow: "hidden" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function OutlineButton({ text, onClick, color = TEXT_MAIN }: { text: string; onClick: () => void; color?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ height: 34, padding: "0 12px", borderRadius: 10, background: "#fff", border: `1px solid ${BORDER}`, color, fontSize: 12, fontWeight: 900, cursor: "pointer", whiteSpace: "nowrap" }}
    >
      {text}
    </button>
  );
}

function PrimaryButton({ text, onClick, disabled = false }: { text: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 34,
        padding: "0 12px",
        borderRadius: 10,
        background: disabled ? "#d1d5db" : RED,
        color: "#fff",
        border: "none",
        fontSize: 12,
        fontWeight: 900,
        cursor: disabled ? "not-allowed" : "pointer",
        whiteSpace: "nowrap",
        boxShadow: disabled ? "none" : "0 10px 24px rgba(239,68,68,0.20)",
      }}
    >
      {text}
    </button>
  );
}

function SubmissionModal({
  row,
  onClose,
}: {
  row: TaskRow;
  onClose: () => void;
}) {
  const submitPackageDeliverable = useStore(s => s.submitPackageDeliverable);
  const currentUser = useStore(s => s.currentUser);
  const [submitNote, setSubmitNote] = useState("");
  const [actualWorkingHours, setActualWorkingHours] = useState(row.pkg.actualWorkingHours != null ? String(row.pkg.actualWorkingHours) : "");
  const [assetCategory, setAssetCategory] = useState(row.pkg.assetCategory || "");
  const [fileLinksText, setFileLinksText] = useState(row.pkg.fileLinks.join("\n"));
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePickFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const next = Array.from(event.target.files || []).map(file => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      name: file.name,
      size: file.size,
      type: file.type || null,
    }));
    setFiles(next);
  };

  const links = fileLinksText
    .split(/\r?\n/)
    .map(item => item.trim())
    .filter(Boolean);

  const submitLabel = row.pkg.status === "需修改" ? "确认重新提交" : "确认提交";

  return (
    <ModalShell onClose={onClose} maxWidth={920}>
      <div style={{ padding: "18px 20px", borderBottom: `1px solid ${BORDER_WEAK}` }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: TEXT_MAIN }}>{row.pkg.status === "需修改" ? "重新提交交付任务" : "提交交付任务"}</div>
        <div style={{ marginTop: 8, fontSize: 13, color: TEXT_SUB, lineHeight: 1.7 }}>
          提交后会生成新的版本记录与需求方审核链接，并同步更新任务状态。
        </div>
      </div>

      <div style={{ padding: 20, maxHeight: "calc(100vh - 210px)", overflowY: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14, padding: 16, background: PAGE_BG, border: `1px solid ${BORDER_WEAK}`, borderRadius: 16 }}>
          {[
            { k: "项目编号", v: row.project?.projectCode || "-" },
            { k: "项目名称", v: row.project?.projectName || "-" },
            { k: "交付物类型", v: row.pkg.deliverableType },
            { k: "承诺交付时间", v: ymdSlash(row.pkg.promisedAt) },
          ].map(item => (
            <div key={item.k}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 900 }}>{item.k}</div>
              <div style={{ marginTop: 6, fontSize: 14, color: TEXT_MAIN, fontWeight: 900 }}>{item.v}</div>
            </div>
          ))}
        </div>

        {row.pkg.latestFeedback ? (
          <div style={{ marginTop: 14, padding: 14, borderRadius: 14, border: "1px solid rgba(245,158,11,0.18)", background: "rgba(245,158,11,0.08)" }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#b45309" }}>最新需求方反馈</div>
            <div style={{ marginTop: 8, fontSize: 13, color: TEXT_MAIN, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{row.pkg.latestFeedback}</div>
          </div>
        ) : null}

        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: TEXT_MAIN }}>上传文件</div>
          <input type="file" multiple onChange={handlePickFiles} style={{ marginTop: 10, width: "100%" }} />
          {files.length > 0 ? (
            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
              {files.map(file => (
                <div key={file.id} style={{ padding: "10px 12px", borderRadius: 12, border: `1px solid ${BORDER}`, background: "#fff" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: TEXT_MAIN }}>{file.name}</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: TEXT_SUB }}>{formatFileType(file)} · {formatFileSize(file.size)}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: TEXT_MAIN }}>文件链接</div>
          <textarea
            value={fileLinksText}
            onChange={e => setFileLinksText(e.target.value)}
            placeholder="每行填写一个 HTTPS 链接"
            style={{ marginTop: 10, width: "100%", minHeight: 110, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "12px 14px", outline: "none", fontSize: 13, color: TEXT_MAIN, resize: "vertical", lineHeight: 1.6 }}
          />
          <div style={{ marginTop: 6, fontSize: 12, color: TEXT_SUB }}>上传文件和文件链接至少填写一项。</div>
        </div>

        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
          <label>
            <div style={{ fontSize: 13, fontWeight: 900, color: TEXT_MAIN }}>实际工时</div>
            <input
              value={actualWorkingHours}
              onChange={e => setActualWorkingHours(e.target.value)}
              placeholder="例如 6"
              style={{ marginTop: 10, width: "100%", height: 44, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "0 14px", outline: "none", fontSize: 13, color: TEXT_MAIN }}
            />
          </label>
          <label>
            <div style={{ fontSize: 13, fontWeight: 900, color: TEXT_MAIN }}>素材类别</div>
            <input
              value={assetCategory}
              onChange={e => setAssetCategory(e.target.value)}
              placeholder="例如 视频 / 平面 / 文案"
              style={{ marginTop: 10, width: "100%", height: 44, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "0 14px", outline: "none", fontSize: 13, color: TEXT_MAIN }}
            />
          </label>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: TEXT_MAIN }}>提交说明</div>
          <textarea
            value={submitNote}
            onChange={e => setSubmitNote(e.target.value)}
            placeholder="补充说明当前版本的交付内容或注意事项"
            style={{ marginTop: 10, width: "100%", minHeight: 110, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "12px 14px", outline: "none", fontSize: 13, color: TEXT_MAIN, resize: "vertical", lineHeight: 1.6 }}
          />
        </div>

        {error ? <div style={{ marginTop: 14, fontSize: 12, fontWeight: 900, color: RED }}>{error}</div> : null}
      </div>

      <div className="flex items-center justify-end gap-[10px]" style={{ padding: "16px 20px", borderTop: `1px solid ${BORDER_WEAK}` }}>
        <OutlineButton text="取消" onClick={onClose} />
        <PrimaryButton
          text={submitting ? "提交中..." : submitLabel}
          disabled={submitting}
          onClick={() => {
            setError(null);
            setSubmitting(true);
            const result = submitPackageDeliverable({
              typeTaskPackageId: row.pkg.id,
              uploadedFiles: files.length > 0 ? files.map(file => ({ name: file.name, size: file.size, type: file.type })) : undefined,
              fileLinks: links,
              submitNote,
              actualWorkingHours: actualWorkingHours.trim() ? Number(actualWorkingHours) : null,
              assetCategory,
              submittedById: currentUser?.id || null,
            });
            setSubmitting(false);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            onClose();
          }}
        />
      </div>
    </ModalShell>
  );
}

function DetailModal({ row, onClose, onSubmit }: { row: TaskRow; onClose: () => void; onSubmit: () => void }) {
  const history = getTypeTaskPackageSubmissions(row.pkg.id, useStore.getState().submissions);
  const resourceLinks = extractLinks(row.questionnaire);

  return (
    <ModalShell onClose={onClose} maxWidth={1040}>
      <div style={{ padding: "18px 20px", borderBottom: `1px solid ${BORDER_WEAK}` }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: TEXT_MAIN }}>{row.project?.projectCode || "-"} · {row.pkg.deliverableType}</div>
        <div style={{ marginTop: 8, fontSize: 13, color: TEXT_SUB, lineHeight: 1.7 }}>
          查看交付任务信息、需求方反馈与历史提交记录。
        </div>
      </div>

      <div style={{ padding: 20, maxHeight: "calc(100vh - 210px)", overflowY: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14, padding: 16, background: PAGE_BG, border: `1px solid ${BORDER_WEAK}`, borderRadius: 16 }}>
          {[
            { k: "项目名称", v: row.project?.projectName || "-" },
            { k: "品牌 / 团队", v: row.project?.brandTeam || "-" },
            { k: "需求方", v: row.questionnaire ? `${row.questionnaire.requesterName} / ${row.questionnaire.requesterEmail}` : "-" },
            { k: "承诺交付时间", v: ymdSlash(row.pkg.promisedAt) },
            { k: "当前状态", v: row.pkg.status },
            { k: "当前版本", v: row.pkg.currentVersion || "未提交" },
          ].map(item => (
            <div key={item.k}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 900 }}>{item.k}</div>
              <div style={{ marginTop: 6, fontSize: 14, color: TEXT_MAIN, fontWeight: 900, wordBreak: "break-word" }}>{item.v}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, display: "grid", gap: 16 }}>
          <section style={{ padding: 16, borderRadius: 16, border: `1px solid ${BORDER}`, background: "#fff" }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: TEXT_MAIN }}>交付物明细</div>
            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              {row.pkg.deliverableItems.map((item, index) => (
                <div key={`${item.name}-${index}`} style={{ padding: 12, borderRadius: 12, background: PAGE_BG, border: `1px solid ${BORDER_WEAK}` }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: TEXT_MAIN }}>{item.name || "暂无交付物明细"}</div>
                  <div style={{ marginTop: 6, fontSize: 12, color: TEXT_SUB, lineHeight: 1.7 }}>
                    数量 {item.quantity || 1} · 尺寸 {item.size || "-"} · 输出格式 {item.outputFormat || "-"} · 使用场景 {item.usageScenario || "-"}
                  </div>
                  {item.remark ? <div style={{ marginTop: 6, fontSize: 12, color: TEXT_MAIN, lineHeight: 1.7 }}>备注：{item.remark}</div> : null}
                </div>
              ))}
            </div>
          </section>

          <section style={{ padding: 16, borderRadius: 16, border: `1px solid ${BORDER}`, background: "#fff" }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: TEXT_MAIN }}>Brief 摘要</div>
            <div style={{ marginTop: 10, fontSize: 13, color: TEXT_MAIN, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{row.questionnaire?.description || "-"}</div>
            <div style={{ marginTop: 12, fontSize: 12, color: TEXT_SUB }}>需求方期望截止时间：{ymdSlash(row.questionnaire?.deadline || null)}</div>
          </section>

          <section style={{ padding: 16, borderRadius: 16, border: `1px solid ${BORDER}`, background: "#fff" }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: TEXT_MAIN }}>素材 / 参考链接</div>
            {resourceLinks.length > 0 ? (
              <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                {resourceLinks.map(link => (
                  <button key={link} type="button" onClick={() => window.open(link, "_blank")} style={{ textAlign: "left", padding: "10px 12px", borderRadius: 12, border: `1px solid ${BORDER}`, background: "#fff", color: BLUE, fontSize: 13, fontWeight: 800, cursor: "pointer", wordBreak: "break-word" }}>
                    {link}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ marginTop: 10, fontSize: 13, color: TEXT_SUB }}>当前 Brief 未填写素材或参考链接。</div>
            )}
          </section>

          <section style={{ padding: 16, borderRadius: 16, border: `1px solid ${BORDER}`, background: "#fff" }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: TEXT_MAIN }}>历史提交记录</div>
            {history.length > 0 ? (
              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {history.map(item => {
                  const signoff = row.signoffHistory.find(record => record.submissionId === item.id) || null;
                  const displayStatus: TypeTaskPackage["status"] =
                    item.result === "passed"
                      ? "已通过"
                      : item.result === "revision_requested"
                        ? "需修改"
                        : "待需求方审核";
                  return (
                    <div key={item.id} style={{ padding: 12, borderRadius: 12, background: PAGE_BG, border: `1px solid ${BORDER_WEAK}` }}>
                      <div className="flex items-center justify-between gap-[12px]">
                        <div style={{ fontSize: 13, fontWeight: 900, color: TEXT_MAIN }}>{item.version}</div>
                        <span style={{ fontSize: 12, fontWeight: 900, color: statusPillStyle(displayStatus).color }}>{displayStatus}</span>
                      </div>
                      <div style={{ marginTop: 6, fontSize: 12, color: TEXT_SUB }}>提交时间：{ymdHmSlash(item.submittedAt)}</div>
                      <div style={{ marginTop: 4, fontSize: 12, color: TEXT_SUB }}>提交人：{item.submittedBy || USERS.find(user => user.id === item.submitterId)?.name || "-"}</div>
                      {item.submitNote ? <div style={{ marginTop: 6, fontSize: 12, color: TEXT_MAIN, lineHeight: 1.7 }}>提交说明：{item.submitNote}</div> : null}
                      {item.fileLinks && item.fileLinks.length > 0 ? <div style={{ marginTop: 6, fontSize: 12, color: TEXT_MAIN }}>文件链接：{item.fileLinks.join(" / ")}</div> : null}
                      {item.uploadedFiles && item.uploadedFiles.length > 0 ? (
                        <div style={{ marginTop: 6, fontSize: 12, color: TEXT_MAIN }}>
                          上传文件：{item.uploadedFiles.map(file => file.name).join(" / ")}
                        </div>
                      ) : null}
                      {signoff ? (
                        <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 10, background: "#fff", border: `1px solid ${BORDER}` }}>
                          <div style={{ fontSize: 12, fontWeight: 900, color: TEXT_MAIN }}>审核结果：{signoff.result === "passed" ? "需求方通过" : "需求方退回修改"}</div>
                          <div style={{ marginTop: 4, fontSize: 12, color: TEXT_SUB }}>审核时间：{ymdHmSlash(signoff.reviewedAt)}</div>
                          <div style={{ marginTop: 4, fontSize: 12, color: TEXT_MAIN, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{signoff.feedback || "无补充意见"}</div>
                        </div>
                      ) : item.signoffUrl ? (
                        <div style={{ marginTop: 8, fontSize: 12, color: BLUE, fontWeight: 800 }}>审核链接：{item.signoffUrl}</div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ marginTop: 10, fontSize: 13, color: TEXT_SUB }}>当前还没有提交记录。</div>
            )}
          </section>
        </div>
      </div>

      <div className="flex items-center justify-end gap-[10px]" style={{ padding: "16px 20px", borderTop: `1px solid ${BORDER_WEAK}` }}>
        <OutlineButton text="关闭" onClick={onClose} />
        {(row.pkg.status === "待提交" || row.pkg.status === "需修改") ? (
          <PrimaryButton text={row.pkg.status === "需修改" ? "重新提交" : "提交交付物"} onClick={onSubmit} />
        ) : null}
      </div>
    </ModalShell>
  );
}

export default function MyTasks() {
  const {
    currentUser,
    projects,
    questionnaires,
    typeTaskPackages,
    submissions,
    signoffRecords,
  } = useStore();

  const [tab, setTab] = useState<StatusTab>("全部");
  const [search, setSearch] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [submitId, setSubmitId] = useState<string | null>(null);

  const questionnaireById = useMemo(() => new Map(questionnaires.map(item => [item.id, item] as const)), [questionnaires]);
  const projectById = useMemo(() => new Map(projects.map(item => [item.id, item] as const)), [projects]);

  const rows = useMemo<TaskRow[]>(() => {
    return typeTaskPackages
      .filter(pkg => pkg.assigneeId === currentUser?.id)
      .map(pkg => {
        const project = projectById.get(pkg.projectId) || null;
        const questionnaire = questionnaireById.get(pkg.briefId) || null;
        return {
          pkg,
          project,
          questionnaire,
          latestSubmission: getLatestTypeTaskPackageSubmission(pkg.id, submissions),
          signoffHistory: getTypeTaskPackageSignoffHistory(pkg.id, signoffRecords),
          latestFeedback: getLatestTypeTaskPackageFeedback(pkg, signoffRecords),
        };
      })
      .sort((a, b) => String(b.pkg.updatedAt || "").localeCompare(String(a.pkg.updatedAt || "")));
  }, [currentUser?.id, projectById, questionnaireById, signoffRecords, submissions, typeTaskPackages]);

  const counts = useMemo(() => {
    return {
      全部: rows.length,
      待提交: rows.filter(row => row.pkg.status === "待提交").length,
      待需求方审核: rows.filter(row => row.pkg.status === "待需求方审核").length,
      需修改: rows.filter(row => row.pkg.status === "需修改").length,
      已通过: rows.filter(row => row.pkg.status === "已通过").length,
      已结束: rows.filter(row => row.pkg.status === "已结束").length,
    } as Record<StatusTab, number>;
  }, [rows]);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return rows.filter(row => {
      if (tab !== "全部" && row.pkg.status !== tab) return false;
      if (!keyword) return true;
      const haystack = [
        row.project?.projectCode,
        row.project?.projectName,
        row.project?.brandTeam,
        row.questionnaire?.requesterName,
        row.pkg.deliverableType,
        row.pkg.assignmentNote,
        row.latestFeedback,
      ].join(" ").toLowerCase();
      return haystack.includes(keyword);
    });
  }, [rows, search, tab]);

  const activeDetail = detailId ? rows.find(row => row.pkg.id === detailId) || null : null;
  const activeSubmit = submitId ? rows.find(row => row.pkg.id === submitId) || null : null;

  if (!currentUser) {
    return <div className="flex-1" style={{ background: PAGE_BG, padding: 32, color: TEXT_MAIN }}>请先登录后查看交付任务。</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: PAGE_BG, padding: "24px 40px 34px" }}>
      <div className="flex items-end justify-between gap-[16px]" style={{ marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 28, color: TEXT_MAIN, fontWeight: 900 }}>我的任务</div>
          <div style={{ marginTop: 8, fontSize: 13, color: TEXT_SUB, fontWeight: 700, lineHeight: 1.8 }}>
            查看分配给你的交付任务，提交版本文件或链接，并跟进需求方反馈。
          </div>
        </div>
        <div style={{ width: 320, maxWidth: "100%" }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索项目、品牌 / 团队、交付物类型"
            style={{ width: "100%", height: 42, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "0 14px", outline: "none", fontSize: 13, color: TEXT_MAIN, background: "#fff" }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14, marginBottom: 18 }}>
        {[
          { label: "待提交", value: counts["待提交"], color: RED, bg: "rgba(239,68,68,0.08)" },
          { label: "待需求方审核", value: counts["待需求方审核"], color: BLUE, bg: "rgba(37,99,235,0.08)" },
          { label: "需修改", value: counts["需修改"], color: "#b45309", bg: "rgba(245,158,11,0.14)" },
          { label: "已通过", value: counts["已通过"], color: GREEN, bg: "rgba(22,163,74,0.10)" },
        ].map(card => (
          <div key={card.label} style={{ padding: 18, borderRadius: 18, background: "#fff", border: `1px solid ${BORDER_WEAK}` }}>
            <div style={{ fontSize: 12, color: TEXT_SUB, fontWeight: 800 }}>{card.label}</div>
            <div style={{ marginTop: 10, fontSize: 28, fontWeight: 900, color: card.color }}>{card.value}</div>
            <div style={{ marginTop: 10, height: 6, borderRadius: 999, background: card.bg }} />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-[10px]" style={{ marginBottom: 16, flexWrap: "wrap" }}>
        {STATUS_ORDER.map(item => {
          const active = tab === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              style={{
                height: 34,
                padding: "0 14px",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 900,
                background: active ? RED : "#fff",
                color: active ? "#fff" : TEXT_MAIN,
                border: active ? "none" : `1px solid ${BORDER}`,
              }}
            >
              {item}{counts[item] > 0 ? ` (${counts[item]})` : ""}
            </button>
          );
        })}
      </div>

      <div style={{ borderRadius: 20, border: `1px solid ${BORDER_WEAK}`, background: "#fff", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.3fr 1fr 1fr 1.2fr 180px", gap: 12, padding: "14px 18px", borderBottom: `1px solid ${BORDER_WEAK}`, fontSize: 12, fontWeight: 900, color: TEXT_SUB }}>
          <div>项目 / 交付任务</div>
          <div>品牌 / 团队</div>
          <div>承诺交付时间</div>
          <div>当前版本</div>
          <div>最新反馈</div>
          <div>操作</div>
        </div>

        {filteredRows.length === 0 ? (
          <div style={{ padding: "56px 20px", textAlign: "center", color: TEXT_SUB, fontSize: 14, fontWeight: 700 }}>
            当前筛选条件下没有交付任务。
          </div>
        ) : filteredRows.map(row => {
          const style = statusPillStyle(row.pkg.status);
          const latestSubmissionText = row.latestSubmission ? `${row.latestSubmission.version} · ${ymdHmSlash(row.latestSubmission.submittedAt)}` : "尚未提交";
          return (
            <div key={row.pkg.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.3fr 1fr 1fr 1.2fr 180px", gap: 12, padding: "16px 18px", borderBottom: `1px solid ${BORDER_WEAK}`, alignItems: "center" }}>
              <div>
                <div className="flex items-center gap-[10px]">
                  <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full" style={{ background: "rgba(37,99,235,0.10)", color: BLUE, fontSize: 14, fontWeight: 900 }}>
                    {getInitial(row.pkg.deliverableType)}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: TEXT_MAIN }}>{row.project?.projectName || "未关联项目"}</div>
                    <div style={{ marginTop: 4, fontSize: 12, color: TEXT_SUB }}>{row.project?.projectCode || "-"} · {row.pkg.deliverableType} × {row.pkg.deliverableItems.length}</div>
                  </div>
                </div>
                {row.pkg.assignmentNote ? <div style={{ marginTop: 8, fontSize: 12, color: TEXT_SUB, lineHeight: 1.7 }}>任务说明：{row.pkg.assignmentNote}</div> : null}
              </div>
              <div style={{ fontSize: 13, color: TEXT_MAIN, fontWeight: 800 }}>{row.project?.brandTeam || "-"}</div>
              <div>
                <div style={{ fontSize: 13, color: TEXT_MAIN, fontWeight: 800 }}>{ymdSlash(row.pkg.promisedAt)}</div>
                <div style={{ marginTop: 6 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", height: 24, padding: "0 10px", borderRadius: 999, background: style.bg, color: style.color, fontSize: 12, fontWeight: 900 }}>{row.pkg.status}</span>
                </div>
              </div>
              <div style={{ fontSize: 13, color: TEXT_MAIN, lineHeight: 1.7 }}>{latestSubmissionText}</div>
              <div style={{ fontSize: 12, color: row.latestFeedback ? TEXT_MAIN : TEXT_SUB, lineHeight: 1.7, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {row.latestFeedback || "暂无反馈"}
              </div>
              <div className="flex items-center gap-[8px]" style={{ flexWrap: "wrap" }}>
                {(row.pkg.status === "待提交" || row.pkg.status === "需修改") ? (
                  <PrimaryButton text={row.pkg.status === "需修改" ? "重新提交" : "提交"} onClick={() => setSubmitId(row.pkg.id)} />
                ) : null}
                <OutlineButton text={row.latestFeedback ? "查看反馈" : "查看记录"} onClick={() => setDetailId(row.pkg.id)} color={row.latestFeedback ? "#b45309" : TEXT_MAIN} />
              </div>
            </div>
          );
        })}
      </div>

      {activeDetail ? (
        <DetailModal
          row={activeDetail}
          onClose={() => setDetailId(null)}
          onSubmit={() => {
            setDetailId(null);
            setSubmitId(activeDetail.pkg.id);
          }}
        />
      ) : null}

      {activeSubmit ? <SubmissionModal row={activeSubmit} onClose={() => setSubmitId(null)} /> : null}
    </div>
  );
}
