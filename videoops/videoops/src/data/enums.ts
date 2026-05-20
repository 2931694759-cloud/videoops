export const ProjectStatus = {
  EXECUTING: "executing",
  SIGNOFF: "signoff",
  COMPLETED: "completed",
  CANCELED: "canceled",
} as const;

export const ProjectStatusLabel = {
  [ProjectStatus.EXECUTING]: "制作中",
  [ProjectStatus.SIGNOFF]: "待验收",
  [ProjectStatus.COMPLETED]: "已完成",
  [ProjectStatus.CANCELED]: "已取消",
} as const;

export const CurrentNode = {
  INTERNAL_PRODUCTION: "internal_production",
  INTERNAL_REVIEW: "internal_review",
  REVISION_REQUIRED: "revision_required",
  STAKEHOLDER_SIGNOFF: "stakeholder_signoff",
  COMPLETED: "completed",
  CANCELED: "canceled",
} as const;

export const CurrentNodeLabel = {
  [CurrentNode.INTERNAL_PRODUCTION]: "内部制作",
  [CurrentNode.INTERNAL_REVIEW]: "内部审核",
  [CurrentNode.REVISION_REQUIRED]: "退回修改",
  [CurrentNode.STAKEHOLDER_SIGNOFF]: "需求方验收",
  [CurrentNode.COMPLETED]: "已完成",
  [CurrentNode.CANCELED]: "已取消",
} as const;

export const RequestStatus = {
  PENDING_DISPATCH: "pending_dispatch",
  DISPATCHED: "dispatched",
  CANCELED: "canceled",
} as const;

export const RequestStatusLabel = {
  [RequestStatus.PENDING_DISPATCH]: "待分发",
  [RequestStatus.DISPATCHED]: "已生成项目",
  [RequestStatus.CANCELED]: "已取消",
} as const;

export const DeliverableStatus = {
  PENDING_SUBMIT: "pending_submit",
  SUBMITTED: "submitted",
  IN_REVIEW: "in_review",
  CHANGES_REQUESTED: "changes_requested",
  APPROVED: "approved",
  ARCHIVED: "archived",
} as const;

export const DeliverableStatusLabel = {
  [DeliverableStatus.PENDING_SUBMIT]: "待提交",
  [DeliverableStatus.SUBMITTED]: "已提交",
  [DeliverableStatus.IN_REVIEW]: "审核中",
  [DeliverableStatus.CHANGES_REQUESTED]: "需修改",
  [DeliverableStatus.APPROVED]: "已通过",
  [DeliverableStatus.ARCHIVED]: "已归档",
} as const;

export const ReviewStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  CHANGES_REQUESTED: "changes_requested",
} as const;

export const ReviewStatusLabel = {
  [ReviewStatus.PENDING]: "待审核",
  [ReviewStatus.APPROVED]: "通过",
  [ReviewStatus.CHANGES_REQUESTED]: "退回",
} as const;

export const Priority = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
} as const;

export const PriorityLabel = {
  [Priority.LOW]: "低",
  [Priority.MEDIUM]: "中",
  [Priority.HIGH]: "高",
  [Priority.URGENT]: "紧急",
} as const;

export const RiskLevel = {
  NORMAL: "normal",
  AT_RISK: "at_risk",
  OVERDUE: "overdue",
} as const;

export const RiskLevelLabel = {
  [RiskLevel.NORMAL]: "正常",
  [RiskLevel.AT_RISK]: "有风险",
  [RiskLevel.OVERDUE]: "已逾期",
} as const;

export const WorkType = {
  COPYWRITING: "copywriting",
  GRAPHIC_DESIGN: "graphic_design",
  MOTION_GRAPHICS: "motion_graphics",
  VIDEO_EDITING: "video_editing",
  VIDEO_PRODUCTION: "video_production",
  THREED_DESIGN: "3d_design",
} as const;

export const WorkTypeLabel = {
  [WorkType.COPYWRITING]: "文案",
  [WorkType.GRAPHIC_DESIGN]: "平面设计",
  [WorkType.MOTION_GRAPHICS]: "动效",
  [WorkType.VIDEO_EDITING]: "视频剪辑",
  [WorkType.VIDEO_PRODUCTION]: "视频制作",
  [WorkType.THREED_DESIGN]: "3D设计",
} as const;

export const AssetType = {
  KEY_VISUAL: "key_visual",
  LOCALIZATION: "localization",
  SOCIAL_VIDEO: "social_video",
  SECONDARY_MATERIAL: "secondary_material",
  VIDEO_TEMPLATE: "video_template",
  POSM: "posm",
} as const;

