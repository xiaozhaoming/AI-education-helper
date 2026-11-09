# 📬 致 Hermes 协调中枢的执行委托信 (Handoff Letter to Hermes)

**委托人：** 家长 / 系统构建工程师  
**日期：** 2026-11-09  
**产品基线：** 《AI 家庭学习系统 PRD V1.0》  
**执行目标：** 完成飞书多维表格（Bitable）、本地 Obsidian Vault 与前端 Web 学习中心的具体连接，跑通小学一年级数学纸笔学习闭环。

---

## 一、本地资产与完整地址索引

请你在本地环境中优先读取和对接以下绝对/相对路径资产：

| 资产名称 | 本地路径 / 访问地址 | 说明 |
|---|---|---|
| **前端项目根目录** | 本项目代码仓根目录 (`/` 或你的本地 clone 路径) | 包含完整 React 19 + TypeScript 源码 |
| **前端本地运行地址** | `http://localhost:3000` | 孩子端 Web 学习中心界面（可通过 `npm run dev` 启动） |
| **线上预览地址** | `https://ais-dev-3gt3dwiofk7md4sjkjc2ez-670918904858.asia-southeast1.run.app` | 云端已部署就绪的开发预览地址 |
| **Hermes 接入技术规范** | `./HERMES_INTEGRATION_SPEC.md` | **必读**：包含飞书 7 张表字段定义、API 契约、Obsidian 模板 |
| **产品需求基线 (PRD)** | `./public/assets/aistudio/AI_E5_AE_B6_E5_BA_AD_E5_AD_A6_E4_B9_A0_E7_B3_BB_E7_BB_9F_PRD_v1.0_ef2f0e59.md` | PRD V1.0 原文，包含业务原则与分层规则 |
| **前端数据类型定义** | `./src/types/index.ts` | 核心对象：`ChildProfile`, `LearningTask`, `Worksheet`, `Submission`, `LearningEvent` |
| **前端 API 通信模块** | `./src/services/apiClient.ts` | 前端发起请求的客户端，预留 `http://localhost:8000` 接口 |
| **数学题目与确定性批改逻辑** | `./src/utils/mathGenerator.ts` | 20 以内进位加法（凑十法）生成算法与确定性程序化比对 |
| **Hermes 本地服务目标地址** | `http://localhost:8000` | **建议 Hermes 监听的本地 REST API 端口**（前端右上角设置支持自定义修改） |
| **Obsidian Vault 本地建议路径** | `~/Documents/Child-Learning-Vault/` | 通用教育知识库根目录（若本地有自定义路径，可在前端设置中更新） |

---

## 二、你的具体执行任务（按先后次序）

### 任务 1：初始化飞书多维表格（System of Record）
请使用飞书开放平台 API 或引导用户在多维表格 Base 中建立 **7 张核心业务表**（字段定义详见 `HERMES_INTEGRATION_SPEC.md` 第 2 节）：
1. `tb_child_profile`（孩子档案表）
2. `tb_knowledge_point`（知识点索引表）
3. `tb_mastery_state`（知识点掌握状态表）
4. `tb_learning_task`（学习任务表）
5. `tb_learning_material`（练习材料表）
6. `tb_submission`（作答提交表）
7. `tb_learning_event`（学习事件与批改明细表）

👉 **配置飞书表单视角：**  
在 `tb_submission` 表上创建“表单视角”（Form View），命名为**“AI 家庭学习系统 · 作答拍照上传”**，开启附件上传字段 `photo_attachments`，供家长手机端拍照直接上传。

---

### 任务 2：初始化本地 Obsidian 通用知识库骨架
在 Obsidian Vault 目录中建立如下目录结构（**严禁在 Obsidian 中写入孩子个人答题记录**）：
```text
Child-Learning-Vault/
├── 00_System/
├── 01_Subjects/Math/
├── 02_Concepts/Math/
│   └── MATH-G1-ADD-CARRY-001.md    # 20以内进位加法（凑十法）核心卡片
├── 03_Error-Patterns/Math/
│   ├── ERR-MATH-CARRY-MISSED.md    # 进位遗漏
│   └── ERR-MATH-MAKE10-CONFUSE.md  # 拆数点数微小偏差
└── 04_Teaching-Strategies/Math/
    └── STRAT-MATH-MAKE10-BLOCKS.md # 十格阵具象算理教学法
```

---

### 任务 3：本地启动轻量 API 服务（对接前端）
请在本地使用 Python (FastAPI/Flask) 或 Node.js 在 `http://localhost:8000` 启动服务，实现 `HERMES_INTEGRATION_SPEC.md` 第 5 节的 3 个关键端点：
- `GET /api/child/profile`：从飞书读取孩子档案与星星数量；
- `GET /api/tasks/today`：读取或规划今日进位加法任务与 Worksheet 数据；
- `POST /api/submissions/review`：接收家长在前端核对修正的题目状态并更新飞书。

---

### 任务 4：执行分层识别与确定性批改流水线
当检测到飞书表单视角有新作答照片上传（通过 Webhook 或轮询）：
1. **识别层**：多模态模型提取二维码中的 Worksheet ID（如 `WS-M1-20261109-8F2A`）及各题手写文字，输出 `confidence` 置信度；
2. **批改层（确定性）**：数学客观算式**必须用代码计算校验**（`ans == numA + numB`），禁止大模型直接猜判；
3. **门禁层**：若置信度 `< 0.85` 或有涂改，写入飞书标记为 `待家长核对`；
4. **归因层**：若有错题，调取 Obsidian 匹配 `ERR-Pattern`，记录为诊断假设；
5. **回写学情**：写入 `tb_learning_event` 并更新 `tb_mastery_state`。

---

## 三、关键约束与安全红线

1. **唯一事实源原则**：飞书记录孩子个体学情，Obsidian 沉淀通用教育知识，切勿在两处同时维护重复学情。
2. **凭证隔离**：飞书 `App ID` / `App Secret` 与大模型密钥保存在本地环境，绝不穿透暴露给浏览器前端。
3. **渐进式掌握度**：必须积累 3 次以上连续学习证据，方可将掌握度调整为“稳定掌握”，不可单凭一次对错下结论。
