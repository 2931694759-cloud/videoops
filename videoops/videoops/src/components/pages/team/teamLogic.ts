import { USERS, type Questionnaire, type Review, type Task } from "@/lib/mock-data";
import { clamp } from "./teamUi";
import type { MemberPerformance, MemberProfile, SkillTag } from "./teamTypes";
import { toMs } from "@/lib/runtime";
import { isTaskAssignedToUser } from "@/lib/taskAssignments";

export function safeJsonParse(text: string | null) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export function pickAvatar(seed: string) {
  const list = ["#7c5cfc", "#f472b6", "#34d399", "#60a5fa", "#fbbf24", "#fb7185", "#22c55e", "#a855f7"];
  const n = Array.from(seed).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return list[n % list.length];
}

export function roleToLabel(r: string) {
  if (r === "LEADER") return "项目管理员" as const;
  return "执行成员" as const;
}

export function seedProfile(u: typeof USERS[number]): MemberProfile {
  const preset: Record<string, { skills: SkillTag[]; projectTypes: string; note: string }> = {
    u1: { skills: ["视频", "剪辑", "动效"], projectTypes: "视频 / 剪辑 / 动效", note: "适合关键项目统筹与交付节奏管理" },
    u2: { skills: ["平面设计", "KV", "本地化延展"], projectTypes: "平面设计 / KV / 本地化延展", note: "擅长品牌一致性与跨类型资源协调" },
    u3: { skills: ["平面设计", "POSM", "KV"], projectTypes: "平面设计 / POSM / KV", note: "门店物料与 KV 延展经验丰富" },
    u4: { skills: ["拍摄", "POSM", "门店物料"], projectTypes: "拍摄 / POSM / 门店物料", note: "擅长拍摄与线下物料配合" },
    u5: { skills: ["视频", "剪辑", "动效"], projectTypes: "视频 / 剪辑 / 动效", note: "需要关注排期与需求方反馈节奏" },
    u6: { skills: ["文案", "内容创意", "3D"], projectTypes: "文案 / 内容创意 / 3D", note: "文案与创意策略支持" },
  };
  const p = preset[u.id] || { skills: ["视频"], projectTypes: "视频", note: "" };
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    roleLabel: roleToLabel(u.role),
    avatar: u.avatar || pickAvatar(u.id),
    projectTypes: p.projectTypes,
    skills: p.skills,
    note: p.note,
  };
}

export function computeNeedFixTaskIds(reviews: Review[]) {
  const byTask: Record<string, Review[]> = {};
  for (const r of reviews) (byTask[r.taskId] ||= []).push(r);
  const needFix = new Set<string>();
  for (const taskId of Object.keys(byTask)) {
    const rel = byTask[taskId].slice().sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    const latest = rel[0];
    if (latest?.status === "REVISION_REQUESTED") needFix.add(taskId);
  }
  return needFix;
}

export function deliverableSummaryForTask(task: Task, q: Questionnaire | null) {
  const parsed = safeJsonParse(q?.specialNotes || null);
  if (isRecord(parsed) && isRecord(parsed.deliverables)) {
    const parts: string[] = [];
    for (const k of Object.keys(parsed.deliverables)) {
      const arr = parsed.deliverables[k];
      if (Array.isArray(arr)) parts.push(`${k} × ${Math.max(1, arr.length)}`);
    }
    if (parts.length) return parts.join("  ");
  }

  if (task.assetType?.includes("文案")) return "文案 × 1";
  if (task.category === "SCRIPT") return "文案 × 1";
  if (task.category === "SHOOTING") return "视频 × 1";
  if (task.category === "ANIMATION") return "视频 × 1";
  if (task.category === "POST_PRODUCTION") return "视频 × 1";
  if (task.category === "EDITING") return "视频 × 1";
  return "视频 × 1";
}

export function memberPerformance(
  memberId: string,
  tasks: Task[],
  reviews: Review[],
  questionnaires: Questionnaire[],
  fallback: { passRate: number; avgRework: number; onTimeRate: number }
): MemberPerformance {
  const qById = new Map<string, Questionnaire>();
  for (const q of questionnaires) qById.set(q.id, q);

  const myTaskIds = new Set(
    tasks
      .filter(t => {
        const q = t.questionnaireId ? qById.get(t.questionnaireId) || null : null;
        return isTaskAssignedToUser(t, memberId, q);
      })
      .map(t => t.id)
  );
  const rel = reviews.filter(r => myTaskIds.has(r.taskId));

  const byTask: Record<string, Review[]> = {};
  for (const r of rel) (byTask[r.taskId] ||= []).push(r);

  let approved = 0;
  let decided = 0;
  let totalRework = 0;
  let reworkTasks = 0;

  for (const taskId of Object.keys(byTask)) {
    const list = byTask[taskId].slice().sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));
    const last = list.slice().sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))[0];
    if (last?.status === "APPROVED") {
      approved += 1;
      decided += 1;
    } else if (last?.status === "REVISION_REQUESTED") {
      decided += 1;
    }
    const reworks = list.filter(x => x.status === "REVISION_REQUESTED").length;
    if (reworks > 0) {
      totalRework += reworks;
      reworkTasks += 1;
    }
  }

  const completed = tasks.filter(t => {
    const q = t.questionnaireId ? qById.get(t.questionnaireId) || null : null;
    return isTaskAssignedToUser(t, memberId, q) && t.status === "COMPLETED" && t.completedAt && t.dueDate;
  });
  const onTime = completed.filter(t => {
    const c = toMs(t.completedAt || "");
    const d = toMs(t.dueDate || "");
    return !Number.isNaN(c) && !Number.isNaN(d) && c <= d;
  }).length;

  const passRate = decided > 0 ? (approved / decided) * 100 : fallback.passRate;
  const avgRework = reworkTasks > 0 ? totalRework / reworkTasks : fallback.avgRework;
  const onTimeRate = completed.length > 0 ? (onTime / completed.length) * 100 : fallback.onTimeRate;

  return { passRate: clamp(passRate, 0, 100), avgRework: clamp(avgRework, 0, 6), onTimeRate: clamp(onTimeRate, 0, 100) };
}

export const LOAD_BASE_PRESET: Record<string, number> = { u1: 82, u2: 38, u3: 77, u4: 56, u5: 105, u6: 64 };

export const PERF_FALLBACKS: Record<string, { passRate: number; avgRework: number; onTimeRate: number }> = {
  u1: { passRate: 86, avgRework: 1.2, onTimeRate: 91 },
  u2: { passRate: 92, avgRework: 0.6, onTimeRate: 94 },
  u3: { passRate: 84, avgRework: 1.1, onTimeRate: 88 },
  u4: { passRate: 90, avgRework: 0.9, onTimeRate: 93 },
  u5: { passRate: 78, avgRework: 1.8, onTimeRate: 82 },
  u6: { passRate: 88, avgRework: 1.0, onTimeRate: 89 },
};
