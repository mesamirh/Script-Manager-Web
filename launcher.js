#!/usr/bin/env node

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

console.clear();
console.log("╔══════════════════════════════════════╗");
console.log("║         Script Manager Web           ║");
console.log("║           Server Launcher            ║");
console.log("╚══════════════════════════════════════╝");
console.log();

const platform = os.platform();
const nodeVersion = process.version;

console.log(`🖥️  Platform: ${platform}`);
console.log(`📦 Node.js: ${nodeVersion}`);
console.log();

// Check Node.js version
const majorVersion = parseInt(nodeVersion.slice(1).split(".")[0]);
if (majorVersion < 16) {
  console.log("❌ ERROR: Node.js 16.0.0 or higher is required");
  console.log("   Current version:", nodeVersion);
  console.log("   Please update Node.js from https://nodejs.org/");
  process.exit(1);
}

// Check if package.json exists
if (!fs.existsSync("package.json")) {
  console.log("❌ ERROR: package.json not found");
  console.log("   Please run this launcher from the project root directory");
  process.exit(1);
}

// Check and install dependencies
console.log("🔍 Checking dependencies...");
if (!fs.existsSync("node_modules")) {
  console.log("📦 Installing dependencies...");
  console.log("   This may take a few minutes on first run...");

  const npmInstall = spawn("npm", ["install"], {
    stdio: "inherit",
    shell: true,
  });

  npmInstall.on("close", (code) => {
    if (code !== 0) {
      console.log("❌ Failed to install dependencies");
      process.exit(1);
    }
    startServer();
  });
} else {
  console.log("✅ Dependencies found");
  startServer();
}

function startServer() {
  console.log();
  console.log("🚀 Starting Script Manager Web Server...");
  console.log();
  console.log("┌─────────────────────────────────────┐");
  console.log("│  Server URL: http://localhost:3000  │");
  console.log("└─────────────────────────────────────┘");
  console.log();
  console.log("📝 Server will start in a few seconds...");
  console.log("🌐 Your browser should open automatically");
  console.log("🛑 Press Ctrl+C to stop the server");
  console.log();

  // Start the server
  const server = spawn("node", ["backend/server.js"], {
    stdio: "inherit",
    shell: true,
  });

  // Open browser after a delay
  setTimeout(() => {
    openBrowser("http://localhost:3000");
  }, 3000);

  // Handle server close
  server.on("close", (code) => {
    console.log();
    if (code === 0) {
      console.log("✅ Server stopped gracefully");
    } else {
      console.log(`❌ Server stopped with error code: ${code}`);
    }
    console.log("Press any key to exit...");
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", () => process.exit(0));
  });

  // Handle launcher close
  process.on("SIGINT", () => {
    console.log("\n🛑 Stopping server...");
    server.kill("SIGINT");
  });
}

function openBrowser(url) {
  const platform = os.platform();
  let command;

  switch (platform) {
    case "darwin": // macOS
      command = "open";
      break;
    case "win32": // Windows
      command = "start";
      url = `"${url}"`;
      break;
    default: // Linux and others
      command = "xdg-open";
      break;
  }

  console.log(`🌐 Opening browser: ${url}`);
  spawn(command, [url], {
    detached: true,
    stdio: "ignore",
    shell: true,
  }).unref();
}
