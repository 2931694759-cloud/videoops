# 表单模板恢复事件记录

## 事件概述

- 事件对象：`src/components/pages/QuestionnaireForm.tsx`
- 关联入口：
  - `src/components/pages/Questionnaires.tsx`
  - `src/components/AppShell.tsx`
  - `src/app/questionnaire-form/page.tsx`
- 排查时间：2026-05-12
- 结论：文件本体未丢失，但仓库未纳入版本控制，且独立路由仍使用旧版表单实现，造成“新版模板疑似丢失”的表象。

## 版本控制排查结果

- 当前分支：`main`
- 备份分支：未发现
- Tag：未发现
- Git 历史：仅存在初始化提交 `Initial commit from Create Next App`
- 目标文件状态：
  - `src/components/pages/QuestionnaireForm.tsx` 未被 Git 跟踪
  - `src/components/pages/Questionnaires.tsx` 未被 Git 跟踪
  - `src/app/questionnaire-form/page.tsx` 未被 Git 跟踪

## 关键证据

- `git branch -a` 仅返回 `main`
- `git tag` 无输出
- `git log --all --name-status --find-renames -- "src/components/pages/QuestionnaireForm.tsx" "src/components/pages/Questionnaires.tsx" "src/app/questionnaire-form/page.tsx"` 无结果
- `git status --short` 显示 `src/components/`、`src/lib/`、`docs/`、`src/data/`、`src/routes/` 等目录整体未跟踪
- 工作区实际存在新版模板文件：`src/components/pages/QuestionnaireForm.tsx`
- 工作区还存在独立页面入口：`src/app/questionnaire-form/page.tsx`

## 根因分析

1. 新版表单模板存在于组件目录，但没有进入 Git，因此无法查询最后更新时间、提交人和精确变更记录。
2. 系统内同时存在两套表单实现：
   - 新版：`src/components/pages/QuestionnaireForm.tsx`
   - 旧版：`src/app/questionnaire-form/page.tsx`
3. `Questionnaires.tsx` 和 `AppShell.tsx` 已使用新版模板，但独立链接 `/questionnaire-form` 仍落到旧版实现。
4. 当团队通过独立链接验证模板时，会看到旧表单，从而误判“之前更新过的模板已经丢失或被回退”。

## 处理过程

1. 定位表单模板候选文件与入口链路。
2. 查询 Git 历史、分支、tag 和重命名记录，确认当前仓库无法提供可恢复版本。
3. 对比工作区文件后确认新版模板仍存在，未发生真实删除。
4. 将 `src/app/questionnaire-form/page.tsx` 调整为复用 `src/components/pages/QuestionnaireForm.tsx`，恢复独立路由到最新版模板。

## 本次恢复动作

- 恢复方式：入口统一，不依赖 Git 回滚
- 修改文件：`src/app/questionnaire-form/page.tsx`
- 修改内容：移除旧版独立表单实现，改为直接渲染 `QuestionnaireForm`

## 验证结果

- 应用内“查看表单模板”继续使用新版模板
- 应用内 `quest-form` 页面继续使用新版模板
- 独立路由 `/questionnaire-form` 已切换为同一份新版模板
- 当前未发现文件被移动或重命名到其他业务目录

## 预防措施

1. 所有新建业务目录必须在首次可运行后立即纳入 Git。
2. 对“组件实现”和“路由入口”采用单一来源策略，页面路由仅做薄封装，不再复制整份表单逻辑。
3. 重要页面上线前增加一次“入口一致性检查”，确认应用内入口和独立 URL 渲染的是同一组件。
4. 每次阶段性大改后创建备份分支或 tag，至少保留一个可回退快照。
5. 将 `git status --short` 纳入交付前检查，避免大量业务代码长期处于未跟踪状态。

## 建议的后续动作

1. 尽快提交当前工作区并补建 tag，例如 `backup/form-template-2026-05-12`。
2. 评估是否需要清理其他重复页面实现，避免再次出现入口分叉。
3. 在团队协作说明中增加“新增页面必须先接入版本控制”的约束。
