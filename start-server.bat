@echo off
title Script Manager Web Server
echo.
echo ================================
echo   Script Manager Web Server
echo ================================
echo.
echo Starting server...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
)

REM Start the server
echo Server starting on http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo Close this window to stop the server
echo.
node backend/server.js

REM Keep window open if there's an error
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Server failed to start
    pause
)
