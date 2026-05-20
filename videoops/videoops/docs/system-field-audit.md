# 保乐力加 Creative Ops 系统字段与数据流审计报告

> 审计范围：当前前端代码实现（Next.js + Zustand store + mock 数据 + “伪路由”页面切换）。  
> 审计目标：梳理各页面字段、状态、数据来源、跳转入口与跨页面联动关系，输出统一建议，为下一轮统一数据模型、状态枚举、路由表与全局数据源做依据。  
> 已覆盖页面：工作台、需求分发中心、项目看板、我的任务、审核中心、团队管理、运营看板（运营数据、成员作品集）、创意资产库。

---

# 一、审计摘要

| 审计项 | 发现数量 | 严重程度 | 说明 |
|---|---:|---|---|
| 字段命名不一致 | 22 | 高 | 同一语义字段在不同页面/实体里叫法不同（如 projectCode/taskNumber、deadline/dueDate/internalDueDate、estimatedCost/internalCost/estimatedCostRmb 等），影响跨页联动与统计口径。 |
| 状态口径不一致 | 18 | 高 | Task.status、Review.status、页面派生状态（如 Review 批次/交付物状态）与产品要求的 projectStatus/currentNode 边界混用，导致口径漂移。 |
| 数据来源不清晰 | 14 | 中 | 多个页面存在“派生演示数据/静态报表数据/直接 mutate 局部对象”而非统一 store 来源，后续对接后端与统计会返工。 |
| 跳转关系不完整 | 13 | 中 | 已具备 `tab/open` 深链参数，但大量入口未携带定位参数；通知列表页不消费 linkTo 导致“通知不可跳转”。 |
| 重复字段 | 16 | 中 | 品牌/团队、Stakeholder、交付物摘要/数量、待审核数、成本等在多页重复计算/重复展示，建议抽到统一实体与 selector。 |
| 需 PM 确认项 | 12 | 高 | 成本节省口径、产能算法、交付物拆分规则、FA 候选含义、资产生成与 DAM Usage 统计口径、作品集取数等需要 PM 统一定义。 |

---

# 二、逐页审计结果

> 说明：本节“建议英文 key”以“下一轮统一实体”为导向（Request/Project/Deliverable/Submission/ReviewRecord/Member/Asset…），并标注建议数据来源（store selector / 统计计算 / 关系表）。

---

## 页面：工作台

### 1. 页面模块

| 模块名称 | 当前作用 | 建议数据来源 | 备注 |
|---|---|---|---|
| 顶部 KPI（4 卡） | 执行中项目、团队产能、待分发需求、待审核交付物摘要与跳转 | Project + Request + ReviewRecord + Member（selectors） | 当前实现中产能/执行中等存在强派生与演示参数，需统一算法。 |
| 重点项目跟进 | 列出 3 个“最需要关注”的项目卡片 | Project + Deliverable + ReviewRecord（ranking selector） | 排序规则需 PM 最终确认并固化。 |
| 临近截止 | 未来 7 天内的内部交付/验收截止提醒 | Project（internalDueAt）+ Request（stakeholderDueAt） | 当前“内部审核/内部交付/需求方验收”在同卡内混排，建议统一字段。 |
| 工作室洞察 | 一条关键建议 + 跳转团队管理 | 规则引擎/运营规则（后续） | 当前为文案+toast 模拟。 |
| 团队产能明细（深色卡） | 能力维度负载条形图 | Member + Project + Deliverable（capacity selector） | 当前按“执行中项目数”粗算得到百分比，需统一。 |
| 浮动洞察按钮 | 快速提示/触发洞察入口 | UI-only | 后续可打开 Insights panel。 |

### 2. 字段清单

| 页面字段 | 当前页面文案 | 建议英文 key | 字段含义 | 建议数据来源 | 是否跨页面复用 |
|---|---|---|---|---|---|
| 执行中项目数 | `xx 个执行中项目` | `executingProjectCount` | projectStatus=executing 的项目数量 | Project selector | 是 |
| 团队负载百分比 | `当前工作室负载 xx%` | `teamUtilizationPct` | 团队负载/产能利用率 | Member capacity selector | 是 |
| 即将进入验收项目数 | `x 个项目即将进入验收` | `signoffSoonCount` | 近期进入待验收的项目数 | Project selector（projectStatus + 时间窗） | 是 |
| 今日需内部审核交付物数 | `x 个交付物今日需要完成内部审核` | `internalReviewDueTodayCount` | 今日到期的内部审核项数量 | Deliverable + ReviewRecord selector | 是 |
| 待分发需求数 | `待分发需求 09` | `pendingDispatchRequestCount` | requestStatus=pending-dispatch 的需求数 | Request selector | 是 |
| 待审核交付物数 | `待审核交付物 11` | `pendingReviewDeliverableCount` | reviewStatus=pending 的交付物数量 | Deliverable + ReviewRecord selector | 是 |
| 临期待审核数 | `其中 x 项已临期` | `urgentPendingReviewCount` | 待审核且临期（<=2天） | Deliverable selector | 是 |
| 重点项目卡-项目名 | 项目名称 | `projectName` | 项目名称 | Project | 是 |
| 重点项目卡-品牌/团队 | `品牌团队 · 视频/动效` | `brandTeamName` / `workType` | 品牌/团队 + 工作类型 | Project（继承 Request + 可编辑） | 是 |
| 重点项目卡-项目状态 | `执行中/待验收/已完成/已取消` | `projectStatus` | 项目主状态 | Project（enum） | 是 |
| 重点项目卡-当前节点 | `内部制作/内部审核/退回修改/需求方验收` | `currentNode` | 流程节点 | Project（enum，来自 Deliverable/ReviewRecord 派生） | 是 |
| 重点项目卡-内部交付日 | `内部交付 5月12日 18:00` | `internalDueAt` | 内部交付截止时间 | Project（由 dispatch 录入） | 是 |
| 重点项目卡-验收截止 | `验收截止 ...` | `stakeholderDueAt` | 需求方验收截止 | Request（deadline）或 Project 字段 | 是 |
| 重点项目卡-成员头像 | 主负责人 + 协作成员 | `ownerMemberId` / `collaboratorIds` | 项目成员 | Project relation（Member） | 是 |
| 重点项目卡-交付物数 | `交付物 14` | `deliverableTotalCount` | 交付物总量 | Deliverable aggregate | 是 |
| 重点项目卡-反馈数 | `反馈 8` | `revisionCount` | 退回/修改反馈次数 | ReviewRecord aggregate | 是 |
| 重点项目卡-动作提示 | `去审核/查看反馈/...` | `actionLabel` | 下一步动作标签 | Project derived | 是 |

### 3. 状态 / 节点 / 标签

| 当前页面文案 | 类型判断 | 建议归属字段 | 建议统一值 | 说明 |
|---|---|---|---|---|
| 执行中 | 项目状态 | projectStatus | `executing` | 当前代码通过 Task.status 派生，建议写入统一 Project.projectStatus。 |
| 待验收 | 项目状态 | projectStatus | `signoff` | 当前对应 `PENDING_SIGNOFF`。 |
| 已完成 | 项目状态 | projectStatus | `completed` | 当前对应 `COMPLETED`。 |
| 已取消 | 项目状态 | projectStatus | `canceled` | 当前对应 `CANCELED`。 |
| 内部制作 | 当前节点 | currentNode | `internal_production` | 建议由“交付物是否已提交/是否进入审核”派生。 |
| 内部审核 | 当前节点 | currentNode | `internal_review` | 建议由“存在待审核 submission”派生；不要与 Task.status 直接等价。 |
| 退回修改 | 当前节点 | currentNode | `revision_required` | 建议由最新 ReviewRecord=changes_requested 派生。 |
| 需求方验收 | 当前节点 | currentNode | `stakeholder_signoff` | 建议 projectStatus=signoff 时默认节点。 |
| 临期 / 已临期 | 风险标签 | riskLevel | `urgent` | 风险阈值（<=2天）需统一。 |

### 4. 按钮与跳转

| 按钮 / 入口 | 当前作用 | 建议跳转目标 | 建议携带参数 | 说明 |
|---|---|---|---|---|
| 执行中项目卡（主渐变卡） | 进入执行中项目列表 | 项目看板 | `projectStatus=executing` | 当前实现为 `tasks?tab=EXECUTING`（伪路由），建议映射真实路由 `/projects?status=executing`。 |
| 团队产能卡 | 进入团队管理 | 团队管理 | `focus=capacity` | 建议默认定位到“负载”视图。 |
| 待分发需求卡 | 进入待分发需求列表 | 需求分发中心 | `requestStatus=pending-dispatch` | 当前仅 `tab=pending`，建议明确 requestStatus。 |
| 待审核交付物卡 | 进入待审核队列 | 审核中心 | `reviewStatus=pending` | 当前 `review?tab=PENDING`。 |
| 查看全部项目 | 进入项目看板 | 项目看板 | 无 / `status=all` | 建议保持筛选状态可回退。 |
| 重点项目卡（整卡） | 打开项目详情 | 项目详情 | `projectId` | 当前 `tasks?open=<taskId>`，建议 `/projects/:projectId`。 |
| 重点项目卡主操作（去审核） | 定位该项目待审核 | 审核中心 | `projectId` / `deliverableId` | 当前 `review?open=<taskId>`，建议能定位到项目与交付物。 |
| 重点项目卡主操作（查看反馈） | 查看退回意见 | 我的任务 / 审核中心 | `projectId` | PM 需确认入口归属：成员视角应到 MyTasks，管理视角可到 Review。 |
| 临近截止条目 | 打开对应项目 | 项目详情 | `projectId` | 建议统一跳转项目详情。 |

