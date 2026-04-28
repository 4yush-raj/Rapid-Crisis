#!/usr/bin/env python3
"""
Direct database update script - applies schema changes directly to SQLite
"""
import os
import sqlite3
import sys

backend_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(backend_dir, 'db.sqlite3')

if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    sys.exit(1)

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("Checking and adding missing columns...")
    
    # Check if phone column exists
    cursor.execute("PRAGMA table_info(core_user)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'phone' not in columns:
        print("Adding phone column...")
        cursor.execute("ALTER TABLE core_user ADD COLUMN phone VARCHAR(20)")
        
    if 'department' not in columns:
        print("Adding department column...")
        cursor.execute("ALTER TABLE core_user ADD COLUMN department VARCHAR(20) DEFAULT 'general'")
    
    # Check incident table
    cursor.execute("PRAGMA table_info(core_incident)")
    inc_columns = [col[1] for col in cursor.fetchall()]
    
    if 'authority_contacted_by_id' not in inc_columns:
        print("Adding authority_contacted_by_id column...")
        cursor.execute("ALTER TABLE core_incident ADD COLUMN authority_contacted_by_id INTEGER")
    
    # Check if message table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='core_message'")
    if not cursor.fetchone():
        print("Creating core_message table...")
        cursor.execute('''
            CREATE TABLE core_message (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                incident_id INTEGER NOT NULL,
                sent_by_id INTEGER NOT NULL,
                sent_to_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (incident_id) REFERENCES core_incident(id),
                FOREIGN KEY (sent_by_id) REFERENCES core_user(id),
                FOREIGN KEY (sent_to_id) REFERENCES core_user(id)
            )
        ''')
    
    conn.commit()
    conn.close()
    
    print("\n✓ Database schema updated successfully!")
    
except sqlite3.OperationalError as e:
    if 'already exists' in str(e).lower():
        print(f"Column already exists: {e}")
        print("✓ Schema is up to date")
    else:
        print(f"✗ Error: {e}")
        sys.exit(1)
except Exception as e:
    print(f"✗ Unexpected error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
