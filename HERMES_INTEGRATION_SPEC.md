# Hermes 调度中枢集成规范与接入手册 (V1.0)

> **交付对象：** 本地 Hermes 调度中枢 / 研发执行代理  
> **基线需求：** 《AI 家庭学习系统 PRD V1.0》  
> **前端工程：** 已构建就绪（React 19 + Tailwind CSS + A4 打印与分层批改中心）

---

## 1. 核心架构与各端边界

| 模块 | 技术载体 | 职责范围 | 绝对禁忌 |
|---|---|---|---|
| **孩子端前端** | 本工程 (React 19 + Vite) | 任务展示、A4 练习纸生成/打印、批改与核对明细、知识星图、勋章成就 | 不存储业务事实、不持有密钥 |
| **学习事实权威源** | 飞书多维表格 (Bitable) | 孩子档案、任务状态、材料元数据、作答附件、识别/批改记录、掌握度 | 不存通用教材大纲与教学策略 |
| **通用教育知识库** | Obsidian Vault | 概念卡片、先修依赖、错误认知归因模式 (ERR-Pattern)、教学策略 | 绝不维护任何孩子的个人答题记录 |
| **调度与决策中枢** | 本地 Hermes Agent | 读写飞书、检索 Obsidian、调度 OCR/LLM 批改、执行确定性答案校验 | 不做不可追溯的暗箱修改 |
| **家长作答上传** | 飞书多维表格表单视角 | 手机端直接扫表单拍照上传作答纸 | 无需单独开发复杂 App |

---

## 2. 飞书多维表格（Bitable）表结构建表指南

在飞书多维表格中创建以下 7 张核心表：

### 表 1: `tb_child_profile`（孩子档案表）
- `child_id` (文本, 主键): 如 `CHILD_001`
- `name` (文本): 孩子姓名/昵称，如 `嘟嘟`
- `grade` (单选): `一年级`
- `curriculum` (单选): `人教版` / `北师大版` / `苏教版`
- `points_balance` (数字): 当前可用成长积分余额（支持线下物理奖励手工扣减）
- `streak_days` (数字): 连续打卡天数
- `created_at` (创建时间)

### 表 2: `tb_knowledge_point`（知识点索引表）
- `knowledge_point_id` (文本, 主键): 如 `MATH-G1-ADD-CARRY-001`
- `subject` (单选): `数学` / `英语` / `语文`
- `title` (文本): 如 `20以内进位加法（凑十法）`
- `obsidian_ref` (文本): 对应 Obsidian 笔记相对路径，如 `02_Concepts/Math/MATH-G1-ADD-CARRY-001.md`
- `parent_kp_id` (单选/关联): 上级知识点编码

### 表 3: `tb_mastery_state`（知识点掌握状态表）
- `state_id` (文本, 主键): 如 `CHILD_001_MATH-G1-ADD-CARRY-001`
- `child_id` (文本 / 关联 `tb_child_profile`)
- `knowledge_point_id` (文本 / 关联 `tb_knowledge_point`)
- `status` (单选): `未评估` / `待学习` / `学习中` / `待巩固` / `初步掌握` / `稳定掌握`
- `evidence_count` (数字): 支撑练习次数
- `last_evaluated_at` (日期时间): 最近评估更新时间
- `evaluation_reason` (长文本): 综合评价理由（由 Hermes 结合多次证据生成）

### 表 4: `tb_learning_task`（学习任务表）
- `task_id` (文本, 主键): 如 `TASK-20261109-001`
- `child_id` (文本 / 关联 `tb_child_profile`)
- `title` (文本): 任务名称
- `knowledge_point_id` (文本 / 关联 `tb_knowledge_point`)
- `task_type` (单选): `纸笔练习` / `在线互动` / `语音对话`
- `status` (单选): `待打印` / `进行中` / `已上传待批改` / `待家长核对` / `已完成` / `已归档`
- `assigned_date` (日期): 如 `2026-11-09`
- `recommend_reason` (长文本): Hermes 规划推荐理由

### 表 5: `tb_learning_material`（练习材料表）
- `worksheet_id` (文本, 主键): 如 `WS-M1-20261109-8F2A`
- `task_id` (文本 / 关联 `tb_learning_task`)
- `version` (数字): 默认 `1`
- `total_pages` (数字): 默认 `1`
- `pdf_file` (附件/URL): 生成的 PDF 练习纸下载地址
- `question_meta_json` (长文本): 包含题目序号、加数、标准答案、凑十拆数拆解的 JSON
- `answer_key_pdf` (附件/URL): 家长独立答案版下载地址

### 表 6: `tb_submission`（作答提交表 - 对应飞书表单视角）
- `submission_id` (文本, 主键): 如 `SUB-20261109-001`
- `worksheet_id` (文本): 扫描或手动关联的练习编号
- `task_id` (文本 / 关联 `tb_learning_task`)
- `photo_attachments` (附件): **家长拍照上传的照片（表单核心收集项）**
- `status` (单选): `处理中` / `待人工核对` / `已完成批改`
- `submitted_at` (创建时间)

### 表 7: `tb_learning_event`（学习事件与批改明细表）
- `event_id` (文本, 主键): 如 `EVT-20261109-Q1`
- `submission_id` (文本 / 关联 `tb_submission`)
- `question_id` (文本): 如 `Q1`
- `model_recognized_text` (文本): OCR 识别原文（如 `"13"`）
- `recognition_confidence` (数字): 置信度（0.0 ~ 1.0）
- `is_correct_computed` (复选框): 确定性程序化比对结果
- `needs_human_confirmation` (复选框): 置信度 < 0.85 或识别异常时为 True
- `human_corrected_text` (文本): 家长人工修正值
- `final_judgment` (单选): `正确` / `错误`
- `obsidian_error_pattern_ref` (文本): 匹配到的 Obsidian 错误模式（如 `ERR-MATH-CARRY-MISSED`）

