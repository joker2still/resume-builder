(() => {
  "use strict";

  const STORAGE_KEY = "localResumeBuilder.current.v1";
  const resumeElement = document.getElementById("resume");
  const managerElement = document.getElementById("moduleManager");
  const managerList = document.getElementById("managerList");
  const saveState = document.getElementById("saveState");
  const notice = document.getElementById("notice");
  const jsonFile = document.getElementById("jsonFile");
  const photoFile = document.getElementById("photoFile");
  const modeButton = document.getElementById("modeButton");
  const undoButton = document.getElementById("undoButton");
  const manageButton = document.getElementById("manageButton");
  let resume;
  let preview = false;
  let saveTimer;
  let noticeTimer;
  let dragData = null;
  let previousPrintTitle = null;
  const undoStack = [];
  let lastSnapshot = "";
  let lastEditTarget = null;
  let lastEditTime = 0;

  const copy = value => JSON.parse(JSON.stringify(value));
  const uid = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const ordered = list => [...list].sort((a, b) => a.order - b.order);

  function blankResume() {
    const section = (id, type, title, order, enabled = true) => ({
      id, type, title, enabled, order, ...(type === "summary" ? { content: "" } : { items: [] })
    });
    return {
      schemaVersion: 1,
      metadata: { documentName: "新简历", updatedAt: new Date().toISOString().slice(0, 10) },
      basics: { name: "", headline: "", phone: "", email: "", location: "", github: "", githubEnabled: true, photoEnabled: false, photo: "" },
      sections: [
        section("summary", "summary", "个人概述", 1),
        section("education", "education", "教育背景", 2),
        section("projects", "projects", "项目经历", 3),
        section("experience", "experience", "工作经历", 4),
        section("skills", "skills", "专业技能", 5),
        section(uid("custom"), "custom", "自定义模块", 6, false)
      ]
    };
  }

  function validateResume(data) {
    const fail = message => { throw new Error(message); };
    if (!data || typeof data !== "object" || Array.isArray(data)) fail("文件内容应为简历 JSON 对象。请检查文件格式。");
    if (data.schemaVersion !== 1) fail("不支持此 schemaVersion；当前仅支持版本 1。");
    if (data.metadata !== undefined && (!data.metadata || typeof data.metadata !== "object" || Array.isArray(data.metadata))) fail("metadata 应为对象。");
    if (!data.basics || typeof data.basics !== "object" || Array.isArray(data.basics)) fail("缺少基本信息 basics。");
    for (const key of ["name", "headline", "phone", "email", "location", "github", "photo"]) {
      if (data.basics[key] === undefined) data.basics[key] = "";
      if (typeof data.basics[key] !== "string") fail(`基本信息 ${key} 应为文本。`);
    }
    if (data.basics.photoEnabled === undefined) data.basics.photoEnabled = false;
    if (typeof data.basics.photoEnabled !== "boolean") fail("photoEnabled 应为布尔值。");
    if (data.basics.githubEnabled === undefined) data.basics.githubEnabled = true;
    if (typeof data.basics.githubEnabled !== "boolean") fail("githubEnabled 应为布尔值。");
    if (data.basics.photo && !/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(data.basics.photo)) fail("照片需要是图片 data URL。");
    if (!Array.isArray(data.sections)) fail("缺少模块列表 sections。");
    const ids = new Set();
    for (const section of data.sections) {
      if (!section || typeof section !== "object" || typeof section.id !== "string" || !section.id) fail("模块缺少有效 id。");
      if (ids.has(section.id)) fail("模块 id 重复。");
      ids.add(section.id);
      if (!["summary", "education", "projects", "experience", "skills", "custom"].includes(section.type)) fail(`不支持的模块类型：${section.type}`);
      if (typeof section.title !== "string" || typeof section.enabled !== "boolean" || !Number.isFinite(section.order)) fail("模块的标题、开关或顺序无效。");
      if (section.type === "summary") {
        if (typeof section.content !== "string") fail("个人概述的 content 应为文本。");
        continue;
      }
      if (!Array.isArray(section.items)) fail(`“${section.title}”缺少 items 列表。`);
      const itemIds = new Set();
      for (const item of section.items) {
        if (!item || typeof item.id !== "string" || !item.id || itemIds.has(item.id)) fail(`“${section.title}”的条目 id 无效或重复。`);
        itemIds.add(item.id);
        if (typeof item.enabled !== "boolean" || !Number.isFinite(item.order)) fail(`“${section.title}”的条目开关或顺序无效。`);
        if (section.type === "skills") {
          if (item.label === undefined) item.label = "";
          if (item.content === undefined) item.content = "";
          if (typeof item.label !== "string" || typeof item.content !== "string") fail("技能条目的 label/content 应为文本。");
        } else {
          for (const key of ["title", "subtitle", "date"]) {
            if (item[key] === undefined) item[key] = "";
            if (typeof item[key] !== "string") fail(`条目的 ${key} 应为文本。`);
          }
          if (item.techStack !== undefined && typeof item.techStack !== "string") fail("techStack 应为文本。");
          if (!Array.isArray(item.bullets) || item.bullets.some(bullet => typeof bullet !== "string")) fail("bullets 应为文本列表。");
        }
      }
    }
    return data;
  }

  function showNotice(message) {
    notice.textContent = message;
    notice.hidden = false;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => { notice.hidden = true; }, 5500);
  }

  function saveNow() {
    clearTimeout(saveTimer);
    resume.metadata = resume.metadata || {};
    resume.metadata.updatedAt = new Date().toISOString().slice(0, 10);
    lastSnapshot = JSON.stringify(resume);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resume));
      saveState.textContent = "已自动保存";
    } catch (error) {
      saveState.textContent = "保存失败";
      showNotice("浏览器本地保存失败。请导出 JSON 备份，并检查存储空间或隐私设置。");
    }
  }

  function changed(editTarget = null) {
    const nextSnapshot = JSON.stringify(resume);
    if (nextSnapshot !== lastSnapshot) {
      const now = Date.now();
      if (!editTarget || editTarget !== lastEditTarget || now - lastEditTime > 1000) {
        undoStack.push(lastSnapshot);
        if (undoStack.length > 30) undoStack.shift();
      }
      lastSnapshot = nextSnapshot;
      lastEditTarget = editTarget;
      lastEditTime = now;
      undoButton.disabled = false;
    }
    saveState.textContent = "保存中…";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 400);
  }

  function undo() {
    if (!undoStack.length) return;
    resume = JSON.parse(undoStack.pop());
    lastSnapshot = JSON.stringify(resume);
    lastEditTarget = null;
    undoButton.disabled = undoStack.length === 0;
    saveNow();
    render();
    showNotice("已撤销上一步修改。");
  }

  function create(tag, className, textValue) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (textValue !== undefined) node.textContent = textValue;
    return node;
  }

  function control(label, handler, title = label) {
    const button = create("button", "", label);
    button.type = "button";
    button.title = title;
    button.setAttribute("aria-label", title);
    button.addEventListener("click", handler);
    return button;
  }

  function editable(tag, className, value, placeholder, setter, multiline = false) {
    const node = create(tag, className, value);
    node.dataset.placeholder = placeholder;
    node.spellcheck = false;
    if (!preview) {
      node.contentEditable = "plaintext-only";
      node.setAttribute("role", "textbox");
      node.setAttribute("aria-label", placeholder);
      if (multiline) node.setAttribute("aria-multiline", "true");
      node.addEventListener("input", () => {
        setter(multiline ? node.innerText.replace(/\r/g, "") : node.textContent.replace(/[\r\n]+/g, " "));
        changed(node);
      });
      node.addEventListener("keydown", event => {
        if (event.key === "Enter" && !multiline) event.preventDefault();
      });
      node.addEventListener("paste", event => {
        event.preventDefault();
        let text = event.clipboardData.getData("text/plain").replace(/\r\n?/g, "\n");
        if (!multiline) text = text.replace(/\n+/g, " ");
        document.execCommand("insertText", false, text);
      });
    }
    return node;
  }

  function reorder(list, fromId, toId) {
    const sorted = ordered(list);
    const from = sorted.findIndex(value => value.id === fromId);
    const to = sorted.findIndex(value => value.id === toId);
    if (from < 0 || to < 0 || from === to) return;
    sorted.splice(to, 0, ...sorted.splice(from, 1));
    sorted.forEach((value, index) => { value.order = index + 1; });
    changed();
    render();
  }

  function move(list, id, delta) {
    const sorted = ordered(list);
    const index = sorted.findIndex(value => value.id === id);
    const target = sorted[index + delta];
    if (target) reorder(list, id, target.id);
  }

  function setDrag(handle, target, kind, id, sectionId) {
    handle.draggable = true;
    handle.classList.add("drag-handle");
    handle.title = "拖动排序";
    handle.addEventListener("dragstart", event => {
      dragData = { kind, id, sectionId };
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", id);
      target.classList.add("dragging");
    });
    handle.addEventListener("dragend", () => { dragData = null; target.classList.remove("dragging"); target.classList.remove("drag-target"); });
    target.addEventListener("dragover", event => {
      if (dragData?.kind !== kind || dragData?.sectionId !== sectionId) return;
      event.preventDefault();
      target.classList.add("drag-target");
    });
    target.addEventListener("dragleave", () => target.classList.remove("drag-target"));
    target.addEventListener("drop", event => {
      event.preventDefault();
      target.classList.remove("drag-target");
      if (!dragData || dragData.kind !== kind || dragData.sectionId !== sectionId) return;
      const list = kind === "section" ? resume.sections : resume.sections.find(section => section.id === sectionId)?.items;
      if (list) reorder(list, dragData.id, id);
      dragData = null;
    });
  }

  function renderManager() {
    managerList.replaceChildren();
    const sorted = ordered(resume.sections);
    sorted.forEach((section, index) => {
      const row = create("div", "manager-row");
      const handle = control("⋮⋮", () => {}, "拖动模块排序");
      row.append(handle);
      setDrag(handle, row, "section", section.id);
      const label = create("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = section.enabled;
      checkbox.addEventListener("change", () => { section.enabled = checkbox.checked; changed(); render(); });
      label.append(checkbox, create("span", "", section.title || "未命名模块"));
      row.append(label);
      const up = control("↑", () => move(resume.sections, section.id, -1), "上移模块");
      const down = control("↓", () => move(resume.sections, section.id, 1), "下移模块");
      up.disabled = index === 0;
      down.disabled = index === sorted.length - 1;
      row.append(up, down);
      managerList.append(row);
    });
  }

  function renderBasics() {
    const basics = resume.basics;
    const head = create("header", "resume-head");
    const identity = create("div", "identity");
    const name = editable("h1", "name", basics.name, "姓名", value => { basics.name = value; });
    const contacts = create("div", "contacts");
    for (const [key, label] of [["phone", "手机"], ["email", "邮箱"], ["location", "所在地"]]) {
      contacts.append(editable("span", "contact", basics[key], label, value => { basics[key] = value; }));
    }
    identity.append(name, contacts);
    if (basics.githubEnabled && (!preview || basics.github.trim())) {
      const githubLine = create("div", "github-line");
      githubLine.dataset.empty = String(!basics.github.trim());
      githubLine.append(create("span", "github-label", "GitHub："));
      if (preview) {
        const value = basics.github.trim();
        let url;
        try {
          const parsed = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
          if (["http:", "https:"].includes(parsed.protocol)) url = parsed.href;
        } catch (error) { /* Keep malformed input as plain text. */ }
        const link = create(url ? "a" : "span", "github-value", value);
        if (url) link.href = url;
        githubLine.append(link);
      } else githubLine.append(editable("span", "github-value", basics.github, "GitHub 链接", value => {
        basics.github = value;
        githubLine.dataset.empty = String(!value.trim());
      }));
      identity.append(githubLine);
    }
    const basicControls = create("div", "basics-controls edit-only");
    const photoLabel = create("label", "", "显示照片 ");
    const photoToggle = document.createElement("input");
    photoToggle.type = "checkbox";
    photoToggle.checked = basics.photoEnabled;
    photoToggle.addEventListener("change", () => { basics.photoEnabled = photoToggle.checked; changed(); render(); });
    photoLabel.append(photoToggle);
    basicControls.append(photoLabel);
    const githubLabel = create("label", "", "显示 GitHub ");
    const githubToggle = document.createElement("input");
    githubToggle.type = "checkbox";
    githubToggle.checked = basics.githubEnabled;
    githubToggle.addEventListener("change", () => { basics.githubEnabled = githubToggle.checked; changed(); render(); });
    githubLabel.append(githubToggle);
    basicControls.append(githubLabel);
    if (basics.photo) basicControls.append(control("移除照片", () => { basics.photo = ""; changed(); render(); }));
    identity.append(basicControls);
    head.append(identity);
    if (basics.photoEnabled) {
      const photoWrap = create("div", `photo-wrap${basics.photo ? "" : " no-photo"}`);
      if (preview) {
        if (basics.photo) {
          const img = document.createElement("img"); img.src = basics.photo; img.alt = `${basics.name || "简历"}照片`; photoWrap.append(img);
        }
      } else {
        const photoButton = create("button", "photo-button", "");
        photoButton.type = "button";
        photoButton.title = "点击更换照片";
        photoButton.setAttribute("aria-label", "点击更换照片");
        if (basics.photo) {
          const img = document.createElement("img"); img.src = basics.photo; img.alt = "简历照片，点击更换"; photoButton.append(img);
        } else photoButton.append(create("span", "photo-placeholder", "点击添加照片"));
        photoButton.addEventListener("click", () => photoFile.click());
        photoWrap.append(photoButton);
      }
      head.append(photoWrap);
    }
    return head;
  }

  function itemControls(section, item, sorted, index) {
    const controls = create("div", "entry-controls item-controls edit-only");
    const handle = control("⋮⋮", () => {}, "拖动条目排序");
    controls.append(handle);
    const toggle = control(item.enabled ? "隐藏" : "显示", () => { item.enabled = !item.enabled; changed(); render(); }, item.enabled ? "隐藏此条目" : "显示此条目");
    controls.append(toggle);
    const up = control("↑", () => move(section.items, item.id, -1), "上移条目");
    const down = control("↓", () => move(section.items, item.id, 1), "下移条目");
    up.disabled = index === 0;
    down.disabled = index === sorted.length - 1;
    controls.append(up, down);
    controls.append(control("删除", () => {
      section.items = section.items.filter(current => current.id !== item.id);
      changed(); render();
    }, "删除此条目"));
    return { controls, handle };
  }

  function selectionOffsets(node) {
    const selection = window.getSelection();
    if (!selection?.rangeCount || !node.contains(selection.anchorNode)) return [node.textContent.length, node.textContent.length];
    const range = selection.getRangeAt(0);
    const beforeStart = range.cloneRange();
    beforeStart.selectNodeContents(node);
    beforeStart.setEnd(range.startContainer, range.startOffset);
    const beforeEnd = range.cloneRange();
    beforeEnd.selectNodeContents(node);
    beforeEnd.setEnd(range.endContainer, range.endOffset);
    return [beforeStart.toString().length, beforeEnd.toString().length];
  }

  function focusBullet(item, index, position = 0) {
    const node = [...resumeElement.querySelectorAll("[data-bullet-item]")]
      .find(candidate => candidate.dataset.bulletItem === item.id && Number(candidate.dataset.bulletIndex) === index);
    if (!node) return;
    node.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    const textNode = node.firstChild;
    if (textNode?.nodeType === Node.TEXT_NODE) range.setStart(textNode, Math.min(position, textNode.length));
    else range.selectNodeContents(node);
    range.collapse(true);
    selection.removeAllRanges(); selection.addRange(range);
  }

  function bulletNode(item, index) {
    const row = create("li", "bullet-row");
    row.dataset.empty = String(!item.bullets[index].trim());
    const node = editable("span", "bullet-text", item.bullets[index], "要点", value => {
      item.bullets[index] = value;
      row.dataset.empty = String(!value.trim());
    });
    node.dataset.bulletItem = item.id;
    node.dataset.bulletIndex = String(index);
    if (!preview) {
      node.addEventListener("keydown", event => {
        if (event.key === "Enter") {
          event.preventDefault();
          const [start, end] = selectionOffsets(node);
          const value = item.bullets[index];
          item.bullets.splice(index, 1, value.slice(0, start), value.slice(end));
          changed(); render(); focusBullet(item, index + 1);
        } else if (event.key === "Backspace" && !node.textContent.trim()) {
          event.preventDefault();
          item.bullets.splice(index, 1);
          changed(); render();
          if (item.bullets.length) {
            const nextIndex = Math.max(0, index - 1);
            focusBullet(item, nextIndex, index ? item.bullets[nextIndex].length : 0);
          } else {
            const addButton = [...resumeElement.querySelectorAll("[data-add-bullet-item]")]
              .find(candidate => candidate.dataset.addBulletItem === item.id);
            addButton?.focus();
          }
        }
      });
      node.addEventListener("paste", event => {
        const pasted = event.clipboardData.getData("text/plain").replace(/\r\n?/g, "\n");
        if (!pasted.includes("\n")) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        const lines = pasted.split("\n");
        const [start, end] = selectionOffsets(node);
        const value = item.bullets[index];
        const prefix = value.slice(0, start);
        const suffix = value.slice(end);
        const replacement = [prefix + lines[0], ...lines.slice(1, -1), lines.at(-1) + suffix];
        item.bullets.splice(index, 1, ...replacement);
        changed(); render(); focusBullet(item, index + replacement.length - 1, lines.at(-1).length);
      }, true);
    }
    row.append(node);
    return row;
  }

  function renderStandardItem(section, item, sorted, index) {
    const row = create("div", `resume-item${item.enabled ? "" : " is-disabled"}`);
    const length = item.bullets.join("").length + item.title.length + item.subtitle.length;
    if (length > 460 || item.bullets.length > 5) row.classList.add("long-item");
    if (!preview) {
      const { controls, handle } = itemControls(section, item, sorted, index);
      row.append(controls);
      setDrag(handle, row, "item", item.id, section.id);
    }
    const top = create("div", "item-top");
    top.append(editable("span", "item-title", item.title, "条目标题", value => { item.title = value; }));
    if (section.type === "education") top.append(editable("span", "item-subtitle education-subtitle", item.subtitle, "学历 / 专业", value => { item.subtitle = value; }));
    top.append(editable("span", "item-date", item.date, "日期", value => { item.date = value; }));
    row.append(top);
    if (section.type !== "education") row.append(editable("div", "item-subtitle", item.subtitle, "副标题 / 简述", value => { item.subtitle = value; }, true));
    if (section.type === "projects") row.append(editable("div", "tech-line", item.techStack || "", "技术栈", value => { item.techStack = value; }, true));
    const bullets = create("ul", "bullets");
    item.bullets.forEach((_, bulletIndex) => bullets.append(bulletNode(item, bulletIndex)));
    row.append(bullets);
    if (!preview) {
      const add = create("div", "add-row edit-only");
      const addButton = control("＋ 添加要点", () => {
        item.bullets.push(""); changed(); render(); focusBullet(item, item.bullets.length - 1);
      });
      addButton.dataset.addBulletItem = item.id;
      add.append(addButton);
      row.append(add);
    }
    return row;
  }

  function renderSkill(section, item, sorted, index) {
    const row = create("div", `skill-row${item.enabled ? "" : " is-disabled"}`);
    if (!preview) {
      const { controls, handle } = itemControls(section, item, sorted, index);
      controls.classList.add("skill-controls");
      row.append(controls);
      setDrag(handle, row, "item", item.id, section.id);
    }
    row.append(editable("span", "skill-label", item.label, "技能组名称", value => { item.label = value; }));
    row.append(editable("span", "skill-content", item.content, "技能内容", value => { item.content = value; }, true));
    return row;
  }

  function newItem(section) {
    const base = { id: uid("item"), enabled: true, order: Math.max(0, ...section.items.map(item => item.order)) + 1 };
    if (section.type === "skills") section.items.push({ ...base, label: "", content: "" });
    else section.items.push({ ...base, title: "", subtitle: "", date: "", ...(section.type === "projects" ? { techStack: "" } : {}), bullets: section.type === "education" ? [] : [""] });
    changed(); render();
  }

  function renderSection(section) {
    const shell = create("section", `resume-section${section.enabled ? "" : " is-disabled"}`);
    const head = create("div", "section-head");
    head.append(editable("h2", "section-title", section.title, "模块标题", value => { section.title = value; renderManager(); }));
    if (!preview) {
      const controls = create("div", "section-controls edit-only");
      controls.append(control(section.enabled ? "隐藏" : "显示", () => { section.enabled = !section.enabled; changed(); render(); }, section.enabled ? "隐藏模块" : "显示模块"));
      if (section.type === "custom") controls.append(control("删除", () => {
        resume.sections = resume.sections.filter(current => current.id !== section.id);
        changed(); render();
      }, "删除自定义模块"));
      head.append(controls);
    }
    shell.append(head);
    if (section.type === "summary") {
      shell.append(editable("div", "section-content", section.content, "点击填写个人概述", value => { section.content = value; }, true));
    } else {
      const sorted = ordered(section.items);
      sorted.forEach((item, index) => shell.append(section.type === "skills" ? renderSkill(section, item, sorted, index) : renderStandardItem(section, item, sorted, index)));
      if (!preview) {
        const add = create("div", "add-row section-add edit-only");
        add.append(control(section.type === "projects" ? "＋ 新增项目" : section.type === "skills" ? "＋ 新增技能组" : "＋ 新增条目", () => newItem(section)));
        shell.append(add);
      }
    }
    return shell;
  }

  function render() {
    document.body.classList.toggle("preview", preview);
    modeButton.textContent = preview ? "编辑" : "预览";
    manageButton.disabled = preview;
    if (preview) { managerElement.hidden = true; manageButton.setAttribute("aria-expanded", "false"); }
    resumeElement.replaceChildren(renderBasics(), ...ordered(resume.sections).filter(section => !preview || section.enabled).map(renderSection));
    renderManager();
  }

  function downloadJson() {
    saveNow();
    const text = JSON.stringify(resume, null, 2);
    const blob = new Blob([text], { type: "application/json;charset=utf-8" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const name = (resume.basics.name || "简历").replace(/[<>:"/\\|?*\x00-\x1f]/g, "_");
    link.href = url;
    link.download = `${name}.resume.json`;
    document.body.append(link);
    link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function importJson(file) {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      validateResume(data);
      resume = copy(data);
      preview = false;
      changed(); saveNow(); render(); showNotice("JSON 已导入并保存。");
    } catch (error) {
      showNotice(`导入失败：${error instanceof SyntaxError ? "文件不是有效 JSON。" : error.message}`);
    } finally { jsonFile.value = ""; }
  }

  async function importPhoto(file) {
    if (!file) return;
    try {
      if (!file.type.startsWith("image/")) throw new Error("请选择图片文件。");
      if (file.size > 15 * 1024 * 1024) throw new Error("图片过大，请选择小于 15 MB 的图片。");
      const url = URL.createObjectURL(file);
      try {
        const img = new Image();
        img.src = url;
        await img.decode();
        const scale = Math.min(1, 900 / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
        const context = canvas.getContext("2d");
        context.fillStyle = "#fff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        resume.basics.photo = canvas.toDataURL("image/jpeg", .86);
        resume.basics.photoEnabled = true;
        changed(); render();
      } finally { URL.revokeObjectURL(url); }
    } catch (error) { showNotice(`照片处理失败：${error.message}`); }
    finally { photoFile.value = ""; }
  }

  function startPrint() {
    saveNow();
    previousPrintTitle = document.title;
    const date = new Date();
    const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    const title = [resume.basics.name || "简历", ymd].join("_").replace(/[<>:"/\\|?*\x00-\x1f]/g, "_");
    document.title = title;
    window.print();
  }

  window.addEventListener("afterprint", () => {
    if (previousPrintTitle !== null) { document.title = previousPrintTitle; previousPrintTitle = null; }
  });
  document.getElementById("printButton").addEventListener("click", startPrint);
  undoButton.addEventListener("click", undo);
  document.addEventListener("keydown", event => {
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "z" && undoStack.length) {
      event.preventDefault();
      undo();
    }
  });
  document.getElementById("exportButton").addEventListener("click", downloadJson);
  document.getElementById("importButton").addEventListener("click", () => jsonFile.click());
  jsonFile.addEventListener("change", () => importJson(jsonFile.files[0]));
  photoFile.addEventListener("change", () => importPhoto(photoFile.files[0]));
  modeButton.addEventListener("click", () => { preview = !preview; render(); });
  manageButton.addEventListener("click", () => {
    managerElement.hidden = !managerElement.hidden;
    manageButton.setAttribute("aria-expanded", String(!managerElement.hidden));
  });
  document.getElementById("addSectionButton").addEventListener("click", () => {
    resume.sections.push({ id: uid("custom"), type: "custom", title: "自定义模块", enabled: true, order: Math.max(0, ...resume.sections.map(section => section.order)) + 1, items: [] });
    changed(); render();
  });
  document.getElementById("newButton").addEventListener("click", () => {
    if (!confirm("新建空白简历会替换当前内容。请先导出 JSON 备份。确定继续吗？")) return;
    resume = blankResume(); preview = false; changed(); saveNow(); render(); showNotice("已新建空白简历。");
  });
  document.getElementById("resetButton").addEventListener("click", () => {
    if (!confirm("重置会替换当前简历。确定继续吗？")) return;
    if (!confirm("请再次确认：恢复示例简历，当前未导出的修改将丢失。")) return;
    resume = copy(window.DEFAULT_RESUME); preview = false; changed(); saveNow(); render(); showNotice("已恢复示例简历。");
  });
  const toolbarToggle = document.getElementById("toolbarToggle");
  const toolbarActions = document.getElementById("toolbarActions");
  toolbarToggle.addEventListener("click", () => {
    const open = toolbarActions.classList.toggle("open");
    toolbarToggle.setAttribute("aria-expanded", String(open));
  });

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    resume = saved ? validateResume(JSON.parse(saved)) : copy(window.DEFAULT_RESUME);
    saveState.textContent = saved ? "已恢复自动保存" : "示例简历";
  } catch (error) {
    resume = copy(window.DEFAULT_RESUME);
    saveState.textContent = "示例简历";
    showNotice("本地保存无法读取，已打开示例简历。可尝试导入之前导出的 JSON。");
  }
  lastSnapshot = JSON.stringify(resume);
  render();
})();
