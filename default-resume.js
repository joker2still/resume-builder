// 虚构示例数据；请勿在此受 Git 跟踪的文件中填写真实简历。
window.DEFAULT_RESUME = {
  schemaVersion: 1,
  metadata: {
    documentName: "软件工程师示例简历",
    updatedAt: "2026-09-25"
  },
  basics: {
    name: "Alex Carter",
    headline: "Full-Stack Software Engineer",
    phone: "+1 (202) 555-0146",
    email: "alex.carter@example.com",
    location: "Portland, OR",
    github: "",
    githubEnabled: false,
    photoEnabled: false,
    photo: ""
  },
  sections: [
    {
      id: "summary",
      type: "summary",
      title: "个人概述",
      enabled: true,
      order: 1,
      content: "专注于易用的 Web 应用和可靠的 API 开发。熟悉从需求设计、功能实现到测试发布的完整流程，注重代码清晰度、可维护性和团队协作。"
    },
    {
      id: "education",
      type: "education",
      title: "教育背景",
      enabled: true,
      order: 2,
      items: [
        {
          id: "edu-1",
          enabled: true,
          order: 1,
          title: "北桥大学",
          subtitle: "计算机科学学士",
          date: "2016–2020",
          bullets: []
        }
      ]
    },
    {
      id: "projects",
      type: "projects",
      title: "项目经历",
      enabled: true,
      order: 3,
      items: [
        {
          id: "project-1",
          enabled: true,
          order: 1,
          title: "社区活动管理平台",
          subtitle: "个人项目",
          date: "2024",
          techStack: "TypeScript、React、Node.js、PostgreSQL",
          bullets: [
            "开发响应式页面，支持浏览活动、收藏和管理报名信息。",
            "设计活动与参与者数据的 REST API，并编写数据库迁移脚本。",
            "为报名流程和键盘操作编写自动化测试。"
          ]
        }
      ]
    },
    {
      id: "experience",
      type: "experience",
      title: "工作经历",
      enabled: true,
      order: 4,
      items: [
        {
          id: "work-1",
          enabled: true,
          order: 1,
          title: "软件工程师",
          subtitle: "示例系统公司 · 远程",
          date: "2022–至今",
          bullets: [
            "使用 TypeScript 和 React 开发用户账户功能，并与设计师协作改善操作体验。",
            "实现 Node.js API 接口，补充输入校验、错误处理和接口文档。",
            "参与代码评审，为关键用户流程添加集成测试。"
          ]
        },
        {
          id: "work-2",
          enabled: true,
          order: 2,
          title: "初级开发工程师",
          subtitle: "样例工坊 · 美国俄勒冈州波特兰",
          date: "2020–2022",
          bullets: [
            "维护内部 Web 工具，修复支持团队反馈的问题。",
            "编写 SQL 查询和 Python 脚本，简化重复性数据检查。"
          ]
        }
      ]
    },
    {
      id: "skills",
      type: "skills",
      title: "专业技能",
      enabled: true,
      order: 5,
      items: [
        {
          id: "skill-1",
          enabled: true,
          order: 1,
          label: "编程语言",
          content: "TypeScript、JavaScript、Python、SQL"
        },
        {
          id: "skill-2",
          enabled: true,
          order: 2,
          label: "Web 开发",
          content: "React、Node.js、HTML、CSS、REST API"
        },
        {
          id: "skill-3",
          enabled: true,
          order: 3,
          label: "工具与工程",
          content: "PostgreSQL、Git、Docker、自动化测试"
        }
      ]
    },
    {
      id: "custom-example",
      type: "custom",
      title: "补充信息",
      enabled: false,
      order: 6,
      items: []
    }
  ]
};
