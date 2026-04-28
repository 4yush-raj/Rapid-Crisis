#!/usr/bin/env python
"""Run migrations for the Django project"""
import os
import sys

# Get the directory of this file
backend_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(backend_dir)

# Add to path
sys.path.insert(0, backend_dir)

# Set up Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crisis_backend.settings')

import django
django.setup()

# Run migrations
from django.core.management import call_command

print("Running migrations...")
try:
    call_command('migrate', verbosity=2)
    print("\n✓ Migrations applied successfully!")
except Exception as e:
    print(f"\n✗ Migration error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
