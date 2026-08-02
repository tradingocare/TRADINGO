@echo off
setlocal enabledelayedexpansion
set BASE=http://localhost:3001/api/v1
set TEMP=%TEMP%
set PASS=0
set FAIL=0

echo ======== LOGIN ========

echo {"identifier":"newtest@tradingo.com","password":"Test@1234"} > "%TEMP%\login_buyer2.json"
for /f %%i in ('curl -s -X POST %BASE%/auth/login -H "Content-Type: application/json" --data "@%TEMP%\login_buyer2.json"') do set BUYER_RESP=%%i
rem parse token

echo "Cannot parse JSON in batch, switching to node script"
node E:\tradingo\test-runner.mjs
