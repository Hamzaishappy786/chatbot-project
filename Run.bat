@echo off

REM Navigate to backend and start server
cd backend
start cmd /k "npm run dev"

REM Navigate to frontend and start frontend app
cd ..\frontend
start cmd /k "npm start"
