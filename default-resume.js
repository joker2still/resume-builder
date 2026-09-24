window.DEFAULT_RESUME = {
  "schemaVersion": 1,
  "metadata": {
    "documentName": "示例简历",
    "updatedAt": "2026-09-24"
  },
  "basics": {
    "name": "张文宣",
    "headline": "AI Agent 开发工程师",
    "phone": "19975267684",
    "email": "z694908768@gmail.com",
    "location": "浙江省·杭州",
    "github": "",
    "githubEnabled": true,
    "photoEnabled": true,
    "photo": ""
  },
  "sections": [
    {
      "id": "summary",
      "type": "summary",
      "title": "个人概述",
      "enabled": true,
      "order": 1,
      "content": "数据科学与大数据技术本科，具备企业软件开发与算法工程化经历，当前聚焦 LLM Agent 应用工程。使用 Python、FastAPI、LangGraph 构建融合 RAG、Tool Calling、MCP、状态恢复、人工审批、异步任务与可观测评估的 Agent 系统，并具备 Java / .NET 企业项目开发和部署调试经验。"
    },
    {
      "id": "education",
      "type": "education",
      "title": "教育背景",
      "enabled": true,
      "order": 2,
      "items": [
        {
          "id": "edu-1",
          "enabled": true,
          "order": 1,
          "title": "浙江工商大学",
          "subtitle": "数据科学与大数据技术 / 本科",
          "date": "2019.09–2023.06",
          "bullets": []
        }
      ]
    },
    {
      "id": "projects",
      "type": "projects",
      "title": "项目实践",
      "enabled": true,
      "order": 3,
      "items": [
        {
          "id": "project-1",
          "enabled": true,
          "order": 1,
          "title": "Agentic RAG 知识库智能体 → Reliable Agent Runtime",
          "subtitle": "两阶段完成本地知识库智能体与可靠运行层",
          "date": "",
          "techStack": "Python、FastAPI、LangGraph、LangChain、Celery、Redis、Qdrant、Ollama、LangSmith、Docker Compose、React",
          "bullets": [
            "基于 FastAPI + React 构建文档管理与问答界面，使用 Ollama 部署本地 LLM / Embedding，以 Qdrant 完成向量检索与 RAG。",
            "通过 LangChain 编排多工具 Agent，并以 MCP 封装知识库工具接口，形成可复用的检索与工具调用能力。",
            "使用 LangGraph 将规划、检索、工具调用与回答生成拆分为显式状态图，使 Agent Loop 可追踪、可控制。",
            "通过 Checkpoint 持久化执行状态并支持异常后的恢复，结合重试与幂等机制，降低长任务中断与重复投递带来的副作用风险。",
            "使用 Celery + Redis 解耦 FastAPI 请求与长任务执行，并为高风险工具操作增加 Human-in-the-loop 审批。",
            "接入结构化日志与 LangSmith Trace 追踪节点、工具和错误，建立离线 Eval；使用 Docker Compose 编排服务依赖。"
          ]
        }
      ]
    },
    {
      "id": "experience",
      "type": "experience",
      "title": "工作实践与经历",
      "enabled": true,
      "order": 4,
      "items": [
        {
          "id": "work-1",
          "enabled": true,
          "order": 1,
          "title": "日企（IT 海关 / 物流系统领域）",
          "subtitle": "开发岗",
          "date": "2023.04–2024.12",
          "bullets": [
            "参与日本海关物流账票系统的前后端开发与维护，围绕业务数据处理、账票生成与问题修复推进功能迭代。",
            "使用 Java / VB.NET 实现业务逻辑并参与数据库设计与优化，通过 Git 与日本团队开展代码评审和版本交付。"
          ]
        },
        {
          "id": "work-2",
          "enabled": true,
          "order": 2,
          "title": "能源科技公司（储能 / 电力系统）",
          "subtitle": "算法工程师",
          "date": "2025.06–2025.10",
          "bullets": [
            "参与储能系统运行策略的数学建模与优化算法开发，将 MATLAB 算法原型重构为 Python 工程模块。",
            "使用 FastAPI 封装算法服务，参与云端部署、联调与问题排查，支持模块化集成和产品化交付。"
          ]
        }
      ]
    },
    {
      "id": "skills",
      "type": "skills",
      "title": "专业技能",
      "enabled": true,
      "order": 5,
      "items": [
        {
          "id": "skill-1",
          "enabled": true,
          "order": 1,
          "label": "Agent / RAG",
          "content": "LangGraph、LangChain、Agentic RAG、Tool Calling、MCP、Qdrant、Ollama。"
        },
        {
          "id": "skill-2",
          "enabled": true,
          "order": 2,
          "label": "可靠性与控制",
          "content": "Checkpoint、Retry、Idempotency、Human-in-the-loop、任务状态、结构化日志、LangSmith Trace、离线 Eval。"
        },
        {
          "id": "skill-3",
          "enabled": true,
          "order": 3,
          "label": "后端与工程",
          "content": "Python、FastAPI、REST API、Celery、Redis、Docker Compose、Git；具备 React 前后端协作经验。"
        },
        {
          "id": "skill-4",
          "enabled": true,
          "order": 4,
          "label": "企业开发",
          "content": "Java、VB.NET、数据库设计与优化，具备跨团队代码评审、部署联调和版本交付经验。"
        }
      ]
    }
  ]
};
window.DEFAULT_RESUME.sections.push({
  id: "custom-example",
  type: "custom",
  title: "自定义模块",
  enabled: false,
  order: 6,
  items: []
});
