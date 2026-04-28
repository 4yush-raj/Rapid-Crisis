-- SQL script to add missing columns to the database
-- This is for SQLite3

ALTER TABLE core_user ADD COLUMN phone VARCHAR(20);
ALTER TABLE core_user ADD COLUMN department VARCHAR(20) DEFAULT 'general';
ALTER TABLE core_incident ADD COLUMN authority_contacted_by_id INTEGER;

-- Create the message table
CREATE TABLE IF NOT EXISTS core_message (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    incident_id INTEGER NOT NULL,
    sent_by_id INTEGER NOT NULL,
    sent_to_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (incident_id) REFERENCES core_incident(id),
    FOREIGN KEY (sent_by_id) REFERENCES core_user(id),
    FOREIGN KEY (sent_to_id) REFERENCES core_user(id)
);
