# 🚀 Script Manager Web

A modern, professional web dashboard for managing and running local Node.js and Python scripts with real-time monitoring, file editing, and console output.

![Script Manager Web](https://img.shields.io/badge/Node.js->=16.0.0-green)

## ✨ Features

### 🎨 **Modern UI/UX**

- **Dark/Light Theme** with GitHub-inspired design
- **Responsive Layout** - Perfect on desktop, tablet, and mobile
- **Real-time Updates** via WebSocket connections
- **Professional Animations** and micro-interactions

### 🔧 **Script Management**

- **Auto-Discovery** of Node.js and Python projects
- **One-Click Execution** with real-time console output
- **Process Control** - Start, stop, and monitor scripts
- **Environment Management** - Edit .env files directly
- **Configuration Editing** - Modify package.json and requirements.txt

### 📊 **Monitoring & Logging**

- **Live Console Output** with color-coded streams
- **System Status** monitoring (running scripts, memory usage)
- **Log Download** functionality
- **Script History** with last run timestamps

### 🔍 **Advanced Features**

- **Smart Search** with Enter-to-run functionality
- **Advanced Filtering** by language type and status
- **File Editor** with syntax highlighting
- **Keyboard Shortcuts** (Ctrl/Cmd+K for search)

## 🚀 Quick Start

### 🖱️ **Easy Launch (Recommended)**

**For Windows Users:**

- Double-click on `start-server.bat`

**For macOS Users:**

- **Option 1**: Double-click on `start-server.command` (Always opens in Terminal)
- **Option 2**: Double-click on `Script Manager Web.app` (Native macOS app)
- **Option 3**: Right-click `start-server.sh` → "Open With" → Terminal
- **Troubleshooting**: If `.sh` files open in text editor, use `.command` file instead

**For Linux Users:**

- Double-click on `start-server.sh` (make it executable first: `chmod +x start-server.sh`)

**Cross-Platform:**

- Double-click on `launcher.js` (if Node.js is associated with .js files)
- Or run: `node launcher.js`

### 📋 **Traditional Method**

1. **Clone the repository**:

   ```bash
   git clone https://github.com/mesamirh/Script-Manager-Web.git
   cd Script-Manager-Web
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Start the application**:

   ```bash
   npm start
   ```

4. **Open your browser**:
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
Script-Manager-Web/
├── backend/
│   └── server.js          # Express server with WebSocket support
├── frontend/
│   ├── index.html         # Main HTML file
│   ├── style.css          # Modern CSS with dark theme
│   └── app.js             # Frontend JavaScript
├── scripts/
│   ├── nodejs/            # Node.js projects
│   └── python/            # Python projects
└── package.json           # Main project dependencies
```

## 🎯 Multiple Ways to Start

1. **🖱️ Double-Click Launch:**

   - Windows: `start-server.bat`
   - macOS: `start-server.command` or `Script Manager Web.app`
   - Linux: `start-server.sh`
   - Cross-platform: `launcher.js`

2. **⌨️ Command Line:**

   ```bash
   npm run launch    # Fancy launcher with auto-browser
   npm start         # Direct server start
   npm run dev       # Development mode with auto-restart
   ```

3. **🔗 Direct Node.js:**
   ```bash
   node launcher.js          # Cross-platform launcher
   node backend/server.js    # Direct server start
   ```

## 🛠️ Adding Scripts

### Node.js Scripts

1. Create a new directory in `scripts/nodejs/`
2. Add your script files
3. Include a `package.json` with a `start` script:
   ```json
   {
     "name": "your-script",
     "scripts": {
       "start": "node index.js"
     }
   }
   ```

### Python Scripts

1. Create a new directory in `scripts/python/`
2. Add your Python files
3. Include either:
   - A `main.py` or `app.py` file (auto-detected)
   - A `run.sh` script for custom execution

## 🎨 Features Overview

### Script Cards

- **Language Icons** - Visual identification of script types
- **Status Badges** - Real-time status with animations
- **Action Buttons** - Run, stop, edit environment, view logs
- **Hover Effects** - Modern UI interactions

### Console Panel

- **Terminal-style Output** with monospace fonts
- **Color-coded Streams** (stdout in green, stderr in red)
- **Auto-scroll** to latest output
- **Download Logs** as text files

### File Editor

- **Syntax Highlighting** with Prism.js
- **Format & Validate** functionality
- **Real-time Status** feedback
- **Modal Interface** with keyboard shortcuts

## ⌨️ Keyboard Shortcuts

- `Ctrl/Cmd + K` - Focus search bar
- `Enter` (in search) - Run matching script
- `Escape` - Close modals or clear search

## 🔧 Configuration

### Environment Variables

Each script can have its own `.env` file for environment-specific configuration.

### Script Requirements

- **Node.js**: Requires `package.json` with a `start` script
- **Python**: Requires `main.py`, `app.py`, or `run.sh`

## 🐛 Troubleshooting

### Common Issues

1. **Can't double-click to run?**

   - **Windows**: Ensure .bat files are associated with Command Prompt
   - **macOS**:
     - Use `start-server.command` instead of `start-server.sh`
     - Or right-click `.sh` file → "Open With" → Terminal
     - Or use the `Script Manager Web.app` bundle
   - **Linux**: Make file executable: `chmod +x start-server.sh`

2. **Scripts not appearing?**

   - Ensure proper directory structure in `scripts/nodejs/` or `scripts/python/`
   - Check that Node.js scripts have `package.json` with a `start` script

3. **WebSocket connection issues?**

   - Check that port 3000 is available
   - Verify firewall settings

4. **Script execution fails?**
   - Check script permissions
   - Verify dependencies are installed
   - Review console output for errors

## 📝 Auto-Start Features

The launcher scripts will automatically:

- ✅ Check if Node.js is installed
- ✅ Install dependencies on first run
- ✅ Start the server
- ✅ Open your browser to the application
- ✅ Show helpful status messages
- ✅ Handle graceful shutdown

## 🙏 Acknowledgments

- **Express.js** for the robust web framework
- **WebSocket** for real-time communication
- **Prism.js** for syntax highlighting
- **Inter Font** for beautiful typography
