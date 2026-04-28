#!/bin/bash

# Install backend dependencies
pip install -r requirements.txt

# Run database migrations
python crisis_backend/manage.py migrate

# Collect static files
python crisis_backend/manage.py collectstatic --noinput

# Build frontend
cd crisis_frontend
npm install
npm run build
cd ..

echo "Build completed successfully!"
