#!/usr/bin/env python
import os
import sys
import django

if __name__ == "__main__":
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crisis_backend.settings')
    django.setup()
    
    from django.core.management import call_command
    call_command('makemigrations')
    call_command('migrate')
    print("Migrations completed successfully!")
