web: gunicorn crisis_backend.wsgi:application --bind 0.0.0.0:$PORT
release: python crisis_backend/manage.py migrate
