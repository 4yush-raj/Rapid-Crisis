@echo off
cd /d "%~dp0"
cd crisis_backend
python manage.py makemigrations
python manage.py migrate
echo Migrations completed!
pause
