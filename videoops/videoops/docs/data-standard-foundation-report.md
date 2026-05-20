# 保乐力加 Creative Ops 第二轮实施说明：全局数据标准层建设

## 一、本轮新增文件清单

1. `docs/product-data-decisions.md`
2. `src/data/enums.ts`
3. `src/data/schema.ts`
4. `src/data/fieldDictionary.ts`
5. `src/routes/routeMap.ts`
6. `docs/data-standard-foundation-report.md` (本文档)

---

## 二、每个文件的作用

- **`docs/product-data-decisions.md`**: 作为产品口径的“宪法”，固化了状态定义、节点边界、成本计算规则、产能算法、资产与作品集生成规则等核心业务逻辑，解决了第一轮审计中发现的“口径模糊和冲突”问题。
- **`src/data/enums.ts`**: 将产品决策文档中的状态和标签转化为代码级别的强类型约束 (`as const`)。统一了全系统的状态词汇，杜绝了此前字符串硬编码导致的拼写错误和语义混淆。提供了方便 UI 展示的 Label 映射。
- **`src/data/schema.ts`**: 定义了全系统核心数据实体的 TypeScript 接口。这是连接后端数据库与前端状态管理的桥梁。它拆分了原本过度臃肿的 Task 和 specialNotes，明确了 Project、Deliverable、Submission 和 ReviewRecord 之间的多级关联关系。
- **`src/data/fieldDictionary.ts`**: 作为数据字典，记录了核心字段的中文含义、类型、来源页面和被消费页面。这在后续重构和跨页面联调时是极其重要的参考，能快速定位数据来源，防止“改了一处坏了三处”。
- **`src/routes/routeMap.ts`**: 封装了所有的路由路径和跳转参数的构建方法 (`buildXxxRoute`)。将原本散落在各个组件中的 `onNavigate('string?param=...')` 替换为强类型的函数调用，确保跳转逻辑的统一，尤其是解决带参深链的问题。
- **`docs/data-standard-foundation-report.md`**: 记录本轮工作的产出和价值，并指明下一阶段的实施方向。

---

## 三、已固化的核心产品口径

1. **项目状态与节点分离**: `projectStatus` 只负责生命周期大阶段 (executing, signoff, completed, canceled)，具体的流转细节 (如内部制作、内部审核、退回修改) 交由 `currentNode` 负责。
2. **成本管理标准化**: 统一到 `Project.cost` 结构中，明确区分预估与实际，并确立了“预计节省”与“实际节省”的计算公式与展示优先级。
3. **产能统计科学化**: 确立了以“点数 (points)”为核心的产能模型。用 `effortPoints` 衡量交付物工作量，用 `weeklyCapacityPoints` 衡量成员带宽，从而得出科学的负载率。
4. **资产与作品集自动化**: 明确了“只有 approved 的交付物格式”才能沉淀为资产，以及成员作品集只从 completed 项目中提取的规则，打通了“交付 -> 资产 -> 作品集”的数据流。
5. **JSON 数据拆解**: 明确 `specialNotes` 不再作为大杂烩，业务字段如品牌、分配信息、交付物清单被正式拆解到实体对应的字段中。

---

## 四、与上一轮审计报告中 P0 问题的对应关系

| 第一轮审计 P0 问题 | 本轮解决方式 | 涉及文件 |
| :--- | :--- | :--- |
| `projectStatus` 承担过多语义，与 `currentNode` 混用 | 明确拆分 `projectStatus` 和 `currentNode` 枚举，并在 Schema 中定义为两个独立字段。 | `enums.ts`, `schema.ts`, `product-data-decisions.md` |
| `specialNotes` 同时作为文本和 JSON 容器 | 在 Schema 中将 `brand`, `dispatchInfo`, `deliverables` 提取为独立实体/字段，`requestNote` 纯作文本备注。 | `schema.ts` |
| 交付物口径多源头 (取模、派生、JSON) | 建立独立的 `Deliverable` 实体，作为贯穿需求、项目、审核和资产的核心纽带。 | `schema.ts`, `product-data-decisions.md` |
| 成本字段命名和口径混用 | 统一为 `ProjectCost` 实体，明确定义预估/实际成本与节省额的计算规则。 | `schema.ts`, `product-data-decisions.md` |
| 跳转缺少 `projectId` 等定位参数 | 建立 `routeMap.ts` 提供强类型的路由构建器，强制要求传入必要的 ID 参数进行深链定位。 | `routeMap.ts` |

---

## 五、下一轮建议工作

本轮已完成了“蓝图设计”，下一轮需要进行“地基浇筑”和“上层建筑替换”。

1. **基于 `schema.ts` 重建 `src/data/mockData.ts`**:
   - 废弃旧的混杂数据，严格按照新定义的实体结构生成连贯的 Mock 数据。
   - 确保从 Request -> Project -> Deliverable -> Submission -> ReviewRecord -> Asset 的关联关系在 Mock 数据中完整闭环。
2. **建立统一 Zustand store**:
   - 设计全局 State 树，存放归一化的实体数据 (如按 ID 索引的 record map)。
3. **实现 Selectors**:
   - 编写基于新状态树的派生数据选择器，如 `useActiveProjects`, `usePendingReviews`, `useMemberUtilization` 等。
4. **实现 Actions**:
   - 编写状态流转动作，如 `dispatchRequest`, `submitDeliverable`, `approveReview` 等，确保单一动作能正确更新关联实体的状态。
5. **逐页替换硬编码和派生数据**:
   - 将现有 9 个页面的数据源和跳转方法全面切换为新的 Store Selector、Action 和 `routeMap` 构建器。
