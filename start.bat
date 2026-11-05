@echo off
title 3D House Designer
echo Starting 3D House Designer (Client + Server)...
set "PATH=C:\Windows\System32;C:\Windows;C:\Windows\System32\WindowsPowerShell\v1.0;C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"
node dev-runner.js
pause
