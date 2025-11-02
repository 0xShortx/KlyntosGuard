"""
Test file with intentional security vulnerabilities
DO NOT USE IN PRODUCTION
"""

import os
import sqlite3

# VULNERABILITY 1: Hardcoded API key
API_KEY = "sk-1234567890abcdefghijklmnopqrstuvwxyz"
OPENAI_KEY = "sk-proj-abc123xyz789"

# VULNERABILITY 2: Hardcoded password
DATABASE_PASSWORD = "admin123"
db_connection = f"postgresql://admin:{DATABASE_PASSWORD}@localhost/mydb"

# VULNERABILITY 3: SQL Injection
def get_user(username):
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    # Vulnerable to SQL injection!
    query = f"SELECT * FROM users WHERE username = '{username}'"
    cursor.execute(query)
    return cursor.fetchone()

# VULNERABILITY 4: Command Injection
def run_command(user_input):
    # Dangerous! User input directly in shell command
    os.system(f"ping {user_input}")

# VULNERABILITY 5: PII exposure
customer_data = {
    "email": "john.doe@example.com",
    "ssn": "123-45-6789",
    "credit_card": "4532-1234-5678-9010",
    "phone": "+1-555-123-4567"
}

# VULNERABILITY 6: Path Traversal
def read_file(filename):
    # Vulnerable to path traversal attacks
    with open(f"/var/www/uploads/{filename}", "r") as f:
        return f.read()

# VULNERABILITY 7: Weak cryptography
from hashlib import md5

def hash_password(password):
    # MD5 is not secure for password hashing!
    return md5(password.encode()).hexdigest()

# VULNERABILITY 8: Missing authentication
def delete_user(user_id):
    # No authentication or authorization check!
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    cursor.execute(f"DELETE FROM users WHERE id = {user_id}")
    conn.commit()

print("This file contains intentional vulnerabilities for testing purposes")
