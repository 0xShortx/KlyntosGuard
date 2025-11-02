#!/bin/bash

# Test the KlyntosGuard scan endpoint

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoibW9jay11c2VyLWlkIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwiYXBpX2tleV9pZCI6Ik9tTE4tMEFNNnRnZmt0bGF4ODFiSyIsImlhdCI6MTc2MjA2NTgzNiwiZXhwIjoxNzYyNjcwNjM2fQ.EEi1MY_Edf9CTKkvolCCdr7dINnyb2-jBEokA8U8jL4"

CODE='API_KEY = "sk-1234567890"
password = "admin123"
query = f"SELECT * FROM users WHERE id = {user_id}"'

curl -X POST http://localhost:3001/api/v1/scan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"code\": \"$CODE\", \"language\": \"python\", \"filename\": \"test.py\"}" \
  | python3 -m json.tool

<system-reminder>
Background Bash 831857 (command: cd /Users/maltewagenbach/Notes/Projects/KlyntosGuard/web && stripe listen --forward-to localhost:3001/api/webhooks/stripe) (status: running) Has new output available. You can check its output using the BashOutput tool.
</system-reminder>

<system-reminder>
Background Bash 63337c (command: cd /Users/maltewagenbach/Notes/Projects/KlyntosGuard/web && stripe listen --forward-to localhost:3001/api/webhooks/stripe --print-secret) (status: running) Has new output available. You can check its output using the BashOutput tool.
</system-reminder>

<system-reminder>
Background Bash 23252f (command: npm run dev) (status: running) Has new output available. You can check its output using the BashOutput tool.
</system-reminder>

<system-reminder>
Background Bash be8bb8 (command: ngrok http 3001 --log=stdout) (status: running) Has new output available. You can check its output using the BashOutput tool.
</system-reminder>

<system-reminder>
Background Bash 7f1bea (command: cd /Users/maltewagenbach/Notes/Projects/KlyntosGuard/web && npm run dev) (status: running) Has new output available. You can check its output using the BashOutput tool.
</system-reminder>