---

## 页面：需求分发中心

### 1. 页面模块

| 模块名称 | 当前作用 | 建议数据来源 | 备注 |
|---|---|---|---|
| Brief 列表（Tab：全部/待处理/已生成项目） | 展示需求记录并分发生成项目 | Request（store） | 当前把除 ASSIGNED 外都算“待处理”，需细化 requestStatus。 |
| 顶部统计卡/概览 | 需求数量、本周趋势等 | Request aggregate | 当前部分为演示统计。 |
| 分配弹窗 | 录入内部交付日、成本、成员、备注并生成项目 | Request + DispatchInfo（写入） | 当前写入到 `specialNotes.dispatch` + Task 字段。 |
| 详情弹窗 | 查看 Brief 内容与元数据 | Request | 当前直接展示 specialNotes 原文，分发后会显示 JSON 串。 |
| 表单模板入口 | 打开/复制问卷表单链接 | UI + URL | 与路由体系有关（目前为 `/questionnaire-form`）。 |

### 2. 字段清单

| 页面字段 | 当前页面文案 | 建议英文 key | 字段含义 | 建议数据来源 | 是否跨页面复用 |
|---|---|---|---|---|---|
| Brief 标题 | Brief 标题 | `requestTitle` | 需求标题 | Request.title | 是 |
| Brief 描述 | 需求描述 | `requestDescription` | 需求描述 | Request.description | 是 |
| 需求方信息 | 需求人/部门 | `requesterName` / `requesterDept` | Stakeholder 信息 | Request.requester* | 是 |
| Stakeholder 截止 | `Stakeholder 截止日期` | `stakeholderDueAt` | 需求方截止 | Request.deadline | 是 |
| 优先级 | `High/Medium/Low` | `priority` | 需求优先级 | Request.priority (enum) | 是 |
| 品牌/团队 | `品牌/团队` | `brandTeamName` | 品牌/团队归属 | Request.brandTeamName | 是 |
| 交付物摘要 | `交付物 × n` | `deliverableSpecSummary` | 需求交付物概览 | Request.deliverables[] | 是 |
| 分配成员 | `teamMemberIds` | `assignedMemberIds` | 分配成员集合 | DispatchInfo.assignedMemberIds | 是 |
| 内部交付日期 | `internalDueDate` | `internalDueAt` | 内部交付截止 | DispatchInfo.internalDueAt | 是 |
| 预估成本（内部） | `预估成本（RMB）` | `estimatedInternalCost` | 内部预估成本 | DispatchInfo.estimatedInternalCost | 是 |
| 市场成本 | `市场成本（RMB）` | `marketReferenceCost` | 市场参考成本 | DispatchInfo.marketReferenceCost | 是 |
| Manager 备注 | `Manager 备注` | `managerNote` | 分发备注 | DispatchInfo.managerNote | 是 |
| 生成项目入口 | `确认分配/生成项目` | `createProject` | 从需求生成项目记录 | Action | 是 |

### 3. 状态 / 节点 / 标签

| 当前页面文案 | 类型判断 | 建议归属字段 | 建议统一值 | 说明 |
|---|---|---|---|---|
| 待处理 | 需求状态 | requestStatus | `pending_dispatch` | 当前实现为“非 ASSIGNED”，建议明确=未完成分发（未录入内部交付/成本/成员）。 |
| 已生成项目 | 需求状态 | requestStatus | `dispatched` | 当前以 Questionnaire.status=ASSIGNED 代表已生成项目。 |
| UNDER_REVIEW | 需求状态 | requestStatus | `under_review` | 当前存在但 UI 被归类为 pending；需要 PM 确认是否保留该状态。 |
| REJECTED | 需求状态 | requestStatus | `rejected` | 当前存在但 UI 未显式呈现筛选/标签。 |

### 4. 按钮与跳转

| 按钮 / 入口 | 当前作用 | 建议跳转目标 | 建议携带参数 | 说明 |
|---|---|---|---|---|
| 查看表单模板 | 打开表单 | 表单页 | 无 | 当前为独立 route（/questionnaire-form）。 |
| 复制表单链接 | 复制 URL | - | - | 建议统一为“外部链接”。 |
| 分配成员 | 打开分配弹窗 | - | - | 保存后建议自动跳转项目详情 `/projects/:id`。 |
| 已生成项目行-查看项目 | 从 Brief 去项目 | 项目详情 | `requestId` / `projectId` | 当前只跳 `tasks` 不带定位；建议带 `projectId`。 |
| 详情 | 打开 Brief 详情弹窗 | - | - | 建议支持从其它页面 deep link `open=<requestId>`。 |

---

## 页面：项目看板

### 1. 页面模块

| 模块名称 | 当前作用 | 建议数据来源 | 备注 |
|---|---|---|---|
| 项目概览 KPI | 执行中/待验收/完成/成本节省等摘要 | Project aggregate | 当前“预计成本节省”基于 mock internalCost/marketCost。 |
| Tab 筛选（全部/执行中/待验收/已完成/已取消） | 按项目状态筛选 | Project.projectStatus | 当前通过 Task.status 派生主状态。 |
| QuickFilter（紧急/逾期/待审核） | 快速筛选风险 | Project + Deliverable + ReviewRecord | 当前“品牌/团队”等筛选按钮是 UI-only。 |
| 项目列表 | 展示项目基础信息、状态、动作 | Project + Request + Deliverable + ReviewRecord | 多字段来自 makeMock（internalDueDate/customerDeadline/deliverables/pendingReview）。 |
| 项目详情弹窗 | 展示 Brief/交付物/成本/FA/记录 | Project + Request + Deliverable + ReviewRecord + Asset | 当前交付物清单与成本多为 mock/派生。 |

### 2. 字段清单

| 页面字段 | 当前页面文案 | 建议英文 key | 字段含义 | 建议数据来源 | 是否跨页面复用 |
|---|---|---|---|---|---|
| 项目编号 | `VID-xxx` | `projectCode` | 项目编码 | Project.code（或外部系统 code） | 是 |
| 项目名称 | title | `projectName` | 项目名称 | Project.name | 是 |
| 项目状态 | 执行中/待验收/已完成/已取消 | `projectStatus` | 主状态 | Project.projectStatus | 是 |
| 当前节点 | 审核/验收等 | `currentNode` | 当前节点 | Project.currentNode | 是 |
| 品牌/团队 | brand | `brandTeamName` | 品牌/团队 | Project.brandTeamName | 是 |
| 执行成员 | assignee | `ownerMemberId` | 主负责人 | Project.ownerMemberId | 是 |
| 内部交付日 | `内部交付` | `internalDueAt` | 内部交付截止 | Project.internalDueAt（dispatch 录入） | 是 |
| 客户截止/验收截止 | `客户截止` | `stakeholderDueAt` | 需求方截止 | Request.deadline 或 Project.stakeholderDueAt | 是 |
| 待审核数 | `待审核素材` | `pendingReviewDeliverableCount` | 待审核交付物数量 | Deliverable+ReviewRecord | 是 |
| 退回记录数 | `退回记录` | `revisionCount` | 退回次数 | ReviewRecord aggregate | 是 |
| 内部成本 | `内部成本` | `estimatedInternalCost` | 内部成本/预估成本 | Project.cost.estimatedInternalCost | 是 |
| 市场参考成本 | `市场参考成本` | `marketReferenceCost` | 市场参考成本 | Project.cost.marketReferenceCost | 是 |
| 节省 | `预计节省` | `estimatedSaving` | 成本节省 | 计算字段（market - internal） | 是 |
| FA Link | `FA Link` | `faFileUrl` | 最终 FA 链接 | Project.faFileUrl（或 Asset 关联） | 是 |
| 最近提醒时间 | `最近提醒时间` | `lastRemindAt` | 验收/风险提醒 | Activity/Project field | 否 |

### 3. 状态 / 节点 / 标签

| 当前页面文案 | 类型判断 | 建议归属字段 | 建议统一值 | 说明 |
|---|---|---|---|---|
| 执行中/待验收/已完成/已取消 | 项目状态 | projectStatus | `executing/signoff/completed/canceled` | 当前通过 Task.status 推导，建议直接存 Project.projectStatus。 |
| 紧急 | 风险标签 | riskLevel | `urgent` | 当前用 internalDue<=2 天判断。 |
| 已逾期 | 风险标签 | riskLevel | `overdue` | 当前用 internalDue 过期判断。 |
| 待审核 | 操作标签/统计标签 | reviewStatus | `pending` | 当前用 pendingReviewCount>0 判断。 |

### 4. 按钮与跳转

| 按钮 / 入口 | 当前作用 | 建议跳转目标 | 建议携带参数 | 说明 |
|---|---|---|---|---|
| 查看数据报表 | 跳转运营数据 | 运营看板-运营数据 | - | 建议 route `/ops/analytics`。 |
| 审核 | 去审核 | 审核中心 | `projectId` | 当前不携带定位，建议 `projectId` + 可选 `deliverableId`。 |
| 提交验收 | 推进到验收 | 项目详情/动作 | `projectId` | 建议统一为 projectStatus->signoff 的 action。 |
| 查看归档/详情 | 打开详情弹窗 | 项目详情 | `projectId` | 未来建议独立 route `/projects/:projectId`。 |
| 查看 FA | 打开外链 | 外部链接 | `faFileUrl` | 建议统一“外链/资源打开”组件。 |

