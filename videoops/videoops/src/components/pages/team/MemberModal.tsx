"use client";

import { useMemo, useState } from "react";
import type { MemberProfile, MemberRoleLabel, SkillTag } from "./teamTypes";
import { SKILL_OPTIONS } from "./teamTypes";
import { BORDER, BORDER_WEAK, PAGE_BG, RED, TEXT_MAIN, TEXT_SUB } from "./teamUi";
import { skillStyle } from "./teamUi";
import { X } from "lucide-react";

type Mode = "add" | "edit";

function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.55)" }} onMouseDown={onClose}>
      <div className="w-full" style={{ maxWidth: 920, maxHeight: "calc(100vh - 64px)", padding: "0 18px" }} onMouseDown={e => e.stopPropagation()}>
        <div style={{ borderRadius: 28, background: "#fff", border: `1px solid ${BORDER_WEAK}`, boxShadow: "0 22px 60px rgba(15, 23, 42, 0.18)", overflow: "hidden" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

const ROLES: MemberRoleLabel[] = ["执行成员", "项目管理员"];

export default function MemberModal({
  mode,
  initial,
  onClose,
  onSave,
}: {
  mode: Mode;
  initial: MemberProfile;
  onClose: () => void;
  onSave: (next: MemberProfile) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [roleLabel, setRoleLabel] = useState<MemberRoleLabel>(initial.roleLabel);
  const [projectTypes, setProjectTypes] = useState(initial.projectTypes);
  const [skills, setSkills] = useState<SkillTag[]>(initial.skills);
  const [note, setNote] = useState(initial.note);
  const [err, setErr] = useState<string | null>(null);

  const title = mode === "add" ? "新增成员" : "编辑成员";
  const tip = mode === "add"
    ? "新增成员后，可补充角色、能力标签和成员备注。"
    : "只编辑成员档案信息，业务数据由系统自动生成。";

  const canSave = useMemo(() => name.trim() && email.trim(), [name, email]);

  const toggleSkill = (s: SkillTag) => {
    setSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const save = () => {
    if (!canSave) {
      setErr("请填写姓名和邮箱。");
      return;
    }
    setErr(null);
    onSave({
      ...initial,
      name: name.trim(),
      email: email.trim(),
      roleLabel,
      projectTypes: projectTypes.trim(),
      skills,
      note: note.trim(),
    });
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-start justify-between" style={{ padding: "20px 22px", borderBottom: `1px solid ${BORDER_WEAK}`, background: "#fff" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: TEXT_MAIN }}>{title}</div>
          <div style={{ marginTop: 6, fontSize: 13, color: TEXT_SUB, fontWeight: 700, lineHeight: 1.7 }}>{tip}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="transition-colors"
          style={{ width: 38, height: 38, borderRadius: 14, border: `1px solid ${BORDER}`, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", cursor: "pointer" }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f9fafb")}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#fff")}
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ padding: 22, overflowY: "auto", maxHeight: "calc(100vh - 220px)" }}>
        <div className="grid grid-cols-2 gap-[14px]" style={{ marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#94a3b8", marginBottom: 6 }}>姓名</div>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="请输入姓名"
              style={{ width: "100%", height: 38, borderRadius: 12, border: `1px solid ${BORDER}`, padding: "0 12px", fontSize: 13, fontWeight: 800, color: TEXT_MAIN, outline: "none" }}
            />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#94a3b8", marginBottom: 6 }}>邮箱</div>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="请输入邮箱"
              style={{ width: "100%", height: 38, borderRadius: 12, border: `1px solid ${BORDER}`, padding: "0 12px", fontSize: 13, fontWeight: 800, color: TEXT_MAIN, outline: "none" }}
            />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#94a3b8", marginBottom: 6 }}>角色</div>
            <select
              value={roleLabel}
              onChange={e => setRoleLabel(e.target.value as MemberRoleLabel)}
              style={{ width: "100%", height: 38, borderRadius: 12, border: `1px solid ${BORDER}`, padding: "0 10px", fontSize: 13, fontWeight: 800, color: TEXT_MAIN, outline: "none", background: "#fff" }}
            >
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#94a3b8", marginBottom: 6 }}>可参与项目类型</div>
            <input
              value={projectTypes}
              onChange={e => setProjectTypes(e.target.value)}
              placeholder="例如：视频 / 平面设计 / POSM"
              style={{ width: "100%", height: 38, borderRadius: 12, border: `1px solid ${BORDER}`, padding: "0 12px", fontSize: 13, fontWeight: 800, color: TEXT_MAIN, outline: "none" }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 900, color: "#94a3b8" }}>能力标签</div>
        <div className="flex items-center flex-wrap gap-[10px]" style={{ marginBottom: 8 }}>
          {SKILL_OPTIONS.map(s => {
            const active = skills.includes(s);
            const st = skillStyle(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleSkill(s)}
                className="transition-colors"
                style={{
                  height: 30,
                  padding: "0 12px",
                  borderRadius: 999,
                  border: `1px solid ${active ? "rgba(37,99,235,0.25)" : BORDER}`,
                  background: active ? st.bg : "#fff",
                  color: active ? st.color : TEXT_MAIN,
                  fontSize: 12,
                  fontWeight: 900,
                  cursor: "pointer",
                }}
                onMouseEnter={e => {
                  if (!active) e.currentTarget.style.backgroundColor = "#f9fafb";
                }}
                onMouseLeave={e => {
                  if (!active) e.currentTarget.style.backgroundColor = "#fff";
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: 12, color: TEXT_SUB, fontWeight: 700, marginBottom: 16 }}>能力标签会用于需求分发中心和项目看板的分配判断。</div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: "#94a3b8", marginBottom: 6 }}>备注</div>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="可选"
            style={{ width: "100%", height: 88, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "10px 12px", outline: "none", fontSize: 13, fontWeight: 700, color: TEXT_MAIN, background: "#fff", resize: "vertical", lineHeight: 1.7 }}
          />
        </div>

        {mode === "edit" && (
          <div style={{ borderRadius: 16, border: `1px solid ${BORDER_WEAK}`, background: PAGE_BG, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: TEXT_MAIN, marginBottom: 8 }}>系统自动生成，不可编辑</div>
            <div style={{ fontSize: 12, color: TEXT_SUB, fontWeight: 700, lineHeight: 1.8 }}>
              <div>1. 当前交付任务：来自项目看板和成员任务数据</div>
              <div>2. 待提交：来自成员待提交交付任务</div>
              <div>3. 待需求方审核：来自已提交待审核交付任务</div>
              <div>4. 本月已通过：仅统计当月通过需求方审核的交付任务</div>
              <div>5. 交付表现：来自历史交付任务与需求方反馈</div>
            </div>
          </div>
        )}

        {err && (
          <div style={{ marginTop: 14, borderRadius: 14, border: `1px solid rgba(239,68,68,0.20)`, background: "rgba(239,68,68,0.06)", padding: "10px 12px", fontSize: 12, fontWeight: 900, color: RED }}>
            {err}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-[10px]" style={{ padding: "14px 18px", borderTop: `1px solid ${BORDER_WEAK}`, background: "#fff" }}>
        <button
          type="button"
          onClick={onClose}
          className="transition-colors"
          style={{ height: 36, padding: "0 14px", borderRadius: 12, background: "#fff", border: `1px solid ${BORDER}`, color: TEXT_MAIN, fontSize: 12, fontWeight: 900, cursor: "pointer" }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f9fafb")}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#fff")}
        >
          取消
        </button>
        <button
          type="button"
          onClick={save}
          className="transition-all"
          style={{ height: 36, padding: "0 16px", borderRadius: 12, background: "#ef4444", border: "none", color: "#fff", fontSize: 12, fontWeight: 900, cursor: "pointer", opacity: canSave ? 1 : 0.7 }}
        >
          保存
        </button>
      </div>
    </ModalShell>
  );
}
