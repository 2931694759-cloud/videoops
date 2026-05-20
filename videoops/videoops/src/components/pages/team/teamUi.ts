import type { SkillTag } from "./teamTypes";

export const PAGE_BG = "#f6f7fb";
export const TEXT_MAIN = "#111827";
export const TEXT_SUB = "#6b7280";
export const BORDER = "#e5e7eb";
export const BORDER_WEAK = "#eef1f6";
export const RED = "#ef4444";
export const RED_DEEP = "#dc2626";
export const ORANGE = "#f59e0b";
export const GREEN = "#16a34a";
export const BLUE = "#2563eb";

export function skillStyle(s: SkillTag) {
  const blue = { bg: "rgba(37,99,235,0.10)", color: "#2563eb" };
  const green = { bg: "rgba(22,163,74,0.12)", color: "#16a34a" };
  const pink = { bg: "rgba(236,72,153,0.12)", color: "#db2777" };
  const orange = { bg: "rgba(245,158,11,0.16)", color: "#f59e0b" };
  const purple = { bg: "rgba(168,85,247,0.14)", color: "#7c3aed" };

  if (s === "平面设计" || s === "KV" || s === "本地化延展") return green;
  if (s === "POSM" || s === "门店物料") return pink;
  if (s === "文案" || s === "内容创意" || s === "脚本") return orange;
  if (s === "3D") return purple;
  return blue;
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
