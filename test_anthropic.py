#!/usr/bin/env python3
"""Test Anthropic API key"""

import anthropic
import os

API_KEY = os.getenv("ANTHROPIC_API_KEY", "YOUR_API_KEY_HERE")

print("Testing Anthropic API key...")
print(f"Key: {API_KEY[:20]}...")
print()

client = anthropic.Anthropic(api_key=API_KEY)

try:
    message = client.messages.create(
        model="claude-3-haiku-20240307",  # Try Haiku which should be available
        max_tokens=1024,
        messages=[
            {"role": "user", "content": "Say hello!"}
        ]
    )
    print("✓ API key works!")
    print(f"Response: {message.content[0].text}")
except Exception as e:
    print(f"✗ Error: {e}")
