import {
  ProjectStatusType,
  CurrentNodeType,
  RequestStatusType,
  DeliverableStatusType,
  ReviewStatusType,
  PriorityType,
  WorkTypeType,
  AssetTypeType,
  ChannelType,
  MemberRoleType,
  ActivityEntityTypeType,
  ActivityActionType,
} from "./enums";

export interface DispatchInfo {
  teamMemberIds: string[];
  internalDueAt: string;
  estimatedCostRmb: number;
  marketCostRmb: number;
  managerNote: string;
}

export interface BriefDeliverableItem {
  name: string;
  quantity: number;
  size: string;
  outputFormat: string;
  usageScenario: string;
  remark: string;
}

export interface BriefDeliverableTypeGroup {
  type: string;
  items: BriefDeliverableItem[];
}

export interface TypeTaskPackage {
  id: string;
  projectId: string;
  briefId: string;
  deliverableType: string;
  deliverableItems: BriefDeliverableItem[];
  assigneeId: string | null;
  assigneeName: string;
  promisedAt: string | null;
  estimatedWorkingHours: number | null;
  actualWorkingHours: number | null;
  assetCategory: string;
  assignmentNote: string;
  status: "待提交" | "待需求方审核" | "需修改" | "已通过" | "已结束";
  currentVersion: string | null;
  fileLinks: string[];
  uploadedFiles: Array<{
    name: string;
    size: number;
    type: string | null;
  }>;
  latestFeedback: string | null;
  submissions: string[];
  signoffHistory: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TypeTaskPackageSubmission {
  id: string;
  typeTaskPackageId: string;
  version: string;
  submittedAt: string;
  submittedBy: string;
  uploadedFiles: Array<{
    name: string;
    size: number;
    type: string | null;
  }>;
  fileLinks: string[];
  submitNote: string;
  signoffToken: string;
  signoffUrl: string;
  emailSentStatus: "draft" | "sent" | null;
}

export interface SignoffRecord {
  id: string;
  typeTaskPackageId: string;
  version: string;
  result: "passed" | "revision_requested";
  feedback: string;
  reviewedByName: string;
  reviewedByEmail: string;
  reviewedAt: string;
}

export interface Request {
  id: string;
  requestCode: string;
  title: string;
  description: string;
  requesterName: string;
  requesterEmail: string;
  requesterDept: string;
  brandTeamName: string;
  priority: PriorityType;
  stakeholderDueAt: string;
  status: RequestStatusType;
  deliverableSpecs: string[]; // Or more structured type depending on future needs
  supportingMaterialLinks: string[];
  dispatchInfo: DispatchInfo | null;
  projectId: string | null;
  requestNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectCost {
  estimatedInternalCost: number | null;
  actualInternalCost: number | null;
  marketReferenceCost: number | null;
  estimatedSaving: number | null;
  actualSaving: number | null;
}

export interface Project {
  id: string;
  projectCode: string;
  projectName: string;
  requestId: string;
  brandTeamName: string;
  ownerMemberId: string;
  collaboratorIds: string[];
  projectStatus: ProjectStatusType;
  currentNode: CurrentNodeType;
  internalDueAt: string;
  stakeholderDueAt: string;
  cost: ProjectCost;
  deliverableIds: string[];
  sourcePublishLinks: string[];
  assetIds: string[];
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeliverableFile {
  fileName: string;
  fileFormat: string;
  fileSize?: string;
  fileUrl: string;
}

export interface Deliverable {
  id: string;
  projectId: string;
  requestId: string;
  deliverableName: string;
  deliverableType: string;
  workType: WorkTypeType;
  assetType: AssetTypeType;
  channel: ChannelType;
  ownerMemberId: string;
  collaboratorIds: string[];
  deliverableStatus: DeliverableStatusType;
  effortPoints: number;
  formats: string[];
  latestSubmissionId: string | null;
  submissionIds: string[];
  reviewRecordIds: string[];
  assetIds: string[];
  dueAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  id: string;
  projectId: string;
  deliverableId: string;
  submitterId: string;
  version: number;
  files: DeliverableFile[];
  note: string;
  submittedAt: string;
  latestReviewRecordId: string | null;
}

export interface ReviewRecord {
  id: string;
  projectId: string;
  deliverableId: string;
  submissionId: string;
  reviewerId: string;
  reviewStatus: ReviewStatusType;
  reviewComment: string;
  reviewLocation: string | null;
  createdAt: string;
}

export interface MemberCapacity {
  weeklyCapacityPoints: number;
}

export interface Member {
  id: string;
  memberName: string;
  memberEmail: string;
  memberRole: MemberRoleType;
  memberTitle: string;
  skillTags: string[];
  capacity: MemberCapacity;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  assetCode: string;
  assetName: string;
  generatedName: string;
  sourceProjectId: string;
  sourceDeliverableId: string;
  sourceSubmissionId: string;
  assetType: AssetTypeType;
  workType: WorkTypeType;
  channel: ChannelType;
  tags: string[];
  usageNote: string;
  fileFormat: string;
  fileName: string;
  assetFileUrl: string;
  sourcePublishLinks: string[];
  usageIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AssetUsage {
  id: string;
  assetId: string;
  reuseProjectId: string;
  reuseDeliverableId: string;
  usedAt: string;
  usageScenario: string;
  reusePublishLink: string;
  createdAt: string;
}

export interface Portfolio {
  id: string;
  memberId: string;
  quarter: string;
  projectIds: string[];
  assetIds: string[];
  exportedAt: string | null;
  exportUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  level: "INFO" | "WARN" | "ERROR";
  actorId: string;
  entityType: ActivityEntityTypeType;
  entityId: string;
  action: ActivityActionType;
  message: string;
  route: string;
  routeParams: Record<string, string>;
  createdAt: string;
}
