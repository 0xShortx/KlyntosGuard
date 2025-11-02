#!/usr/bin/env python3
"""Test the KlyntosGuard scan endpoint with full vulnerable file"""

import httpx
import json

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoibW9jay11c2VyLWlkIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwiYXBpX2tleV9pZCI6Ik9tTE4tMEFNNnRnZmt0bGF4ODFiSyIsImlhdCI6MTc2MjA2NTgzNiwiZXhwIjoxNzYyNjcwNjM2fQ.EEi1MY_Edf9CTKkvolCCdr7dINnyb2-jBEokA8U8jL4"

# Read the vulnerable test file
with open('test_vulnerable.py', 'r') as f:
    test_code = f.read()

payload = {
    "code": test_code,
    "language": "python",
    "filename": "test_vulnerable.py",
    "policies": ["all"]
}

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {TOKEN}"
}

print("🔍 Testing KlyntosGuard Full Scan")
print(f"📄 File: test_vulnerable.py")
print(f"📏 Code length: {len(test_code)} characters")
print(f"📝 Lines: {len(test_code.splitlines())} lines")
print()

try:
    with httpx.Client(timeout=60.0) as client:
        print("⏳ Scanning... (this may take a moment)")
        response = client.post(
            "http://localhost:3001/api/v1/scan",
            json=payload,
            headers=headers
        )

        if response.status_code == 200:
            result = response.json()
            print()
            print("=" * 60)
            print("✅ SCAN COMPLETED SUCCESSFULLY")
            print("=" * 60)
            print()

            summary = result['result']['summary']
            violations = result['result']['violations']
            scan_time = result['result']['scan_time_ms']

            print(f"⏱️  Scan Time: {scan_time}ms ({scan_time/1000:.2f}s)")
            print()

            print(f"📊 SUMMARY:")
            print(f"  🔴 Critical: {summary['critical']}")
            print(f"  🟠 High:     {summary['high']}")
            print(f"  🟡 Medium:   {summary['medium']}")
            print(f"  🟢 Low:      {summary['low']}")
            print(f"  ℹ️  Info:     {summary['info']}")
            print(f"  📝 Total:    {len(violations)} violations")
            print()

            if violations:
                print("=" * 60)
                print("🚨 VULNERABILITIES FOUND:")
                print("=" * 60)
                print()

                for i, v in enumerate(violations, 1):
                    severity_emoji = {
                        'critical': '🔴',
                        'high': '🟠',
                        'medium': '🟡',
                        'low': '🟢',
                        'info': 'ℹ️'
                    }

                    print(f"{i}. {severity_emoji.get(v['severity'], '❓')} [{v['severity'].upper()}] Line {v.get('line', '?')}")
                    print(f"   Category: {v['category']}")
                    print(f"   Issue: {v['message']}")
                    if v.get('code_snippet'):
                        print(f"   Code: {v['code_snippet']}")
                    if v.get('suggestion'):
                        print(f"   💡 Fix: {v['suggestion']}")
                    print()
            else:
                print("✅ No vulnerabilities found!")

        else:
            print(f"❌ Scan failed: {response.status_code}")
            print(response.text)

except Exception as e:
    print(f"❌ Error: {e}")