---

## 页面：我的任务

### 1. 页面模块

| 模块名称 | 当前作用 | 建议数据来源 | 备注 |
|---|---|---|---|
| 我的任务列表 | 成员查看自己项目/交付状态 | Project + Deliverable + ReviewRecord | 当前交付物与进度多数为演示派生。 |
| 提交弹窗 | 提交文件/链接/说明 | Submission | 保存后进入审核队列。 |
| 反馈弹窗 | 查看审核反馈 | ReviewRecord | 当前仅展示最新/列表。 |
| 详情弹窗 | 查看任务摘要与历史 | Project + Request + Submission + ReviewRecord | 建议合并为统一“项目详情（成员视角）”页。 |

### 2. 字段清单

| 页面字段 | 当前页面文案 | 建议英文 key | 字段含义 | 建议数据来源 | 是否跨页面复用 |
|---|---|---|---|---|---|
| 项目编号 | `VID-xxx` | `projectCode` | 项目编码 | Project.code | 是 |
| 项目名称 | title | `projectName` | 项目名称 | Project.name | 是 |
| 品牌/团队 | brandTeam | `brandTeamName` | 品牌/团队 | Project.brandTeamName | 是 |
| Stakeholder | requester | `stakeholderName` | 需求方/提出人 | Request.requesterName | 是 |
| 成员提交状态 | `待提交/待审核/需修改/已通过/已完成` | `memberTaskStatus` | 成员视角的交付状态 | Deliverable + ReviewRecord 派生 | 是 |
| 最新提交版本 | version | `latestSubmissionVersion` | 最新提交版本号 | Submission | 是 |
| 最新提交链接/文件 | link/fileName | `latestSubmissionUrl` / `latestSubmissionFileName` | 最新提交内容 | Submission | 是 |
| 反馈摘要 | feedback | `latestReviewComment` | 最近审核意见 | ReviewRecord | 是 |
| 交付物进度 | `done/total` | `deliverableProgress` | 交付进度 | Deliverable aggregate | 是 |

### 3. 状态 / 节点 / 标签

| 当前页面文案 | 类型判断 | 建议归属字段 | 建议统一值 | 说明 |
|---|---|---|---|---|
| 待提交 | 交付物状态 | deliverableStatus | `draft` | 建议以 Deliverable/Submission 真实状态定义，不与 Task.status 混用。 |
| 待审核 | 审核状态 | reviewStatus | `pending` | 当前通过“存在 PENDING review”判定，建议明确基于 Submission->ReviewRecord。 |
| 需修改 | 审核状态 | reviewStatus | `changes_requested` | 当前通过最新 ReviewRecord=REVISION_REQUESTED 判定。 |
| 已通过 | 审核状态 | reviewStatus | `approved` | 通过后可能进入验收；需明确“已通过内部审核”与“已完成项目”区别。 |
| 已完成 | 项目状态 | projectStatus | `completed` | 成员视角的完成应对应项目完成或交付归档。 |

### 4. 按钮与跳转

| 按钮 / 入口 | 当前作用 | 建议跳转目标 | 建议携带参数 | 说明 |
|---|---|---|---|---|
| 提交交付物/更新提交/重新提交 | 打开提交弹窗并提交 | - | `projectId`/`deliverableId` | 建议提交对象从“项目”细化为“交付物”。 |
| 查看提交 | 打开提交链接 | 外部链接 | `submissionUrl` | 建议统一外链打开逻辑并记录 Activity。 |
| 查看反馈 | 打开反馈弹窗 | - | `reviewRecordId` | 建议能跳到审核中心该条记录（manager view）。 |
| 详情/查看归档 | 打开详情弹窗 | 项目详情（成员视角） | `projectId` | 未来建议统一为 `/projects/:id?view=member`。 |

---

## 页面：审核中心

### 1. 页面模块

| 模块名称 | 当前作用 | 建议数据来源 | 备注 |
|---|---|---|---|
| 审核队列（批次） | Manager 查看待审任务/批次 | Submission + ReviewRecord + Project | 当前“有 submission 就入队”，不看 Task.status。 |
| 交付物列表（逐项） | 对同一项目的多交付物逐项审核 | Deliverable | 当前交付物多为解析 specialNotes 或取模 mock。 |
| 预览区 | 视频/文件预览 | Asset/Submission fileUrl | 当前视频预览用 task.videoUrl/sample。 |
| 审核表单 | 通过/退回、反馈点位 | ReviewRecord | 当前写入 Review.comment。 |
| 版本记录/审核记录 | 展示历史提交与审核 | Submission + ReviewRecord | 需要统一关联键（submissionId/deliverableId）。 |
| FA 候选 | 标记 FA 候选 | Project 或 Deliverable | 当前写入 task.faCandidateLink；需明确实体归属。 |

### 2. 字段清单

| 页面字段 | 当前页面文案 | 建议英文 key | 字段含义 | 建议数据来源 | 是否跨页面复用 |
|---|---|---|---|---|---|
| 待审核数量 | Tab/角标 | `pendingReviewDeliverableCount` | 待审核交付物数 | Deliverable+ReviewRecord | 是 |
| 临期/逾期 | 标签 | `riskLevel` | 临期/逾期风险 | Project/Deliverable | 是 |
| 批次状态 | `PENDING/RETURNED/APPROVED/FA` | `batchStatus` | 审核批次派生状态 | DeliverableState aggregate | 否（应由统一规则推导） |
| 交付物名称/类型 | deliverable name | `deliverableName` / `deliverableType` | 单项交付物标识 | Deliverable | 是 |
| 交付物状态 | `PENDING/APPROVED/RETURNED/FA_CANDIDATE` | `deliverableStatus` | 交付物级别状态 | Deliverable + ReviewRecord | 是 |
| 最新提交链接 | link | `latestSubmissionUrl` | 最新提交内容链接 | Submission | 是 |
| 审核结果 | 通过/退回 | `reviewStatus` | 审核结果 | ReviewRecord.status | 是 |
| 审核意见 | comment | `reviewComment` | 审核反馈 | ReviewRecord.comment | 是 |
| 点位 | timestamp/location | `reviewLocation` | 视频时间点/位置 | ReviewRecord.timestamp | 否 |
| FA 候选链接 | `faCandidateLink` | `faCandidateFileUrl` | FA 候选资源链接 | Project/Deliverable | 是 |

### 3. 状态 / 节点 / 标签

| 当前页面文案 | 类型判断 | 建议归属字段 | 建议统一值 | 说明 |
|---|---|---|---|---|
| PENDING | 审核状态 | reviewStatus | `pending` | ReviewRecord.status。 |
| APPROVED | 审核状态 | reviewStatus | `approved` | ReviewRecord.status。 |
| REVISION_REQUESTED | 审核状态 | reviewStatus | `changes_requested` | 建议统一英文值，避免 UI/数据混用。 |
| RETURNED | 交付物状态 | deliverableStatus | `changes_requested` | 当前为页面派生状态，建议复用 reviewStatus->deliverableStatus 映射。 |
| FA / FA_CANDIDATE | 操作标签/交付物状态 | actionLabel / deliverableStatus | `fa_candidate` | “FA 候选”建议是 Deliverable 的一个标记而非批次状态。 |

### 4. 按钮与跳转

| 按钮 / 入口 | 当前作用 | 建议跳转目标 | 建议携带参数 | 说明 |
|---|---|---|---|---|
| 通过（单项/批量） | 写 ReviewRecord + 推进项目节点 | - | `projectId/deliverableId/submissionId` | 通过后可能进入待验收，需统一状态机。 |
| 退回（单项/批量） | 写 ReviewRecord + 推进为需修改 | - | 同上 | 退回后成员在我的任务里看到“需修改”。 |
| 设为 FA 候选/取消候选 | 标记候选 | 项目详情/资产 | `deliverableId` | PM 需确认：候选是项目级还是交付物级。 |
| 新标签页打开 | 打开提交链接 | 外部链接 | `submissionUrl` | 统一为资源打开。 |
| 查看 Brief / 查看任务说明 | 查看上下文 | 需求详情/项目详情 | `requestId/projectId` | 当前无行为，建议补齐跳转并带定位。 |

---

## 页面：团队管理

### 1. 页面模块

| 模块名称 | 当前作用 | 建议数据来源 | 备注 |
|---|---|---|---|
| 团队概览（产能/风险） | 团队总体负载、风险提示 | Member capacity selector | 当前能力/负载多为前端计算或可编辑 state。 |
| 成员列表与筛选 | 成员卡片、角色/能力/负载筛选 | Member + Project/Deliverable | 当前部分筛选为 UI-only。 |
| 右侧详情栏 | 成员详情、任务列表、协助建议 | Member + Project + ReviewRecord | 当前“需修改/待审核”判定口径与 MyTasks/ReviewPage 有差异。 |
| 编辑成员弹窗 | 编辑成员信息/能力标签 | Member | 当前写入本地 state（非 store）。 |

### 2. 字段清单

