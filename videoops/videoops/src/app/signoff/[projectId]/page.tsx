"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { USERS } from "@/lib/mock-data";
import { getTypeTaskPackageSignoffHistory, getTypeTaskPackageSubmissions } from "@/lib/workflowSelectors";
import { ymdHmSlash, ymdSlash } from "@/lib/runtime";

const PAGE_BG = "#f6f7fb";
const TEXT_MAIN = "#111827";
const TEXT_SUB = "#6b7280";
const BORDER = "#e5e7eb";
const BORDER_WEAK = "#eef1f6";
const BLUE = "#2563eb";
const GREEN = "#16a34a";
const RED = "#ef4444";

function statusCard(message: string, tone: "info" | "success" | "warn") {
  if (tone === "success") return { border: "1px solid rgba(22,163,74,0.18)", bg: "rgba(22,163,74,0.06)", color: GREEN, message };
  if (tone === "warn") return { border: "1px solid rgba(245,158,11,0.20)", bg: "rgba(245,158,11,0.10)", color: "#b45309", message };
  return { border: "1px solid rgba(37,99,235,0.18)", bg: "rgba(37,99,235,0.06)", color: BLUE, message };
}

export default function SignoffPage() {
  const params = useParams<{ projectId: string }>();
  const token = String(params?.projectId || "");
  const {
    projects,
    questionnaires,
    typeTaskPackages,
    submissions,
    signoffRecords,
    approvePackageSubmission,
    requestPackageRevision,
  } = useStore();

  const submission = useMemo(
    () => submissions.find(item => item.signoffToken === token) || null,
    [submissions, token]
  );
  const pkg = useMemo(
    () => (submission?.typeTaskPackageId ? typeTaskPackages.find(item => item.id === submission.typeTaskPackageId) || null : null),
    [submission?.typeTaskPackageId, typeTaskPackages]
  );
  const project = useMemo(
    () => (submission?.projectId ? projects.find(item => item.id === submission.projectId) || null : null),
    [projects, submission?.projectId]
  );
  const questionnaire = useMemo(
    () => (project ? questionnaires.find(item => item.id === project.briefId) || null : null),
    [project, questionnaires]
  );

  const signoffHistory = useMemo(
    () => (pkg ? getTypeTaskPackageSignoffHistory(pkg.id, signoffRecords) : []),
    [pkg, signoffRecords]
  );
  const submissionHistory = useMemo(
    () => (pkg ? getTypeTaskPackageSubmissions(pkg.id, submissions) : []),
    [pkg, submissions]
  );

  const latestSubmission = submissionHistory[0] || null;
  const linkedSignoff = signoffHistory.find(item => item.submissionId === submission?.id) || null;

  const [feedback, setFeedback] = useState("");
  const [reviewedByName, setReviewedByName] = useState(questionnaire?.requesterName || "需求方");
  const [reviewedByEmail, setReviewedByEmail] = useState(questionnaire?.requesterEmail || "");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const state = useMemo(() => {
    if (!token) return { kind: "invalid" as const, card: statusCard("缺少审核令牌，请确认链接是否完整。", "warn") };
    if (!submission || !pkg || !project) return { kind: "invalid" as const, card: statusCard("未找到对应交付任务或提交版本，请确认审核链接是否正确。", "warn") };
    if (project.status === "已取消" || pkg.status === "已结束") return { kind: "readonly" as const, card: statusCard("项目已取消或交付任务已结束，当前审核链接仅供查看。", "warn") };
    if (submission.result === "passed" || linkedSignoff?.result === "passed") return { kind: "readonly" as const, card: statusCard("该提交版本已通过审核，当前链接不可重复操作。", "success") };
    if (submission.result === "revision_requested" || linkedSignoff?.result === "revision_requested") return { kind: "readonly" as const, card: statusCard("该提交版本已被退回修改，当前链接不可重复操作。", "warn") };
    if (!latestSubmission || latestSubmission.id !== submission.id) return { kind: "readonly" as const, card: statusCard("该链接对应的版本已过期，系统已有更新版本待审核。", "warn") };
    if (pkg.status === "已通过") return { kind: "readonly" as const, card: statusCard("该交付任务已通过审核，旧链接不可重复操作。", "success") };
    if (pkg.status !== "待需求方审核") return { kind: "readonly" as const, card: statusCard("当前交付任务不在待审核状态，旧链接不可再提交结果。", "warn") };
    return { kind: "active" as const, card: statusCard("请审核当前提交版本。点击“退回修改”时，修改意见为必填。", "info") };
  }, [linkedSignoff?.result, latestSubmission, pkg, project, submission, token]);

  const handleApprove = () => {
    if (!submission) return;
    setError(null);
    const result = approvePackageSubmission({
      token,
      reviewedByName: reviewedByName.trim() || "需求方",
      reviewedByEmail: reviewedByEmail.trim(),
      feedback,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setNotice("已提交通过结果，交付任务状态已同步更新。");
  };

  const handleRevision = () => {
    if (!submission) return;
    setError(null);
    if (!feedback.trim()) {
      setError("退回时必须填写修改意见。");
      return;
    }
    const result = requestPackageRevision({
      token,
      reviewedByName: reviewedByName.trim() || "需求方",
      reviewedByEmail: reviewedByEmail.trim(),
      feedback: feedback.trim(),
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setNotice("已提交退回结果，执行成员和项目管理员会看到最新反馈。");
  };

  if (!submission || !pkg || !project) {
    return (
      <div style={{ minHeight: "100vh", background: PAGE_BG, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "min(760px, 100%)", background: "#fff", borderRadius: 18, border: `1px solid ${BORDER_WEAK}`, padding: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: TEXT_MAIN }}>交付审核</div>
          <div style={{ marginTop: 10, fontSize: 13, color: TEXT_SUB, lineHeight: 1.7 }}>未找到对应审核记录，请确认链接是否正确。</div>
        </div>
      </div>
    );
  }

  const assignee = USERS.find(user => user.id === pkg.assigneeId) || null;

  return (
    <div style={{ minHeight: "100vh", background: PAGE_BG, padding: "28px 18px" }}>
      <div style={{ width: "min(920px, 100%)", margin: "0 auto" }}>
        <div style={{ background: "#fff", border: `1px solid ${BORDER_WEAK}`, borderRadius: 18, overflow: "hidden" }}>
          <div style={{ padding: "18px 20px", borderBottom: `1px solid ${BORDER_WEAK}` }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: TEXT_MAIN }}>交付审核</div>
            <div style={{ marginTop: 8, fontSize: 13, color: TEXT_SUB, lineHeight: 1.7 }}>
              本页审核的是某个交付任务的某次提交版本，不是整个项目。
            </div>
          </div>

          <div style={{ padding: 20 }}>
            <div style={{ padding: "12px 14px", borderRadius: 14, border: state.card.border, background: state.card.bg, color: state.card.color, fontSize: 13, fontWeight: 900 }}>
              {notice || state.card.message}
            </div>

            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14, padding: 16, background: PAGE_BG, border: `1px solid ${BORDER_WEAK}`, borderRadius: 16 }}>
              {[
                { k: "项目编号", v: project.projectCode },
                { k: "项目名称", v: project.projectName },
                { k: "品牌 / 团队", v: project.brandTeam || "-" },
                { k: "需求方", v: questionnaire ? `${questionnaire.requesterName} / ${questionnaire.requesterEmail}` : `${project.requestorName} / ${project.requestorEmail}` },
                { k: "交付物类型", v: pkg.deliverableType },
                { k: "执行成员", v: assignee?.name || pkg.assigneeName || "-" },
                { k: "承诺交付时间", v: ymdSlash(pkg.promisedAt) },
                { k: "当前版本", v: submission.version },
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
                  {pkg.deliverableItems.map((item, index) => (
                    <div key={`${pkg.id}-${index}`} style={{ padding: 12, borderRadius: 12, background: PAGE_BG, border: `1px solid ${BORDER_WEAK}` }}>
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
                <div style={{ fontSize: 14, fontWeight: 900, color: TEXT_MAIN }}>当前提交内容</div>
                <div style={{ marginTop: 10, fontSize: 12, color: TEXT_SUB }}>提交时间：{ymdHmSlash(submission.submittedAt)}</div>
                <div style={{ marginTop: 4, fontSize: 12, color: TEXT_SUB }}>提交人：{submission.submittedBy || USERS.find(user => user.id === submission.submitterId)?.name || "-"}</div>
                {submission.submitNote ? <div style={{ marginTop: 10, fontSize: 13, color: TEXT_MAIN, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>提交说明：{submission.submitNote}</div> : null}
                {submission.fileLinks && submission.fileLinks.length > 0 ? <div style={{ marginTop: 10, fontSize: 13, color: TEXT_MAIN, lineHeight: 1.8 }}>文件链接：{submission.fileLinks.join(" / ")}</div> : null}
                {submission.uploadedFiles && submission.uploadedFiles.length > 0 ? <div style={{ marginTop: 10, fontSize: 13, color: TEXT_MAIN, lineHeight: 1.8 }}>上传文件：{submission.uploadedFiles.map(file => file.name).join(" / ")}</div> : null}
              </section>

              <section style={{ padding: 16, borderRadius: 16, border: `1px solid ${BORDER}`, background: "#fff" }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: TEXT_MAIN }}>历史版本与审核记录</div>
                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                  {submissionHistory.map(item => {
                    const record = signoffHistory.find(entry => entry.submissionId === item.id) || null;
                    const reviewText = record ? (record.result === "passed" ? "需求方通过" : "需求方退回修改") : "待需求方审核";
                    return (
                      <div key={item.id} style={{ padding: 12, borderRadius: 12, background: PAGE_BG, border: `1px solid ${BORDER_WEAK}` }}>
                        <div className="flex items-center justify-between gap-[12px]">
                          <div style={{ fontSize: 13, fontWeight: 900, color: TEXT_MAIN }}>{item.version}</div>
                          <div style={{ fontSize: 12, fontWeight: 900, color: record?.result === "passed" ? GREEN : record?.result === "revision_requested" ? "#b45309" : BLUE }}>{reviewText}</div>
                        </div>
                        <div style={{ marginTop: 6, fontSize: 12, color: TEXT_SUB }}>提交时间：{ymdHmSlash(item.submittedAt)}</div>
                        {record ? (
                          <>
                            <div style={{ marginTop: 4, fontSize: 12, color: TEXT_SUB }}>审核时间：{ymdHmSlash(record.reviewedAt)}</div>
                            <div style={{ marginTop: 6, fontSize: 12, color: TEXT_MAIN, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{record.feedback || "无补充意见"}</div>
                          </>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>

              <section style={{ padding: 16, borderRadius: 16, border: `1px solid ${BORDER}`, background: "#fff" }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: TEXT_MAIN }}>审核信息</div>
                <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
                  <label>
                    <div style={{ fontSize: 12, fontWeight: 900, color: TEXT_MAIN }}>审核人姓名</div>
                    <input value={reviewedByName} onChange={e => setReviewedByName(e.target.value)} disabled={state.kind !== "active"} style={{ marginTop: 8, width: "100%", height: 42, borderRadius: 12, border: `1px solid ${BORDER}`, padding: "0 12px", outline: "none", fontSize: 13, color: TEXT_MAIN, opacity: state.kind === "active" ? 1 : 0.7 }} />
                  </label>
                  <label>
                    <div style={{ fontSize: 12, fontWeight: 900, color: TEXT_MAIN }}>审核人邮箱</div>
                    <input value={reviewedByEmail} onChange={e => setReviewedByEmail(e.target.value)} disabled={state.kind !== "active"} style={{ marginTop: 8, width: "100%", height: 42, borderRadius: 12, border: `1px solid ${BORDER}`, padding: "0 12px", outline: "none", fontSize: 13, color: TEXT_MAIN, opacity: state.kind === "active" ? 1 : 0.7 }} />
                  </label>
                </div>
                <div style={{ marginTop: 14, fontSize: 12, fontWeight: 900, color: TEXT_MAIN }}>修改意见</div>
                <textarea
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  disabled={state.kind !== "active"}
                  placeholder="退回修改时必填；通过时可选填写补充说明"
                  style={{ marginTop: 8, width: "100%", minHeight: 120, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "12px 14px", outline: "none", fontSize: 13, color: TEXT_MAIN, resize: "vertical", lineHeight: 1.6, opacity: state.kind === "active" ? 1 : 0.7 }}
                />
                {error ? <div style={{ marginTop: 10, fontSize: 12, fontWeight: 900, color: RED }}>{error}</div> : null}
              </section>
            </div>
          </div>

          <div className="flex items-center justify-end gap-[10px]" style={{ padding: "16px 20px", borderTop: `1px solid ${BORDER_WEAK}` }}>
            <button type="button" onClick={handleRevision} disabled={state.kind !== "active"} style={{ height: 38, padding: "0 14px", borderRadius: 12, background: "#fff", border: `1px solid ${BORDER}`, color: state.kind === "active" ? TEXT_MAIN : "#9ca3af", fontSize: 13, fontWeight: 900, cursor: state.kind === "active" ? "pointer" : "not-allowed" }}>
              退回修改
            </button>
            <button type="button" onClick={handleApprove} disabled={state.kind !== "active"} style={{ height: 38, padding: "0 16px", borderRadius: 12, background: state.kind === "active" ? GREEN : "#d1d5db", border: "none", color: "#fff", fontSize: 13, fontWeight: 900, cursor: state.kind === "active" ? "pointer" : "not-allowed" }}>
              通过
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
