@echo off
REM Change to the backend directory
cd /d "%~dp0"

REM Run the Python migration script
python apply_migrations.py

REM Wait for user input
pause