export const AssetTypeLabel = {
  [AssetType.KEY_VISUAL]: "主视觉素材",
  [AssetType.LOCALIZATION]: "本地化延展",
  [AssetType.SOCIAL_VIDEO]: "社媒短视频",
  [AssetType.SECONDARY_MATERIAL]: "二次物料",
  [AssetType.VIDEO_TEMPLATE]: "视频模板",
  [AssetType.POSM]: "POSM",
} as const;

export const Channel = {
  SOCIAL_MEDIA: "social_media",
  XIAOHONGSHU: "xiaohongshu",
  E_COMMERCE: "e_commerce",
  OFFLINE_RETAIL: "offline_retail",
  INTERNAL_COMMS: "internal_comms",
} as const;

export const ChannelLabel = {
  [Channel.SOCIAL_MEDIA]: "社媒",
  [Channel.XIAOHONGSHU]: "小红书",
  [Channel.E_COMMERCE]: "电商平台",
  [Channel.OFFLINE_RETAIL]: "线下门店",
  [Channel.INTERNAL_COMMS]: "内部传播",
} as const;

export const MemberRole = {
  MANAGER: "manager",
  TRAFFIC_MANAGER: "traffic_manager",
  MEMBER: "member",
} as const;

export const MemberRoleLabel = {
  [MemberRole.MANAGER]: "Manager",
  [MemberRole.TRAFFIC_MANAGER]: "Traffic Manager",
  [MemberRole.MEMBER]: "Member",
} as const;

export const ActivityEntityType = {
  REQUEST: "request",
  PROJECT: "project",
  DELIVERABLE: "deliverable",
  SUBMISSION: "submission",
  REVIEW: "review",
  ASSET: "asset",
} as const;

export const ActivityAction = {
  CREATED: "created",
  UPDATED: "updated",
  STATUS_CHANGED: "status_changed",
  ASSIGNED: "assigned",
  SUBMITTED: "submitted",
  REVIEWED: "reviewed",
  APPROVED: "approved",
  REJECTED: "rejected",
  DELETED: "deleted",
} as const;

// Helper Type Definitions
export type ProjectStatusType = typeof ProjectStatus[keyof typeof ProjectStatus];
export type CurrentNodeType = typeof CurrentNode[keyof typeof CurrentNode];
export type RequestStatusType = typeof RequestStatus[keyof typeof RequestStatus];
export type DeliverableStatusType = typeof DeliverableStatus[keyof typeof DeliverableStatus];
export type ReviewStatusType = typeof ReviewStatus[keyof typeof ReviewStatus];
export type PriorityType = typeof Priority[keyof typeof Priority];
export type RiskLevelType = typeof RiskLevel[keyof typeof RiskLevel];
export type WorkTypeType = typeof WorkType[keyof typeof WorkType];
export type AssetTypeType = typeof AssetType[keyof typeof AssetType];
export type ChannelType = typeof Channel[keyof typeof Channel];
export type MemberRoleType = typeof MemberRole[keyof typeof MemberRole];
export type ActivityEntityTypeType = typeof ActivityEntityType[keyof typeof ActivityEntityType];
export type ActivityActionType = typeof ActivityAction[keyof typeof ActivityAction];

// Helper Functions
export function getProjectStatusLabel(status: ProjectStatusType | string): string {
  return ProjectStatusLabel[status as ProjectStatusType] || status;
}

export function getCurrentNodeLabel(node: CurrentNodeType | string): string {
  return CurrentNodeLabel[node as CurrentNodeType] || node;
}

export function getRequestStatusLabel(status: RequestStatusType | string): string {
  return RequestStatusLabel[status as RequestStatusType] || status;
}

export function getDeliverableStatusLabel(status: DeliverableStatusType | string): string {
  return DeliverableStatusLabel[status as DeliverableStatusType] || status;
}

export function getReviewStatusLabel(status: ReviewStatusType | string): string {
  return ReviewStatusLabel[status as ReviewStatusType] || status;
}

export function getPriorityLabel(priority: PriorityType | string): string {
  return PriorityLabel[priority as PriorityType] || priority;
}

export function getRiskLevelLabel(riskLevel: RiskLevelType | string): string {
  return RiskLevelLabel[riskLevel as RiskLevelType] || riskLevel;
}

export function getWorkTypeLabel(workType: WorkTypeType | string): string {
  return WorkTypeLabel[workType as WorkTypeType] || workType;
}

export function getAssetTypeLabel(assetType: AssetTypeType | string): string {
  return AssetTypeLabel[assetType as AssetTypeType] || assetType;
}

export function getChannelLabel(channel: ChannelType | string): string {
  return ChannelLabel[channel as ChannelType] || channel;
}

export function getMemberRoleLabel(role: MemberRoleType | string): string {
  return MemberRoleLabel[role as MemberRoleType] || role;
}
