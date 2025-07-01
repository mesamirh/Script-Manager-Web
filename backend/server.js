const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const chokidar = require("chokidar");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

const SCRIPTS_BASE_DIR = path.join(__dirname, "../scripts");
const NODE_SCRIPTS_DIR = path.join(SCRIPTS_BASE_DIR, "nodejs");
const PYTHON_SCRIPTS_DIR = path.join(SCRIPTS_BASE_DIR, "python");

[NODE_SCRIPTS_DIR, PYTHON_SCRIPTS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

let runningProcesses = new Map();
let scriptMetadata = new Map();

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => console.log("Client connected"));
wss.on("close", () => console.log("Client disconnected"));

function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

app.use(express.static(path.join(__dirname, "../frontend")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

const getScripts = () => {
  const readDirForProjects = (dir, type) => {
    if (!fs.existsSync(dir)) return [];

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const scripts = [];

    const standaloneFiles = entries.filter((dirent) => dirent.isFile());
    standaloneFiles.forEach((file) => {
      const filePath = path.join(dir, file.name);
      const fileName = file.name;
      let isRunnable = false;

      if (
        type === "Node.js" &&
        (fileName.endsWith(".js") || fileName.endsWith(".mjs"))
      ) {
        isRunnable = true;
        const scriptId = `${type
          .toLowerCase()
          .replace(".", "")}_${fileName.replace(/\.[^/.]+$/, "")}`;
        scripts.push({
          id: scriptId,
          name: fileName.replace(/\.[^/.]+$/, ""),
          type: type,
          path: path.dirname(filePath),
          fileName: fileName,
          status: runningProcesses.has(scriptId) ? "Running" : "Idle",
          lastRun: scriptMetadata.get(scriptId)?.lastRun || null,
          tags: ["standalone"],
          isRunnable: true,
          isStandalone: true,
        });
      } else if (type === "Python" && fileName.endsWith(".py")) {
        isRunnable = true;
        const scriptId = `${type
          .toLowerCase()
          .replace(".", "")}_${fileName.replace(/\.[^/.]+$/, "")}`;
        scripts.push({
          id: scriptId,
          name: fileName.replace(/\.[^/.]+$/, ""),
          type: type,
          path: path.dirname(filePath),
          fileName: fileName,
          status: runningProcesses.has(scriptId) ? "Running" : "Idle",
          lastRun: scriptMetadata.get(scriptId)?.lastRun || null,
          tags: ["standalone"],
          isRunnable: true,
          isStandalone: true,
        });
      }
    });

    const directories = entries.filter((dirent) => dirent.isDirectory());
    directories.forEach((dirent) => {
      const projectPath = path.join(dir, dirent.name);
      let tags = [];
      let isRunnable = false;

      if (type === "Node.js") {
        const pkgJsonPath = path.join(projectPath, "package.json");
        const mainJsPath = path.join(projectPath, "index.js");
        const appJsPath = path.join(projectPath, "app.js");
        const mainTsPath = path.join(projectPath, "index.ts");

        if (fs.existsSync(pkgJsonPath)) {
          try {
            const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
            if (pkg.scripts && pkg.scripts.start) {
              isRunnable = true;
            }
            tags = pkg.keywords || [];
          } catch (e) {
            console.error(`Invalid package.json in ${projectPath}`);
          }
        } else if (
          fs.existsSync(mainJsPath) ||
          fs.existsSync(appJsPath) ||
          fs.existsSync(mainTsPath)
        ) {
          isRunnable = true;
          tags = ["project"];
        }
      } else if (type === "Python") {
        const runShPath = path.join(projectPath, "run.sh");
        const mainPyPath = path.join(projectPath, "main.py");
        const appPyPath = path.join(projectPath, "app.py");
        const requirementsPath = path.join(projectPath, "requirements.txt");

        if (fs.existsSync(runShPath)) {
          isRunnable = true;
          tags.push("shell-script");
        } else if (fs.existsSync(mainPyPath) || fs.existsSync(appPyPath)) {
          isRunnable = true;
          tags.push("python-script");
        }

        if (fs.existsSync(requirementsPath)) {
          tags.push("requirements");
        }
      }

      if (isRunnable) {
        const scriptId = `${type.toLowerCase().replace(".", "")}_${
          dirent.name
        }`;
        scripts.push({
          id: scriptId,
          name: dirent.name,
          type: type,
          path: projectPath,
          status: runningProcesses.has(scriptId) ? "Running" : "Idle",
          lastRun: scriptMetadata.get(scriptId)?.lastRun || null,
          tags: tags,
          isRunnable: true,
          isStandalone: false,
        });
      }
    });

    return scripts;
  };

  const nodeScripts = readDirForProjects(NODE_SCRIPTS_DIR, "Node.js");
  const pythonScripts = readDirForProjects(PYTHON_SCRIPTS_DIR, "Python");
  return [...nodeScripts, ...pythonScripts];
};

app.get("/api/scripts", (req, res) => res.json(getScripts()));

app.post("/api/scripts/run/:scriptId", (req, res) => {
  const { scriptId } = req.params;
  const script = getScripts().find((s) => s.id === scriptId);

  if (!script || runningProcesses.has(scriptId)) {
    return res
      .status(400)
      .json({ error: "Script not found or already running" });
  }

  const envPath = path.join(script.path, ".env");
  const scriptEnv = { ...process.env };
  if (fs.existsSync(envPath)) {
    try {
      Object.assign(
        scriptEnv,
        require("dotenv").parse(fs.readFileSync(envPath))
      );
    } catch (e) {
      console.error(`Error loading .env file for ${script.name}:`, e.message);
    }
  }

  let command, args;
  if (script.type === "Node.js") {
    if (script.isStandalone) {
      command = "node";
      args = [script.fileName];
    } else {
      const pkgJsonPath = path.join(script.path, "package.json");
      if (fs.existsSync(pkgJsonPath)) {
        command = "npm";
        args = ["start"];
      } else {
        command = "node";
        if (fs.existsSync(path.join(script.path, "index.js"))) {
          args = ["index.js"];
        } else if (fs.existsSync(path.join(script.path, "app.js"))) {
          args = ["app.js"];
        } else {
          return res.status(400).json({ error: "No runnable file found" });
        }
      }
    }
  } else if (script.type === "Python") {
    if (script.isStandalone) {
      command = "python3";
      args = [script.fileName];
    } else {
      const runShPath = path.join(script.path, "run.sh");
      if (fs.existsSync(runShPath)) {
        command = "sh";
        args = ["run.sh"];
      } else if (fs.existsSync(path.join(script.path, "main.py"))) {
        command = "python3";
        args = ["main.py"];
      } else if (fs.existsSync(path.join(script.path, "app.py"))) {
        command = "python3";
        args = ["app.py"];
      } else {
        return res.status(400).json({ error: "No runnable Python file found" });
      }
    }
  }

  try {
    const child = spawn(command, args, {
      cwd: script.path,
      env: scriptEnv,
      shell: true,
      detached: false,
    });

    runningProcesses.set(scriptId, child);

    const updateStatus = (status) =>
      broadcast({ type: "status_update", scriptId, status });
    updateStatus("Running");
    broadcast({
      type: "log",
      scriptId,
      stream: "stdout",
      message: `[SYSTEM] Starting ${
        script.name
      } with command '${command} ${args.join(" ")}'...\n`,
    });

    child.stdout.on("data", (data) => {
      broadcast({
        type: "log",
        scriptId,
        stream: "stdout",
        message: data.toString(),
      });
    });

    child.stderr.on("data", (data) => {
      broadcast({
        type: "log",
        scriptId,
        stream: "stderr",
        message: data.toString(),
      });
    });

    child.on("close", (code) => {
      const message = `[SYSTEM] ${script.name} finished with exit code ${code}\n`;
      broadcast({ type: "log", scriptId, stream: "stdout", message });
      runningProcesses.delete(scriptId);
      scriptMetadata.set(scriptId, {
        ...scriptMetadata.get(scriptId),
        lastRun: new Date().toISOString(),
      });
      updateStatus("Idle");
    });

    child.on("error", (err) => {
      const message = `[SYSTEM] Failed to start ${script.name}: ${err.message}\n`;
      broadcast({ type: "log", scriptId, stream: "stderr", message });
      runningProcesses.delete(scriptId);
      updateStatus("Idle");
    });

    res.json({ message: `${script.name} execution started successfully` });
  } catch (error) {
    console.error(`Error starting script ${scriptId}:`, error);
    res.status(500).json({ error: "Failed to start script execution" });
  }
});

app.post("/api/scripts/stop/:scriptId", (req, res) => {
  const { scriptId } = req.params;
  const child = runningProcesses.get(scriptId);
  if (child) {
    try {
      if (!child.killed && child.pid) {
        try {
          process.kill(-child.pid, "SIGTERM");
        } catch (groupError) {
          if (groupError.code === "ESRCH") {
            try {
              process.kill(child.pid, "SIGTERM");
            } catch (mainError) {
              if (mainError.code !== "ESRCH") {
                throw mainError;
              }
            }
          } else {
            throw groupError;
          }
        }

        setTimeout(() => {
          if (!child.killed && child.pid) {
            try {
              process.kill(child.pid, "SIGKILL");
            } catch (killError) {
              if (killError.code !== "ESRCH") {
                console.error(
                  `Error force killing process ${child.pid}:`,
                  killError.message
                );
              }
            }
          }
        }, 5000);

        res.json({ message: "Stop signal sent" });
      } else {
        runningProcesses.delete(scriptId);
        broadcast({ type: "status_update", scriptId, status: "Idle" });
        res.json({ message: "Process was already terminated" });
      }
    } catch (error) {
      console.error(
        `Error stopping process for script ${scriptId}:`,
        error.message
      );

      runningProcesses.delete(scriptId);
      broadcast({ type: "status_update", scriptId, status: "Idle" });
      res
        .status(500)
        .json({ error: "Failed to stop process, but cleaned up tracking" });
    }
  } else {
    res.status(400).json({ error: "Project not running" });
  }
});

app.get("/api/scripts/env/:scriptId", (req, res) => {
  const script = getScripts().find((s) => s.id === req.params.scriptId);
  if (!script) return res.status(404).send("Script not found");
  const envPath = path.join(script.path, ".env");
  res.send(fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "");
});

app.post("/api/scripts/env/:scriptId", (req, res) => {
  const script = getScripts().find((s) => s.id === req.params.scriptId);
  if (!script) return res.status(404).send("Script not found");
  fs.writeFileSync(path.join(script.path, ".env"), req.body.content, "utf8");
  res.json({ message: "Environment file saved" });
});

app.get("/api/scripts/config/:scriptId", (req, res) => {
  const script = getScripts().find((s) => s.id === req.params.scriptId);
  if (!script) return res.status(404).send("Script not found");

  let configPath;
  if (script.type === "Node.js") {
    configPath = path.join(script.path, "package.json");
  } else if (script.type === "Python") {
    configPath = path.join(script.path, "requirements.txt");
    if (!fs.existsSync(configPath)) {
      configPath = path.join(script.path, "setup.py");
    }
  }

  if (fs.existsSync(configPath)) {
    res.send(fs.readFileSync(configPath, "utf8"));
  } else {
    if (script.type === "Node.js") {
      res.send(
        JSON.stringify(
          {
            name: script.name,
            version: "1.0.0",
            scripts: {
              start: "node index.js",
            },
            dependencies: {},
          },
          null,
          2
        )
      );
    } else {
      res.send(
        "# Add your Python requirements here\n# Example:\n# requests>=2.25.1\n# numpy>=1.21.0\n"
      );
    }
  }
});

app.post("/api/scripts/config/:scriptId", (req, res) => {
  const script = getScripts().find((s) => s.id === req.params.scriptId);
  if (!script) return res.status(404).send("Script not found");

  let configPath;
  if (script.type === "Node.js") {
    configPath = path.join(script.path, "package.json");

    try {
      JSON.parse(req.body.content);
    } catch (e) {
      return res.status(400).json({ error: "Invalid JSON format" });
    }
  } else if (script.type === "Python") {
    configPath = path.join(script.path, "requirements.txt");
  }

  try {
    fs.writeFileSync(configPath, req.body.content, "utf8");
    res.json({ message: "Configuration file saved" });

    broadcast({ type: "refresh_scripts" });
  } catch (error) {
    console.error("Error saving config file:", error);
    res.status(500).json({ error: "Failed to save configuration file" });
  }
});

const watcher = chokidar.watch([NODE_SCRIPTS_DIR, PYTHON_SCRIPTS_DIR], {
  ignored: /(^|[\/\\])\..|node_modules/,
  persistent: true,
  depth: 1,
});

watcher
  .on("addDir", () => broadcast({ type: "refresh_scripts" }))
  .on("unlinkDir", () => broadcast({ type: "refresh_scripts" }));

server.listen(PORT, "0.0.0.0", () => {
  console.log(
    `🚀 Local Script Runner Dashboard running on http://localhost:${PORT}`
  );
});
