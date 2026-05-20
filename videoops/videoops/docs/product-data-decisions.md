# 保乐力加 Creative Ops 数据口径决策说明

## 1. 项目状态 projectStatus

项目状态统一为四种：

| 英文值 | 中文展示 |
|---|---|
| executing | 执行中 |
| signoff | 待验收 |
| completed | 已完成 |
| canceled | 已取消 |

说明：
- `projectStatus` 表达项目主状态；
- 审核、制作、修改、验收等过程信息放在 `currentNode`；
- 页面展示时使用中文值；
- 数据层使用英文枚举值。

---

## 2. 当前节点 currentNode

`currentNode` 统一为：

| 英文值 | 中文展示 | 说明 |
|---|---|---|
| internal_production | 内部制作 | 成员正在制作交付物 |
| internal_review | 内部审核 | 成员已提交，Manager 正在审核 |
| revision_required | 退回修改 | 审核退回，成员需要修改 |
| stakeholder_signoff | 需求方验收 | 内部已通过，等待需求方确认 |
| completed | 已完成 | 项目已完成后的节点 |
| canceled | 已取消 | 项目已取消后的节点 |

---

## 3. 需求状态 requestStatus

需求状态统一为：

| 英文值 | 中文展示 | 说明 |
|---|---|---|
| pending_dispatch | 待分发 | 需求已进入分发中心，等待分配成员、内部交付日、预估成本和 Manager 备注 |
| dispatched | 已生成项目 | Traffic Manager 已确认分发，并生成项目 |
| canceled | 已取消 | 需求取消 |

---

## 4. 交付物状态 deliverableStatus

交付物状态统一为：

| 英文值 | 中文展示 | 说明 |
|---|---|---|
| pending_submit | 待提交 | 成员尚未提交 |
| submitted | 已提交 | 成员已提交，等待进入审核 |
| in_review | 审核中 | Manager 正在审核 |
| changes_requested | 需修改 | 审核退回 |
| approved | 已通过 | 内部审核通过 |
| archived | 已归档 | 项目完成后沉淀为资产 |

---

## 5. 审核状态 reviewStatus

审核状态统一为：

| 英文值 | 中文展示 |
|---|---|
| pending | 待审核 |
| approved | 通过 |
| changes_requested | 退回 |

---

## 6. 成本节省口径

成本字段统一放在 `Project.cost` 下。

字段包括：

| 字段 | 中文名 |
|---|---|
| estimatedInternalCost | 内部预估成本 |
| actualInternalCost | 内部实际成本 |
| marketReferenceCost | 市场参考成本 |
| estimatedSaving | 预计节省 |
| actualSaving | 实际节省 |

计算规则：
```ts
estimatedSaving = marketReferenceCost - estimatedInternalCost
actualSaving = marketReferenceCost - actualInternalCost
```

展示规则：
- `actualInternalCost` 存在时，运营数据优先展示 `actualSaving`；
- `actualInternalCost` 不存在时，展示 `estimatedSaving`；
- 数值为正时展示为“节省”；
- 数值为负时展示为“超出市场参考成本”。

---

## 7. 团队产能口径

成员产能使用点数制。

`Member.capacity` 使用：
```ts
{
  weeklyCapacityPoints: number
}
```

`Deliverable` 使用：
```ts
{
  effortPoints: number
}
```

成员负载计算：
```ts
memberUtilizationPct = 当前执行中交付物 effortPoints 总和 / weeklyCapacityPoints * 100
```

能力维度负载按 `Deliverable.workType` 和 `Member.skills` 汇总。

默认 `effortPoints` 规则：

| 交付物类型 | 默认点数 |
| ----- | ---: |
| 文案 | 1 |
| 平面设计 | 2 |
| 动效 | 3 |
| 视频剪辑 | 4 |
| 视频制作 | 5 |

---

## 8. 资产生成规则

项目完成后，根据已通过的交付物生成资产。

规则：
1. 只从 `deliverableStatus = approved` 的交付物生成资产；
2. 一个交付物如果包含多个最终文件格式，则每个文件格式生成一个 Asset；
3. Asset 必须关联 `sourceProjectId` 和 `sourceDeliverableId`；
4. `Asset.assetFileUrl` 来自最终提交文件链接；
5. `Asset.sourcePublishLinks` 来自项目的来源发布链接；
6. AssetUsage 记录后续复用项目和复用发布链接。

资产名称自动生成规则：
```text
品牌/团队 + 项目编号 + 交付物名称 + 文件格式 + 完成日期
```

示例：
```text
Martell_PRJ-032_节日祝福视频主片_MP4_20260515
```

当某个字段缺失时，使用兜底规则：
```text
项目编号 + 交付物编号 + 文件格式 + 完成日期
```

---

## 9. FA 候选口径

FA 候选作为审核阶段的内部标记，归属到 Deliverable。

字段为：
```ts
isFaCandidate: boolean
faCandidateSubmissionId?: string
```

用途：
- Manager 在审核中心可标记某个交付物版本为 FA 候选；
- 项目完成后，资产生成仍以 approved 的最终交付文件为准；
- 页面按钮和资产库中使用“交付物”“资产”“发布链接”等中文业务表达。

---

## 10. DAM Usage 口径

DAM Usage 基于 AssetUsage 统计。

字段包括：

| 指标 | 计算方式 |
| --- | --- |
| 资产总数 | Asset 总数 |
| 已复用资产数 | 至少存在一条 AssetUsage 的 Asset 数 |
| 资产复用次数 | AssetUsage 总数 |
| 资产复用率 | 已复用资产数 / 资产总数 |
| 按部门复用 | AssetUsage.projectId 关联 Project.brandTeamName |
| 按工作类型复用 | Asset.workType |

---

## 11. 成员作品集取数规则

成员作品集从已完成项目中生成。

取数规则：
1. 项目 `projectStatus = completed`；
2. 项目 `completedAt` 落在所选季度；
3. 成员 `memberId` 出现在 `ownerMemberId` 或 `collaboratorIds` 中；
4. 项目下至少存在一个 `approved / archived` 交付物；
5. 已生成 Asset 的交付物优先用于作品集展示；
6. 用户可在成员作品集页面手动勾选要导出的项目。
