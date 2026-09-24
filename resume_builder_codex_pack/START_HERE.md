# START HERE

你是 Codex。请直接在当前目录创建一个可运行的“本地简历编辑器”。

先阅读：
1. `CODEX_PROMPT.md`
2. `SPEC.md`
3. `UI_STYLE.md`
4. `ACCEPTANCE_CHECKLIST.md`

参考资料：
- `refs/current_resume_zhangwenxuan.pdf`：当前简历内容参考
- `refs/reference_resume_shengyuliu.pdf`：视觉/信息层级参考
- `examples/zhangwenxuan.resume.json`：当前简历的数据示例

目标不是做一个复杂 SaaS，而是做一个“内容和排版分离”的轻量简历工具：
- 以后用户只改内容，不再手工调 Word 排版
- 内容增减后自动重排、自动分页
- 一键打印/保存为 PDF
- 可复用给别人
- PC 为主，手机支持查看、小改、导出

请优先完成一个可靠、简洁、离线可用的 v1，不要过度工程化。