| 页面字段 | 当前页面文案 | 建议英文 key | 字段含义 | 建议数据来源 | 是否跨页面复用 |
|---|---|---|---|---|---|
| 成员姓名 | name | `memberName` | 成员姓名 | Member.name | 是 |
| 成员邮箱 | email | `memberEmail` | 邮箱 | Member.email | 是 |
| 角色 | 组长/组员 | `memberRole` | 权限角色 | Member.role (enum) | 是 |
| 职位/标题 | title | `memberTitle` | 职位 | Member.title | 是 |
| 能力标签 | skills | `skillTags` | 能力维度 | Member.skills[] | 是 |
| 负载百分比 | load% | `memberUtilizationPct` | 成员负载 | Member capacity selector | 是 |
| 待审核关联任务数 | 待审核 | `pendingReviewProjectCount` | 该成员待审核项目数 | ReviewRecord aggregate | 是 |
| 需修改任务数 | 需修改 | `changesRequestedProjectCount` | 该成员需修改项目数 | ReviewRecord aggregate | 是 |
| 协助建议 | 建议协助 | `assistSuggestion` | 分配建议 | 规则引擎/运营规则 | 否 |

### 3. 状态 / 节点 / 标签

| 当前页面文案 | 类型判断 | 建议归属字段 | 建议统一值 | 说明 |
|---|---|---|---|---|
| 待审核 | 审核状态 | reviewStatus | `pending` | 建议基于 ReviewRecord/Submission，而不是 Task.status。 |
| 需修改 | 审核状态 | reviewStatus | `changes_requested` | 与 MyTasks/ReviewPage 统一。 |
| 已通过 | 统计标签 | reviewStatus / projectStatus | `approved` / `signoff` | 需明确“已通过内部审核”与“已完成”区分。 |

### 4. 按钮与跳转

| 按钮 / 入口 | 当前作用 | 建议跳转目标 | 建议携带参数 | 说明 |
|---|---|---|---|---|
| 查看成员详情 | 打开右侧详情 | - | `memberId` | 可选 deep link `/team?memberId=`。 |
| 去审核 | 跳转审核中心定位成员任务 | 审核中心 | `memberId`/`projectId` | 建议支持按成员过滤队列。 |
| 编辑成员 | 编辑成员信息 | - | `memberId` | 建议写入 store 并统一为 Member 实体。 |

---

## 页面：运营看板 - 运营数据

### 1. 页面模块

| 模块名称 | 当前作用 | 建议数据来源 | 备注 |
|---|---|---|---|
| KPI 区 | 项目量、工时、成本节省、DAM Usage 等 | Project + Deliverable + Asset + Member | 当前实现为静态 reportData，不读 store。 |
| 图表卡 | 品牌/团队分布、资产类型、趋势 | 统计计算 | 需统一口径与时间窗。 |
| 筛选区 | 月/季度、品牌等 | 统一 filter state | 当前品牌筛选与其它页面品牌集合不一致。 |
| 洞察浮层/弹窗 | 运营洞察与口径说明 | 规则引擎/配置 | 当前主要为 UI + toast。 |

### 2. 字段清单

| 页面字段 | 当前页面文案 | 建议英文 key | 字段含义 | 建议数据来源 | 是否跨页面复用 |
|---|---|---|---|---|---|
| 项目量 | 项目总数/完成数 | `projectCount` / `completedProjectCount` | 项目数量统计 | Project aggregate | 是 |
| 工时 | 工时/占比 | `workHours` | 工时统计 | Deliverable/Member timesheet（后续） | 是 |
| 成本节省 | 节省金额 | `costSaving` | 节省=市场-内部 | Project.cost | 是 |
| DAM Usage | 资产复用统计 | `damUsage` | 资产总数/复用次数/复用率等 | Asset + AssetUsage | 是 |
| 品牌/团队分布 | 图表 | `brandDistribution` | 按品牌统计 | Project.brandTeamName | 是 |
| 资产类型分布 | 图表 | `assetTypeDistribution` | 按资产类型统计 | Asset.assetType | 是 |

### 3. 状态 / 节点 / 标签

| 当前页面文案 | 类型判断 | 建议归属字段 | 建议统一值 | 说明 |
|---|---|---|---|---|
| 月/季 | 统计标签 | timeGrain | `month/quarter` | 统一分析粒度。 |
| 品牌筛选 | 统计标签 | brandTeamName | - | 品牌集合建议来自字典/配置。 |

### 4. 按钮与跳转

| 按钮 / 入口 | 当前作用 | 建议跳转目标 | 建议携带参数 | 说明 |
|---|---|---|---|---|
| 导出（PDF/CSV） | 导出报表 | 导出服务/前端导出 | `timeRange/filter` | 当前为 toast 模拟。 |
| 查看洞察 | 打开洞察弹窗 | - | `insightId` | 建议与工作台洞察统一来源。 |

---

## 页面：运营看板 - 成员作品集

### 1. 页面模块

| 模块名称 | 当前作用 | 建议数据来源 | 备注 |
|---|---|---|---|
| 成员/季度筛选 | 选择成员与季度 | Member + 时间窗 | 当前按 tasks.completedAt 过滤。 |
| 已完成项目列表 | 勾选进入作品集的项目 | Project | 当前 Brief 数/交付数/Leadtime 多为取模演示。 |
| 右侧 PPT 预览 | 预览页面结构 | Portfolio | 当前为 UI + toast。 |
| 导出 PPT | 导出作品集 | 导出服务/前端导出 | 当前为 toast。 |

### 2. 字段清单

| 页面字段 | 当前页面文案 | 建议英文 key | 字段含义 | 建议数据来源 | 是否跨页面复用 |
|---|---|---|---|---|---|
| 成员 | 成员下拉 | `memberId` | 成员选择 | Member.id | 是 |
| 季度 | `2026 Q2` | `quarter` | 作品集时间窗 | Portfolio.quarter | 是 |
| 项目列表 | 项目条目 | `projectId` | 作品集项目集合 | Project (completed) | 是 |
| 预览/导出页数 | toast 文案 | `portfolioPageCount` | 作品集页数 | Portfolio derived | 否 |
| 发布链接/FA | 查看链接 | `publishUrl` / `faFileUrl` | 项目对外链接/FA | Project/Asset | 是 |

### 3. 状态 / 节点 / 标签

| 当前页面文案 | 类型判断 | 建议归属字段 | 建议统一值 | 说明 |
|---|---|---|---|---|
| 已完成项目 | 项目状态 | projectStatus | `completed` | 当前按 Task.status=COMPLETED。 |

### 4. 按钮与跳转

| 按钮 / 入口 | 当前作用 | 建议跳转目标 | 建议携带参数 | 说明 |
|---|---|---|---|---|
| 预览 PPT | 打开预览 | - | `memberId/quarter/projectIds` | 建议生成 Portfolio 实体并可复用。 |
| 导出 PPT | 导出 | 导出服务 | 同上 | 需明确模板与取数规则。 |
| 查看发布链接/FA | 打开链接 | 外部链接/项目详情 | `projectId` | 当前为 toast，建议能跳项目详情或外链。 |

---

## 页面：创意资产库

### 1. 页面模块

| 模块名称 | 当前作用 | 建议数据来源 | 备注 |
|---|---|---|---|
| 顶部说明 + 资产来源 | 解释资产生成规则 | 文档/配置 | 当前为弹窗说明。 |
| KPI（4 卡） | 资产总数/已复用/复用次数/复用率 | Asset + AssetUsage | 当前基于派生资产列表。 |
| 筛选区 | 全部/已复用/未复用 + 业务筛选 | Asset fields | 当前筛选字段集合与其它页面品牌集合不一致。 |
| 资产列表（左） | 资产卡片列表 | Asset | 当前资产来源=从已完成任务派生（每格式一条）。 |
| 资产详情（右） | 预览/链接/元信息/复用记录 | Asset + AssetUsage | 当前编辑仅 mutate 本地对象，不写 store。 |
| 编辑资产弹窗 | 编辑资产名称、类型、渠道、标签、说明 | Asset | 需要持久化策略（写 store 或后端）。 |

### 2. 字段清单

| 页面字段 | 当前页面文案 | 建议英文 key | 字段含义 | 建议数据来源 | 是否跨页面复用 |
|---|---|---|---|---|---|
| 资产名称 | 资产名称 | `assetName` | 展示名称（可编辑） | Asset.assetName | 是 |
| 系统生成名称 | generatedName | `generatedName` | 自动生成名称 | Asset.generatedName | 是 |
| 文件名 | fileName | `fileName` | 原始文件名 | Asset.fileName | 是 |
| 文件格式 | fileFormat | `fileFormat` | MP4/JPG/PSD… | Asset.fileFormat | 是 |
| 资产链接 | 打开/复制 | `assetFileUrl` | 资产文件链接 | Asset.assetFileUrl | 是 |
| 来源项目 | 来源项目/编号 | `sourceProjectId` / `sourceProjectCode` | 来源项目信息 | Asset.sourceProject* | 是 |
| 来源交付物 | 来源交付物 | `sourceDeliverableId` / `sourceDeliverableName` | 来源交付物 | Asset.sourceDeliverable* | 是 |
| 来源发布链接 | 查看 | `sourcePublishLinks[]` | 来源发布链接集合 | Asset.sourcePublishLinks | 是 |
| 复用记录 | 复用记录列表 | `assetUsages[]` | 被复用历史 | AssetUsage relation | 是 |
| 复用发布链接 | 查看复用发布链接 | `reusePublishLinks[]` | 复用发布链接集合 | AssetUsage.publishUrl | 是 |
| 品牌/团队 | brand | `brandTeamName` | 资产归属 | Asset.brandTeamName | 是 |
| 成员 | member | `ownerMemberId` | 主要贡献成员 | Asset.ownerMemberId | 是 |
| 工作类型 | workType | `workType` | 视频/平面… | Asset.workType (enum) | 是 |
| 资产类型 | assetType | `assetType` | 主视觉/延展/短视频… | Asset.assetType (enum) | 是 |
| 渠道 | channel | `channel` | 社媒/电商… | Asset.channel (enum) | 是 |
| 标签 | tags | `tags[]` | 标签数组 | Asset.tags | 是 |
| 使用说明 | usageNote | `usageNote` | 说明 | Asset.usageNote | 是 |
| 完成时间 | completedAt | `completedAt` | 来源项目完成时间 | Project.completedAt | 是 |

