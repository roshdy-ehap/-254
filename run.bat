@echo off
chcp 65001 >nul
color 0A
title ميزان POS

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║   ميزان POS — تشغيل مباشر                          ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

node --version >nul 2>&1
if errorlevel 1 (
    echo  ✗ Node.js غير مثبت — https://nodejs.org
    pause & exit /b 1
)

if not exist "node_modules" (
    echo  ⏳ تثبيت المتطلبات (مرة واحدة)...
    call npm install --legacy-peer-deps
)

echo  ✓ تشغيل ميزان POS...
call npm start
