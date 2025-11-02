# KlyntosGuard - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Start the Web Dashboard

```bash
cd /Users/maltewagenbach/Notes/Projects/KlyntosGuard/web
npm run dev
```

Dashboard will be available at: **http://localhost:3001**

### Step 2: Start the Guardrails Server

```bash
cd /Users/maltewagenbach/Notes/Projects/KlyntosGuard
./start_guardrails.sh
```

Guardrails server will run on: **http://localhost:8000**

### Step 3: Use the Guardrails

Go to **http://localhost:3001/guardrails** and start chatting!

---

## ✅ What's Ready

- ✅ NeMo Guardrails installed from cloned repo
- ✅ Configuration created for code security
- ✅ Custom actions bridge to scanner
- ✅ Dashboard page at /guardrails
- ✅ API keys generated
- ✅ Environment variables configured

## 🔑 API Keys

**Guardrails API Key**: `kg_c3eecae2212dbfbae263d0d6bcd844d3ac9b94d90db169865334a6486d52d1d5`

Add to database:
```sql
INSERT INTO guard_api_keys (id, key, name, user_id, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '66a9f0d9f4190aa86083eedd02879712473ff36ac4d14952a82c55574784ffd8',
  'Guardrails System',
  'system',
  true,
  NOW(),
  NOW()
);
```

---

## 📚 Documentation

- [GUARDRAILS_STATUS.md](./GUARDRAILS_STATUS.md) - Complete status and architecture
- [NEMO_INTEGRATION_PLAN.md](./NEMO_INTEGRATION_PLAN.md) - Integration details
- [CLI_COMPLETE_GUIDE.md](./CLI_COMPLETE_GUIDE.md) - CLI usage guide