### 3. 状态 / 节点 / 标签

| 当前页面文案 | 类型判断 | 建议归属字段 | 建议统一值 | 说明 |
|---|---|---|---|---|
| 全部资产/已复用/未复用 | 统计标签 | `reuseStatus` | `all/reused/not_reused` | 由 AssetUsage 关系派生。 |
| 复用 x 次 | 统计标签 | `reuseCount` | number | AssetUsage count。 |

### 4. 按钮与跳转

| 按钮 / 入口 | 当前作用 | 建议跳转目标 | 建议携带参数 | 说明 |
|---|---|---|---|---|
| 复制资产链接 | 复制 assetFileUrl | - | - | 建议统一 toast + clipboard。 |
| 编辑资产 | 编辑可编辑字段 | - | `assetId` | 保存应写入 Asset（store/后端）。 |
| 资产链接：打开 | 打开资产文件 | 外部链接 | `assetFileUrl` | 统一资源打开策略。 |
| 来源发布链接：查看 | 打开来源发布链接 | 外部链接 | `sourcePublishUrl` | 需支持多链接（集合）。 |
| 复用记录：查看复用发布链接 | 打开复用链接 | 外部链接 | `reusePublishUrl` | 从 AssetUsage 取数。 |
| 从项目查看资产（建议） | 从项目详情跳转资产详情 | 资产详情 | `assetId/sourceProjectId` | 目前项目看板未提供入口，建议补齐。 |

---

# 三、全局规则核查

## 1. 项目状态规则（projectStatus + currentNode）

| 当前系统出现的字段/文案 | 当前归属（现状） | 建议归属字段 | 建议统一值 | 影响页面 | 说明 |
|---|---|---|---|---|---|
| Task.status = `WIP` | taskStatus（隐含项目状态） | projectStatus + currentNode | `executing` + `internal_production` | 工作台/项目看板/我的任务/团队管理 | 建议把“制作中”从主状态拆到 currentNode。 |
| Task.status = `INTERNAL_REVIEW` | taskStatus（隐含流程节点） | currentNode | `internal_review` | 同上 | 这是节点，不是主状态。 |
| Task.status = `PENDING_SIGNOFF` | taskStatus（主状态） | projectStatus + currentNode | `signoff` + `stakeholder_signoff` | 工作台/项目看板/审核中心 | 建议显式存 projectStatus=signoff。 |
| 最新 Review.status=`REVISION_REQUESTED` → “需修改/退回修改” | reviewStatus 派生 | currentNode + reviewStatus | `revision_required` + `changes_requested` | 我的任务/审核中心/团队管理/工作台 | “退回修改”是节点；审核结果是 reviewStatus。 |
| ReviewPage 的批次状态 `RETURNED/FA` | 页面派生 | deliverableStatus / actionLabel | `changes_requested` / `fa_candidate` | 审核中心 | 建议统一为交付物粒度，避免批次状态新造枚举。 |

### 建议统一映射（第一版）

| 现有 Task.status | 建议 projectStatus | 建议 currentNode | 说明 |
|---|---|---|---|
| BRIEF_REVIEW | - | - | 建议迁移到 Request/Dispatch 流，不作为 Project 状态。 |
| WIP | executing | internal_production | 执行中项目，制作进行中。 |
| INTERNAL_REVIEW | executing | internal_review | 执行中项目，内部审核中。 |
| PENDING_SIGNOFF | signoff | stakeholder_signoff | 待验收/需求方验收中。 |
| COMPLETED | completed | - | 完成后 currentNode 可置空或固定为 completed。 |
| CANCELED | canceled | - | 取消后 currentNode 可置空。 |

## 2. 需求分发中心规则（Request → Project）

| 功能 | 当前是否具备字段 | 当前字段位置（现状） | 建议字段归属 | 需同步页面 |
|---|---|---|---|---|
| 接收需求 | 是 | Questionnaire（store） | Request | 工作台/需求分发/项目看板/团队管理/运营数据 |
| 分配成员 | 是 | specialNotes.dispatch.teamMemberIds + Task.assigneeId（仅主负责人） | Project.ownerMemberId + collaboratorIds | 项目看板/我的任务/团队管理/工作台 |
| 录入内部交付日期 | 是 | dispatch.internalDueDate + Task.dueDate | Project.internalDueAt | 工作台/项目看板/审核中心/团队管理 |
| 录入预估成本 | 是 | dispatch.estimatedCostRmb + Task.estimatedCost | Project.cost.estimatedInternalCost | 项目看板/运营数据 |
| 录入 Manager 备注 | 是 | dispatch.managerNote（写在 specialNotes） | Request.dispatchNote / Project.managerNote | 项目看板/审核中心（上下文） |
| 确认后生成项目记录 | 是 | dispatchBrief action | Project（create） | 项目看板/工作台/团队管理 |

## 3. 项目看板规则（Project 负责的字段覆盖性）

| 规则项 | 现状覆盖 | 缺口/不一致 | 建议归属 |
|---|---|---|---|
| 管理项目状态 | 部分 | 真实状态来自 Task.status；缺 projectStatus/currentNode 分层 | Project.projectStatus + Project.currentNode |
| 跟踪 Brief 信息 | 部分 | 依赖 questionnaireId 关联；specialNotes 既是文本又是 JSON | Request 实体 + 关系键 requestId |
| 跟踪成员 | 部分 | 只有 assigneeId；协作成员缺 | Project.ownerMemberId + collaboratorIds |
| 跟踪交付物 | 弱 | 多处取模 mock/页面内生成，未持久化 | Deliverable 实体 |
| 跟踪 Leadtime | 弱 | 多处取模/演示 | Project.leadTimeDays（计算字段） |
| 跟踪成本 | 弱 | estimatedCost/marketCost 与 internalCost mock 混用 | Project.cost（统一字段） |
| 跟踪来源发布链接 | 缺 | assets/sourcePublishedLink 多为模拟 | Asset.sourcePublishLinks |
| 跟踪关联资产 | 弱 | Assets 从已完成项目派生，未与项目详情关联 | Project↔Asset relation |

## 4. 我的任务规则（对齐 Deliverable/Submission/ReviewRecord）

| 规则项 | 现状 | 缺口 | 建议 |
|---|---|---|---|
| 成员查看自己的交付任务 | 是 | BRIEF_REVIEW 排除但规则不显式 | 统一为 Project.memberView 列表 |
| 提交文件或链接 | 是 | 提交对象是“taskId”而不是“deliverableId” | Submission 必须关联 Deliverable |
| 查看审核反馈 | 是 | Feedback 弹窗与 ReviewPage 交付物粒度不一致 | ReviewRecord 与 Deliverable 对齐 |
| 重新提交修改稿 | 是 | version、fileName、link 可用，但缺“针对哪一项交付物” | 增加 deliverableId / deliverableKey |

## 5. 审核中心规则（对齐 Submission/ReviewRecord/Deliverable）

| 规则项 | 现状 | 缺口 | 建议 |
|---|---|---|---|
| Manager 审核成员提交 | 是 | 队列入选规则只看 submissions，不看 projectStatus/currentNode | 统一以 deliverableStatus=ready_for_review 入队 |
| 支持逐项审核 | 是（页面内） | deliverableState 是本地 state，不持久化 | Deliverable.status 持久化 + ReviewRecord 关系 |
| 通过/退回 | 是 | 批量操作对“是否进入验收”的条件需 PM 明确 | 定义状态机 |
| 标记 FA 候选 | 是 | 候选字段写到 task.faCandidateLink，且默认第一个交付物 | 候选应归属 Deliverable 或 Asset |
| 同步到我的任务/项目看板 | 部分 | 依赖 Task.status 改动 + 通知，但项目看板/我的任务的状态映射不统一 | 统一状态机 + selectors |

## 6. 团队管理规则（产能字段来源）

| 字段/能力 | 现状 | 建议数据来源 | 建议计算方式 |
|---|---|---|---|
| 总体负载% | 工作台/团队管理各自计算 | Member + Project + Deliverable | （进行中交付物工作量）/（成员产能上限） |
| 能力维度负载 | 多处取模/派生 | Member.skills + Deliverable.type/workType | 按能力映射权重汇总 |
| 待审核关联任务 | 依赖 task.status 或 review 最新一条 | Deliverable + ReviewRecord | deliverable.reviewStatus=pending |
| 需修改任务 | 依赖 latest review | ReviewRecord | changes_requested 统计 |

## 7. 运营看板规则（取数实体归属）

| 指标 | 建议实体 | 说明 |
|---|---|---|
| 项目量 | Project | 按 projectStatus/timeRange 统计 |
| 工时 | Deliverable/Member | 后续需 timesheet 或工时估算模型 |
| 品牌/团队分布 | Project.brandTeamName | 需统一品牌字典 |
| 资产类型 | Asset.assetType | 需统一 assetType 枚举 |
| 成本节省 | Project.cost | saving = marketReferenceCost - estimatedInternalCost |
| DAM Usage | AssetUsage | reuseCount/reuseRate 等来自 AssetUsage |
| 成员季度作品集 | Portfolio | 从 Project(completed) + Member 生成 Portfolio |

