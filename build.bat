@echo off
chcp 65001 >nul
color 0B
title ميزان POS — بناء التطبيق

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║   ميزان POS — بناء ملف التثبيت .exe               ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

:: Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo  ✗ Node.js غير مثبت
    echo.
    echo  حمّله من: https://nodejs.org
    echo  اختر: LTS version
    pause & exit /b 1
)

for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  ✓ Node.js %NODE_VER%

:: Install dependencies
echo.
echo  ⏳ تثبيت المتطلبات... (قد يأخذ دقيقتين في أول مرة)
call npm install --legacy-peer-deps
if errorlevel 1 (
    echo  ✗ فشل تثبيت المتطلبات
    pause & exit /b 1
)

:: Build
echo.
echo  ⏳ جاري البناء... (قد يأخذ 5-10 دقائق)
echo.
call npm run build
if errorlevel 1 (
    echo.
    echo  ✗ فشل البناء — راجع الأخطاء أعلاه
    pause & exit /b 1
)

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║   ✓ تم البناء بنجاح!                               ║
echo  ║                                                      ║
echo  ║   الملف في مجلد: dist\                              ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
start "" dist
pause
