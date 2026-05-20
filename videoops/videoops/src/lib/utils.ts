import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}年${m}月${day}日`;
}

export function formatShortDate(date: Date | string): string {
  const d = new Date(date);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${m}月${day}日`;
}

export function getInitial(name: string): string {
  return name.charAt(0);
}

export const STATUS_MAP: Record<string, string> = {
  BRIEF_REVIEW: "需求审核",
  WIP: "制作中",
  INTERNAL_REVIEW: "内部审核",
  PENDING_SIGNOFF: "待签收",
  COMPLETED: "已完成",
  CANCELED: "已取消",
};

export const PRIORITY_MAP: Record<string, string> = {
  URGENT: "紧急",
  HIGH: "高优先级",
  MEDIUM: "中优先级",
  LOW: "低优先级",
};

export const CATEGORY_MAP: Record<string, string> = {
  SHOOTING: "拍摄",
  EDITING: "剪辑",
  ANIMATION: "动效",
  SCRIPT: "脚本",
  POST_PRODUCTION: "后期",
  OTHER: "其他",
};

export const VIDEO_TYPE_MAP: Record<string, string> = {
  PROMO: "宣传片",
  TRAINING: "培训视频",
  TESTIMONIAL: "客户证言",
  EVENT: "活动记录",
  SOCIAL_MEDIA: "社交媒体短视频",
  OTHER: "其他",
};

export const QUEST_STATUS_MAP: Record<string, string> = {
  PENDING: "待处理",
  UNDER_REVIEW: "审核中",
  ASSIGNED: "已分配",
  REJECTED: "已拒绝",
};

export const CATEGORY_COLORS: Record<string, string> = {
  SHOOTING: "bg-emerald-500/8 text-emerald-600",
  EDITING: "bg-blue-500/8 text-blue-600",
  ANIMATION: "bg-pink-500/8 text-pink-600",
  SCRIPT: "bg-violet-500/8 text-violet-600",
  POST_PRODUCTION: "bg-amber-500/8 text-amber-600",
  OTHER: "bg-gray-500/8 text-gray-500",
};

export const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "bg-red-500/8 text-red-600",
  HIGH: "bg-orange-500/8 text-orange-600",
  MEDIUM: "bg-gray-500/8 text-gray-500",
  LOW: "bg-gray-500/8 text-gray-400",
};

export function timeAgo(date: Date | string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return formatShortDate(date);
}

export const STATUS_DOT_COLORS: Record<string, string> = {
  BRIEF_REVIEW: "bg-gray-400",
  WIP: "bg-blue-400",
  INTERNAL_REVIEW: "bg-amber-400",
  PENDING_SIGNOFF: "bg-violet-400",
  COMPLETED: "bg-emerald-400",
  CANCELED: "bg-gray-500",
};

export const BRAND_RED = "#e74c3c";

export const STATUS_PILL: Record<string, { bg: string; color: string; dot: string }> = {
  BRIEF_REVIEW:    { bg: "#f0f0f2", color: "#6a6a76", dot: "#a1a1aa" },
  WIP:             { bg: "#ebf0ff", color: "#2558a6", dot: "#2558a6" },
  INTERNAL_REVIEW: { bg: "#fff3eb", color: "#c0592b", dot: "#c0592b" },
  PENDING_SIGNOFF: { bg: "#f0ebff", color: "#6b47b8", dot: "#6b47b8" },
  COMPLETED:       { bg: "#ebfff0", color: "#1a7a4a", dot: "#1a7a4a" },
  CANCELED:        { bg: "#f0f0f2", color: "#8a8a96", dot: "#8a8a96" },
};