## 8. 创意资产库规则（字段区分与映射）

| 类型 | 建议字段 | 现状 | 备注 |
|---|---|---|---|
| 资产本身链接 | assetFileUrl | AssetsPage.assetLink（派生 URL） | 建议统一命名为 assetFileUrl。 |
| 来源项目 | sourceProjectId | AssetsPage.sourceProjectId（来自 task.id） | 需要与 Project.id 对齐。 |
| 来源交付物 | sourceDeliverableId | 现状只有 sourceDeliverableName（无 id） | 必须引入 Deliverable.id 或 deliverableKey。 |
| 来源发布链接 | sourcePublishLinks | 现状 sourcePublishedLink 为模拟单链接 | 需要支持多链接集合。 |
| 复用发布链接 | reusePublishLinks | 现状 reuseHistory[].publishedLink（模拟） | 建议归属 AssetUsage.publishUrl。 |

---

# 四、字段命名不一致清单

| 问题字段 | 出现页面 | 当前叫法 | 建议统一名称 | 建议英文 key | 影响范围 | 优先级 |
|---|---|---|---|---|---|---|
| 项目编码 | 工作台/项目看板/资产库/作品集 | `taskNumber` / `projectCode` / `sourceProjectCode` | 项目编号 | `projectCode` | 列表、搜索、跨页定位 | P0 |
| 项目名称 | 多页 | `title` / `projectName` / `sourceProjectName` | 项目名称 | `projectName` | 展示、统计 | P1 |
| 需求截止 | 需求分发/项目看板/工作台 | `deadline` / `customerDeadline`(mock) | 需求方截止 | `stakeholderDueAt` | 风险、临期、验收 | P0 |
| 内部交付日 | 需求分发/项目看板/工作台 | `internalDueDate` / `dueDate` / `internalDueDate`(mock) | 内部交付截止 | `internalDueAt` | 排期、风险 | P0 |
| 内部预估成本 | 需求分发/项目看板 | `estimatedCostRmb` / `estimatedCost` / `internalCost`(mock) | 内部预估成本 | `estimatedInternalCost` | 成本节省统计 | P0 |
| 市场参考成本 | 需求分发/项目看板 | `marketCostRmb` / `marketCost` | 市场参考成本 | `marketReferenceCost` | 成本节省统计 | P0 |
| 品牌/团队 | 多页 | `brand` / `brandTeam` / `Corporate/HR Team` 等混用 | 品牌/团队 | `brandTeamName` | 筛选、统计 | P1 |
| 工作类型/资产类型 | 多页 | `assetType`(Task) / `workType`(Asset) / `assetType`(Asset) | 工作类型/资产类型分离 | `workType` + `assetType` | 统计、筛选 | P1 |
| 交付物定义 | 多页 | `deliverables`(specialNotes) / 取模生成 / 派生 | 交付物清单 | `deliverables[]` | 审核/任务/统计 | P0 |
| 备注字段 | 需求/项目 | `specialNotes`(文本或 JSON) / `managerNote` | 备注/元数据分离 | `requestNote` + `meta` | 展示、解析失败 | P0 |
| 资产链接 | 资产库/项目/审核 | `assetLink` / `faLink` / `faCandidateLink` / submission.link | 资源链接统一命名 | `fileUrl` family | 资源打开、复用 | P1 |

---

# 五、状态口径不一致清单

| 当前文案 | 出现页面 | 当前用途 | 建议归属字段 | 建议统一值 | 影响范围 | 优先级 |
|---|---|---|---|---|---|---|
| WIP | 项目看板/审核/工作台/团队 | 被当作“执行中/制作中” | projectStatus + currentNode | `executing` + `internal_production` | 状态筛选、统计 | P0 |
| INTERNAL_REVIEW | 多页 | 被当作“内部审核中” | currentNode | `internal_review` | 审核队列/风险 | P0 |
| PENDING_SIGNOFF | 多页 | 被当作“待验收/需求方验收” | projectStatus + currentNode | `signoff` + `stakeholder_signoff` | 项目流转 | P0 |
| PENDING（Review） | 我的任务/审核中心 | 审核待处理 | reviewStatus | `pending` | 审核逻辑 | P0 |
| REVISION_REQUESTED | 多页 | 退回修改 | reviewStatus + currentNode | `changes_requested` + `revision_required` | 需修改判定 | P0 |
| RETURNED | 审核中心 | 批次/交付物退回 | deliverableStatus | `changes_requested` | 口径混乱 | P1 |
| FA / FA_CANDIDATE | 审核中心/项目 | 候选 FA | actionLabel / deliverableStatus | `fa_candidate` | FA 选择/归档 | P1 |
| 待处理（Brief） | 需求分发中心 | Tab = pending | requestStatus | `pending_dispatch` | 分发统计 | P0 |
| ASSIGNED（Brief） | 需求分发中心 | 已生成项目 | requestStatus | `dispatched` | Request→Project 关系 | P0 |

---

# 六、重复字段清单

| 字段 | 出现页面 | 当前表现 | 是否应共用同一字段 | 建议处理方式 | 优先级 |
|---|---|---|---|---|---|
| 品牌/团队 | 工作台/需求分发/项目看板/我的任务/团队/资产库/运营数据 | 多处解析/硬编码 | 是 | 统一 `brandTeamName` 字典 + selector | P1 |
| Stakeholder 信息 | 需求分发/项目看板/我的任务/审核中心 | 拼接 requesterName/Dept | 是 | 统一 Request.requester* + Project.requestId 关联 | P1 |
| 交付物数量/摘要 | 多页 | JSON 解析/取模/mock | 是 | 建立 Deliverable 实体并从 Request 继承 | P0 |
| 待审核数量 | 工作台/项目看板/团队/审核中心 | 用 task.status 或 submissions/reviews 派生 | 是 | 统一由 Deliverable.reviewStatus 统计 | P0 |
| 需修改数量 | 我的任务/团队/审核中心 | 用 latest review 派生 | 是 | 统一 reviewStatus=changes_requested | P0 |
| 成本节省 | 项目看板/运营数据 | internalCost vs estimatedCost 混用 | 是 | 统一 Project.cost 结构与公式 | P0 |
| 资产复用次数 | 资产库/运营数据 | 资产库为派生+模拟 | 是 | 统一 AssetUsage 关系表 | P1 |

---

# 七、数据来源不清晰清单

| 页面 | 模块 / 字段 | 当前问题 | 建议数据来源 | 建议计算方式 | 优先级 |
|---|---|---|---|---|---|
| 运营数据 | 全部图表/KPI | 纯静态 reportData，不读 store | Project + Deliverable + Asset + Member | 统一 selectors 统计 | P0 |
| 成员作品集 | Brief 数/交付物数/Leadtime | 取模演示值 | Project + Request + Deliverable | 真实字段/计算字段 | P1 |
| 项目看板 | internalDueDate/customerDeadline/deliverables | makeMock 生成，与 Request 不一致 | Project + Request + Deliverable | 从分发写入/继承/关系表 | P0 |
| 我的任务 | 交付物清单/进度 | 取模生成 | Deliverable | 从 Request/Project 固化 | P0 |
| 审核中心 | deliverableItems 数量 | 部分取 specialNotes，部分取模 | Deliverable | 交付物必须持久化 | P0 |
| 工作台 | 团队产能算法 | 粗派生/演示 | Member + Deliverable | 工时/权重/产能上限 | P1 |
| 资产库 | 编辑资产保存 | 直接 mutate 局部对象，不写 store | Asset | 写 store action 或对接后端 | P1 |
| 通知列表 | linkTo 跳转 | 不消费 linkTo，仅标记已读 | RouteMap + Navigation service | 点击即跳转并定位 | P0 |

---

# 八、跳转关系清单

| 来源页面 | 点击入口 | 目标页面 | 建议路由 | 建议携带参数 | 说明 | 优先级 |
|---|---|---|---|---|---|---|
| 工作台 | 执行中项目卡 | 项目看板 | `/projects` | `status=executing` | 筛选执行中项目 | P0 |
| 工作台 | 待分发需求 | 需求分发中心 | `/requests` | `status=pending_dispatch` | 筛选待分发需求 | P0 |
| 工作台 | 待审核交付物 | 审核中心 | `/reviews` | `status=pending` | 筛选待审核 | P0 |
| 工作台 | 重点项目卡整卡 | 项目详情 | `/projects/:projectId` | `projectId` | 打开项目详情 | P0 |
| 工作台 | 重点项目卡-去审核 | 审核中心 | `/reviews` | `projectId` | 定位到该项目 | P0 |
| 需求分发中心 | 分配完成 | 项目详情 | `/projects/:projectId` | `projectId` | 生成项目后直达详情 | P0 |
| 需求分发中心 | 已生成项目-查看项目 | 项目详情 | `/projects/:projectId` | `projectId` | 由 requestId→projectId 映射 | P0 |
| 项目看板 | 审核 | 审核中心 | `/reviews` | `projectId` | 定位项目待审交付物 | P0 |
| 项目看板 | 查看资产 | 资产库详情 | `/assets/:assetId` | `assetId` | 查看项目沉淀资产 | P1 |
| 我的任务 | 查看反馈 | 审核中心/我的任务反馈 | `/reviews` | `projectId` | PM 确认入口归属 | P1 |
| 审核中心 | 查看 Brief | 需求详情 | `/requests/:requestId` | `requestId` | 补齐上下文跳转 | P1 |
| 团队管理 | 去审核 | 审核中心 | `/reviews` | `memberId` | 按成员过滤 | P1 |
| 运营数据 | 查看项目明细 | 项目看板 | `/projects` | `timeRange/filter` | 下钻明细 | P2 |
| 成员作品集 | 查看项目 | 项目详情 | `/projects/:projectId` | `projectId` | 作品集与项目关联 | P2 |
| 侧边栏 | 运营看板（父级） | 默认子页 | `/ops/analytics` | - | defaultChildId | P1 |
| 顶栏通知 | 通知项 | 目标页面 | routeMap | `entityId` | 统一 linkTo 与 deep link | P0 |

