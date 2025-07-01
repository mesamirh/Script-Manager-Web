# 🚀 Script Manager Web - Launcher Instructions

## Quick Start Guide

### 🖱️ Double-Click to Run

This application now supports **double-click execution** on all platforms!

#### Windows Users

1. Double-click `start-server.bat`
2. A command window will open
3. The server will start automatically
4. Your browser will open to the application

#### macOS Users

1. Double-click `start-server.sh`
2. If prompted, choose "Terminal" to open the file
3. The server will start automatically
4. Your browser will open to the application

**First-time macOS setup:**

```bash
chmod +x start-server.sh
```

#### Linux Users

1. Make the script executable: `chmod +x start-server.sh`
2. Double-click `start-server.sh`
3. The server will start automatically
4. Your browser will open to the application

#### Cross-Platform (Node.js)

1. Double-click `launcher.js` (if .js files are associated with Node.js)
2. Or open terminal and run: `node launcher.js`

## 🔧 What the Launchers Do

### Automatic Setup

- ✅ Check Node.js installation
- ✅ Verify Node.js version (16+ required)
- ✅ Install dependencies automatically
- ✅ Start the web server
- ✅ Open browser automatically
- ✅ Show helpful status messages

### Error Handling

- ❌ Missing Node.js → Shows installation instructions
- ❌ Wrong Node.js version → Shows update instructions
- ❌ Missing dependencies → Installs them automatically
- ❌ Server startup errors → Shows error details

## 📝 Manual Commands

If you prefer command line:

```bash
# Fancy launcher with GUI
node launcher.js

# Quick npm script
npm run launch

# Traditional start
npm start
```

## 🛠️ Troubleshooting

### Windows Issues

- **File won't run**: Right-click → "Run as Administrator"
- **Command window closes**: There might be an error, check Node.js installation

### macOS Issues

- **Permission denied**: Run `chmod +x start-server.sh`
- **App can't be opened**: Go to System Preferences → Security & Privacy → Allow

### Linux Issues

- **Permission denied**: Run `chmod +x start-server.sh`
- **Command not found**: Install Node.js from your package manager

### General Issues

- **Port 3000 busy**: Close other applications using port 3000
- **Browser doesn't open**: Manually go to http://localhost:3000

## 🎯 First Time Setup

1. **Install Node.js** (if not already installed)

   - Download from: https://nodejs.org/
   - Version 16.0.0 or higher required

2. **Download/Clone this project**

3. **Run the launcher**

   - Windows: Double-click `start-server.bat`
   - macOS/Linux: Double-click `start-server.sh`
   - Any platform: `node launcher.js`

4. **Wait for automatic setup**

   - Dependencies will install automatically
   - Server will start
   - Browser will open

5. **Start managing your scripts!**

## 💡 Pro Tips

- Keep the terminal/command window open while using the app
- The server runs at http://localhost:3000
- Press Ctrl+C in the terminal to stop the server
- Close the terminal window to stop everything
- The launcher remembers your setup for faster future starts

## 🔗 Alternative Access

If launchers don't work, you can always:

1. Open terminal/command prompt
2. Navigate to project folder
3. Run `npm install` (first time only)
4. Run `npm start`
5. Open http://localhost:3000 in your browser
