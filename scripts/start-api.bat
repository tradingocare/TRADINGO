@echo off
cd /d E:\tradingo\apps\api
set NODE_ENV=production
start /B /MIN node dist\main.js > E:\tradingo\logs\api-stdout.log 2> E:\tradingo\logs\api-stderr.log
exit /b 0
