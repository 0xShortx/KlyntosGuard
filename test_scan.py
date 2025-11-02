#!/usr/bin/env python3
"""Test the KlyntosGuard scan endpoint"""

import httpx
import json

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoibW9jay11c2VyLWlkIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwiYXBpX2tleV9pZCI6Ik9tTE4tMEFNNnRnZmt0bGF4ODFiSyIsImlhdCI6MTc2MjA2NTgzNiwiZXhwIjoxNzYyNjcwNjM2fQ.EEi1MY_Edf9CTKkvolCCdr7dINnyb2-jBEokA8U8jL4"

# Test code with multiple vulnerabilities
test_code = '''API_KEY = "sk-1234567890abcdefghijklmnopqrstuvwxyz"
password = "admin123"

def get_user(user_id):
    query = f"SELECT * FROM users WHERE id = {user_id}"
    return query
'''

payload = {
    "code": test_code,
    "language": "python",
    "filename": "test.py",
    "policies": ["all"]
}

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {TOKEN}"
}

print("Testing KlyntosGuard scan endpoint...")
print(f"Code length: {len(test_code)} characters")
print()

try:
    with httpx.Client(timeout=60.0) as client:
        response = client.post(
            "http://localhost:3001/api/v1/scan",
            json=payload,
            headers=headers
        )

        print(f"Status Code: {response.status_code}")
        print()

        if response.status_code == 200:
            result = response.json()
            print("✓ Scan completed successfully!")
            print()
            print(json.dumps(result, indent=2))
        else:
            print(f"✗ Scan failed: {response.status_code}")
            print(response.text)

except Exception as e:
    print(f"✗ Error: {e}")
