"""
Test file with intentional security vulnerabilities for testing
"""
import os
import pickle
import subprocess

# SQL Injection vulnerability
def get_user(username):
    query = f"SELECT * FROM users WHERE username = '{username}'"
    return db.execute(query)

# Command injection vulnerability
def process_file(filename):
    os.system(f"cat {filename}")

# Hardcoded credentials
API_KEY = "sk_live_1234567890abcdef"
DB_PASSWORD = "super_secret_password"

# Insecure deserialization
def load_data(data):
    return pickle.loads(data)

# Path traversal
def read_file(path):
    with open(path, 'r') as f:
        return f.read()

# Weak cryptography
import hashlib
def hash_password(password):
    return hashlib.md5(password.encode()).hexdigest()
