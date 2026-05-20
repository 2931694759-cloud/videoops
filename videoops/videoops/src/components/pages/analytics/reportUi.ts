export const PAGE_BG = "#f6f7fb";
export const TEXT_MAIN = "#111827";
export const TEXT_SUB = "#6b7280";
export const BORDER = "#e5e7eb";
export const BORDER_WEAK = "#eef1f6";

export const RED = "#ef4444";
export const BLUE = "#2563eb";
export const GREEN = "#16a34a";
export const ORANGE = "#f59e0b";
export const PURPLE = "#7c3aed";
export const SLATE = "#94a3b8";

export const CARD_SHADOW = "0 18px 50px rgba(15, 23, 42, 0.06)";
export const CARD_SHADOW_STRONG = "0 22px 60px rgba(15, 23, 42, 0.10)";
export const RADIUS = 18;

export function trendPillStyle(trendText: string) {
  const isDown = trendText.trim().startsWith("-");
  if (isDown) return { bg: "rgba(239,68,68,0.12)", color: RED };
  return { bg: "rgba(22,163,74,0.12)", color: GREEN };
}

export function statusPillStyle(status: "已完成" | "待验收" | "制作中") {
  if (status === "已完成") return { bg: "rgba(22,163,74,0.12)", color: GREEN };
  if (status === "待验收") return { bg: "rgba(245,158,11,0.16)", color: ORANGE };
  return { bg: "rgba(37,99,235,0.12)", color: BLUE };
}

export function categoryPillStyle(category: "视频" | "平面设计" | "POSM" | "文案") {
  if (category === "视频") return { bg: "rgba(37,99,235,0.10)", color: BLUE };
  if (category === "平面设计") return { bg: "rgba(22,163,74,0.12)", color: GREEN };
  if (category === "POSM") return { bg: "rgba(236,72,153,0.12)", color: "#db2777" };
  return { bg: "rgba(245,158,11,0.16)", color: ORANGE };
}
