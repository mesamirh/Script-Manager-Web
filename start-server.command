#!/bin/bash

# Change to script directory
cd "$(dirname "$0")"

echo "╔══════════════════════════════════════╗"
echo "║         Script Manager Web           ║"
echo "║         Terminal Launcher            ║"
echo "╚══════════════════════════════════════╝"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js is not installed"
    echo "   Please install Node.js from https://nodejs.org/"
    echo
    read -p "Press Enter to exit..."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ ERROR: Failed to install dependencies"
        read -p "Press Enter to exit..."
        exit 1
    fi
    echo
fi

echo "🚀 Starting Script Manager Web Server..."
echo "🌐 Server will be available at: http://localhost:3000"
echo "🔧 Press Ctrl+C to stop the server"
echo

# Open browser after a delay
(sleep 3 && open http://localhost:3000) &

# Start the server
node backend/server.js

# Keep terminal open on error
if [ $? -ne 0 ]; then
    echo
    echo "❌ ERROR: Server failed to start"
    read -p "Press Enter to exit..."
fi
