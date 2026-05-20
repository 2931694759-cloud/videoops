export type MemberRoleLabel = "项目管理员" | "执行成员";
export type MemberRoleFilter = "all" | "项目管理员" | "执行成员";
export type MemberSortField = "currentTasks" | "monthDone";
export type SortDirection = "desc" | "asc";

export const SKILL_OPTIONS = [
  "视频",
  "剪辑",
  "动效",
  "平面设计",
  "KV",
  "本地化延展",
  "POSM",
  "门店物料",
  "拍摄",
  "文案",
  "内容创意",
  "脚本",
  "3D",
] as const;

export type SkillTag = typeof SKILL_OPTIONS[number];

export type MemberProfile = {
  id: string;
  name: string;
  email: string;
  roleLabel: MemberRoleLabel;
  avatar: string;
  projectTypes: string;
  skills: SkillTag[];
  note: string;
};

export type MemberStats = {
  currentTasks: number;
  toSubmit: number;
  waitingSignoff: number;
  needFix: number;
  passed: number;
  monthDone: number;
  revisionCount: number;
};

export type MemberPerformance = {
  passRate: number;
  avgRework: number;
  onTimeRate: number;
};

export type MemberTaskRow = {
  id: string;
  title: string;
  deliverables: string;
  statusLabel: "待提交" | "待需求方审核" | "需修改" | "已通过" | "已结束";
  dueLabel: string;
  riskLabel: "正常" | "紧急" | "已逾期";
};