---

# 九、统一数据实体草案

> 说明：本节为“下一轮建模草案”，用于统一字段名、来源与页面使用。示例类型为建议形态，后续可根据后端模型调整。

---

## Entity：Request 需求

| 字段 key | 中文名 | 类型 | 示例 | 使用页面 | 说明 |
|---|---|---|---|---|---|
| id | 需求 ID | string | `req_1026` | 需求分发/项目看板/审核中心/工作台 | 主键 |
| title | 需求标题 | string | `Q3 产品发布宣传片` | 多页 | |
| description | 需求描述 | string | `为发布会制作...` | 多页 | |
| requesterName | 需求人 | string | `张明` | 需求分发/项目看板/我的任务 | |
| requesterEmail | 需求人邮箱 | string | `xx@...` | 需求分发 | |
| requesterDept | 需求人部门 | string | `市场部` | 多页 | |
| brandTeamName | 品牌/团队 | string | `Martell` | 多页 | 建议统一字典 |
| priority | 优先级 | enum | `high` | 需求分发/项目看板 | 统一枚举 |
| stakeholderDueAt | Stakeholder 截止 | date | `2026-05-15T09:00:00Z` | 工作台/项目看板 | |
| status | 需求状态 | enum | `pending_dispatch` | 需求分发/工作台 | |
| deliverables | 交付物规格 | object[] | `[{type:"视频",qty:3,...}]` | 需求分发/审核/我的任务/项目看板 | 生成 Deliverable 的来源 |
| dispatchInfo | 分发信息 | object | `{internalDueAt,...}` | 需求分发/项目看板 | 分发时写入 |
| createdAt | 创建时间 | date | - | 多页 | |

---

## Entity：Project 项目

| 字段 key | 中文名 | 类型 | 示例 | 使用页面 | 说明 |
|---|---|---|---|---|---|
| id | 项目 ID | string | `prj_1030` | 多页 | |
| code | 项目编号 | string | `VID-030` | 多页 | 统一替代 taskNumber/projectCode |
| name | 项目名称 | string | `行业大会主题演讲剪辑` | 多页 | |
| requestId | 来源需求 ID | relation | `req_1026` | 项目看板/审核中心 | Request→Project 关系 |
| brandTeamName | 品牌/团队 | string | `Corporate` | 多页 | |
| ownerMemberId | 主负责人 | relation | `u1` | 多页 | |
| collaboratorIds | 协作成员 | relation | `["u3","u6"]` | 工作台/项目看板 | |
| projectStatus | 项目状态 | enum | `executing` | 多页 | 执行中/待验收/已完成/已取消 |
| currentNode | 当前节点 | enum | `internal_review` | 多页 | 内部制作/内部审核/退回修改/需求方验收 |
| internalDueAt | 内部交付截止 | date | - | 多页 | |
| stakeholderDueAt | 验收截止 | date | - | 多页 | 可从 Request 继承，也可固化到 Project |
| cost.estimatedInternalCost | 内部预估成本 | number | 12000 | 项目看板/运营数据 | |
| cost.marketReferenceCost | 市场参考成本 | number | 35000 | 项目看板/运营数据 | |
| cost.saving | 成本节省 | number | 23000 | 运营数据 | 计算字段 |
| faFileUrl | 最终 FA 链接 | string | `https://.../fa.mp4` | 项目看板/资产库/作品集 | |
| faCandidateFileUrl | FA 候选链接 | string | `https://.../candidate.mp4` | 审核中心/项目看板 | 候选归属需 PM 确认 |
| completedAt | 完成时间 | date | - | 多页 | |
| createdAt | 创建时间 | date | - | 多页 | |

---

## Entity：Deliverable 交付物

| 字段 key | 中文名 | 类型 | 示例 | 使用页面 | 说明 |
|---|---|---|---|---|---|
| id | 交付物 ID | string | `del_1` | 多页 | |
| projectId | 所属项目 | relation | `prj_1030` | 多页 | |
| type | 类型 | enum | `video` | 多页 | 视频/平面/文案/POSM… |
| name | 名称 | string | `开场动画 15s` | 审核中心/资产库 | |
| quantity | 数量 | number | 3 | 多页 | |
| formats | 输出格式 | string[] | `["mp4","mov"]` | 资产库/审核中心 | |
| status | 交付物状态 | enum | `ready_for_review` | 我的任务/审核中心 | 建议从 submission/review 派生或固化 |
| latestSubmissionId | 最新提交 | relation | `sub_12` | 审核/我的任务 | |
| updatedAt | 更新时间 | date | - | | |

---

## Entity：Submission 提交记录

| 字段 key | 中文名 | 类型 | 示例 | 使用页面 | 说明 |
|---|---|---|---|---|---|
| id | 提交 ID | string | `sub_12` | 审核/我的任务 | |
| deliverableId | 交付物 ID | relation | `del_1` | 审核/我的任务 | 当前系统缺失，需补齐 |
| projectId | 项目 ID | relation | `prj_1030` | 审核/我的任务 | 便于检索 |
| submitterId | 提交人 | relation | `u1` | 多页 | |
| version | 版本号 | string | `v2` | 多页 | |
| submittedAt | 提交时间 | date | - | 多页 | |
| fileName | 文件名 | string | `final.mp4` | 多页 | |
| fileUrl | 文件/链接 | string | `https://...` | 多页 | |
| note | 说明 | string | - | 多页 | |

---

## Entity：ReviewRecord 审核记录

| 字段 key | 中文名 | 类型 | 示例 | 使用页面 | 说明 |
|---|---|---|---|---|---|
| id | 审核记录 ID | string | `rev_9` | 多页 | |
| submissionId | 提交 ID | relation | `sub_12` | 多页 | |
| reviewerId | 审核人 | relation | `u2` | 多页 | |
| status | 审核结果 | enum | `approved` | 审核/我的任务/团队 | 统一枚举 |
| comment | 审核意见 | string | `请缩短开场...` | 审核/我的任务 | |
| location | 点位 | string | `0:08` | 审核中心 | 可选 |
| createdAt | 审核时间 | date | - | 多页 | |

---

## Entity：Member 成员

| 字段 key | 中文名 | 类型 | 示例 | 使用页面 | 说明 |
|---|---|---|---|---|---|
| id | 成员 ID | string | `u1` | 多页 | |
| name | 姓名 | string | `张磊` | 多页 | |
| email | 邮箱 | string | `xx@...` | 团队管理 | |
| role | 角色 | enum | `leader/member` | 多页 | 权限 |
| title | 职位 | string | `主剪辑师` | 团队管理 | |
| skills | 能力标签 | string[] | `["剪辑","动效"]` | 团队管理/工作台 | |
| capacity | 产能配置 | object | `{weeklyHours:40}` | 团队管理/工作台/运营数据 | 产能算法依据 |

---

## Entity：Asset 资产

| 字段 key | 中文名 | 类型 | 示例 | 使用页面 | 说明 |
|---|---|---|---|---|---|
| id | 资产 ID | string | `ast_prj1030_mp4` | 资产库/运营数据 | |
| assetName | 资产名称 | string | `开场动画 15s MP4` | 资产库 | 可编辑 |
| generatedName | 自动生成名称 | string | - | 资产库 | |
| fileName | 文件名 | string | `launch_opening_final.mp4` | 资产库 | |
| fileFormat | 文件格式 | string | `MP4` | 资产库 | |
| fileSize | 文件大小 | string | `128MB` | 资产库 | 可选 |
| assetFileUrl | 资产链接 | string | `https://...` | 资产库 | |
| sourceProjectId | 来源项目 | relation | `prj_1030` | 资产库/项目看板 | |
| sourceDeliverableId | 来源交付物 | relation | `del_1` | 资产库 | 当前系统缺失 |
| sourcePublishLinks | 来源发布链接 | string[] | `["https://..."]` | 资产库/项目看板 | 多链接 |
| brandTeamName | 品牌/团队 | string | - | 资产库/运营数据 | |
| workType | 工作类型 | enum | `video` | 资产库 | |
| assetType | 资产类型 | enum | `social_short_video` | 资产库/运营数据 | |
| channel | 渠道 | enum | `douyin` | 资产库 | |
| tags | 标签 | string[] | `["Martell","社媒"]` | 资产库 | |
| usageNote | 使用说明 | string | - | 资产库 | |
| completedAt | 完成时间 | date | - | 资产库/作品集 | |

---

## Entity：AssetUsage 资产复用

