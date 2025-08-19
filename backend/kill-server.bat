@echo off
echo Killing Node.js processes on port 3002...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3002 ^| findstr LISTENING') do (
    echo Killing process %%a
    taskkill -F -PID %%a 2>nul
)
echo Done.