---

## 3. 飞书表单视角（Form View）配置说明

1. 打开飞书多维表格中的 **`tb_submission`（作答提交表）**；
2. 点击视图切换 ➔ 新建 **“表单视角”**（Form View）；
3. 将表单名称设为：**“AI 家庭学习系统 · 纸笔作答拍照上传”**；
4. 表单公开字段只暴露：
   - **`photo_attachments`（作答纸照片）**：设置为必填项，允许手机现场拍摄或从相册选择；
   - **可选字段 `worksheet_id`**：若二维码被污损，可作为人工选填后备；
5. 家长日常使用手机扫描二维码或保存该飞书表单为手机桌面快捷方式，拍完即走，极简轻便。

---

## 4. Obsidian 知识库标准与规范

Obsidian 根目录推荐规范（只读通用知识）：

```text
Child-Learning-Vault/
├── 00_System/
│   └── metadata_schema.md
├── 01_Subjects/
│   └── Math/grade_1_curriculum.md
├── 02_Concepts/
│   └── Math/
│       ├── MATH-G1-ADD-001.md
│       └── MATH-G1-ADD-CARRY-001.md
├── 03_Error-Patterns/
│   └── Math/
│       ├── ERR-MATH-CARRY-MISSED.md      # 进位遗漏
│       └── ERR-MATH-MAKE10-CONFUSE.md    # 凑十点数误差
└── 04_Teaching-Strategies/
    └── Math/
        └── STRAT-MATH-MAKE10-BLOCKS.md   # 十格阵具象操作
```

### 概念卡片 YAML 元数据模板示例 (`02_Concepts/Math/MATH-G1-ADD-CARRY-001.md`)

```yaml
---
note_id: "MATH-G1-ADD-CARRY-001"
type: "concept"
subject: "Math"
grade: "G1"
title: "20以内进位加法（凑十法）"
prerequisites:
  - "MATH-G1-NUM-001"
  - "MATH-G1-ADD-001"
error_patterns:
  - "ERR-MATH-CARRY-MISSED"
  - "ERR-MATH-MAKE10-CONFUSE"
teaching_strategies:
  - "STRAT-MATH-MAKE10-BLOCKS"
status: "published"
version: "1.0.0"
updated_at: "2026-11-09"
---

# 概念与算理要义
20以内进位加法的本质是十进制计数法的具象迁移。
口诀：看大数、拆小数、凑成十、加剩数。
```

---

## 5. 前端 API 交互契约 (Hermes 本地服务实现标准)

当在前端右上角切换至 **“本地 Hermes 联调模式”** 时，前端会请求 Hermes 暴露的本地服务（默认 `http://localhost:8000`）。Hermes 需实现以下极简 REST 端点：

### 1. `GET /api/child/profile`
返回孩子基础档案与积分：
```json
{
  "childId": "CHILD_001",
  "name": "嘟嘟",
  "avatar": "🚀",
  "grade": "一年级",
  "curriculum": "人教版",
  "pointsBalance": 125,
  "streakDays": 6
}
```

### 2. `GET /api/tasks/today`
返回今日纸笔任务与题目数据（含 Worksheet ID）：
```json
{
  "taskId": "TASK-20261109-001",
  "childId": "CHILD_001",
  "title": "今日数学小达人：20以内进位加法（凑十法）",
  "knowledgePointId": "MATH-G1-ADD-CARRY-001",
  "status": "pending_print",
  "material": {
    "worksheetId": "WS-M1-20261109-8F2A",
    "totalPages": 1,
    "qrCodeUrl": "aikids://ws/WS-M1-20261109-8F2A?p=1",
    "questions": [
      {
        "questionId": "Q1",
        "index": 1,
        "numA": 9,
        "numB": 4,
        "standardAnswer": 13,
        "thinkingHint": "把 4 分成 1 和 3，9 加 1 得 10，10 加 3 得 13。"
      }
    ]
  }
}
```

### 3. `POST /api/submissions/review`
家长在前端核实低置信度题目后回传更新：
```json
// Request Body:
{
  "taskId": "TASK-20261109-001",
  "questionId": "Q2",
  "correctedAnswer": "13",
  "confirmedCorrect": true
}
```

---

## 6. Hermes 视觉分层批改执行逻辑（核心保护原则）

Hermes 在收到飞书表单上传的照片时，必须执行严格的**分层批改流水线**：

1. **识别层（Vision OCR）**：
   - 提取各题方框内的手写文字字符，输出 `recognized_text`；
   - 必须同时给出置信度数值 `confidence`（0.0 ~ 1.0）；
2. **批改层（Deterministic Programmatic Check）**：
   - 对数学客观算式，**严禁由大模型直接猜判对错**；
   - 使用程序比对：`int(recognized_text) == standardAnswer`；
3. **门禁层（Human-in-the-loop Gate）**：
   - 若 `confidence < 0.85` 或内容无法解析为数字，标记 `needs_human_confirmation = true`，状态设为 `待家长核对`；
4. **归因层（Obsidian Diagnostic Attribution）**：
   - 仅当明确判定答错时，读取对应知识点的 `error_patterns` 进行归因假设（如 `ERR-MATH-CARRY-MISSED`）；
   - 更新飞书掌握状态时，必须积累连续 3 次以上的稳定练习证据，方可将掌握度调整为 `稳定掌握`。
