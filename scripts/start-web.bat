@echo off
cd /d E:\tradingo\apps\web\.next\standalone
set NODE_ENV=production
set PORT=3000
start /B /MIN node apps\web\server.js > E:\tradingo\logs\web-stdout.log 2> E:\tradingo\logs\web-stderr.log
exit /b 0
