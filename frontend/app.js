document.addEventListener("DOMContentLoaded", () => {
  let scripts = [];
  let filters = { type: "all", status: "all", search: "" };
  let sort = "name-asc";
  let currentLogScriptId = null;

  const appContainer = document.getElementById("app-container");

  const searchInput = document.getElementById("search-input");
  const themeToggle = document.getElementById("theme-toggle");
  const settingsBtn = document.getElementById("settings-btn");
  const runningCount = document.getElementById("running-count");
  const memoryUsage = document.getElementById("memory-usage");
  const refreshScriptsBtn = document.getElementById("refresh-scripts");

  const scriptList = document.getElementById("script-list");
  const scriptCount = document.getElementById("script-count");
  const sortSelect = document.getElementById("sort-select");

  const filterOptions = document.querySelectorAll(".filter-option");
  const allCount = document.getElementById("all-count");
  const nodejsCount = document.getElementById("nodejs-count");
  const pythonCount = document.getElementById("python-count");
  const allStatusCount = document.getElementById("all-status-count");
  const runningStatusCount = document.getElementById("running-status-count");
  const idleStatusCount = document.getElementById("idle-status-count");

  const logViewer = document.getElementById("log-viewer");
  const logOutput = document.getElementById("log-output");
  const logScriptName = document.getElementById("log-script-name");
  const clearLogBtn = document.getElementById("clear-log-btn");
  const closeLogBtn = document.getElementById("close-log-btn");
  const downloadLog = document.getElementById("download-log");

  const editorModal = document.getElementById("editor-modal");
  const closeEditorModalBtn = document.getElementById("close-editor-modal");
  const editorModalTitle = document.getElementById("editor-modal-title");
  const editorFileType = document.getElementById("editor-file-type");
  const editorScriptName = document.getElementById("editor-script-name");
  const editorFilePath = document.getElementById("editor-file-path");
  const codeEditor = document.getElementById("code-editor");
  const codeHighlight = document.getElementById("code-highlight");
  const saveEditorBtn = document.getElementById("save-editor-btn");
  const cancelEditorBtn = document.getElementById("cancel-editor-btn");
  const formatBtn = document.getElementById("format-btn");
  const validateBtn = document.getElementById("validate-btn");
  const editorStatus = document.getElementById("editor-status");

  let currentEditingScriptId = null;
  let currentEditingFileType = null;
  let originalContent = "";

  const API_URL = "";
  let ws;

  function connectWebSocket() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "log":
          if (data.scriptId === currentLogScriptId) {
            appendLog(data.message, data.stream);
          }
          break;
        case "status_update":
          updateScriptStatus(data.scriptId, data.status);
          break;
        case "refresh_scripts":
          fetchScripts();
          break;
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected. Reconnecting...");
      setTimeout(connectWebSocket, 3000);
    };
  }

  function startApp() {
    initializeTheme();
    setupEventListeners();
    connectWebSocket();
    fetchScripts();
    updateSystemStatus();
    setupResponsiveLayout();
  }

  function initializeTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme);
  }

  function updateThemeIcon(theme) {
    if (themeToggle) {
      const themeIcon = themeToggle.querySelector(".theme-icon");
      if (themeIcon) {
        themeIcon.textContent = theme === "dark" ? "🌙" : "☀️";
      }
    }
  }

  function setupResponsiveLayout() {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        if (logViewer && logViewer.classList.contains("visible")) {
          logViewer.style.height = "60vh";
        }
      } else {
        if (logViewer) {
          logViewer.style.height = "50vh";
        }
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeIcon(newTheme);

    document.body.style.transition =
      "background-color 0.3s ease, color 0.3s ease";
    setTimeout(() => {
      document.body.style.transition = "";
    }, 300);
  }

  function updateSystemStatus() {
    const runningScripts = scripts.filter((s) => s.status === "Running").length;
    if (runningCount) {
      runningCount.textContent = runningScripts;

      if (runningScripts > 0) {
        runningCount.style.animation = "pulse 2s infinite";
      } else {
        runningCount.style.animation = "";
      }
    }

    if (memoryUsage) {
      const mockMemory = Math.floor(Math.random() * 20) + 60;
      memoryUsage.textContent = `${mockMemory}%`;

      if (mockMemory > 85) {
        memoryUsage.style.color = "var(--danger)";
      } else if (mockMemory > 70) {
        memoryUsage.style.color = "var(--warning)";
      } else {
        memoryUsage.style.color = "var(--accent-primary)";
      }
    }

    updateFilterCounts();
  }

  function updateFilterCounts() {
    const nodejsScripts = scripts.filter((s) => s.type === "Node.js").length;
    const pythonScripts = scripts.filter((s) => s.type === "Python").length;
    const runningScripts = scripts.filter((s) => s.status === "Running").length;
    const idleScripts = scripts.filter((s) => s.status === "Idle").length;

    if (allCount) allCount.textContent = scripts.length;
    if (nodejsCount) nodejsCount.textContent = nodejsScripts;
    if (pythonCount) pythonCount.textContent = pythonScripts;
    if (allStatusCount) allStatusCount.textContent = scripts.length;
    if (runningStatusCount) runningStatusCount.textContent = runningScripts;
    if (idleStatusCount) idleStatusCount.textContent = idleScripts;
  }

  function setupQuickSearch() {
    let searchTimeout;

    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        filters.search = e.target.value.toLowerCase();
        renderScripts();

        const filteredCount = getFilteredAndSortedScripts().length;
        if (e.target.value && filteredCount === 0) {
          showSearchFeedback("No scripts found for your search");
        } else if (e.target.value && filteredCount > 0) {
          showSearchFeedback(
            `Found ${filteredCount} script${filteredCount !== 1 ? "s" : ""}`
          );
        }
      }, 300);
    });

    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const query = e.target.value.toLowerCase();
        const matchingScript = scripts.find((script) =>
          script.name.toLowerCase().includes(query)
        );

        if (matchingScript) {
          runScript(matchingScript.id);
          showNotification(`Running ${matchingScript.name}`, "success");
        } else {
          showNotification("No matching script found", "warning");
        }
      }
    });

    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        searchInput.value = "";
        filters.search = "";
        renderScripts();
      }
    });
  }

  function showSearchFeedback(message) {
    let feedback = document.querySelector(".search-feedback");
    if (!feedback) {
      feedback = document.createElement("div");
      feedback.className = "search-feedback";
      feedback.style.cssText = `
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: var(--bg-surface);
                border: 1px solid var(--border-primary);
                border-top: none;
                border-radius: 0 0 var(--radius-md) var(--radius-md);
                padding: 0.75rem 1rem;
                color: var(--text-secondary);
                font-size: 0.85rem;
                z-index: 1000;
                transition: var(--transition);
            `;
      searchInput.parentElement.appendChild(feedback);
    }

    feedback.textContent = message;
    feedback.style.display = "block";

    setTimeout(() => {
      if (feedback) {
        feedback.style.display = "none";
      }
    }, 2000);
  }

  function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 2rem;
            background: var(--bg-surface);
            border: 2px solid var(--border-primary);
            border-radius: var(--radius-md);
            padding: 1rem 1.5rem;
            color: var(--text-primary);
            font-weight: 500;
            z-index: 1001;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            box-shadow: var(--shadow-lg);
            max-width: 300px;
        `;

    if (type === "success") {
      notification.style.borderColor = "var(--accent-primary)";
      notification.style.background = "var(--accent-light)";
    } else if (type === "warning") {
      notification.style.borderColor = "var(--warning)";
    } else if (type === "error") {
      notification.style.borderColor = "var(--danger)";
    }

    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.transform = "translateX(0)";
    }, 100);

    setTimeout(() => {
      notification.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  async function fetchScripts() {
    try {
      const response = await fetch(`${API_URL}/api/scripts`);
      scripts = await response.json();
      renderScripts();
      updateSystemStatus();
    } catch (error) {
      console.error("Error fetching scripts:", error);
      showNotification("Failed to fetch scripts", "error");
    }
  }

  function renderScripts() {
    const filteredAndSortedScripts = getFilteredAndSortedScripts();
    scriptList.innerHTML = "";

    if (filteredAndSortedScripts.length === 0) {
      scriptList.innerHTML = `
                <div class="empty-state" style="
                    grid-column: 1 / -1; 
                    text-align: center; 
                    padding: 4rem 2rem; 
                    color: var(--text-muted);
                    background: var(--bg-secondary);
                    border-radius: var(--radius-lg);
                    border: 2px dashed var(--border-primary);
                ">
                    <div style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.5;">📁</div>
                    <h3 style="margin-bottom: 0.5rem; color: var(--text-secondary);">No scripts found</h3>
                    <p>No scripts match your current filters.</p>
                    ${
                      filters.search
                        ? '<p style="margin-top: 1rem;"><button onclick="document.getElementById(\'search-input\').value=\'\'; window.location.reload();" style="padding: 0.5rem 1rem; background: var(--accent-primary); color: white; border: none; border-radius: var(--radius-sm); cursor: pointer;">Clear Search</button></p>'
                        : ""
                    }
                </div>
            `;
    } else {
      filteredAndSortedScripts.forEach((script) => {
        const card = createScriptCard(script);
        scriptList.appendChild(card);
      });
    }

    updateScriptCount(filteredAndSortedScripts.length);
  }

  function createScriptCard(script) {
    const card = document.createElement("div");
    card.className = "script-card";
    card.dataset.id = script.id;
    card.dataset.type = script.type;
    const lastRun = script.lastRun
      ? new Date(script.lastRun).toLocaleString()
      : "Never";
    const isRunning = script.status === "Running";

    const relativeTime = script.lastRun
      ? getRelativeTime(new Date(script.lastRun))
      : "Never";

    card.innerHTML = `
            <div class="card-header">
                <div class="script-info">
                    <svg class="script-icon" data-type="${script.type}">
                        <use xlink:href="#icon-${script.type
                          .toLowerCase()
                          .replace(".", "")}"></use>
                    </svg>
                    <div class="script-details">
                        <h3 class="script-name">${script.name}</h3>
                        <p class="script-type" style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">${
                          script.type
                        }</p>
                    </div>
                </div>
                <span class="status-badge ${
                  script.status
                }" title="Script is ${script.status.toLowerCase()}">
                    ${script.status}
                </span>
            </div>
            <div class="card-body">
                <div class="card-meta">
                    <p style="margin-bottom: 0.5rem;">
                        <strong>Last Run:</strong> 
                        <span class="last-run-time" title="${lastRun}">${relativeTime}</span>
                    </p>
                    ${
                      script.path
                        ? `<p style="margin-bottom: 0.5rem; font-size: 0.8rem; color: var(--text-muted);"><strong>Path:</strong> ${script.path}</p>`
                        : ""
                    }
                </div>
                ${
                  script.tags && script.tags.length > 0
                    ? `
                    <div class="tag-list">
                        ${script.tags
                          .map(
                            (tag) =>
                              `<span class="tag" title="Tag: ${tag}">${tag}</span>`
                          )
                          .join("")}
                    </div>
                `
                    : ""
                }
            </div>
            <div class="card-actions">
                <button class="action-btn run-btn" ${
                  isRunning ? "disabled" : ""
                } title="Run script">
                    <span>${isRunning ? "⏳" : "▶️"}</span> ${
      isRunning ? "Running" : "Run"
    }
                </button>
                <button class="action-btn stop-btn" ${
                  !isRunning ? "disabled" : ""
                } title="Stop script">
                    <span>⏹️</span> Stop
                </button>
                <button class="action-btn env-btn" title="Edit environment variables">
                    <span>🔧</span> .env
                </button>
                <button class="action-btn config-btn" title="Edit configuration">
                    <span>⚙️</span> Config
                </button>
                <button class="action-btn view-log-btn" title="View logs">
                    <span>📋</span> Logs
                </button>
            </div>
        `;

    const runBtn = card.querySelector(".run-btn");
    const stopBtn = card.querySelector(".stop-btn");
    const envBtn = card.querySelector(".env-btn");
    const configBtn = card.querySelector(".config-btn");
    const viewLogBtn = card.querySelector(".view-log-btn");

    runBtn.addEventListener("click", () => {
      runScript(script.id);
      addButtonFeedback(runBtn, "<span>⏳</span> Starting...");
    });

    stopBtn.addEventListener("click", () => {
      stopScript(script.id);
      addButtonFeedback(stopBtn, "<span>⏹️</span> Stopping...");
    });

    envBtn.addEventListener("click", () => {
      openFileEditor(script.id, "env");
    });

    configBtn.addEventListener("click", () => {
      openFileEditor(script.id, "config");
    });

    viewLogBtn.addEventListener("click", () => {
      showLogViewer(script.id);
    });

    card.addEventListener("mouseenter", () => {
      card.style.transform = "translateY(-4px)";
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });

    return card;
  }

  function addButtonFeedback(button, message) {
    const originalText = button.innerHTML;
    button.innerHTML = message;
    button.disabled = true;

    setTimeout(() => {
      button.innerHTML = originalText;
      button.disabled = false;
    }, 2000);
  }

  function getRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  function updateScriptCount(count) {
    if (scriptCount) {
      scriptCount.textContent = `${count} script${count !== 1 ? "s" : ""}`;
    }
  }

  function setupModernFilters() {
    filterOptions.forEach((option) => {
      option.addEventListener("click", () => {
        const filterType = option.dataset.filter;
        const filterValue = option.dataset.value;

        filters[filterType] = filterValue;

        const filterGroup = option.closest(".filter-group");
        const groupOptions = filterGroup.querySelectorAll(".filter-option");

        groupOptions.forEach((opt) => {
          opt.classList.remove("active");
          const checkbox = opt.querySelector(".filter-checkbox");
          checkbox.classList.remove("checked");
        });

        option.classList.add("active");
        const checkbox = option.querySelector(".filter-checkbox");
        checkbox.classList.add("checked");

        option.style.transform = "scale(1.05)";
        setTimeout(() => {
          option.style.transform = "";
        }, 150);

        renderScripts();
        showNotification(
          `Filtered by ${
            option.querySelector(".filter-option-label").textContent
          }`,
          "info"
        );
      });
    });
  }

  async function runScript(scriptId) {
    showLogViewer(scriptId);
    try {
      const response = await fetch(`${API_URL}/api/scripts/run/${scriptId}`, {
        method: "POST",
      });
      if (response.ok) {
        showNotification("Script started successfully", "success");
      } else {
        throw new Error("Failed to start script");
      }
    } catch (error) {
      console.error("Error running script:", error);
      showNotification("Failed to start script", "error");
    }
  }

  async function stopScript(scriptId) {
    try {
      const response = await fetch(`${API_URL}/api/scripts/stop/${scriptId}`, {
        method: "POST",
      });
      if (response.ok) {
        showNotification("Script stopped successfully", "success");
      } else {
        throw new Error("Failed to stop script");
      }
    } catch (error) {
      console.error("Error stopping script:", error);
      showNotification("Failed to stop script", "error");
    }
  }

  function updateScriptStatus(scriptId, status) {
    const script = scripts.find((s) => s.id === scriptId);
    if (script) {
      script.status = status;
      if (status === "Idle") {
        script.lastRun = new Date().toISOString();
      }
    }

    const card = document.querySelector(`.script-card[data-id="${scriptId}"]`);
    if (card) {
      const statusBadge = card.querySelector(".status-badge");
      const runBtn = card.querySelector(".run-btn");
      const stopBtn = card.querySelector(".stop-btn");
      const lastRunTime = card.querySelector(".last-run-time");

      statusBadge.textContent = status;
      statusBadge.className = `status-badge ${status}`;

      const isRunning = status === "Running";
      runBtn.disabled = isRunning;
      stopBtn.disabled = !isRunning;

      runBtn.innerHTML = isRunning
        ? "<span>⏳</span> Running"
        : "<span>▶️</span> Run";

      if (!isRunning && lastRunTime) {
        const now = new Date();
        lastRunTime.textContent = getRelativeTime(now);
        lastRunTime.title = now.toLocaleString();
      }
    }

    updateSystemStatus();
  }

  function getFilteredAndSortedScripts() {
    let result = scripts.filter((script) => {
      const matchesType =
        filters.type === "all" || script.type === filters.type;
      const matchesStatus =
        filters.status === "all" || script.status === filters.status;
      const matchesSearch =
        script.name.toLowerCase().includes(filters.search) ||
        (script.tags &&
          script.tags.some((t) => t.toLowerCase().includes(filters.search)));
      return matchesType && matchesStatus && matchesSearch;
    });

    result.sort((a, b) => {
      switch (sort) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "type":
          return a.type.localeCompare(b.type) || a.name.localeCompare(b.name);
        case "last-run":
          const dateA = a.lastRun ? new Date(a.lastRun) : 0;
          const dateB = b.lastRun ? new Date(b.lastRun) : 0;
          return dateB - dateA;
        default:
          return 0;
      }
    });

    return result;
  }

  function showLogViewer(scriptId) {
    const script = scripts.find((s) => s.id === scriptId);
    if (!script) return;

    if (currentLogScriptId !== scriptId) {
      logOutput.innerHTML = "";
      currentLogScriptId = scriptId;
    }

    logScriptName.textContent = script.name;
    logViewer.classList.add("visible");
  }

  function appendLog(message, stream) {
    const emptyConsole = logOutput.querySelector(".empty-console");
    if (emptyConsole) {
      emptyConsole.remove();
    }

    const line = document.createElement("div");
    line.className = `log-line ${stream}`;
    line.textContent = message;
    logOutput.appendChild(line);
    logOutput.scrollTop = logOutput.scrollHeight;
  }

  function downloadLogFile() {
    if (!currentLogScriptId) {
      showNotification("No script selected", "warning");
      return;
    }

    const script = scripts.find((s) => s.id === currentLogScriptId);
    const logContent = Array.from(logOutput.querySelectorAll(".log-line"))
      .map((line) => line.textContent)
      .join("\n");

    const blob = new Blob([logContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${script ? script.name : "script"}_log_${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification("Log file downloaded", "success");
  }

  async function openFileEditor(scriptId, fileType) {
    const script = scripts.find((s) => s.id === scriptId);
    if (!script) return;

    currentEditingScriptId = scriptId;
    currentEditingFileType = fileType;

    let fileName, endpoint, language;

    if (fileType === "env") {
      fileName = ".env";
      endpoint = `/api/scripts/env/${scriptId}`;
      language = "properties";
      editorModalTitle.textContent = "Edit Environment Variables";
      editorFileType.textContent = "ENV";
      editorFileType.className = "file-type-badge env";
    } else if (fileType === "config") {
      if (script.type === "Node.js") {
        fileName = "package.json";
        endpoint = `/api/scripts/config/${scriptId}`;
        language = "json";
        editorModalTitle.textContent = "Edit Package Configuration";
        editorFileType.textContent = "JSON";
        editorFileType.className = "file-type-badge json";
      } else {
        fileName = "requirements.txt";
        endpoint = `/api/scripts/config/${scriptId}`;
        language = "text";
        editorModalTitle.textContent = "Edit Requirements";
        editorFileType.textContent = "TXT";
        editorFileType.className = "file-type-badge";
      }
    }

    editorScriptName.textContent = script.name;
    editorFilePath.textContent = `${script.path}/${fileName}`;

    try {
      const response = await fetch(`${API_URL}${endpoint}`);
      const content = await response.text();
      originalContent = content;

      codeEditor.value = content;
      updateSyntaxHighlighting(content, language);
      editorModal.classList.add("active");
      codeEditor.focus();

      setEditorStatus("Ready", "success");
    } catch (error) {
      console.error("Error fetching file:", error);
      setEditorStatus("Error loading file", "error");
    }
  }

  function setupEventListeners() {
    setupQuickSearch();
    setupModernFilters();

    if (themeToggle) {
      themeToggle.addEventListener("click", toggleTheme);
    }

    if (refreshScriptsBtn) {
      refreshScriptsBtn.addEventListener("click", () => {
        fetchScripts();
        showNotification("Scripts refreshed", "success");
      });
    }

    sortSelect.addEventListener("change", (e) => {
      sort = e.target.value;
      renderScripts();
      showNotification(`Sorted by ${e.target.selectedOptions[0].text}`, "info");
    });

    if (clearLogBtn) {
      clearLogBtn.addEventListener("click", () => {
        logOutput.innerHTML =
          '<div class="empty-console"><span class="empty-icon">📟</span><span>Console cleared</span></div>';
        showNotification("Console cleared", "info");
      });
    }

    if (closeLogBtn) {
      closeLogBtn.addEventListener("click", () => {
        logViewer.classList.remove("visible");
      });
    }

    if (downloadLog) {
      downloadLog.addEventListener("click", downloadLogFile);
    }

    if (closeEditorModalBtn) {
      closeEditorModalBtn.addEventListener("click", () => {
        editorModal.classList.remove("active");
        resetEditor();
      });
    }

    if (cancelEditorBtn) {
      cancelEditorBtn.addEventListener("click", () => {
        codeEditor.value = originalContent;
        updateSyntaxHighlighting(
          originalContent,
          currentEditingFileType === "config" ? "json" : "properties"
        );
        editorModal.classList.remove("active");
        resetEditor();
      });
    }

    if (saveEditorBtn) {
      saveEditorBtn.addEventListener("click", saveFileContent);
    }

    if (formatBtn) {
      formatBtn.addEventListener("click", formatCode);
    }

    if (validateBtn) {
      validateBtn.addEventListener("click", validateCode);
    }

    if (codeEditor) {
      codeEditor.addEventListener("input", (e) => {
        const language =
          currentEditingFileType === "config" ? "json" : "properties";
        updateSyntaxHighlighting(e.target.value, language);

        if (editorStatus && editorStatus.textContent.includes("Saved")) {
          setEditorStatus("Modified", "");
        }
      });

      codeEditor.addEventListener("scroll", () => {
        if (codeHighlight) {
          codeHighlight.scrollTop = codeEditor.scrollTop;
          codeHighlight.scrollLeft = codeEditor.scrollLeft;
        }
      });

      codeEditor.addEventListener("keydown", (e) => {
        if (e.key === "Tab") {
          e.preventDefault();
          const start = codeEditor.selectionStart;
          const end = codeEditor.selectionEnd;
          codeEditor.value =
            codeEditor.value.substring(0, start) +
            "  " +
            codeEditor.value.substring(end);
          codeEditor.selectionStart = codeEditor.selectionEnd = start + 2;

          const language =
            currentEditingFileType === "config" ? "json" : "properties";
          updateSyntaxHighlighting(codeEditor.value, language);
        }
      });
    }

    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }

      if (e.key === "Escape") {
        if (document.activeElement === searchInput) {
          searchInput.blur();
        } else if (editorModal && editorModal.classList.contains("active")) {
          editorModal.classList.remove("active");
          resetEditor();
        } else if (logViewer && logViewer.classList.contains("visible")) {
          logViewer.classList.remove("visible");
        }
      }
    });

    if (editorModal) {
      editorModal.addEventListener("click", (e) => {
        if (e.target === editorModal) {
          editorModal.classList.remove("active");
          resetEditor();
        }
      });
    }
  }

  function resetEditor() {
    currentEditingScriptId = null;
    currentEditingFileType = null;
    originalContent = "";
    if (editorStatus) {
      setEditorStatus("", "");
    }
  }

  function updateSyntaxHighlighting(code, language) {
    if (codeHighlight && codeHighlight.querySelector("code")) {
      codeHighlight.querySelector("code").textContent = code;
      codeHighlight.className = `language-${language}`;
      if (window.Prism) {
        Prism.highlightElement(codeHighlight.querySelector("code"));
      }
    }
  }

  function setEditorStatus(message, type = "") {
    if (editorStatus) {
      editorStatus.textContent = message;
      editorStatus.className = `editor-status ${type}`;
    }
  }

  async function saveFileContent() {
    if (!currentEditingScriptId || !currentEditingFileType) return;

    const content = codeEditor.value;

    if (currentEditingFileType === "config" && content.trim()) {
      try {
        JSON.parse(content);
      } catch (e) {
        setEditorStatus("Invalid JSON format", "error");
        return;
      }
    }

    const endpoint =
      currentEditingFileType === "env"
        ? `/api/scripts/env/${currentEditingScriptId}`
        : `/api/scripts/config/${currentEditingScriptId}`;

    try {
      setEditorStatus("Saving...", "");
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        originalContent = content;
        setEditorStatus("Saved successfully", "success");
        showNotification("File saved successfully", "success");
        setTimeout(() => {
          editorModal.classList.remove("active");
          resetEditor();
        }, 1500);
      } else {
        throw new Error("Failed to save file");
      }
    } catch (error) {
      console.error("Error saving file:", error);
      setEditorStatus("Failed to save file", "error");
      showNotification("Failed to save file", "error");
    }
  }

  function formatCode() {
    if (currentEditingFileType === "config") {
      try {
        const parsed = JSON.parse(codeEditor.value);
        const formatted = JSON.stringify(parsed, null, 2);
        codeEditor.value = formatted;
        updateSyntaxHighlighting(formatted, "json");
        setEditorStatus("Code formatted", "success");
        showNotification("Code formatted", "success");
      } catch (e) {
        setEditorStatus("Invalid JSON - cannot format", "error");
        showNotification("Invalid JSON - cannot format", "error");
      }
    } else {
      setEditorStatus("Format not available for this file type", "");
      showNotification("Format not available for this file type", "warning");
    }
  }

  function validateCode() {
    if (currentEditingFileType === "config") {
      try {
        JSON.parse(codeEditor.value);
        setEditorStatus("Valid JSON", "success");
        showNotification("JSON is valid", "success");
      } catch (e) {
        setEditorStatus(`Invalid JSON: ${e.message}`, "error");
        showNotification(`Invalid JSON: ${e.message}`, "error");
      }
    } else if (currentEditingFileType === "env") {
      const lines = codeEditor.value.split("\n");
      const errors = [];
      lines.forEach((line, index) => {
        if (line.trim() && !line.startsWith("#") && !line.includes("=")) {
          errors.push(`Line ${index + 1}: Missing '=' in environment variable`);
        }
      });

      if (errors.length === 0) {
        setEditorStatus("Valid environment file", "success");
        showNotification("Environment file is valid", "success");
      } else {
        setEditorStatus(errors[0], "error");
        showNotification(errors[0], "error");
      }
    }
  }

  startApp();
});
