const now = Date.parse("2026-05-12T09:00:00.000Z");
const d = (n: number) => new Date(now - n * 86400000).toISOString();
const f = (n: number) => new Date(now + n * 86400000).toISOString();

export interface Task {
  id: string; taskNumber: string; title: string; description?: string | null;
  status: string; priority: string; category: string;
  assigneeId?: string | null;
  primaryAssigneeId?: string | null;
  assigneeIds?: string[];
  createdById: string;
  questionnaireId?: string | null;
  videoUrl?: string | null;
  faLink?: string | null;
  faVersion?: string | null;
  acceptanceNote?: string | null;
  acceptanceEmailStatus?: "draft" | "sent" | null;
  signOffLink?: string | null;
  stakeholderAction?: "confirmed" | "revision_requested" | null;
  stakeholderFeedback?: string | null;
  stakeholderActionTime?: string | null;
  resubmitExpectedDate?: string | null;
  supportingLink?: string | null;
  estimatedCost?: number | null;
  marketCost?: number | null;
  brand?: string | null;
  channel?: string | null;
  assetType?: string | null;
  projectCode?: string | null;
  dueDate?: string | null; completedAt?: string | null;
  acceptedAt?: string | null;
  acceptanceHistory?: Array<{
    round: number;
    acceptedAt: string;
    faLink: string;
    faVersion: string;
    result: "pending" | "completed" | "revision_requested";
    resultAt?: string | null;
    feedback?: string | null;
  }> | null;
  requestDate?: string | null;
  stakeholderExpectedDueDate?: string | null;
  committedDeliveryDate?: string | null;
  internalDueDate?: string | null;
  estimatedWorkingHours?: number | null;
  actualWorkingHours?: number | null;
  marketReferenceCost?: number | null;
  internalCost?: number | null;
  workType?: string | null;
  createdAt: string; updatedAt: string;
}

export interface Review {
  id: string; taskId: string; reviewerId: string;
  status: string; comment: string | null; timestamp: string | null;
  submissionId?: string | null;
  createdAt: string;
}

export interface SubmissionRecord {
  id: string;
  taskId: string;
  typeTaskPackageId?: string | null;
  projectId?: string | null;
  submitterId: string;
  submittedBy?: string | null;
  version: string;
  submittedAt: string;
  fileName: string | null;
  uploadedFiles?: Array<{
    name: string;
    size: number;
    type: string | null;
  }>;
  link: string | null;
  fileLinks?: string[];
  note: string;
  submitNote?: string | null;
  signoffToken?: string | null;
  signoffUrl?: string | null;
  emailSentStatus?: "pending" | "sent" | "failed" | null;
  result?: "pending" | "passed" | "revision_requested" | null;
  reviewedAt?: string | null;
  reviewedByName?: string | null;
  reviewedByEmail?: string | null;
}

export interface DeliverableItem {
  name: string;
  quantity: number;
  size: string;
  outputFormat: string;
  usageScenario: string;
  remark: string;
}

export interface DeliverableTypeGroup {
  type: string;
  items: DeliverableItem[];
}

export type ProjectRecordStatus = "制作中" | "待验收" | "已完成" | "已取消";
export type TypeTaskPackageStatus = "待提交" | "待需求方审核" | "需修改" | "已通过" | "已结束";

export interface ProjectRecord {
  id: string;
  projectCode: string;
  briefId: string;
  projectName: string;
  brandTeam: string;
  requestorName: string;
  requestorEmail: string;
  status: ProjectRecordStatus;
  typeTaskPackageIds: string[];
  createdAt: string;
  completedAt: string | null;
  canceledAt: string | null;
  cancelReason: string | null;
  legacyTaskId?: string | null;
}

export interface TypeTaskPackage {
  id: string;
  projectId: string;
  briefId: string;
  deliverableType: string;
  deliverableItems: DeliverableItem[];
  assigneeId: string | null;
  assigneeName: string;
  promisedAt: string | null;
  estimatedWorkingHours: number | null;
  actualWorkingHours: number | null;
  assetCategory: string;
  assignmentNote: string;
  status: TypeTaskPackageStatus;
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

export interface SignoffRecord {
  id: string;
  typeTaskPackageId: string;
  projectId?: string | null;
  submissionId?: string | null;
  signoffToken?: string | null;
  version: string;
  result: "passed" | "revision_requested";
  feedback: string;
  reviewedByName: string;
  reviewedByEmail: string;
  reviewedAt: string;
}

export type ActivityEventLevel = "INFO" | "WARN" | "ERROR";
export type ActivityEntityType = "auth" | "task" | "questionnaire" | "review" | "submission" | "notification";

export interface ActivityEvent {
  id: string;
  level: ActivityEventLevel;
  actorId: string | null;
  entityType: ActivityEntityType;
  entityId: string | null;
  action: string;
  message: string;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

export interface SystemEvent {
  id: string;
  level: ActivityEventLevel;
  scope: "client" | "store" | "notification" | "data";
  message: string;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  createdAt: string;

  content?: string;
  message?: string;
  linkTo?: string;

  senderId?: string;
  senderName?: string;
  receiverId?: string;
  receiverName?: string;
  receiverEmail?: string;

  projectId?: string;
  projectCode?: string;
  projectName?: string;
  briefSummary?: string;
  requestDate?: string;
  stakeholderExpectedDueDate?: string;
  committedDeliveryDate?: string;
  internalDueDate?: string;
  clientDueDate?: string;
  assignNote?: string;
  projectStatus?: "制作中" | "待验收" | "已完成" | "已取消";
  deliverablesSummary?: string;
  workTeam?: string;
  faLink?: string;
  faVersion?: string;
  acceptanceNote?: string;
  signOffLink?: string;
  signoffUrl?: string;
  signoffToken?: string;
  submissionId?: string;
  submissionVersion?: string;
  typeTaskPackageId?: string;
  deliverableType?: string;
  stakeholderAction?: "confirmed" | "revision_requested";
  stakeholderFeedback?: string;
  stakeholderActionTime?: string;
  resubmitExpectedDate?: string;

  notificationStatus?: "未读" | "已读" | "已发送";
  actionText?: string;
  actionTarget?: string;
  secondaryActionText?: string;
  secondaryActionTarget?: string;