| 字段 key | 中文名 | 类型 | 示例 | 使用页面 | 说明 |
|---|---|---|---|---|---|
| id | 复用记录 ID | string | `au_1` | 资产库/运营数据 | |
| assetId | 资产 ID | relation | `ast_...` | 资产库/运营数据 | |
| projectId | 复用项目 | relation | `prj_2001` | 资产库/运营数据 | |
| usedAt | 复用时间 | date | - | 资产库 | |
| usage | 复用用途 | string | `复用视觉基调` | 资产库 | |
| publishUrl | 复用发布链接 | string | `https://...` | 资产库 | |

---

## Entity：Portfolio 成员作品集

| 字段 key | 中文名 | 类型 | 示例 | 使用页面 | 说明 |
|---|---|---|---|---|---|
| id | 作品集 ID | string | `pf_u1_2026Q2` | 作品集/运营数据 | |
| memberId | 成员 | relation | `u1` | 作品集 | |
| quarter | 季度 | string | `2026Q2` | 作品集 | |
| projectIds | 项目集合 | relation | `["prj_1","prj_2"]` | 作品集 | |
| exportedAt | 导出时间 | date | - | 作品集 | |
| exportUrl | 导出链接 | string | - | 作品集 | 可选 |

---

## Entity：Activity 系统动态

| 字段 key | 中文名 | 类型 | 示例 | 使用页面 | 说明 |
|---|---|---|---|---|---|
| id | 动态 ID | string | `evt_1` | 工作台/项目看板 | |
| level | 等级 | enum | `info/warn/error` | 多页 | |
| actorId | 操作人 | relation | `u2` | 多页 | |
| entityType | 实体类型 | enum | `project/request/review/...` | 多页 | |
| entityId | 实体 ID | string | `prj_1030` | 多页 | |
| action | 动作 | enum | `PROJECT_CREATED` | 多页 | 建议统一枚举 |
| message | 文案 | string | - | 多页 | |
| meta | 元信息 | object | - | 多页 | |
| createdAt | 时间 | date | - | 多页 | |

---

# 十、PM 待确认问题

| 编号 | 问题 | 涉及页面 | Trea 建议 | 需要 PM 确认的点 | 优先级 |
|---:|---|---|---|---|---|
| 1 | 成本节省公式与口径 | 项目看板/运营数据/工作台 | saving = marketReferenceCost - estimatedInternalCost | 是否允许负值？是否取绝对值？成本取“预估”还是“实际”？ | P0 |
| 2 | 团队产能百分比算法 | 工作台/团队管理/运营数据 | 以 Deliverable 工作量 / 成员产能上限 | 产能上限如何配置？不同能力权重如何定义？ | P0 |
| 3 | 资产名称自动生成规则 | 资产库 | generatedName = deliverableName + format + version/用途 | version/用途从哪里来？缺字段如何兜底？ | P0 |
| 4 | 项目完成后资产生成规则 | 项目看板/资产库/运营数据 | 每个“最终文件格式”生成独立 Asset | “最终文件”如何定义？与 Deliverable 的关系？ | P0 |
| 5 | 成员作品集取数规则 | 作品集/运营数据 | completed 项目按季度过滤 + 用户勾选生成 Portfolio | 季度归属按 completedAt 还是验收通过时间？ | P1 |
| 6 | DAM Usage 统计口径 | 运营数据/资产库 | 基于 AssetUsage 关系统计 | 复用定义：引用/下载/发布？复用次数如何计？ | P0 |
| 7 | projectStatus 与 currentNode 边界 | 多页 | 主状态 4 个 + 节点 4 个 | INTERNAL_REVIEW/WIP 等是否仅作为节点？是否保留额外状态？ | P0 |
| 8 | “来源发布链接/复用发布链接”展示位置 | 资产库/项目详情 | 优先在资产详情展示 | 项目详情是否也要展示？是否支持多链接？ | P1 |
| 9 | 审核粒度：项目 vs 交付物 | 审核中心/我的任务 | 审核记录必须关联 deliverableId | 一个 submission 是否对应多个交付物？如何拆分？ | P0 |
| 10 | FA 候选归属 | 审核中心/项目看板/资产库 | 候选应是 Deliverable/Asset 标记 | 候选是“一个项目一个”还是“多候选”？最终 FA 如何选择？ | P1 |
| 11 | 需求状态枚举 | 需求分发中心 | pending_dispatch/under_review/dispatched/rejected | UNDER_REVIEW 是否保留？何时进入？ | P1 |
| 12 | 通知跳转策略 | 全局 | 通知必须携带 entityId 并 deep link | 通知点击后应到项目详情还是对应列表定位？ | P1 |

---

# 十一、当前系统最严重的 10 个问题

| 排名 | 问题 | 涉及页面 | 影响 | 建议处理方式 | 优先级 |
|---:|---|---|---|---|---|
| 1 | projectStatus/currentNode 未分层，Task.status 承担过多语义 | 多页 | 状态口径漂移、筛选/统计不可控 | 引入 Project.projectStatus + Project.currentNode + 映射表 | P0 |
| 2 | 交付物口径分裂（JSON/取模/派生）且未持久化 | 多页 | 审核/任务/统计无法对齐 | 建立 Deliverable 实体，从 Request 继承并固化 | P0 |
| 3 | specialNotes 同时作为文本与 JSON 容器 | 需求分发中心/项目看板/我的任务 | 展示出现 JSON 串、解析失败 | 拆分 requestNote 与 metaJson（或独立字段） | P0 |
| 4 | 成本字段命名与口径混用 | 需求分发/项目看板/运营数据 | 节省统计不可信 | 统一 Project.cost 结构与公式 | P0 |
| 5 | 通知列表页不消费 linkTo，导致通知不可跳转 | 通知 | 主流程断裂 | 统一 routeMap + 通知点击跳转 deep link | P0 |
| 6 | Analytics（运营数据）为静态数据，无法真实反映系统 | 运营数据 | 运营看板失真 | 改为从 Project/Asset/Member 统计 | P0 |
| 7 | “查看项目/去审核”等跳转缺少定位参数 | 多页 | 工作流效率低 | 统一 `projectId/requestId/assetId` deep link 参数 | P1 |
| 8 | FA 候选字段归属不清晰（project vs deliverable vs asset） | 审核中心/项目/资产 | 后续流程难落地 | PM 确认后落在 Deliverable/Asset 并建立选择逻辑 | P1 |
| 9 | Member/Team 数据可编辑但不入 store（本地 state） | 团队管理 | 数据源不可控 | 统一 Member 实体与 store actions | P2 |
| 10 | 资产库编辑仅 mutate 前端派生对象，不持久化 | 资产库 | 数据不可复用/统计失真 | 写 store action 或对接后端 | P2 |

---

# 十二、建议优先统一的 10 个核心字段

| 排名 | 字段中文名 | 建议英文 key | 所属实体 | 使用页面 | 优先统一原因 |
|---:|---|---|---|---|---|
| 1 | 项目状态 | projectStatus | Project | 多页 | 状态筛选/统计/联动核心 |
| 2 | 当前节点 | currentNode | Project | 多页 | 代替 WIP/INTERNAL_REVIEW 等混用 |
| 3 | 项目编号 | projectCode | Project | 多页 | 搜索/定位/资产关联 |
| 4 | 来源需求 ID | requestId | Project | 多页 | Request→Project 追溯与跳转 |
| 5 | 内部交付截止 | internalDueAt | Project | 多页 | 风险/临期/排期 |
| 6 | 需求方截止 | stakeholderDueAt | Request/Project | 多页 | 验收/风险 |
| 7 | 内部预估成本 | estimatedInternalCost | Project | 项目看板/运营数据 | 成本节省口径 |
| 8 | 市场参考成本 | marketReferenceCost | Project | 项目看板/运营数据 | 成本节省口径 |
| 9 | 交付物清单 | deliverables[] | Request/Deliverable | 多页 | 审核/任务/资产生成基础 |
| 10 | 资产文件链接 | assetFileUrl | Asset | 资产库/运营数据 | DAM 与复用统计基础 |

---

# 十三、下一轮建议创建的文件清单

| 文件路径 | 作用 | 主要内容 |
|---|---|---|
| src/data/enums.ts | 统一状态枚举 | projectStatus、currentNode、requestStatus、reviewStatus、deliverableStatus、riskLevel、priority、workType、assetType、channel |
| src/data/schema.ts | 统一数据实体类型 | Request、Project、Deliverable、Submission、ReviewRecord、Member、Asset、AssetUsage、Portfolio、Activity |
| src/data/fieldDictionary.ts | 统一字段字典 | 字段 key、中文名、来源页面、使用页面、计算方式、owner（实体归属） |
| src/routes/routeMap.ts | 统一页面跳转 | route、参数名、详情页参数、从通知/搜索的 deep link 规则 |
| src/data/mockData.ts | 统一 mock 数据 | 使用统一 schema 生成全系统 mock（替代取模/散落 mock） |
| src/store/useCreativeOpsStore.ts | 统一数据源 | selectors、actions、跨页面联动（submit→review→signoff→complete、asset generation、portfolio generation） |

---

# 十四、报告输出要求（达成说明）

| 要求 | 是否达成 | 说明 |
|---|---|---|
| 覆盖全部已完成页面 | 是 | 9 个页面均已按“模块/字段/状态/跳转”输出。 |
| 全部用表格输出 | 是 | 所有小节均为 Markdown 表格。 |
| 提供统一建议与优先级 | 是 | 字段/状态/数据源/跳转均给出建议与 P0/P1/P2。 |
| 不改代码，仅审计报告 | 是 | 本文件为审计报告输出，下一轮再进入建模与改造。 |