  userId?: string;
  isRead?: boolean;
}

export const USERS = [
  { id: "u1", name: "张磊", email: "zhanglei@example.com", password: "password123", avatar: "#7c5cfc", role: "LEADER", title: "主剪辑师" },
  { id: "u2", name: "王芳", email: "wangfang@example.com", password: "password123", avatar: "#f472b6", role: "LEADER", title: "制片主管" },
  { id: "u3", name: "李梅", email: "limei@example.com", password: "password123", avatar: "#f472b6", role: "MEMBER", title: "动效设计师" },
  { id: "u4", name: "王骏", email: "wangjun@example.com", password: "password123", avatar: "#34d399", role: "MEMBER", title: "摄影师" },
  { id: "u5", name: "陈宇", email: "chenyu@example.com", password: "password123", avatar: "#60a5fa", role: "MEMBER", title: "脚本策划" },
  { id: "u6", name: "赵琳", email: "zhaolin@example.com", password: "password123", avatar: "#fbbf24", role: "MEMBER", title: "后期剪辑" },
];

export const TASKS: Task[] = [
  { id: "t1", taskNumber: "VID-032", title: "节日祝福视频", description: "制作公司节日祝福短视频，包含全体员工祝福片段", status: "COMPLETED", priority: "MEDIUM", category: "SHOOTING", assigneeId: "u4", createdById: "u1", dueDate: d(5), completedAt: d(7), createdAt: d(30), updatedAt: d(7), faLink: "https://dam.example.com/fa/VID-032.mp4", brand: "百龄坛", channel: "微信", assetType: "社交媒体素材", projectCode: "MIX-2026-003", estimatedCost: 3000, marketCost: 8000 },
  { id: "t2", taskNumber: "VID-033", title: "技术团队招聘宣传片", description: "为HR部门制作技术团队招聘视频，展示公司技术文化", status: "COMPLETED", priority: "HIGH", category: "SCRIPT", assigneeId: "u5", createdById: "u2", dueDate: d(3), completedAt: d(4), createdAt: d(25), updatedAt: d(4), faLink: "https://dam.example.com/fa/VID-033.mp4", channel: "线下活动", assetType: "主题视频", projectCode: "MIX-2026-004", estimatedCost: 8000, marketCost: 22000 },
  { id: "t3", taskNumber: "VID-034", title: "品牌片头动画升级", description: "升级公司品牌片头动画，融入新的VI标准，时长5秒", status: "INTERNAL_REVIEW", priority: "HIGH", category: "ANIMATION", assigneeId: "u3", createdById: "u1", dueDate: f(2), createdAt: d(10), updatedAt: d(1), videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", brand: "绝对伏特加", assetType: "主题视频", projectCode: "MIX-2026-005", estimatedCost: 5000, marketCost: 15000 },
  { id: "t4", taskNumber: "VID-035", title: "3月投资者简报视频", description: "制作3月份投资者简报的配套视频，包含数据可视化动画", status: "INTERNAL_REVIEW", priority: "URGENT", category: "EDITING", assigneeId: "u1", createdById: "u2", dueDate: f(1), createdAt: d(14), updatedAt: d(1), videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", channel: "线下活动", assetType: "主题视频", estimatedCost: 6000, marketCost: 18000 },
  { id: "t5", taskNumber: "VID-036", title: "产品演示 — 新功能X", description: "为产品团队制作新功能X的演示视频，包含屏幕录制和解说", status: "INTERNAL_REVIEW", priority: "MEDIUM", category: "POST_PRODUCTION", assigneeId: "u1", createdById: "u1", dueDate: f(5), createdAt: d(7), updatedAt: d(1), videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4", brand: "马爹利", channel: "电商平台", assetType: "本地化适配", estimatedCost: 4000, marketCost: 12000 },
  { id: "t6", taskNumber: "VID-037", title: "春季系列社交媒体预告", description: "制作春季产品系列的社交媒体预告片，15秒竖版", status: "WIP", priority: "HIGH", category: "ANIMATION", assigneeId: "u3", createdById: "u2", dueDate: f(7), createdAt: d(5), updatedAt: d(2), brand: "芝华士", channel: "小红书", assetType: "社交媒体素材", projectCode: "MIX-2026-007" },
  { id: "t7", taskNumber: "VID-038", title: "客户证言 — 某某公司", description: "拍摄某某公司客户证言视频，采访其CEO和产品负责人", status: "PENDING_SIGNOFF", priority: "MEDIUM", category: "SHOOTING", assigneeId: "u4", createdById: "u1", dueDate: f(10), createdAt: d(8), updatedAt: d(1), faLink: "https://dam.example.com/fa/VID-038.mp4", channel: "微信", assetType: "主题视频", estimatedCost: 7000, marketCost: 20000 },
  { id: "t8", taskNumber: "VID-039", title: "新员工入职引导视频 v2", description: "更新新员工入职引导视频，加入新的公司制度和流程", status: "CANCELED", priority: "LOW", category: "SCRIPT", assigneeId: "u5", createdById: "u2", dueDate: f(14), createdAt: d(6), updatedAt: d(1), assetType: "主题视频", estimatedCost: 3200, marketCost: 5200 },
  { id: "t9", taskNumber: "VID-040", title: "年度回顾混剪", description: "制作公司年度回顾视频，汇总全年重要活动和里程碑", status: "WIP", priority: "MEDIUM", category: "EDITING", assigneeId: "u1", createdById: "u1", dueDate: f(21), createdAt: d(3), updatedAt: d(1), brand: "百龄坛", channel: "微信", assetType: "主题视频", projectCode: "MIX-2026-001", estimatedCost: 5000, marketCost: 15000 },
  { id: "t10", taskNumber: "VID-041", title: "Q3产品发布宣传片", description: "为Q3产品发布会制作宣传片，需要高质量特效和配乐", status: "BRIEF_REVIEW", priority: "URGENT", category: "POST_PRODUCTION", assigneeId: null, createdById: "u2", dueDate: f(30), createdAt: d(1), updatedAt: d(1), brand: "绝对伏特加", channel: "电商平台", assetType: "主题视频", projectCode: "MIX-2026-010", estimatedCost: 12000, marketCost: 35000 },
  { id: "t11", taskNumber: "VID-042", title: "内部培训 — 新CRM系统操作", description: "录制新CRM系统操作培训视频", status: "BRIEF_REVIEW", priority: "MEDIUM", category: "SCRIPT", assigneeId: null, createdById: "u1", dueDate: f(20), createdAt: d(1), updatedAt: d(1), assetType: "主题视频" },
  { id: "t12", taskNumber: "VID-043", title: "CEO主题演讲精华剪辑", description: "从CEO年度大会演讲中剪辑精华片段，制作3分钟传播版本", status: "BRIEF_REVIEW", priority: "MEDIUM", category: "EDITING", assigneeId: null, createdById: "u2", dueDate: f(15), createdAt: d(1), updatedAt: d(1), channel: "微信", assetType: "本地化适配" },

  // ── 张磊(u1) 制作中 ──
  { id: "t13", taskNumber: "VID-044", title: "品牌焕新系列 — 主视频", description: "配合公司品牌焕新，制作旗舰形象片，时长约90秒，需输出中英双语版本", status: "WIP", priority: "HIGH", category: "EDITING", assigneeId: "u1", createdById: "u2", dueDate: f(12), createdAt: d(4), updatedAt: d(1), brand: "马爹利", channel: "线下活动", assetType: "主题视频", projectCode: "MIX-2026-002", estimatedCost: 10000, marketCost: 30000 },
  { id: "t14", taskNumber: "VID-045", title: "秋季促销社媒短片", description: "制作三组15秒竖版短片，分别适配抖音、小红书、视频号投放", status: "WIP", priority: "MEDIUM", category: "ANIMATION", assigneeId: "u1", createdById: "u2", dueDate: f(18), createdAt: d(3), updatedAt: d(1), brand: "芝华士", channel: "小红书", assetType: "社交媒体素材", projectCode: "MIX-2026-008" },
  { id: "t15", taskNumber: "VID-046", title: "合作伙伴峰会花絮剪辑", description: "剪辑合作伙伴峰会全天花絮，输出5分钟精华版与30秒预告两个版本", status: "WIP", priority: "LOW", category: "EDITING", assigneeId: "u1", createdById: "u1", dueDate: f(25), createdAt: d(2), updatedAt: d(1), channel: "微信", assetType: "本地化适配", estimatedCost: 3000, marketCost: 9000 },

  // ── 张磊(u1) 内部审核 ──
  { id: "t16", taskNumber: "VID-047", title: "Q2数据回顾动态图表", description: "将Q2财务与业务数据制作成动态信息图，时长60秒，供高管会议使用", status: "INTERNAL_REVIEW", priority: "HIGH", category: "ANIMATION", assigneeId: "u1", createdById: "u2", dueDate: f(3), createdAt: d(9), updatedAt: d(2), videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", brand: "绝对伏特加", assetType: "主题视频", estimatedCost: 4500, marketCost: 14000 },
  { id: "t17", taskNumber: "VID-048", title: "新品上线预热视频", description: "新产品发布前的预热悬念视频，时长30秒，需保密处理产品外观细节", status: "INTERNAL_REVIEW", priority: "URGENT", category: "POST_PRODUCTION", assigneeId: "u1", createdById: "u2", dueDate: f(2), createdAt: d(6), updatedAt: d(1), videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4", brand: "马爹利", channel: "电商平台", assetType: "主题视频", projectCode: "MIX-2026-006", estimatedCost: 8000, marketCost: 25000 },

  // ── 张磊(u1) 已完成 ──
  { id: "t18", taskNumber: "VID-025", title: "产品使用教程合集", description: "整理并剪辑全套产品使用教程，分10个章节发布", status: "COMPLETED", priority: "MEDIUM", category: "EDITING", assigneeId: "u1", createdById: "u2", dueDate: d(20), completedAt: d(22), createdAt: d(50), updatedAt: d(22), faLink: "https://dam.example.com/fa/VID-025.mp4", assetType: "主题视频", estimatedCost: 6000, marketCost: 18000 },
  { id: "t19", taskNumber: "VID-027", title: "公司九周年纪念片", description: "以时间线为主轴，回顾公司九年发展历程，时长约5分钟", status: "COMPLETED", priority: "HIGH", category: "EDITING", assigneeId: "u1", createdById: "u2", dueDate: d(15), completedAt: d(16), createdAt: d(40), updatedAt: d(16), faLink: "https://dam.example.com/fa/VID-027.mp4", brand: "百龄坛", channel: "线下活动", assetType: "主题视频", projectCode: "MIX-2026-009", estimatedCost: 10000, marketCost: 28000 },
  { id: "t20", taskNumber: "VID-029", title: "春节特辑祝福视频", description: "制作春节主题祝福视频，融合传统元素与公司文化，时长45秒", status: "COMPLETED", priority: "LOW", category: "ANIMATION", assigneeId: "u1", createdById: "u1", dueDate: d(35), completedAt: d(36), createdAt: d(60), updatedAt: d(36), faLink: "https://dam.example.com/fa/VID-029.mp4", brand: "芝华士", channel: "微信", assetType: "社交媒体素材" },
  { id: "t21", taskNumber: "VID-030", title: "行业大会主题演讲剪辑", description: "剪辑CEO在行业大会的主题演讲，制作适合媒体发布的精华版本", status: "COMPLETED", priority: "MEDIUM", category: "EDITING", assigneeId: "u1", createdById: "u2", dueDate: d(10), completedAt: d(11), createdAt: d(30), updatedAt: d(11), faLink: "https://dam.example.com/fa/VID-030.mp4", channel: "微信", assetType: "本地化适配", estimatedCost: 4000, marketCost: 12000 },

  // ── 其他成员任务补充 ──
  // 李梅(u3)
  { id: "t22", taskNumber: "VID-049", title: "App引导页动画", description: "为新版App设计并制作4屏引导页动画，风格轻盈现代", status: "WIP", priority: "HIGH", category: "ANIMATION", assigneeId: "u3", createdById: "u1", dueDate: f(8), createdAt: d(3), updatedAt: d(1), brand: "绝对伏特加", assetType: "本地化适配" },
  { id: "t23", taskNumber: "VID-026", title: "产品发布会开场动画", description: "为Q2产品发布会制作60秒开场动画，需配合现场LED尺寸输出", status: "COMPLETED", priority: "HIGH", category: "ANIMATION", assigneeId: "u3", createdById: "u1", dueDate: d(18), completedAt: d(19), createdAt: d(45), updatedAt: d(19), faLink: "https://dam.example.com/fa/VID-026.mp4", brand: "马爹利", channel: "线下活动", assetType: "主题视频", estimatedCost: 7000, marketCost: 20000 },
  // 王骏(u4)
  { id: "t24", taskNumber: "VID-050", title: "城市街拍系列 — 第三集", description: "拍摄品牌城市街拍系列第三集，取景北京三里屯及798艺术区", status: "WIP", priority: "MEDIUM", category: "SHOOTING", assigneeId: "u4", createdById: "u2", dueDate: f(6), createdAt: d(4), updatedAt: d(1), brand: "百龄坛", channel: "小红书", assetType: "社交媒体素材" },
  { id: "t25", taskNumber: "VID-051", title: "产品功能演示拍摄", description: "棚拍产品功能演示素材，需要micro镜头特写及慢动作版本", status: "INTERNAL_REVIEW", priority: "HIGH", category: "SHOOTING", assigneeId: "u4", createdById: "u1", dueDate: f(4), createdAt: d(7), updatedAt: d(1), videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", brand: "芝华士", assetType: "主题视频", estimatedCost: 5000, marketCost: 16000 },
  { id: "t26", taskNumber: "VID-028", title: "员工年终采访记录", description: "逐一采访各部门代表员工，收集年终感言素材", status: "COMPLETED", priority: "LOW", category: "SHOOTING", assigneeId: "u4", createdById: "u2", dueDate: d(25), completedAt: d(26), createdAt: d(50), updatedAt: d(26), faLink: "https://dam.example.com/fa/VID-028.mp4", assetType: "主题视频" },
  // 陈宇(u5)
  { id: "t27", taskNumber: "VID-052", title: "Q3营销战役脚本", description: "撰写Q3全渠道营销战役系列视频脚本，共5支，总时长约6分钟", status: "WIP", priority: "URGENT", category: "SCRIPT", assigneeId: "u5", createdById: "u2", dueDate: f(5), createdAt: d(2), updatedAt: d(1), brand: "绝对伏特加", channel: "电商平台", assetType: "主题视频", projectCode: "MIX-2026-011" },
  { id: "t28", taskNumber: "VID-031", title: "客户成功案例脚本", description: "撰写三个行业客户成功案例的采访脚本和叙事框架", status: "COMPLETED", priority: "MEDIUM", category: "SCRIPT", assigneeId: "u5", createdById: "u1", dueDate: d(12), completedAt: d(13), createdAt: d(35), updatedAt: d(13), faLink: "https://dam.example.com/fa/VID-031.mp4", assetType: "主题视频", estimatedCost: 3000, marketCost: 10000 },
  // 赵琳(u6)
  { id: "t29", taskNumber: "VID-053", title: "618大促混剪", description: "整合618大促期间所有素材，制作2分钟年度大促回顾混剪", status: "WIP", priority: "HIGH", category: "POST_PRODUCTION", assigneeId: "u6", createdById: "u2", dueDate: f(9), createdAt: d(3), updatedAt: d(1), brand: "马爹利", channel: "电商平台", assetType: "社交媒体素材", estimatedCost: 4000, marketCost: 12000 },
  { id: "t30", taskNumber: "VID-054", title: "社媒内容月度精选", description: "每月剪辑社交媒体发布素材合集，输出30秒版与60秒版各一", status: "INTERNAL_REVIEW", priority: "MEDIUM", category: "POST_PRODUCTION", assigneeId: "u6", createdById: "u2", dueDate: f(7), createdAt: d(6), updatedAt: d(2), videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4", channel: "小红书", assetType: "社交媒体素材" },
  { id: "t31", taskNumber: "VID-024", title: "年会精彩片段后期", description: "对年会全程录像进行精剪，突出颁奖、节目及高管致辞片段", status: "COMPLETED", priority: "HIGH", category: "POST_PRODUCTION", assigneeId: "u6", createdById: "u1", dueDate: d(22), completedAt: d(23), createdAt: d(48), updatedAt: d(23), faLink: "https://dam.example.com/fa/VID-024.mp4", channel: "线下活动", assetType: "主题视频", estimatedCost: 5000, marketCost: 15000 },

  { id: "t32", taskNumber: "VID-060", title: "Q3 产品发布整合物料", description: "负责社媒平面延展，包含小红书与微信尺寸。", status: "WIP", priority: "HIGH", category: "DESIGN", assigneeId: "u1", createdById: "u2", questionnaireId: "q4", dueDate: f(1), createdAt: d(2), updatedAt: d(0), brand: "马爹利", channel: "微信", assetType: "社交媒体素材", projectCode: "PRJ-1001", estimatedCost: 12000, marketCost: 18000 },
  { id: "t33", taskNumber: "VID-061", title: "门店 POSM 物料更新", description: "内页与门店海报文字统一更新。", status: "WIP", priority: "MEDIUM", category: "DESIGN", assigneeId: "u6", createdById: "u2", questionnaireId: "q5", dueDate: d(1), createdAt: d(3), updatedAt: d(1), brand: null, channel: "门店", assetType: "线下物料", projectCode: "PRJ-1002", estimatedCost: 3200, marketCost: 5200 },
  { id: "t34", taskNumber: "VID-062", title: "CEO 走播演讲稿视频", description: "负责 V1 脚本与镜头脚本。", status: "INTERNAL_REVIEW", priority: "HIGH", category: "SCRIPT", assigneeId: "u2", createdById: "u1", questionnaireId: "q6", dueDate: f(2), createdAt: d(4), updatedAt: d(0), brand: null, channel: "内部汇报", assetType: "主题视频", projectCode: "PRJ-1003", estimatedCost: 2400, marketCost: 4200 },
  { id: "t35", taskNumber: "VID-063", title: "新品上市策略视频", description: "负责剪辑优化与字幕校对。", status: "WIP", priority: "MEDIUM", category: "EDITING", assigneeId: "u3", createdById: "u2", questionnaireId: "q7", dueDate: f(4), createdAt: d(5), updatedAt: d(0), brand: "绝对伏特加", channel: "抖音", assetType: "社交媒体素材", projectCode: "PRJ-1004", estimatedCost: 5600, marketCost: 16600 },
  { id: "t36", taskNumber: "VID-064", title: "年会开场视频", description: "负责剪辑节奏与字幕。", status: "PENDING_SIGNOFF", priority: "LOW", category: "EDITING", assigneeId: "u4", createdById: "u2", questionnaireId: "q8", dueDate: f(20), createdAt: d(6), updatedAt: d(0), brand: null, channel: "线下活动", assetType: "主题视频", projectCode: "PRJ-1005", estimatedCost: 6400, marketCost: 7900 },
  { id: "t37", taskNumber: "VID-065", title: "品牌焕新系列主视觉", description: "负责主视觉延展尺寸适配。", status: "COMPLETED", priority: "MEDIUM", category: "DESIGN", assigneeId: "u5", createdById: "u2", questionnaireId: "q9", dueDate: d(2), completedAt: d(1), createdAt: d(18), updatedAt: d(1), brand: "芝华士", channel: "电商平台", assetType: "平面设计", projectCode: "PRJ-1006", faLink: "https://dam.example.com/fa/VID-065.zip", estimatedCost: 15000, marketCost: 26000 },

  { id: "t44", taskNumber: "VID-066", title: "新品上市倒计时视频", description: "倒计时视频多规格交付，包含 15s / 30s / 6s 三版。", status: "INTERNAL_REVIEW", priority: "URGENT", category: "EDITING", assigneeId: "u3", createdById: "u2", questionnaireId: "q7", dueDate: f(1), createdAt: d(4), updatedAt: d(0), brand: "绝对伏特加", channel: "抖音", assetType: "社交媒体素材", projectCode: "PRJ-1004", estimatedCost: 5600, marketCost: 16600 },
  { id: "t45", taskNumber: "VID-067", title: "新品发布主视觉文案", description: "文案单交付：一句主标题 + 一句 CTA。", status: "INTERNAL_REVIEW", priority: "HIGH", category: "SCRIPT", assigneeId: "u6", createdById: "u1", questionnaireId: "q10", dueDate: f(3), createdAt: d(3), updatedAt: d(0), brand: "百龄坛", channel: "小红书", assetType: "文案", projectCode: "PRJ-1013", estimatedCost: 1800, marketCost: 5200 },
  { id: "t46", taskNumber: "VID-068", title: "门店活动回顾短视频", description: "活动回顾单条视频交付，需优先处理。", status: "INTERNAL_REVIEW", priority: "HIGH", category: "POST_PRODUCTION", assigneeId: "u6", createdById: "u2", questionnaireId: "q5", dueDate: d(1), createdAt: d(6), updatedAt: d(0), brand: null, channel: "门店", assetType: "视频", projectCode: "PRJ-1014", estimatedCost: 4200, marketCost: 12600 },
  { id: "t47", taskNumber: "VID-069", title: "Q3 发布整合物料 — 社媒平面", description: "交付两套社媒平面尺寸，内部审核通过后进入最终验收流程。", status: "PENDING_SIGNOFF", priority: "MEDIUM", category: "OTHER", assigneeId: "u1", createdById: "u2", questionnaireId: "q4", dueDate: f(2), createdAt: d(7), updatedAt: d(1), brand: "马爹利", channel: "微信", assetType: "平面设计", projectCode: "PRJ-1001" },
  { id: "t48", taskNumber: "VID-070", title: "夏季 campaign KV 动效适配", description: "将夏季 campaign 主视觉拆分为 15 秒动态 KV，并输出抖音与视频号双尺寸。", status: "WIP", priority: "HIGH", category: "ANIMATION", assigneeId: "u1", createdById: "u2", dueDate: f(1), createdAt: d(2), updatedAt: d(0), brand: "芝华士", channel: "抖音", assetType: "社交媒体素材", projectCode: "MIX-2026-012", estimatedCost: 4800, marketCost: 12600 },
  { id: "t49", taskNumber: "VID-071", title: "新品培训课件剪辑", description: "把产品培训课件录屏与讲解剪成 6 段短视频，供渠道销售内部学习。", status: "WIP", priority: "MEDIUM", category: "EDITING", assigneeId: "u1", createdById: "u2", dueDate: d(1), createdAt: d(4), updatedAt: d(0), brand: null, channel: "内部培训", assetType: "主题视频", projectCode: "MIX-2026-013", estimatedCost: 5200, marketCost: 14800 },
  { id: "t50", taskNumber: "VID-072", title: "双11预热海报延展", description: "延展双11预热海报主视觉，补齐首页 banner、详情页头图和社媒封面。", status: "WIP", priority: "MEDIUM", category: "DESIGN", assigneeId: "u1", createdById: "u2", dueDate: f(6), createdAt: d(3), updatedAt: d(0), brand: "Martell", channel: "电商平台", assetType: "平面设计", projectCode: "MIX-2026-014", estimatedCost: 3600, marketCost: 9800 },
  { id: "t51", taskNumber: "VID-073", title: "渠道招商手册修订", description: "修订新版渠道招商手册，需同步更新封面、目录和核心产品页。", status: "WIP", priority: "HIGH", category: "DESIGN", assigneeId: "u1", createdById: "u2", dueDate: d(2), createdAt: d(5), updatedAt: d(1), brand: null, channel: "门店", assetType: "线下物料", projectCode: "MIX-2026-015", estimatedCost: 6400, marketCost: 17200 },
  { id: "t52", taskNumber: "VID-074", title: "品牌片字幕多语版", description: "基于品牌片 master 输出中英双语与粤语字幕版，保证行长和安全区一致。", status: "INTERNAL_REVIEW", priority: "HIGH", category: "EDITING", assigneeId: "u1", createdById: "u2", dueDate: f(2), createdAt: d(4), updatedAt: d(1), brand: "百龄坛", channel: "微信", assetType: "视频", projectCode: "MIX-2026-016", estimatedCost: 4200, marketCost: 11800 },
  { id: "t53", taskNumber: "VID-075", title: "门店陈列海报改版", description: "根据新一轮促销权益调整门店海报版式，需要补齐 A1、A3 与立架三个尺寸。", status: "INTERNAL_REVIEW", priority: "URGENT", category: "DESIGN", assigneeId: "u1", createdById: "u2", dueDate: d(1), createdAt: d(3), updatedAt: d(1), brand: null, channel: "门店", assetType: "平面设计", projectCode: "MIX-2026-017", estimatedCost: 3800, marketCost: 9600 },
  { id: "t54", taskNumber: "VID-076", title: "发布会开场主视觉文案", description: "完善发布会开场 KV 的主标题、次标题和 CTA，需适配 LED 和暖场海报。", status: "INTERNAL_REVIEW", priority: "HIGH", category: "SCRIPT", assigneeId: "u1", createdById: "u2", dueDate: f(1), createdAt: d(2), updatedAt: d(0), brand: "Martell", channel: "线下活动", assetType: "文案", projectCode: "MIX-2026-018", estimatedCost: 1800, marketCost: 5200 },
  { id: "t55", taskNumber: "VID-077", title: "电商详情页动图优化", description: "优化电商详情页 6 张 GIF 动图的节奏与信息分层，兼容移动端首屏。", status: "INTERNAL_REVIEW", priority: "HIGH", category: "POST_PRODUCTION", assigneeId: "u1", createdById: "u2", dueDate: d(3), createdAt: d(5), updatedAt: d(1), brand: null, channel: "电商平台", assetType: "社交媒体素材", projectCode: "MIX-2026-019", estimatedCost: 5600, marketCost: 14600 },
  { id: "t56", taskNumber: "VID-078", title: "经销商大会倒计时片", description: "为经销商大会制作 30 秒倒计时片，现场屏与朋友圈预热视频共用素材。", status: "PENDING_SIGNOFF", priority: "HIGH", category: "EDITING", assigneeId: "u1", createdById: "u2", dueDate: f(1), createdAt: d(4), updatedAt: d(0), brand: "Martell", channel: "线下活动", assetType: "主题视频", projectCode: "MIX-2026-020", estimatedCost: 6800, marketCost: 18800, faLink: "https://share.example.com/fa/VID-078" },
  { id: "t57", taskNumber: "VID-079", title: "新品卖点拆条海报", description: "把新品核心卖点拆成 4 张单页海报，用于 CRM 推送与门店立牌。", status: "PENDING_SIGNOFF", priority: "MEDIUM", category: "DESIGN", assigneeId: "u1", createdById: "u2", dueDate: d(1), createdAt: d(6), updatedAt: d(1), brand: null, channel: "CRM", assetType: "平面设计", projectCode: "MIX-2026-021", estimatedCost: 3000, marketCost: 8600, faLink: "https://share.example.com/fa/VID-079" },
  { id: "t58", taskNumber: "VID-080", title: "季度总结图文长页", description: "将季度总结拆成一屏式长图页面，适配管理层周报与外部传播场景。", status: "PENDING_SIGNOFF", priority: "MEDIUM", category: "DESIGN", assigneeId: "u1", createdById: "u1", dueDate: f(2), createdAt: d(5), updatedAt: d(0), brand: null, channel: "内部汇报", assetType: "平面设计", projectCode: "MIX-2026-022", estimatedCost: 2600, marketCost: 7200, faLink: "https://share.example.com/fa/VID-080" },
  { id: "t59", taskNumber: "VID-081", title: "门店活动落地页文案", description: "补齐门店活动落地页标题、卖点与报名引导文案，覆盖 H5 与短信落地页。", status: "PENDING_SIGNOFF", priority: "HIGH", category: "SCRIPT", assigneeId: "u1", createdById: "u2", dueDate: d(2), createdAt: d(4), updatedAt: d(1), brand: null, channel: "H5", assetType: "文案", projectCode: "MIX-2026-023", estimatedCost: 2200, marketCost: 6200, faLink: "https://share.example.com/fa/VID-081" },
  { id: "t60", taskNumber: "VID-082", title: "会员活动 recap 短片", description: "剪辑会员活动 recap 短片，输出 60 秒主版和 15 秒 teaser。", status: "COMPLETED", priority: "MEDIUM", category: "EDITING", assigneeId: "u1", createdById: "u2", dueDate: d(8), completedAt: d(7), createdAt: d(18), updatedAt: d(7), brand: "芝华士", channel: "微信", assetType: "视频", projectCode: "MIX-2026-024", estimatedCost: 6200, marketCost: 16800, faLink: "https://dam.example.com/fa/VID-082.mp4" },
  { id: "t61", taskNumber: "VID-083", title: "新品发布直播切片", description: "将新品发布直播切成 6 条竖版精华片，用于视频号和抖音持续投放。", status: "COMPLETED", priority: "HIGH", category: "POST_PRODUCTION", assigneeId: "u1", createdById: "u2", dueDate: d(10), completedAt: d(9), createdAt: d(20), updatedAt: d(9), brand: "Martell", channel: "抖音", assetType: "社交媒体素材", projectCode: "MIX-2026-025", estimatedCost: 8200, marketCost: 21600, faLink: "https://dam.example.com/fa/VID-083.mp4" },
  { id: "t62", taskNumber: "VID-084", title: "线下路演易拉宝更新", description: "配合临时路演调整产品卖点，更新易拉宝与签到背景板版面。", status: "CANCELED", priority: "LOW", category: "DESIGN", assigneeId: "u1", createdById: "u2", dueDate: f(5), createdAt: d(7), updatedAt: d(2), brand: null, channel: "线下活动", assetType: "线下物料", projectCode: "MIX-2026-026", estimatedCost: 2600, marketCost: 5800 },
  { id: "t63", taskNumber: "VID-085", title: "高管访谈封面 KV", description: "为高管访谈栏目制作封面 KV 与视频封面模板，统一后续系列视觉。", status: "COMPLETED", priority: "MEDIUM", category: "DESIGN", assigneeId: "u1", createdById: "u1", dueDate: d(12), completedAt: d(11), createdAt: d(24), updatedAt: d(11), brand: null, channel: "微信", assetType: "平面设计", projectCode: "MIX-2026-027", estimatedCost: 3400, marketCost: 9200, faLink: "https://dam.example.com/fa/VID-085.zip" },
  { id: "t64", taskNumber: "VID-086", title: "新品上市卖点短视频", description: "拆分新品上市核心卖点，输出 3 条社媒短视频。", status: "WIP", priority: "HIGH", category: "EDITING", assigneeId: "u3", createdById: "u2", questionnaireId: "q23", dueDate: f(9), createdAt: d(2), updatedAt: d(0), brand: "马爹利", channel: "抖音", assetType: "社交媒体素材", projectCode: "PRJ-2001", estimatedCost: 6800, marketCost: 18200 },
  { id: "t65", taskNumber: "VID-087", title: "双11 主视觉 KV 延展", description: "补齐首页 banner、详情页头图和社媒封面三种尺寸。", status: "INTERNAL_REVIEW", priority: "HIGH", category: "DESIGN", assigneeId: "u6", createdById: "u2", questionnaireId: "q24", dueDate: f(6), createdAt: d(4), updatedAt: d(0), brand: "芝华士", channel: "电商平台", assetType: "平面设计", projectCode: "PRJ-2002", estimatedCost: 4200, marketCost: 10600 },
  { id: "t66", taskNumber: "VID-088", title: "会员日 EDM 文案", description: "整理会员日主标题、副标题和 CTA 文案，适配 EDM 与落地页。", status: "WIP", priority: "MEDIUM", category: "SCRIPT", assigneeId: "u1", createdById: "u2", questionnaireId: "q25", dueDate: f(4), createdAt: d(3), updatedAt: d(0), brand: "百龄坛", channel: "CRM", assetType: "文案", projectCode: "PRJ-2003", estimatedCost: 2200, marketCost: 6200 },
  { id: "t67", taskNumber: "VID-089", title: "发布会现场花絮快剪", description: "发布会结束后 24 小时内输出现场花絮快剪，用于社媒传播。", status: "PENDING_SIGNOFF", priority: "URGENT", category: "POST_PRODUCTION", assigneeId: "u4", createdById: "u2", questionnaireId: "q26", dueDate: f(8), createdAt: d(5), updatedAt: d(1), brand: "绝对伏特加", channel: "微信", assetType: "视频", projectCode: "PRJ-2004", estimatedCost: 7600, marketCost: 19800, faLink: "https://share.example.com/fa/VID-089" },
  { id: "t68", taskNumber: "VID-090", title: "门店海报套装更新", description: "同步更新 A1 海报、收银台立牌和冰桶贴三套门店平面。", status: "COMPLETED", priority: "MEDIUM", category: "DESIGN", assigneeId: "u5", createdById: "u2", questionnaireId: "q27", dueDate: d(3), completedAt: d(2), createdAt: d(10), updatedAt: d(2), brand: "马爹利", channel: "门店", assetType: "平面设计", projectCode: "PRJ-2005", estimatedCost: 5100, marketCost: 13600, faLink: "https://dam.example.com/fa/VID-090.zip" },
  { id: "t69", taskNumber: "VID-091", title: "区域招商会回顾视频", description: "剪辑区域招商会回顾视频，原计划用于经销商复盘传播。", status: "CANCELED", priority: "LOW", category: "EDITING", assigneeId: "u3", createdById: "u2", questionnaireId: "q28", dueDate: f(3), createdAt: d(6), updatedAt: d(1), brand: null, channel: "线下活动", assetType: "视频", projectCode: "PRJ-2006", estimatedCost: 3800, marketCost: 9200 },
  { id: "t70", taskNumber: "VID-092", title: "品牌故事字幕多语版", description: "基于品牌故事主片补齐中英双语和日语字幕版本。", status: "INTERNAL_REVIEW", priority: "HIGH", category: "EDITING", assigneeId: "u1", createdById: "u2", questionnaireId: "q29", dueDate: f(5), createdAt: d(5), updatedAt: d(0), brand: "百龄坛", channel: "微信", assetType: "视频", projectCode: "PRJ-2007", estimatedCost: 4600, marketCost: 11200 },
  { id: "t71", taskNumber: "VID-093", title: "导购手册封面优化", description: "优化导购手册封面主视觉与导购卖点标题层级。", status: "WIP", priority: "MEDIUM", category: "DESIGN", assigneeId: "u6", createdById: "u1", questionnaireId: "q30", dueDate: f(7), createdAt: d(2), updatedAt: d(0), brand: null, channel: "内部培训", assetType: "平面设计", projectCode: "PRJ-2008", estimatedCost: 2600, marketCost: 6800 },
];

export interface Questionnaire {
  id: string; title: string; description: string; videoType: string;
  duration: string; deadline: string; requesterName: string;
  requesterEmail: string; requesterDept: string | null;
  deliverableTypes?: DeliverableTypeGroup[];
  specialNotes: string | null; status: string;
  claimedById: string | null; assignedById: string | null; createdAt: string;
}

export const QUESTIONNAIRES: Questionnaire[] = [
  { id: "q1", title: "Q3产品发布宣传片", description: "为Q3产品发布会制作一支高质量宣传片，需要展示新产品特性和品牌形象", videoType: "PROMO", duration: "90秒", deadline: f(30), requesterName: "张明", requesterEmail: "zhangming@example.com", requesterDept: "市场部", specialNotes: "需要在发布会前一周完成", status: "PENDING", claimedById: null, assignedById: null, createdAt: d(1) },
  { id: "q2", title: "内部培训 — 新CRM系统操作", description: "需要一个新CRM系统的操作培训视频，供全公司员工学习使用", videoType: "TRAINING", duration: "10-15分钟", deadline: f(20), requesterName: "刘洋", requesterEmail: "liuyang@example.com", requesterDept: "销售部", specialNotes: "请分章节制作", status: "UNDER_REVIEW", claimedById: "u5", assignedById: null, createdAt: d(3) },
  { id: "q3", title: "CEO主题演讲精华剪辑", description: "将CEO在年度大会上的45分钟演讲剪辑为3分钟精华版", videoType: "EVENT", duration: "3分钟", deadline: f(15), requesterName: "赵敏", requesterEmail: "zhaomin@example.com", requesterDept: "行政部", specialNotes: null, status: "ASSIGNED", claimedById: "u1", assignedById: "u2", createdAt: d(5) },
  { id: "q4", title: "Q3 产品发布整合物料", description: "发布会视频、社媒平面与线下门店物料整合制作。", videoType: "PROMO", duration: "-", deadline: f(28), requesterName: "苏菲", requesterEmail: "sophie@example.com", requesterDept: null, specialNotes: JSON.stringify({ brand: "马爹利", company: "保乐力加", priority: "High", deliverables: { "平面设计": [{}, {}] } }), status: "ASSIGNED", claimedById: null, assignedById: "u2", createdAt: d(6) },
  { id: "q5", title: "门店 POSM 物料更新", description: "门店陈列物料更新与更换。", videoType: "PROMO", duration: "-", deadline: f(18), requesterName: "乔雯", requesterEmail: "qiaowen@example.com", requesterDept: "渠道部", specialNotes: JSON.stringify({ team: "Retail Team", priority: "Medium", deliverables: { "线下物料": [{}], "平面设计": [{}, {}], "视频": [{}] } }), status: "ASSIGNED", claimedById: null, assignedById: "u2", createdAt: d(7) },
  { id: "q6", title: "CEO 走播演讲稿视频", description: "负责 V1 脚本与镜头脚本。", videoType: "EVENT", duration: "-", deadline: f(12), requesterName: "陈然", requesterEmail: "chenran@example.com", requesterDept: "传播部", specialNotes: JSON.stringify({ team: "Corporate", priority: "High", deliverables: { "视频": [{}] } }), status: "ASSIGNED", claimedById: null, assignedById: "u1", createdAt: d(8) },
  { id: "q7", title: "新品上市策略视频", description: "负责剪辑优化与字幕校对。", videoType: "PROMO", duration: "-", deadline: f(14), requesterName: "Lucas", requesterEmail: "lucas@example.com", requesterDept: null, specialNotes: JSON.stringify({ brand: "绝对伏特加", company: "保乐力加", priority: "Medium", deliverables: { "视频": [{}, {}, {}] } }), status: "ASSIGNED", claimedById: null, assignedById: "u2", createdAt: d(9) },
  { id: "q8", title: "年会开场视频", description: "年会开场 3 分钟视频，现场播放。", videoType: "EVENT", duration: "-", deadline: f(32), requesterName: "周洋", requesterEmail: "zhouyang@example.com", requesterDept: "人力资源部", specialNotes: JSON.stringify({ team: "HR Team", priority: "Low", deliverables: { "视频": [{}] } }), status: "ASSIGNED", claimedById: null, assignedById: "u2", createdAt: d(10) },
  { id: "q9", title: "品牌焕新系列主视觉", description: "负责主视觉延展尺寸适配。", videoType: "PROMO", duration: "-", deadline: f(40), requesterName: "Emma", requesterEmail: "emma@example.com", requesterDept: null, specialNotes: JSON.stringify({ brand: "芝华士", company: "保乐力加", priority: "Medium", deliverables: { "平面设计": [{}, {}, {}] } }), status: "ASSIGNED", claimedById: null, assignedById: "u2", createdAt: d(11) },
  { id: "q10", title: "新品发布主视觉文案", description: "一句主标题 + 一句 CTA，适配小红书与微信。", videoType: "OTHER", duration: "-", deadline: f(9), requesterName: "李娜", requesterEmail: "lina@example.com", requesterDept: "市场部", specialNotes: JSON.stringify({ brand: "百龄坛", priority: "High", deliverables: { "文案": [{}] } }), status: "ASSIGNED", claimedById: null, assignedById: "u1", createdAt: d(2) },
  { id: "q11", title: "618 电商活动预热视频", description: "为 618 大促制作 30 秒预热视频，需覆盖主卖点与优惠节奏。", videoType: "PROMO", duration: "30秒", deadline: f(11), requesterName: "林岚", requesterEmail: "linlan@example.com", requesterDept: "市场部", specialNotes: JSON.stringify({ brand: "马爹利", priority: "High", deliverables: { "视频": [{}] } }), status: "PENDING", claimedById: null, assignedById: null, createdAt: d(1) },
  { id: "q12", title: "新品线下路演主视觉", description: "路演主视觉需覆盖主背景板、易拉宝和签到墙。", videoType: "PROMO", duration: "-", deadline: f(15), requesterName: "Alicia", requesterEmail: "alicia@example.com", requesterDept: null, specialNotes: JSON.stringify({ brand: "芝华士", company: "保乐力加", priority: "Medium", deliverables: { "平面设计": [{}, {}, {}] } }), status: "PENDING", claimedById: null, assignedById: null, createdAt: d(2) },
  { id: "q13", title: "年度经销商大会邀请函视频", description: "制作年度经销商大会电子邀请函视频，用于会前邀约触达。", videoType: "EVENT", duration: "20秒", deadline: f(18), requesterName: "周静", requesterEmail: "zhoujing@example.com", requesterDept: "渠道部", specialNotes: JSON.stringify({ team: "Retail Team", priority: "High", deliverables: { "视频": [{}] } }), status: "PENDING", claimedById: null, assignedById: null, createdAt: d(3) },
  { id: "q14", title: "会员日 H5 头图与贴片", description: "会员日活动 H5 需补齐开屏头图与 6 秒贴片动画。", videoType: "OTHER", duration: "-", deadline: f(9), requesterName: "赵雪", requesterEmail: "zhaoxue@example.com", requesterDept: null, specialNotes: JSON.stringify({ brand: "绝对伏特加", company: "保乐力加", priority: "Medium", deliverables: { "平面设计": [{}], "视频": [{}] } }), status: "PENDING", claimedById: null, assignedById: null, createdAt: d(1) },
  { id: "q15", title: "品牌大使采访拍摄 Brief", description: "规划品牌大使采访拍摄内容，需明确主问题与 B-roll 清单。", videoType: "EVENT", duration: "3分钟", deadline: f(20), requesterName: "唐悦", requesterEmail: "tangyue@example.com", requesterDept: "传播部", specialNotes: JSON.stringify({ team: "Corporate", priority: "Low", deliverables: { "视频": [{}], "文案": [{}] } }), status: "PENDING", claimedById: null, assignedById: null, createdAt: d(4) },
  { id: "q16", title: "季度战报长图模板", description: "输出季度战报长图模板，供各 BU 后续复用。", videoType: "OTHER", duration: "-", deadline: f(14), requesterName: "Helen", requesterEmail: "helen@example.com", requesterDept: null, specialNotes: JSON.stringify({ brand: "百龄坛", company: "保乐力加", priority: "Medium", deliverables: { "平面设计": [{}, {}] } }), status: "PENDING", claimedById: null, assignedById: null, createdAt: d(5) },
  { id: "q17", title: "秋季促销社媒脚本", description: "撰写秋季促销社媒短片脚本，需拆成 3 支短视频。", videoType: "PROMO", duration: "45秒", deadline: f(10), requesterName: "陈晓彤", requesterEmail: "chenxiaotong@example.com", requesterDept: "市场部", specialNotes: JSON.stringify({ brand: "马爹利", priority: "High", deliverables: { "文案": [{}, {}, {}] } }), status: "UNDER_REVIEW", claimedById: "u5", assignedById: null, createdAt: d(2) },
  { id: "q18", title: "门店陈列规范培训视频", description: "制作门店陈列规范培训视频，覆盖新品堆头与冰桶陈列。", videoType: "TRAINING", duration: "6分钟", deadline: f(16), requesterName: "许亮", requesterEmail: "xuliang@example.com", requesterDept: "销售部", specialNotes: JSON.stringify({ team: "Retail Team", priority: "Medium", deliverables: { "视频": [{}] } }), status: "UNDER_REVIEW", claimedById: "u4", assignedById: null, createdAt: d(3) },
  { id: "q19", title: "品牌专区倒计时海报", description: "输出门店品牌专区倒计时海报三套尺寸。", videoType: "OTHER", duration: "-", deadline: f(8), requesterName: "Mia", requesterEmail: "mia@example.com", requesterDept: null, specialNotes: JSON.stringify({ brand: "芝华士", company: "保乐力加", priority: "High", deliverables: { "平面设计": [{}, {}, {}] } }), status: "UNDER_REVIEW", claimedById: "u3", assignedById: null, createdAt: d(1) },
  { id: "q20", title: "高管内训字幕整理", description: "整理高管内训视频字幕并统一风格与术语。", videoType: "TRAINING", duration: "12分钟", deadline: f(12), requesterName: "王宁", requesterEmail: "wangning@example.com", requesterDept: "人力资源部", specialNotes: JSON.stringify({ team: "Corporate", priority: "Low", deliverables: { "文案": [{}], "视频": [{}] } }), status: "UNDER_REVIEW", claimedById: "u6", assignedById: null, createdAt: d(4) },
  { id: "q21", title: "已取消需求：直播暖场片", description: "原计划为直播制作暖场片，现业务方向调整取消。", videoType: "EVENT", duration: "15秒", deadline: f(6), requesterName: "吴非", requesterEmail: "wufei@example.com", requesterDept: "市场部", specialNotes: JSON.stringify({ brand: "百龄坛", priority: "Low", deliverables: { "视频": [{}] } }), status: "REJECTED", claimedById: "u3", assignedById: null, createdAt: d(1) },
  { id: "q22", title: "退回需求：展会手册修订", description: "展会手册修订需求信息不完整，待需求方补充说明后重提。", videoType: "OTHER", duration: "-", deadline: f(13), requesterName: "Grace", requesterEmail: "grace@example.com", requesterDept: null, specialNotes: JSON.stringify({ brand: "绝对伏特加", company: "保乐力加", priority: "Medium", deliverables: { "线下物料": [{}] } }), status: "REJECTED", claimedById: "u5", assignedById: null, createdAt: d(2) },
  { id: "q23", title: "新品上市卖点短视频", description: "拆分新品上市卖点，输出 3 条社媒短视频。", videoType: "PROMO", duration: "15秒", deadline: f(12), requesterName: "Olivia", requesterEmail: "olivia@example.com", requesterDept: null, specialNotes: JSON.stringify({ brand: "马爹利", company: "保乐力加", priority: "High", deliverables: { "视频": [{}, {}, {}] }, dispatch: { teamMemberIds: ["u3"], internalDueDate: "2026-05-22", estimatedCostRmb: 6800, marketCostRmb: 18200, managerNote: "优先保证首条卖点视频节奏。" } }), status: "ASSIGNED", claimedById: null, assignedById: "u2", createdAt: d(4) },
  { id: "q24", title: "双11 主视觉 KV 延展", description: "补齐首页 banner、详情页头图和社媒封面三种尺寸。", videoType: "PROMO", duration: "-", deadline: f(9), requesterName: "赵敏仪", requesterEmail: "zhaominyi@example.com", requesterDept: "电商部", specialNotes: JSON.stringify({ team: "E-commerce Team", priority: "High", deliverables: { "平面设计": [{}, {}, {}] }, dispatch: { teamMemberIds: ["u6"], internalDueDate: "2026-05-19", estimatedCostRmb: 4200, marketCostRmb: 10600, managerNote: "KV 延展先出首页首屏。" } }), status: "ASSIGNED", claimedById: null, assignedById: "u2", createdAt: d(5) },
  { id: "q25", title: "会员日 EDM 文案", description: "整理会员日主标题、副标题和 CTA 文案，适配 EDM 与落地页。", videoType: "OTHER", duration: "-", deadline: f(7), requesterName: "Ada", requesterEmail: "ada@example.com", requesterDept: null, specialNotes: JSON.stringify({ brand: "百龄坛", company: "保乐力加", priority: "Medium", deliverables: { "文案": [{}, {}] }, dispatch: { teamMemberIds: ["u1"], internalDueDate: "2026-05-18", estimatedCostRmb: 2200, marketCostRmb: 6200, managerNote: "标题与 CTA 要同步 CRM 口径。" } }), status: "ASSIGNED", claimedById: null, assignedById: "u2", createdAt: d(4) },
  { id: "q26", title: "发布会现场花絮快剪", description: "发布会结束后 24 小时内输出现场花絮快剪，用于社媒传播。", videoType: "EVENT", duration: "45秒", deadline: f(10), requesterName: "苏珊", requesterEmail: "susan@example.com", requesterDept: null, specialNotes: JSON.stringify({ brand: "绝对伏特加", company: "保乐力加", priority: "High", deliverables: { "视频": [{}] }, dispatch: { teamMemberIds: ["u4"], internalDueDate: "2026-05-21", estimatedCostRmb: 7600, marketCostRmb: 19800, managerNote: "现场结束后先交 teaser 版。" } }), status: "ASSIGNED", claimedById: null, assignedById: "u2", createdAt: d(6) },
  { id: "q27", title: "门店海报套装更新", description: "同步更新 A1 海报、收银台立牌和冰桶贴三套门店平面。", videoType: "OTHER", duration: "-", deadline: f(5), requesterName: "田恬", requesterEmail: "tiantian@example.com", requesterDept: "渠道部", specialNotes: JSON.stringify({ team: "Retail Team", priority: "Medium", deliverables: { "平面设计": [{}, {}, {}] }, dispatch: { teamMemberIds: ["u5"], internalDueDate: "2026-05-16", estimatedCostRmb: 5100, marketCostRmb: 13600, managerNote: "三套尺寸统一改价格权益。" } }), status: "ASSIGNED", claimedById: null, assignedById: "u2", createdAt: d(8) },
  { id: "q28", title: "区域招商会回顾视频", description: "剪辑区域招商会回顾视频，原计划用于经销商复盘传播。", videoType: "EVENT", duration: "60秒", deadline: f(6), requesterName: "Kevin", requesterEmail: "kevin@example.com", requesterDept: null, specialNotes: JSON.stringify({ brand: "", team: "Retail Team", company: "保乐力加", priority: "Low", deliverables: { "视频": [{}] }, dispatch: { teamMemberIds: ["u3"], internalDueDate: "2026-05-17", estimatedCostRmb: 3800, marketCostRmb: 9200, managerNote: "如活动素材不够可先做静态混剪版。" } }), status: "ASSIGNED", claimedById: null, assignedById: "u2", createdAt: d(7) },
  { id: "q29", title: "品牌故事字幕多语版", description: "基于品牌故事主片补齐中英双语和日语字幕版本。", videoType: "PROMO", duration: "90秒", deadline: f(8), requesterName: "罗伊", requesterEmail: "luoyi@example.com", requesterDept: "市场部", specialNotes: JSON.stringify({ brand: "百龄坛", priority: "High", deliverables: { "视频": [{}, {}] }, dispatch: { teamMemberIds: ["u1"], internalDueDate: "2026-05-20", estimatedCostRmb: 4600, marketCostRmb: 11200, managerNote: "先完成中英版，再补日语版。" } }), status: "ASSIGNED", claimedById: null, assignedById: "u2", createdAt: d(6) },
  { id: "q30", title: "导购手册封面优化", description: "优化导购手册封面主视觉与导购卖点标题层级。", videoType: "OTHER", duration: "-", deadline: f(13), requesterName: "高琳", requesterEmail: "gaolin@example.com", requesterDept: "培训部", specialNotes: JSON.stringify({ team: "Corporate", priority: "Medium", deliverables: { "平面设计": [{}, {}] }, dispatch: { teamMemberIds: ["u6"], internalDueDate: "2026-05-23", estimatedCostRmb: 2600, marketCostRmb: 6800, managerNote: "封面主标题需和培训体系命名一致。" } }), status: "ASSIGNED", claimedById: null, assignedById: "u1", createdAt: d(3) },
];

export const PROJECTS: ProjectRecord[] = [
  {
    id: "prj-v2-1",
    projectCode: "PRJ-V2-001",
    briefId: "q24",
    projectName: "双11 主视觉 KV 延展",
    brandTeam: "电商部",
    requestorName: "赵敏仪",
    requestorEmail: "zhaominyi@example.com",
    status: "待验收",
    typeTaskPackageIds: ["ttp-v2-u6-signoff"],
    createdAt: d(5),
    completedAt: null,
    canceledAt: null,
    cancelReason: null,
  },
  {
    id: "prj-v2-2",
    projectCode: "PRJ-V2-002",
    briefId: "q29",
    projectName: "品牌故事字幕多语版",
    brandTeam: "市场部",
    requestorName: "罗伊",
    requestorEmail: "luoyi@example.com",
    status: "制作中",
    typeTaskPackageIds: ["ttp-v2-u6-revision"],
    createdAt: d(6),
    completedAt: null,
    canceledAt: null,
    cancelReason: null,
  },
  {
    id: "prj-v2-3",
    projectCode: "PRJ-V2-003",
    briefId: "q30",
    projectName: "导购手册封面优化",
    brandTeam: "培训部",
    requestorName: "高琳",
    requestorEmail: "gaolin@example.com",
    status: "已完成",
    typeTaskPackageIds: ["ttp-v2-u6-passed"],
    createdAt: d(3),
    completedAt: d(1),
    canceledAt: null,
    cancelReason: null,
  },
  {
    id: "prj-v2-4",
    projectCode: "PRJ-V2-004",
    briefId: "q31",
    projectName: "新品冰饮短视频首版",
    brandTeam: "马爹利电商",
    requestorName: "陈璐",
    requestorEmail: "chenlu@example.com",
    status: "已完成",
    typeTaskPackageIds: ["ttp-v2-u4-first-pass"],
    createdAt: d(7),
    completedAt: d(2),
    canceledAt: null,
    cancelReason: null,
  },
  {
    id: "prj-v2-5",
    projectCode: "PRJ-V2-005",
    briefId: "q32",
    projectName: "夏日门店整合传播素材",
    brandTeam: "芝华士渠道",
    requestorName: "梁琪",
    requestorEmail: "liangqi@example.com",
    status: "制作中",
    typeTaskPackageIds: ["ttp-v2-u3-3d-passed", "ttp-v2-u4-video-signoff", "ttp-v2-u6-copy-todo"],
    createdAt: d(6),
    completedAt: null,
    canceledAt: null,
    cancelReason: null,
  },
  {
    id: "prj-v2-6",
    projectCode: "PRJ-V2-006",
    briefId: "q33",
    projectName: "发布会主屏倒计时方案",
    brandTeam: "皇家礼炮活动",
    requestorName: "周航",
    requestorEmail: "zhouhang@example.com",
    status: "已取消",
    typeTaskPackageIds: ["ttp-v2-u5-canceled-design", "ttp-v2-u4-canceled-video"],
    createdAt: d(9),
    completedAt: null,
    canceledAt: d(1),
    cancelReason: "活动方案取消，需求方停止制作。",
  },
  {
    id: "prj-v2-7",
    projectCode: "PRJ-V2-007",
    briefId: "q34",
    projectName: "Q3 品牌宣传片制作",
    brandTeam: "保乐力加",
    requestorName: "张明",
    requestorEmail: "zhangming@example.com",
    status: "制作中",
    typeTaskPackageIds: ["ttp-v2-u1-pending", "ttp-v2-u1-signoff", "ttp-v2-u1-revision", "ttp-v2-u1-passed"],
    createdAt: d(7),
    completedAt: null,
    canceledAt: null,
    cancelReason: null,
  },
  {
    id: "prj-v2-8",
    projectCode: "PRJ-V2-008",
    briefId: "q3",
    projectName: "CEO主题演讲精华剪辑",
    brandTeam: "保乐力加",
    requestorName: "赵敏",
    requestorEmail: "zhaomin@example.com",
    status: "制作中",
    typeTaskPackageIds: ["ttp-v2-q3-video"],
    createdAt: d(5),
    completedAt: null,
    canceledAt: null,
    cancelReason: null,
  },
  {
    id: "prj-v2-9",
    projectCode: "PRJ-V2-009",
    briefId: "q4",
    projectName: "Q3 产品发布整合物料",
    brandTeam: "马爹利",
    requestorName: "苏菲",
    requestorEmail: "sophie@example.com",
    status: "制作中",
    typeTaskPackageIds: ["ttp-v2-q4-design"],
    createdAt: d(6),
    completedAt: null,
    canceledAt: null,
    cancelReason: null,
  },
  {
    id: "prj-v2-10",
    projectCode: "PRJ-V2-010",
    briefId: "q10",
    projectName: "新品发布主视觉文案",
    brandTeam: "百龄坛",
    requestorName: "李娜",
    requestorEmail: "lina@example.com",
    status: "制作中",
    typeTaskPackageIds: ["ttp-v2-q10-copy"],
    createdAt: d(2),
    completedAt: null,
    canceledAt: null,
    cancelReason: null,
  },
  {
    id: "prj-v2-11",
    projectCode: "PRJ-V2-011",
    briefId: "q23",
    projectName: "新品上市卖点短视频",
    brandTeam: "马爹利",
    requestorName: "Olivia",
    requestorEmail: "olivia@example.com",
    status: "制作中",
    typeTaskPackageIds: ["ttp-v2-q23-video"],
    createdAt: d(4),
    completedAt: null,
    canceledAt: null,
    cancelReason: null,
  },
  {
    id: "prj-v2-12",
    projectCode: "PRJ-V2-012",
    briefId: "q25",
    projectName: "会员日 EDM 文案",
    brandTeam: "百龄坛",
    requestorName: "Ada",
    requestorEmail: "ada@example.com",
    status: "制作中",
    typeTaskPackageIds: ["ttp-v2-q25-copy"],
    createdAt: d(4),
    completedAt: null,
    canceledAt: null,
    cancelReason: null,
  },
  {
    id: "prj-v2-13",
    projectCode: "PRJ-V2-013",
    briefId: "q26",
    projectName: "发布会现场花絮快剪",
    brandTeam: "绝对伏特加",
    requestorName: "苏珊",
    requestorEmail: "susan@example.com",
    status: "待验收",
    typeTaskPackageIds: ["ttp-v2-q26-video"],
    createdAt: d(6),
    completedAt: null,
    canceledAt: null,
    cancelReason: null,
  },
];

export const TYPE_TASK_PACKAGES: TypeTaskPackage[] = [
  {
    id: "ttp-v2-u6-signoff",
    projectId: "prj-v2-1",
    briefId: "q24",
    deliverableType: "平面设计",
    deliverableItems: [
      { name: "首页 Banner", quantity: 1, size: "1920x720", outputFormat: "PNG", usageScenario: "官网首页", remark: "" },
      { name: "详情页头图", quantity: 1, size: "1242x1660", outputFormat: "PNG", usageScenario: "电商详情页", remark: "" },
      { name: "社媒封面", quantity: 1, size: "1080x1350", outputFormat: "PNG", usageScenario: "社媒投放", remark: "" },
    ],
    assigneeId: "u6",
    assigneeName: "赵琳",
    promisedAt: "2026-05-25T09:00:00.000Z",
    estimatedWorkingHours: 8,
    actualWorkingHours: 6,
    assetCategory: "平面设计",
    assignmentNote: "先完成首页首屏与详情页头图。",
    status: "待需求方审核",
    currentVersion: "V1",
    fileLinks: ["https://share.example.com/PRJ-V2-001-V1"],
    uploadedFiles: [],
    latestFeedback: null,
    submissions: ["sub-v2-u6-signoff-v1"],
    signoffHistory: [],
    createdAt: d(4),
    updatedAt: d(0),
  },
  {
    id: "ttp-v2-u6-revision",
    projectId: "prj-v2-2",
    briefId: "q29",
    deliverableType: "视频",
    deliverableItems: [
      { name: "中英双语字幕版", quantity: 1, size: "16:9", outputFormat: "MP4", usageScenario: "品牌故事片", remark: "" },
      { name: "日语字幕版", quantity: 1, size: "16:9", outputFormat: "MP4", usageScenario: "海外传播", remark: "" },
    ],
    assigneeId: "u6",
    assigneeName: "赵琳",
    promisedAt: "2026-05-24T09:00:00.000Z",
    estimatedWorkingHours: 7,
    actualWorkingHours: 5,
    assetCategory: "视频",
    assignmentNote: "先完成中英版，再补日语版。",
    status: "需修改",
    currentVersion: "V1",
    fileLinks: ["https://share.example.com/PRJ-V2-002-V1"],
    uploadedFiles: [],
    latestFeedback: "英文字幕断句仍需优化，请补齐双语版本后完整重提。",
    submissions: ["sub-v2-u6-revision-v1"],
    signoffHistory: ["signoff-v2-u6-revision-v1"],
    createdAt: d(5),
    updatedAt: d(1),
  },
  {
    id: "ttp-v2-u6-passed",
    projectId: "prj-v2-3",
    briefId: "q30",
    deliverableType: "平面设计",
    deliverableItems: [
      { name: "导购手册封面", quantity: 1, size: "A4", outputFormat: "PDF", usageScenario: "培训资料", remark: "" },
      { name: "导购卖点页", quantity: 1, size: "A4", outputFormat: "PDF", usageScenario: "培训资料", remark: "" },
    ],
    assigneeId: "u6",
    assigneeName: "赵琳",
    promisedAt: d(2),
    estimatedWorkingHours: 4,
    actualWorkingHours: 4,
    assetCategory: "平面设计",
    assignmentNote: "保持培训体系命名一致。",
    status: "已通过",
    currentVersion: "V2",
    fileLinks: ["https://share.example.com/PRJ-V2-003-V2"],
    uploadedFiles: [],
    latestFeedback: "需求方已通过。",
    submissions: ["sub-v2-u6-passed-v1", "sub-v2-u6-passed-v2"],
    signoffHistory: ["signoff-v2-u6-passed-v2"],
    createdAt: d(8),
    updatedAt: d(1),
  },
  {
    id: "ttp-v2-u4-first-pass",
    projectId: "prj-v2-4",
    briefId: "q31",
    deliverableType: "视频",
    deliverableItems: [
      { name: "15s 冰饮种草视频", quantity: 1, size: "9:16", outputFormat: "MP4", usageScenario: "社媒投放", remark: "" },
    ],
    assigneeId: "u4",
    assigneeName: "李航",
    promisedAt: d(3),
    estimatedWorkingHours: 5,
    actualWorkingHours: 5,
    assetCategory: "视频",
    assignmentNote: "突出新品冰饮场景，首版直接面向需求方审核。",
    status: "已通过",
    currentVersion: "V1",
    fileLinks: ["https://share.example.com/PRJ-V2-004-V1"],
    uploadedFiles: [],
    latestFeedback: "需求方已通过。",
    submissions: ["sub-v2-u4-first-pass-v1"],
    signoffHistory: ["signoff-v2-u4-first-pass-v1"],
    createdAt: d(6),
    updatedAt: d(2),
  },
  {
    id: "ttp-v2-u3-3d-passed",
    projectId: "prj-v2-5",
    briefId: "q32",
    deliverableType: "3D",
    deliverableItems: [
      { name: "酒瓶建模", quantity: 1, size: "按 Brief", outputFormat: "PNG", usageScenario: "门店端架", remark: "" },
      { name: "冰饮渲染图", quantity: 1, size: "按 Brief", outputFormat: "PNG", usageScenario: "社媒封面", remark: "" },
    ],
    assigneeId: "u3",
    assigneeName: "王可",
    promisedAt: d(1),
    estimatedWorkingHours: 9,
    actualWorkingHours: 8,
    assetCategory: "3D",
    assignmentNote: "优先出渲染图供门店物料联动。",
    status: "已通过",
    currentVersion: "V1",
    fileLinks: ["https://share.example.com/PRJ-V2-005-3d-V1"],
    uploadedFiles: [],
    latestFeedback: "3D 方向确认通过。",
    submissions: ["sub-v2-u3-3d-passed-v1"],
    signoffHistory: ["signoff-v2-u3-3d-passed-v1"],
    createdAt: d(5),
    updatedAt: d(2),
  },
  {
    id: "ttp-v2-u4-video-signoff",
    projectId: "prj-v2-5",
    briefId: "q32",
    deliverableType: "视频",
    deliverableItems: [
      { name: "30s 门店氛围短片", quantity: 1, size: "16:9", outputFormat: "MP4", usageScenario: "门店屏幕", remark: "" },
    ],
    assigneeId: "u4",
    assigneeName: "李航",
    promisedAt: f(1),
    estimatedWorkingHours: 6,
    actualWorkingHours: 5,
    assetCategory: "视频",
    assignmentNote: "需求方需优先确认门店屏版本。",
    status: "待需求方审核",
    currentVersion: "V1",
    fileLinks: ["https://share.example.com/PRJ-V2-005-video-V1"],
    uploadedFiles: [],
    latestFeedback: null,
    submissions: ["sub-v2-u4-video-signoff-v1"],
    signoffHistory: [],
    createdAt: d(5),
    updatedAt: d(0),
  },
  {
    id: "ttp-v2-u6-copy-todo",
    projectId: "prj-v2-5",
    briefId: "q32",
    deliverableType: "Copy",
    deliverableItems: [
      { name: "主标题与 CTA 文案", quantity: 1, size: "-", outputFormat: "DOCX", usageScenario: "门店海报", remark: "" },
    ],
    assigneeId: "u6",
    assigneeName: "赵琳",
    promisedAt: "2026-05-21T09:00:00.000Z",
    estimatedWorkingHours: 3,
    actualWorkingHours: null,
    assetCategory: "文案",
    assignmentNote: "需与 3D 画面同步文案语气。",
    status: "待提交",
    currentVersion: null,
    fileLinks: [],
    uploadedFiles: [],
    latestFeedback: null,
    submissions: [],
    signoffHistory: [],
    createdAt: d(5),
    updatedAt: d(0),
  },
  {
    id: "ttp-v2-u5-canceled-design",
    projectId: "prj-v2-6",
    briefId: "q33",
    deliverableType: "平面设计",
    deliverableItems: [
      { name: "主屏倒计时 KV", quantity: 1, size: "3840x2160", outputFormat: "PNG", usageScenario: "活动主屏", remark: "" },
    ],
    assigneeId: "u5",
    assigneeName: "陈杰",
    promisedAt: d(6),
    estimatedWorkingHours: 4,
    actualWorkingHours: 4,
    assetCategory: "平面设计",
    assignmentNote: "主屏静态版先行。",
    status: "已通过",
    currentVersion: "V1",
    fileLinks: ["https://share.example.com/PRJ-V2-006-design-V1"],
    uploadedFiles: [],
    latestFeedback: "静态主屏版已通过。",
    submissions: ["sub-v2-u5-canceled-design-v1"],
    signoffHistory: ["signoff-v2-u5-canceled-design-v1"],
    createdAt: d(8),
    updatedAt: d(5),
  },
  {
    id: "ttp-v2-u4-canceled-video",
    projectId: "prj-v2-6",
    briefId: "q33",
    deliverableType: "视频",
    deliverableItems: [
      { name: "15s 倒计时动画", quantity: 1, size: "16:9", outputFormat: "MP4", usageScenario: "活动开场", remark: "" },
    ],
    assigneeId: "u4",
    assigneeName: "李航",
    promisedAt: d(2),
    estimatedWorkingHours: 5,
    actualWorkingHours: null,
    assetCategory: "视频",
    assignmentNote: "活动取消后结束流转。",
    status: "已结束",
    currentVersion: null,
    fileLinks: [],
    uploadedFiles: [],
    latestFeedback: "项目已取消，当前交付任务已结束。",
    submissions: [],
    signoffHistory: [],
    createdAt: d(8),
    updatedAt: d(1),
  },
  {
    id: "ttp-v2-u1-pending",
    projectId: "prj-v2-7",
    briefId: "q34",
    deliverableType: "视频",
    deliverableItems: [
      { name: "90s 品牌宣传片", quantity: 1, size: "16:9", outputFormat: "MP4", usageScenario: "品牌官网", remark: "需包含产品展示与品牌故事" },
    ],
    assigneeId: "u1",
    assigneeName: "张磊",
    promisedAt: "2026-05-28T09:00:00.000Z",
    estimatedWorkingHours: 16,
    actualWorkingHours: 10,
    assetCategory: "视频",
    assignmentNote: "先完成粗剪版本供内部确认。",
    status: "待提交",
    currentVersion: null,
    fileLinks: [],
    uploadedFiles: [],
    latestFeedback: null,
    submissions: [],
    signoffHistory: [],
    createdAt: d(7),
    updatedAt: d(0),
  },
  {
    id: "ttp-v2-u1-signoff",
    projectId: "prj-v2-7",
    briefId: "q34",
    deliverableType: "平面设计",
    deliverableItems: [
      { name: "宣传片海报", quantity: 1, size: "1920x1080", outputFormat: "PNG", usageScenario: "社媒宣传", remark: "" },
    ],
    assigneeId: "u1",
    assigneeName: "张磊",
    promisedAt: "2026-05-25T09:00:00.000Z",
    estimatedWorkingHours: 6,
    actualWorkingHours: 6,
    assetCategory: "平面设计",
    assignmentNote: "与宣传片视觉风格保持一致。",
    status: "待需求方审核",
    currentVersion: "V1",
    fileLinks: ["https://share.example.com/PRJ-V2-007-poster-V1"],
    uploadedFiles: [],
    latestFeedback: null,
    submissions: ["sub-v2-u1-signoff-v1"],
    signoffHistory: [],
    createdAt: d(6),
    updatedAt: d(0),
  },
  {
    id: "ttp-v2-u1-revision",
    projectId: "prj-v2-7",
    briefId: "q34",
    deliverableType: "Copy",
    deliverableItems: [
      { name: "宣传片旁白文案", quantity: 1, size: "-", outputFormat: "DOCX", usageScenario: "视频配音", remark: "" },
    ],
    assigneeId: "u1",
    assigneeName: "张磊",
    promisedAt: "2026-05-23T09:00:00.000Z",
    estimatedWorkingHours: 4,
    actualWorkingHours: 4,
    assetCategory: "文案",
    assignmentNote: "需配合画面节奏调整语速。",
    status: "需修改",
    currentVersion: "V1",
    fileLinks: ["https://share.example.com/PRJ-V2-007-copy-V1"],
    uploadedFiles: [],
    latestFeedback: "旁白文案需更突出品牌调性，请调整语气并补充产品亮点描述。",
    submissions: ["sub-v2-u1-revision-v1"],
    signoffHistory: ["signoff-v2-u1-revision-v1"],
    createdAt: d(8),
    updatedAt: d(1),
  },
  {
    id: "ttp-v2-u1-passed",
    projectId: "prj-v2-7",
    briefId: "q34",
    deliverableType: "视频",
    deliverableItems: [
      { name: "30s 短视频版本", quantity: 1, size: "9:16", outputFormat: "MP4", usageScenario: "社媒投放", remark: "" },
    ],
    assigneeId: "u1",
    assigneeName: "张磊",
    promisedAt: d(5),
    estimatedWorkingHours: 8,
    actualWorkingHours: 8,
    assetCategory: "视频",
    assignmentNote: "竖版适配手机端观看。",
    status: "已通过",
    currentVersion: "V1",
    fileLinks: ["https://share.example.com/PRJ-V2-007-short-V1"],
    uploadedFiles: [],
    latestFeedback: "需求方已通过。",
    submissions: ["sub-v2-u1-passed-v1"],
    signoffHistory: ["signoff-v2-u1-passed-v1"],
    createdAt: d(10),
    updatedAt: d(3),
  },
  {
    id: "ttp-v2-q3-video",
    projectId: "prj-v2-8",
    briefId: "q3",
    deliverableType: "视频",
    deliverableItems: [
      { name: "3分钟精华版", quantity: 1, size: "16:9", outputFormat: "MP4", usageScenario: "内部传播", remark: "从45分钟演讲中剪辑精华" },
    ],
    assigneeId: "u1",
    assigneeName: "张磊",
    promisedAt: "2026-05-20T09:00:00.000Z",
    estimatedWorkingHours: 8,
    actualWorkingHours: 6,
    assetCategory: "视频",
    assignmentNote: "重点保留战略方向部分。",
    status: "待提交",
    currentVersion: null,
    fileLinks: [],
    uploadedFiles: [],
    latestFeedback: null,
    submissions: [],
    signoffHistory: [],
    createdAt: d(5),
    updatedAt: d(0),
  },
  {
    id: "ttp-v2-q4-design",
    projectId: "prj-v2-9",
    briefId: "q4",
    deliverableType: "平面设计",
    deliverableItems: [
      { name: "小红书尺寸", quantity: 1, size: "1080x1440", outputFormat: "PNG", usageScenario: "小红书", remark: "" },
      { name: "微信尺寸", quantity: 1, size: "900x500", outputFormat: "JPG", usageScenario: "微信公众号", remark: "" },
    ],
    assigneeId: "u1",
    assigneeName: "张磊",
    promisedAt: "2026-05-28T09:00:00.000Z",
    estimatedWorkingHours: 12,
    actualWorkingHours: 8,
    assetCategory: "平面设计",
    assignmentNote: "两套尺寸视觉保持一致。",
    status: "待提交",
    currentVersion: null,
    fileLinks: [],
    uploadedFiles: [],
    latestFeedback: null,
    submissions: [],
    signoffHistory: [],
    createdAt: d(6),
    updatedAt: d(0),
  },
  {
    id: "ttp-v2-q10-copy",
    projectId: "prj-v2-10",
    briefId: "q10",
    deliverableType: "文案",
    deliverableItems: [
      { name: "主标题", quantity: 1, size: "-", outputFormat: "DOCX", usageScenario: "小红书", remark: "" },
      { name: "CTA", quantity: 1, size: "-", outputFormat: "DOCX", usageScenario: "微信", remark: "" },
    ],
    assigneeId: "u6",
    assigneeName: "陈杰",
    promisedAt: "2026-05-19T09:00:00.000Z",
    estimatedWorkingHours: 4,
    actualWorkingHours: 4,
    assetCategory: "文案",
    assignmentNote: "调性需符合百龄坛品牌。",
    status: "待需求方审核",
    currentVersion: "V1",
    fileLinks: ["https://share.example.com/PRJ-V2-010-copy-V1"],
    uploadedFiles: [],
    latestFeedback: null,
    submissions: ["sub-q10-copy-v1"],
    signoffHistory: [],
    createdAt: d(2),
    updatedAt: d(0),
  },
  {
    id: "ttp-v2-q23-video",
    projectId: "prj-v2-11",
    briefId: "q23",
    deliverableType: "视频",
    deliverableItems: [
      { name: "卖点视频1", quantity: 1, size: "9:16", outputFormat: "MP4", usageScenario: "抖音", remark: "" },
      { name: "卖点视频2", quantity: 1, size: "9:16", outputFormat: "MP4", usageScenario: "抖音", remark: "" },
      { name: "卖点视频3", quantity: 1, size: "9:16", outputFormat: "MP4", usageScenario: "抖音", remark: "" },
    ],
    assigneeId: "u3",
    assigneeName: "李航",
    promisedAt: "2026-05-22T09:00:00.000Z",
    estimatedWorkingHours: 12,
    actualWorkingHours: 8,
    assetCategory: "视频",
    assignmentNote: "优先保证首条卖点视频节奏。",
    status: "待提交",
    currentVersion: null,
    fileLinks: [],
    uploadedFiles: [],
    latestFeedback: null,
    submissions: [],
    signoffHistory: [],
    createdAt: d(4),
    updatedAt: d(0),
  },
  {
    id: "ttp-v2-q25-copy",
    projectId: "prj-v2-12",
    briefId: "q25",
    deliverableType: "文案",
    deliverableItems: [
      { name: "主标题", quantity: 1, size: "-", outputFormat: "DOCX", usageScenario: "EDM", remark: "" },
      { name: "副标题", quantity: 1, size: "-", outputFormat: "DOCX", usageScenario: "落地页", remark: "" },
      { name: "CTA", quantity: 1, size: "-", outputFormat: "DOCX", usageScenario: "EDM/落地页", remark: "" },
    ],
    assigneeId: "u1",
    assigneeName: "张磊",
    promisedAt: "2026-05-18T09:00:00.000Z",
    estimatedWorkingHours: 4,
    actualWorkingHours: 3,
    assetCategory: "文案",
    assignmentNote: "标题与 CTA 要同步 CRM 口径。",
    status: "待提交",
    currentVersion: null,
    fileLinks: [],
    uploadedFiles: [],
    latestFeedback: null,
    submissions: [],
    signoffHistory: [],
    createdAt: d(4),
    updatedAt: d(0),
  },
  {
    id: "ttp-v2-q26-video",
    projectId: "prj-v2-13",
    briefId: "q26",
    deliverableType: "视频",
    deliverableItems: [
      { name: "现场花絮快剪", quantity: 1, size: "9:16", outputFormat: "MP4", usageScenario: "微信", remark: "发布会结束后24小时内交付" },
    ],
    assigneeId: "u4",
    assigneeName: "赵琳",
    promisedAt: "2026-05-21T09:00:00.000Z",
    estimatedWorkingHours: 6,
    actualWorkingHours: 6,
    assetCategory: "视频",
    assignmentNote: "现场结束后先交 teaser 版。",
    status: "待需求方审核",
    currentVersion: "V1",
    fileLinks: ["https://share.example.com/PRJ-V2-013-video-V1"],
    uploadedFiles: [],
    latestFeedback: null,
    submissions: ["sub-q26-video-v1"],
    signoffHistory: [],
    createdAt: d(6),
    updatedAt: d(1),
  },
];

export const SIGNOFF_RECORDS: SignoffRecord[] = [
  {
    id: "signoff-v2-u6-revision-v1",
    typeTaskPackageId: "ttp-v2-u6-revision",
    projectId: "prj-v2-2",
    submissionId: "sub-v2-u6-revision-v1",
    signoffToken: "seed-signoff-u6-revision-v1",
    version: "V1",
    result: "revision_requested",
    feedback: "英文字幕断句仍需优化，请补齐双语版本后完整重提。",
    reviewedByName: "罗伊",
    reviewedByEmail: "luoyi@example.com",
    reviewedAt: d(1),
  },
  {
    id: "signoff-v2-u6-passed-v2",
    typeTaskPackageId: "ttp-v2-u6-passed",
    projectId: "prj-v2-3",
    submissionId: "sub-v2-u6-passed-v2",
    signoffToken: "seed-signoff-u6-passed-v2",
    version: "V2",
    result: "passed",
    feedback: "已通过，可归档。",
    reviewedByName: "高琳",
    reviewedByEmail: "gaolin@example.com",
    reviewedAt: d(1),
  },
  {
    id: "signoff-v2-u4-first-pass-v1",
    typeTaskPackageId: "ttp-v2-u4-first-pass",
    projectId: "prj-v2-4",
    submissionId: "sub-v2-u4-first-pass-v1",
    signoffToken: "seed-signoff-u4-first-pass-v1",
    version: "V1",
    result: "passed",
    feedback: "首版方向准确，直接通过。",
    reviewedByName: "陈璐",
    reviewedByEmail: "chenlu@example.com",
    reviewedAt: d(2),
  },
  {
    id: "signoff-v2-u3-3d-passed-v1",
    typeTaskPackageId: "ttp-v2-u3-3d-passed",
    projectId: "prj-v2-5",
    submissionId: "sub-v2-u3-3d-passed-v1",
    signoffToken: "seed-signoff-u3-3d-passed-v1",
    version: "V1",
    result: "passed",
    feedback: "3D 渲染方向已确认，可继续推进视频与文案。",
    reviewedByName: "梁琪",
    reviewedByEmail: "liangqi@example.com",
    reviewedAt: d(2),
  },
  {
    id: "signoff-v2-u5-canceled-design-v1",
    typeTaskPackageId: "ttp-v2-u5-canceled-design",
    projectId: "prj-v2-6",
    submissionId: "sub-v2-u5-canceled-design-v1",
    signoffToken: "seed-signoff-u5-canceled-design-v1",
    version: "V1",
    result: "passed",
    feedback: "静态主屏版通过，但项目后续整体取消。",
    reviewedByName: "周航",
    reviewedByEmail: "zhouhang@example.com",
    reviewedAt: d(5),
  },
  {
    id: "signoff-v2-u1-revision-v1",
    typeTaskPackageId: "ttp-v2-u1-revision",
    projectId: "prj-v2-7",
    submissionId: "sub-v2-u1-revision-v1",
    signoffToken: "seed-signoff-u1-revision-v1",
    version: "V1",
    result: "revision_requested",
    feedback: "旁白文案需更突出品牌调性，请调整语气并补充产品亮点描述。",
    reviewedByName: "张明",
    reviewedByEmail: "zhangming@example.com",
    reviewedAt: d(1),
  },
  {
    id: "signoff-v2-u1-passed-v1",
    typeTaskPackageId: "ttp-v2-u1-passed",
    projectId: "prj-v2-7",
    submissionId: "sub-v2-u1-passed-v1",
    signoffToken: "seed-signoff-u1-passed-v1",
    version: "V1",
    result: "passed",
    feedback: "竖版短视频方向准确，直接通过。",
    reviewedByName: "张明",
    reviewedByEmail: "zhangming@example.com",
    reviewedAt: d(2),
  },
];

export const REVIEWS: Review[] = [
  { id: "r1", taskId: "t3", reviewerId: "u1", status: "REVISION_REQUESTED", comment: "整体动画节奏不错，但Logo出现的时机需要调整", timestamp: "0:03", submissionId: "sub-t3-v1", createdAt: d(2) },
  { id: "r2", taskId: "t3", reviewerId: "u1", status: "PENDING", comment: "修改后重新提交审核", timestamp: null, submissionId: "sub-t3-v2", createdAt: d(1) },
  { id: "r3", taskId: "t4", reviewerId: "u2", status: "PENDING", comment: "数据图表的颜色需要统一到新的品牌色", timestamp: "1:23", submissionId: "sub-t4-v1", createdAt: d(1) },
  { id: "r4", taskId: "t1", reviewerId: "u1", status: "APPROVED", comment: "完美！可以发布了", timestamp: null, createdAt: d(7) },
  { id: "r5", taskId: "t2", reviewerId: "u2", status: "APPROVED", comment: "很好，已转交HR部门", timestamp: null, submissionId: "sub-t2-v1", createdAt: d(4) },
  { id: "r6", taskId: "t34", reviewerId: "u1", status: "PENDING", comment: "已收到交付，请审核脚本结构与节奏。", timestamp: null, submissionId: "sub-t34-draft", createdAt: d(0) },
  { id: "r7", taskId: "t35", reviewerId: "u2", status: "REVISION_REQUESTED", comment: "节奏偏慢，请缩短开场并替换片尾 CTA。", timestamp: null, submissionId: "sub-t35-v2", createdAt: d(0) },
  { id: "r8", taskId: "t36", reviewerId: "u1", status: "APPROVED", comment: "通过，后续可进入归档流程。", timestamp: null, submissionId: "sub-t36-v1", createdAt: d(1) },
  { id: "r9", taskId: "t37", reviewerId: "u2", status: "APPROVED", comment: "主视觉已归档。", timestamp: null, submissionId: "sub-t37-v1", createdAt: d(1) },
  { id: "r10", taskId: "t44", reviewerId: "u2", status: "REVISION_REQUESTED", comment: "开场节奏偏慢，请缩短 2 秒；片尾 CTA 文案请更克制。", timestamp: "0:08", submissionId: "sub-t44-v1", createdAt: d(1) },
  { id: "r11", taskId: "t47", reviewerId: "u2", status: "APPROVED", comment: "两套尺寸排版稳定，通过，可进入最终验收流程。", timestamp: null, submissionId: "sub-t47-v1", createdAt: d(1) },
  { id: "r12", taskId: "t52", reviewerId: "u2", status: "REVISION_REQUESTED", comment: "英文字幕断句不自然，第 3 屏安全区偏下，请重新调整。", timestamp: "0:18", submissionId: "sub-t52-v1", createdAt: d(1) },
  { id: "r13", taskId: "t53", reviewerId: "u2", status: "REVISION_REQUESTED", comment: "促销权益层级不清，A1 版面请放大价格利益点并统一标题字重。", timestamp: null, submissionId: "sub-t53-v1", createdAt: d(1) },
  { id: "r14", taskId: "t54", reviewerId: "u2", status: "REVISION_REQUESTED", comment: "主标题偏长，LED 远看识别度不够，请压缩到 12 字以内。", timestamp: null, submissionId: "sub-t54-v1", createdAt: d(0) },
  { id: "r15", taskId: "t55", reviewerId: "u2", status: "REVISION_REQUESTED", comment: "第三张动图节奏拖沓，卖点顺序也需要调整。", timestamp: "0:07", submissionId: "sub-t55-v1", createdAt: d(1) },
  { id: "r16", taskId: "t56", reviewerId: "u2", status: "APPROVED", comment: "节奏和现场氛围都不错，可以进入最终验收。", timestamp: null, submissionId: "sub-t56-v1", createdAt: d(0) },
  { id: "r17", taskId: "t57", reviewerId: "u2", status: "APPROVED", comment: null, timestamp: null, submissionId: "sub-t57-v1", createdAt: d(1) },
  { id: "r18", taskId: "t58", reviewerId: "u2", status: "APPROVED", comment: null, timestamp: null, submissionId: "sub-t58-v1", createdAt: d(0) },
  { id: "r19", taskId: "t59", reviewerId: "u2", status: "APPROVED", comment: null, timestamp: null, submissionId: "sub-t59-v1", createdAt: d(1) },
  { id: "r20", taskId: "t60", reviewerId: "u2", status: "APPROVED", comment: "会员活动 recap 已确认归档。", timestamp: null, submissionId: "sub-t60-v1", createdAt: d(7) },
  { id: "r21", taskId: "t61", reviewerId: "u2", status: "APPROVED", comment: "直播切片节奏稳定，可归档。", timestamp: null, submissionId: "sub-t61-v1", createdAt: d(9) },
  { id: "r22", taskId: "t63", reviewerId: "u2", status: "APPROVED", comment: "KV 模板已通过，后续系列可沿用。", timestamp: null, submissionId: "sub-t63-v1", createdAt: d(11) },
  { id: "r23", taskId: "t1", reviewerId: "u1", status: "REVISION_REQUESTED", comment: "片尾品牌露出时间偏短，请延长 1 秒。", timestamp: "0:43", submissionId: "sub-t1-v1", createdAt: "2026-05-02T07:00:00.000Z" },
  { id: "r24", taskId: "t1", reviewerId: "u1", status: "APPROVED", comment: "画面节奏已优化，等待最终归档。", timestamp: null, submissionId: "sub-t1-v2", createdAt: "2026-05-03T08:30:00.000Z" },
  { id: "r25", taskId: "t65", reviewerId: "u2", status: "PENDING", comment: "已收到 KV 延展版本，请优先确认首页 banner 版式。", timestamp: null, submissionId: "sub-t65-v1", createdAt: d(0) },
  { id: "r26", taskId: "t66", reviewerId: "u2", status: "REVISION_REQUESTED", comment: "标题偏长，CTA 语气不够直接，请重新整理后完整重提。", timestamp: null, submissionId: "sub-t66-v1", createdAt: d(0) },
  { id: "r27", taskId: "t67", reviewerId: "u2", status: "APPROVED", comment: "节奏和现场氛围都合适，可进入验收。", timestamp: null, submissionId: "sub-t67-v1", createdAt: d(1) },
  { id: "r28", taskId: "t68", reviewerId: "u2", status: "APPROVED", comment: "门店套装首版通过，已进入归档。", timestamp: null, submissionId: "sub-t68-v1", createdAt: d(5) },
  { id: "r29", taskId: "t68", reviewerId: "u2", status: "APPROVED", comment: "归档包已确认。", timestamp: null, submissionId: "sub-t68-final", createdAt: d(2) },
  { id: "r30", taskId: "t70", reviewerId: "u2", status: "REVISION_REQUESTED", comment: "英文字幕断句仍需优化，请补齐双语版本后完整重提。", timestamp: "0:21", submissionId: "sub-t70-v1", createdAt: d(1) },
  { id: "r31", taskId: "t70", reviewerId: "u2", status: "PENDING", comment: "V2 已收到，待复审。", timestamp: null, submissionId: "sub-t70-v2", createdAt: d(0) },
  { id: "r32", taskId: "t7", reviewerId: "u1", status: "APPROVED", comment: "客户证言版本已通过内部审核，可发起验收。", timestamp: null, submissionId: "sub-t7-v1", createdAt: d(3) },
];

export const SUBMISSIONS: SubmissionRecord[] = [
  { id: "sub-t1-v1", taskId: "t1", submitterId: "u4", version: "V1", submittedAt: "2026-05-02T07:00:00.000Z", fileName: "VID-032-V1.mp4", link: null, note: "节日祝福视频初版" },
  { id: "sub-t1-v2", taskId: "t1", submitterId: "u4", version: "V2", submittedAt: "2026-05-03T08:30:00.000Z", fileName: "VID-032-V2.mp4", link: null, note: "根据反馈延长品牌露出并优化节奏" },
  { id: "sub-t3-v1", taskId: "t3", submitterId: "u3", version: "V1", submittedAt: d(3), fileName: "VID-034-V1.mp4", link: null, note: "首版提交，供审核节奏与 Logo 出现时机" },
  { id: "sub-t3-v2", taskId: "t3", submitterId: "u3", version: "V2", submittedAt: d(1), fileName: null, link: "https://share.example.com/VID-034-V2", note: "按反馈调整 Logo 时机与动画节奏" },
  { id: "sub-t4-v1", taskId: "t4", submitterId: "u1", version: "V1", submittedAt: d(1), fileName: "VID-035-V1.mp4", link: null, note: "请重点检查图表配色一致性" },
  { id: "sub-t7-v1", taskId: "t7", submitterId: "u4", version: "V1", submittedAt: d(4), fileName: "VID-038-V1.mp4", link: null, note: "客户证言首版交付" },
  { id: "sub-t7-final", taskId: "t7", submitterId: "u4", version: "Final", submittedAt: d(2), fileName: null, link: "https://dam.example.com/fa/VID-038.mp4", note: "客户证言最终版" },
  { id: "sub-t34-draft", taskId: "t34", submitterId: "u3", version: "Draft", submittedAt: d(0), fileName: "VID-062-Draft.docx", link: null, note: "镜头脚本初稿" },
  { id: "sub-t35-v2", taskId: "t35", submitterId: "u3", version: "V2", submittedAt: d(1), fileName: null, link: "https://share.example.com/VID-063-V2", note: "字幕校对+节奏优化" },
  { id: "sub-t35-v1", taskId: "t35", submitterId: "u3", version: "V1", submittedAt: d(3), fileName: "VID-063-V1.mp4", link: null, note: "初版剪辑" },
  { id: "sub-t36-v1", taskId: "t36", submitterId: "u3", version: "V1", submittedAt: d(2), fileName: "VID-064-V1.mp4", link: null, note: "年会开场第一版" },
  { id: "sub-t37-v1", taskId: "t37", submitterId: "u3", version: "V1", submittedAt: d(4), fileName: "VID-065-V1.zip", link: null, note: "主视觉延展首版" },
  { id: "sub-t37-final", taskId: "t37", submitterId: "u3", version: "Final", submittedAt: d(2), fileName: null, link: "https://dam.example.com/fa/VID-065.zip", note: "归档包" },
  { id: "sub-t1-final", taskId: "t1", submitterId: "u4", version: "Final", submittedAt: d(8), fileName: null, link: "https://dam.example.com/fa/VID-032.mp4", note: "最终交付" },
  { id: "sub-t2-v1", taskId: "t2", submitterId: "u5", version: "V1", submittedAt: d(7), fileName: "VID-033-V1.mp4", link: null, note: "招聘宣传片首版" },
  { id: "sub-t2-final", taskId: "t2", submitterId: "u5", version: "Final", submittedAt: d(5), fileName: null, link: "https://dam.example.com/fa/VID-033.mp4", note: "最终交付" },
  { id: "sub-t44-v2", taskId: "t44", submitterId: "u3", version: "V2", submittedAt: d(0), fileName: null, link: "https://share.example.com/PRJ-1004-countdown-v2", note: "按退回意见加速开场节奏并更新片尾 CTA" },
  { id: "sub-t44-v1", taskId: "t44", submitterId: "u3", version: "V1", submittedAt: d(2), fileName: "VID-066-V1.mp4", link: null, note: "倒计时视频三规格初版" },
  { id: "sub-t45-v1", taskId: "t45", submitterId: "u5", version: "V1", submittedAt: d(1), fileName: null, link: "https://share.example.com/PRJ-1013-copy-v1", note: "主标题 + CTA 文案 V1" },
  { id: "sub-t46-v1", taskId: "t46", submitterId: "u6", version: "V1", submittedAt: d(1), fileName: "VID-068-V1.mp4", link: null, note: "活动回顾 V1" },
  { id: "sub-t47-v1", taskId: "t47", submitterId: "u3", version: "V1", submittedAt: d(2), fileName: null, link: "https://share.example.com/PRJ-1001-design-v1", note: "两套社媒平面尺寸 V1" },
  { id: "sub-t52-v1", taskId: "t52", submitterId: "u1", version: "V1", submittedAt: d(2), fileName: "VID-074-V1.mp4", link: null, note: "先提交中英双语字幕版供校对" },
  { id: "sub-t53-v1", taskId: "t53", submitterId: "u1", version: "V1", submittedAt: d(2), fileName: null, link: "https://share.example.com/VID-075-V1", note: "A1 / A3 / 立架首版海报" },
  { id: "sub-t54-v1", taskId: "t54", submitterId: "u1", version: "V1", submittedAt: d(1), fileName: "VID-076-copy-v1.docx", link: null, note: "开场主标题与 CTA 文案首版" },
  { id: "sub-t55-v1", taskId: "t55", submitterId: "u1", version: "V1", submittedAt: d(2), fileName: null, link: "https://share.example.com/VID-077-V1", note: "6 张动图首版" },
  { id: "sub-t56-v1", taskId: "t56", submitterId: "u1", version: "V1", submittedAt: d(1), fileName: "VID-078-V1.mp4", link: "https://share.example.com/VID-078-V1", note: "倒计时片 V1，含现场屏与朋友圈版" },
  { id: "sub-t57-v1", taskId: "t57", submitterId: "u1", version: "V1", submittedAt: d(2), fileName: null, link: "https://share.example.com/VID-079-V1", note: "四张卖点海报 V1" },
  { id: "sub-t58-v1", taskId: "t58", submitterId: "u1", version: "V1", submittedAt: d(1), fileName: null, link: "https://share.example.com/VID-080-V1", note: "季度总结长图首版" },
  { id: "sub-t59-v1", taskId: "t59", submitterId: "u1", version: "V1", submittedAt: d(2), fileName: "VID-081-copy-v1.docx", link: null, note: "落地页标题、卖点和 CTA 文案 V1" },
  { id: "sub-t60-v1", taskId: "t60", submitterId: "u1", version: "V1", submittedAt: d(10), fileName: "VID-082-V1.mp4", link: null, note: "会员活动 recap 首版" },
  { id: "sub-t60-final", taskId: "t60", submitterId: "u1", version: "Final", submittedAt: d(8), fileName: null, link: "https://dam.example.com/fa/VID-082.mp4", note: "会员活动 recap 最终版" },
  { id: "sub-t61-v1", taskId: "t61", submitterId: "u1", version: "V1", submittedAt: d(12), fileName: "VID-083-V1.mp4", link: null, note: "直播切片首版" },
  { id: "sub-t61-final", taskId: "t61", submitterId: "u1", version: "Final", submittedAt: d(10), fileName: null, link: "https://dam.example.com/fa/VID-083.mp4", note: "直播切片最终归档版本" },
  { id: "sub-t63-v1", taskId: "t63", submitterId: "u1", version: "V1", submittedAt: d(14), fileName: "VID-085-V1.zip", link: null, note: "封面 KV 模板首版" },
  { id: "sub-t63-final", taskId: "t63", submitterId: "u1", version: "Final", submittedAt: d(12), fileName: null, link: "https://dam.example.com/fa/VID-085.zip", note: "封面 KV 模板归档包" },
  { id: "sub-t65-v1", taskId: "t65", submitterId: "u6", version: "V1", submittedAt: d(0), fileName: null, link: "https://share.example.com/VID-087-V1", note: "双11 KV 延展三尺寸首版" },
  { id: "sub-t66-v1", taskId: "t66", submitterId: "u1", version: "V1", submittedAt: d(1), fileName: "VID-088-copy-v1.docx", link: null, note: "会员日 EDM 文案首版" },
  { id: "sub-t67-v1", taskId: "t67", submitterId: "u4", version: "V1", submittedAt: d(2), fileName: "VID-089-V1.mp4", link: "https://share.example.com/VID-089-V1", note: "现场花絮快剪首版" },
  { id: "sub-t68-v1", taskId: "t68", submitterId: "u5", version: "V1", submittedAt: d(6), fileName: "VID-090-V1.zip", link: null, note: "三套门店平面首版" },
  { id: "sub-t68-final", taskId: "t68", submitterId: "u5", version: "Final", submittedAt: d(2), fileName: null, link: "https://dam.example.com/fa/VID-090.zip", note: "门店海报套装归档包" },
  { id: "sub-t70-v1", taskId: "t70", submitterId: "u1", version: "V1", submittedAt: d(3), fileName: "VID-092-V1.mp4", link: null, note: "品牌故事字幕双语初版" },
  { id: "sub-t70-v2", taskId: "t70", submitterId: "u1", version: "V2", submittedAt: d(0), fileName: null, link: "https://share.example.com/VID-092-V2", note: "按反馈优化英文断句并补充日语字幕" },
  { id: "sub-v2-u6-signoff-v1", taskId: "ttp-v2-u6-signoff", typeTaskPackageId: "ttp-v2-u6-signoff", projectId: "prj-v2-1", submitterId: "u6", submittedBy: "赵琳", version: "V1", submittedAt: d(0), fileName: null, uploadedFiles: [], link: "https://share.example.com/PRJ-V2-001-V1", fileLinks: ["https://share.example.com/PRJ-V2-001-V1"], note: "双11 KV 延展三尺寸首版", submitNote: "双11 KV 延展三尺寸首版", signoffToken: "seed-signoff-u6-v1", signoffUrl: "/signoff/seed-signoff-u6-v1", emailSentStatus: "sent", result: "pending", reviewedAt: null, reviewedByName: null, reviewedByEmail: null },
  { id: "sub-v2-u6-revision-v1", taskId: "ttp-v2-u6-revision", typeTaskPackageId: "ttp-v2-u6-revision", projectId: "prj-v2-2", submitterId: "u6", submittedBy: "赵琳", version: "V1", submittedAt: d(2), fileName: "PRJ-V2-002-V1.mp4", uploadedFiles: [], link: "https://share.example.com/PRJ-V2-002-V1", fileLinks: ["https://share.example.com/PRJ-V2-002-V1"], note: "品牌故事字幕多语版 V1", submitNote: "品牌故事字幕多语版 V1", signoffToken: "seed-signoff-u6-revision-v1", signoffUrl: "/signoff/seed-signoff-u6-revision-v1", emailSentStatus: "sent", result: "revision_requested", reviewedAt: d(1), reviewedByName: "罗伊", reviewedByEmail: "luoyi@example.com" },
  { id: "sub-v2-u6-passed-v1", taskId: "ttp-v2-u6-passed", typeTaskPackageId: "ttp-v2-u6-passed", projectId: "prj-v2-3", submitterId: "u6", submittedBy: "赵琳", version: "V1", submittedAt: d(4), fileName: "PRJ-V2-003-V1.pdf", uploadedFiles: [], link: "https://share.example.com/PRJ-V2-003-V1", fileLinks: ["https://share.example.com/PRJ-V2-003-V1"], note: "导购手册封面首版", submitNote: "导购手册封面首版", signoffToken: "seed-signoff-u6-passed-v1", signoffUrl: "/signoff/seed-signoff-u6-passed-v1", emailSentStatus: "sent", result: "revision_requested", reviewedAt: d(3), reviewedByName: "高琳", reviewedByEmail: "gaolin@example.com" },
  { id: "sub-v2-u6-passed-v2", taskId: "ttp-v2-u6-passed", typeTaskPackageId: "ttp-v2-u6-passed", projectId: "prj-v2-3", submitterId: "u6", submittedBy: "赵琳", version: "V2", submittedAt: d(2), fileName: null, uploadedFiles: [], link: "https://share.example.com/PRJ-V2-003-V2", fileLinks: ["https://share.example.com/PRJ-V2-003-V2"], note: "按反馈优化后提交 V2", submitNote: "按反馈优化后提交 V2", signoffToken: "seed-signoff-u6-passed-v2", signoffUrl: "/signoff/seed-signoff-u6-passed-v2", emailSentStatus: "sent", result: "passed", reviewedAt: d(1), reviewedByName: "高琳", reviewedByEmail: "gaolin@example.com" },
  { id: "sub-v2-u4-first-pass-v1", taskId: "ttp-v2-u4-first-pass", typeTaskPackageId: "ttp-v2-u4-first-pass", projectId: "prj-v2-4", submitterId: "u4", submittedBy: "李航", version: "V1", submittedAt: d(3), fileName: "PRJ-V2-004-V1.mp4", uploadedFiles: [], link: "https://share.example.com/PRJ-V2-004-V1", fileLinks: ["https://share.example.com/PRJ-V2-004-V1"], note: "新品冰饮短视频首版", submitNote: "新品冰饮短视频首版", signoffToken: "seed-signoff-u4-first-pass-v1", signoffUrl: "/signoff/seed-signoff-u4-first-pass-v1", emailSentStatus: "sent", result: "passed", reviewedAt: d(2), reviewedByName: "陈璐", reviewedByEmail: "chenlu@example.com" },
  { id: "sub-v2-u3-3d-passed-v1", taskId: "ttp-v2-u3-3d-passed", typeTaskPackageId: "ttp-v2-u3-3d-passed", projectId: "prj-v2-5", submitterId: "u3", submittedBy: "王可", version: "V1", submittedAt: d(3), fileName: null, uploadedFiles: [], link: "https://share.example.com/PRJ-V2-005-3d-V1", fileLinks: ["https://share.example.com/PRJ-V2-005-3d-V1"], note: "3D 建模与渲染图 V1", submitNote: "3D 建模与渲染图 V1", signoffToken: "seed-signoff-u3-3d-passed-v1", signoffUrl: "/signoff/seed-signoff-u3-3d-passed-v1", emailSentStatus: "sent", result: "passed", reviewedAt: d(2), reviewedByName: "梁琪", reviewedByEmail: "liangqi@example.com" },
  { id: "sub-v2-u4-video-signoff-v1", taskId: "ttp-v2-u4-video-signoff", typeTaskPackageId: "ttp-v2-u4-video-signoff", projectId: "prj-v2-5", submitterId: "u4", submittedBy: "李航", version: "V1", submittedAt: d(0), fileName: "PRJ-V2-005-video-V1.mp4", uploadedFiles: [], link: "https://share.example.com/PRJ-V2-005-video-V1", fileLinks: ["https://share.example.com/PRJ-V2-005-video-V1"], note: "门店氛围短片 V1", submitNote: "门店氛围短片 V1", signoffToken: "seed-signoff-u4-video-signoff-v1", signoffUrl: "/signoff/seed-signoff-u4-video-signoff-v1", emailSentStatus: "sent", result: "pending", reviewedAt: null, reviewedByName: null, reviewedByEmail: null },
  { id: "sub-v2-u5-canceled-design-v1", taskId: "ttp-v2-u5-canceled-design", typeTaskPackageId: "ttp-v2-u5-canceled-design", projectId: "prj-v2-6", submitterId: "u5", submittedBy: "陈杰", version: "V1", submittedAt: d(6), fileName: null, uploadedFiles: [], link: "https://share.example.com/PRJ-V2-006-design-V1", fileLinks: ["https://share.example.com/PRJ-V2-006-design-V1"], note: "倒计时主屏静态版 V1", submitNote: "倒计时主屏静态版 V1", signoffToken: "seed-signoff-u5-canceled-design-v1", signoffUrl: "/signoff/seed-signoff-u5-canceled-design-v1", emailSentStatus: "sent", result: "passed", reviewedAt: d(5), reviewedByName: "周航", reviewedByEmail: "zhouhang@example.com" },
  { id: "sub-v2-u1-signoff-v1", taskId: "ttp-v2-u1-signoff", typeTaskPackageId: "ttp-v2-u1-signoff", projectId: "prj-v2-7", submitterId: "u1", submittedBy: "张磊", version: "V1", submittedAt: d(0), fileName: "PRJ-V2-007-poster-V1.png", uploadedFiles: [], link: "https://share.example.com/PRJ-V2-007-poster-V1", fileLinks: ["https://share.example.com/PRJ-V2-007-poster-V1"], note: "宣传片海报 V1", submitNote: "宣传片海报首版提交", signoffToken: "seed-signoff-u1-signoff-v1", signoffUrl: "/signoff/seed-signoff-u1-signoff-v1", emailSentStatus: "sent", result: "pending", reviewedAt: null, reviewedByName: null, reviewedByEmail: null },
  { id: "sub-v2-u1-revision-v1", taskId: "ttp-v2-u1-revision", typeTaskPackageId: "ttp-v2-u1-revision", projectId: "prj-v2-7", submitterId: "u1", submittedBy: "张磊", version: "V1", submittedAt: d(2), fileName: "PRJ-V2-007-copy-V1.docx", uploadedFiles: [], link: "https://share.example.com/PRJ-V2-007-copy-V1", fileLinks: ["https://share.example.com/PRJ-V2-007-copy-V1"], note: "旁白文案 V1", submitNote: "宣传片旁白文案首版", signoffToken: "seed-signoff-u1-revision-v1", signoffUrl: "/signoff/seed-signoff-u1-revision-v1", emailSentStatus: "sent", result: "revision_requested", reviewedAt: d(1), reviewedByName: "张明", reviewedByEmail: "zhangming@example.com" },
  { id: "sub-v2-u1-passed-v1", taskId: "ttp-v2-u1-passed", typeTaskPackageId: "ttp-v2-u1-passed", projectId: "prj-v2-7", submitterId: "u1", submittedBy: "张磊", version: "V1", submittedAt: d(3), fileName: "PRJ-V2-007-short-V1.mp4", uploadedFiles: [], link: "https://share.example.com/PRJ-V2-007-short-V1", fileLinks: ["https://share.example.com/PRJ-V2-007-short-V1"], note: "30s 短视频 V1", submitNote: "竖版短视频首版", signoffToken: "seed-signoff-u1-passed-v1", signoffUrl: "/signoff/seed-signoff-u1-passed-v1", emailSentStatus: "sent", result: "passed", reviewedAt: d(2), reviewedByName: "张明", reviewedByEmail: "zhangming@example.com" },
];

export const ACTIVITY_EVENTS: ActivityEvent[] = [
  { id: "evt-1", level: "INFO", actorId: "u2", entityType: "questionnaire", entityId: "q1", action: "BRIEF_SUBMITTED", message: "收到新 Brief：Q3产品发布宣传片", meta: { source: "form" }, createdAt: d(1) },
  { id: "evt-2", level: "INFO", actorId: "u2", entityType: "questionnaire", entityId: "q3", action: "BRIEF_DISPATCHED", message: "完成分配并生成项目：CEO主题演讲精华剪辑", meta: { teamMemberIds: ["u1"], internalDueDate: f(10) }, createdAt: d(5) },
  { id: "evt-3", level: "INFO", actorId: "u3", entityType: "submission", entityId: "sub-t3-v2", action: "SUBMISSION_CREATED", message: "提交交付物：品牌片头动画升级（V2）", meta: { taskId: "t3" }, createdAt: d(1) },
  { id: "evt-4", level: "INFO", actorId: "u1", entityType: "review", entityId: "r1", action: "REVIEW_CREATED", message: "审核打回：品牌片头动画升级", meta: { taskId: "t3", status: "REVISION_REQUESTED" }, createdAt: d(2) },
  { id: "evt-5", level: "INFO", actorId: "u4", entityType: "task", entityId: "t7", action: "TASK_STATUS_CHANGED", message: "提交验收：客户证言 — 某某公司", meta: { from: "WIP", to: "PENDING_SIGNOFF" }, createdAt: d(1) },
  { id: "evt-6", level: "INFO", actorId: "u1", entityType: "review", entityId: "r2", action: "REVIEW_CREATED", message: "提交复审：品牌片头动画升级（V2）", meta: { taskId: "t3", status: "PENDING" }, createdAt: d(1) },
  { id: "evt-7", level: "INFO", actorId: "u2", entityType: "task", entityId: "t7", action: "TASK_STATUS_CHANGED", message: "标记完成：客户证言 — 某某公司", meta: { from: "PENDING_SIGNOFF", to: "COMPLETED" }, createdAt: d(0) },
  { id: "evt-8", level: "WARN", actorId: "u2", entityType: "task", entityId: "t8", action: "TASK_STATUS_CHANGED", message: "取消项目：新员工入职引导视频 v2", meta: { from: "WIP", to: "CANCELED", reason: "需求取消" }, createdAt: d(1) },
  { id: "evt-9", level: "INFO", actorId: "u3", entityType: "submission", entityId: "sub-t35-v2", action: "SUBMISSION_CREATED", message: "更新提交：新品上市策略视频（V2）", meta: { taskId: "t35" }, createdAt: d(1) },
  { id: "evt-10", level: "INFO", actorId: "u2", entityType: "review", entityId: "r7", action: "REVIEW_CREATED", message: "打回修改：新品上市策略视频", meta: { taskId: "t35", status: "REVISION_REQUESTED" }, createdAt: d(0) },
  { id: "evt-11", level: "INFO", actorId: "u2", entityType: "questionnaire", entityId: "q23", action: "BRIEF_DISPATCHED", message: "完成分配并生成项目：新品上市卖点短视频", meta: { teamMemberIds: ["u3"], taskId: "t64" }, createdAt: d(4) },
  { id: "evt-12", level: "INFO", actorId: "u6", entityType: "submission", entityId: "sub-t65-v1", action: "SUBMISSION_CREATED", message: "提交交付物：双11 主视觉 KV 延展（V1）", meta: { taskId: "t65" }, createdAt: d(0) },
  { id: "evt-13", level: "WARN", actorId: "u2", entityType: "task", entityId: "t69", action: "TASK_STATUS_CHANGED", message: "取消项目：区域招商会回顾视频", meta: { from: "WIP", to: "CANCELED", reason: "活动取消，需求方停止投放" }, createdAt: d(1) },
  { id: "evt-14", level: "INFO", actorId: "u1", entityType: "submission", entityId: "sub-t70-v2", action: "SUBMISSION_CREATED", message: "更新提交：品牌故事字幕多语版（V2）", meta: { taskId: "t70" }, createdAt: d(0) },
];

export const SYSTEM_EVENTS: SystemEvent[] = [
  { id: "sys-1", level: "INFO", scope: "store", message: "初始化 mock 数据完成", meta: { tasks: TASKS.length, questionnaires: QUESTIONNAIRES.length }, createdAt: d(0) },
  { id: "sys-2", level: "WARN", scope: "notification", message: "邮件队列延迟：验收提醒发送耗时偏高", meta: { p95Ms: 2400 }, createdAt: d(0) },
  { id: "sys-3", level: "ERROR", scope: "data", message: "部分 Brief 的 specialNotes 解析失败，已降级为纯文本", meta: { entityType: "questionnaire" }, createdAt: d(0) },
];

export const NOTIFICATIONS: Notification[] = [
  { id: "n1", userId: "u3", type: "signoff_revision_requested", title: "任务需要修改", message: "需求方退回了「品牌片头动画升级」，请根据反馈重新提交", linkTo: "/my-tasks", isRead: true, createdAt: d(2) },
  { id: "n2", userId: "u1", receiverId: "u1", receiverName: "张磊", type: "signoff_email_sent", title: "审核链接已发送", message: "赵琳提交了「双11 主视觉 KV 延展」，系统已向需求方发送审核链接", projectId: "prj-v2-1", projectCode: "PRJ-V2-001", projectName: "双11 主视觉 KV 延展", projectStatus: "待验收", typeTaskPackageId: "ttp-v2-u6-signoff", deliverableType: "平面设计", submissionId: "sub-v2-u6-signoff-v1", submissionVersion: "V1", signOffLink: "/signoff/seed-signoff-u6-v1", signoffUrl: "/signoff/seed-signoff-u6-v1", signoffToken: "seed-signoff-u6-v1", actionText: "查看项目", actionTarget: "tasks", secondaryActionText: "打开审核页", secondaryActionTarget: "/signoff/seed-signoff-u6-v1", linkTo: "/tasks", isRead: false, createdAt: d(1) },
  { id: "n3", userId: "u2", type: "signoff_email_sent", title: "审核链接已发送", message: "张磊提交了「3月投资者简报视频」，系统已向需求方发送审核链接", linkTo: "/tasks", isRead: false, createdAt: d(1) },
  { id: "n4", userId: "u3", type: "NEW_QUESTIONNAIRE", title: "新的视频需求", message: "有人提交了新的视频需求「Q3产品发布宣传片」", linkTo: "/questionnaire", isRead: false, createdAt: d(1) },
  { id: "n5", userId: "u4", type: "NEW_QUESTIONNAIRE", title: "新的视频需求", message: "有人提交了新的视频需求「Q3产品发布宣传片」", linkTo: "/questionnaire", isRead: false, createdAt: d(1) },
  { id: "n6", userId: "u5", type: "TASK_ASSIGNED", title: "你有一个新任务", message: "王芳指派了「新员工入职引导视频 v2」给你", linkTo: "/tasks", isRead: true, createdAt: d(5) },
  { id: "n7", userId: "u4", type: "DEADLINE_WARNING", title: "任务即将到期", message: "任务「客户证言 — 某某公司」将在3天后到期", linkTo: "/tasks", isRead: false, createdAt: d(0) },
  { id: "n8", userId: "u1", type: "project_auto_completed", title: "项目已自动完成", message: "「节日祝福视频」对应项目的交付任务已全部通过，项目已自动完成", linkTo: "/tasks", isRead: true, createdAt: d(7) },
  { id: "n9", userId: "u3", type: "TASK_ASSIGNED", title: "你被分配到新项目", message: "你被分配到「VID-086 新品上市卖点短视频」", linkTo: "/my-tasks", isRead: false, createdAt: d(4) },
  { id: "n10", userId: "u6", receiverId: "u6", receiverName: "赵琳", type: "deliverable_submitted", title: "交付任务已提交", message: "你已提交「PRJ-V2-001 双11 主视觉 KV 延展 / 平面设计」的 V1 版本。", projectId: "prj-v2-1", projectCode: "PRJ-V2-001", projectName: "双11 主视觉 KV 延展", projectStatus: "待验收", typeTaskPackageId: "ttp-v2-u6-signoff", deliverableType: "平面设计", submissionId: "sub-v2-u6-signoff-v1", submissionVersion: "V1", actionText: "查看记录", actionTarget: "my-tasks", linkTo: "/my-tasks", isRead: false, createdAt: d(0) },
  { id: "n11", userId: "u1", type: "signoff_revision_requested", title: "任务需要修改", message: "需求方退回了「VID-088 会员日 EDM 文案」，请根据意见重新提交", linkTo: "/my-tasks", isRead: false, createdAt: d(0) },
  { id: "n12", userId: "u4", type: "signoff_passed", title: "需求方已通过", message: "「VID-089 发布会现场花絮快剪」已通过需求方审核", linkTo: "/my-tasks", isRead: false, createdAt: d(1) },
  { id: "n13", userId: "u1", receiverId: "u1", receiverName: "张磊", type: "signoff_email_sent", title: "审核链接已发送", message: "赵琳提交了「双11 主视觉 KV 延展」，系统已向需求方发送审核链接", projectId: "prj-v2-1", projectCode: "PRJ-V2-001", projectName: "双11 主视觉 KV 延展", projectStatus: "待验收", typeTaskPackageId: "ttp-v2-u6-signoff", deliverableType: "平面设计", submissionId: "sub-v2-u6-signoff-v1", submissionVersion: "V1", signOffLink: "/signoff/seed-signoff-u6-v1", signoffUrl: "/signoff/seed-signoff-u6-v1", signoffToken: "seed-signoff-u6-v1", actionText: "查看项目", actionTarget: "tasks", secondaryActionText: "打开审核页", secondaryActionTarget: "/signoff/seed-signoff-u6-v1", linkTo: "/tasks", isRead: true, createdAt: d(0) },
];

export function getUser(id: string) { return USERS.find(u => u.id === id) || null; }
export function getUserByEmail(email: string) { return USERS.find(u => u.email === email) || null; }
export function getTaskAssignee(task: typeof TASKS[0]) { return task.assigneeId ? getUser(task.assigneeId) : null; }
