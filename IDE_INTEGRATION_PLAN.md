# IDE Integration Plan - One-Click Installation

## Goal
Make it dead simple for users to install KlyntosGuard in their IDE (VS Code/Cursor) after signing up on the web app.

## Best Solution: VS Code Extension + Deep Links

### Why This Is The Easiest
1. **One Click** - User clicks button, VS Code/Cursor opens with extension
2. **Auto-Configuration** - API key automatically configured
3. **Works on All Platforms** - Windows, Mac, Linux
4. **No Manual Steps** - No copying/pasting API keys

---

## Implementation Strategy

### Option 1: Published VS Code Extension (RECOMMENDED)
**User Flow:**
```
User logs in → Dashboard shows "Install Extension" button →
Clicks button → Opens vscode://extension/klyntos.klyntos-guard →
VS Code Marketplace opens → User clicks "Install" →
Extension reads API key from web app (OAuth) →
Done! Instant scanning in IDE
```

**Pros:**
- ✅ Most professional
- ✅ Automatic updates
- ✅ Trusted by users (official marketplace)
- ✅ Works with code signing
- ✅ One-click install

**Cons:**
- ⏱️ Takes 1-2 weeks to publish first time
- 📝 Requires Microsoft Partner account

### Option 2: Custom Protocol Handler (FASTEST TO IMPLEMENT)
**User Flow:**
```
User logs in → Dashboard shows "Connect IDE" →
Clicks button → Downloads .vsix file with API key embedded →
Double-click .vsix → Installs extension →
Done! Pre-configured with their API key
```

**Pros:**
- ✅ Can implement TODAY
- ✅ No approval needed
- ✅ Works with private/internal tools
- ✅ API key auto-configured

**Cons:**
- ❌ Users must allow .vsix install (security warning)
- ❌ Manual updates
- ❌ Less discoverable

### Option 3: Settings Snippet (SIMPLEST FALLBACK)
**User Flow:**
```
User logs in → Dashboard shows settings snippet →
User copies → Opens VS Code settings.json →
Pastes → Done
```

**Pros:**
- ✅ Zero friction to implement
- ✅ Works immediately
- ✅ No extension needed (uses existing extensions)

**Cons:**
- ❌ Manual copy/paste
- ❌ More steps for user
- ❌ Less integrated experience

---

## Recommended Approach: Hybrid

### Phase 1: Immediate (This Week)
1. **Settings Snippet Generator** - Web page that generates settings
2. **VSIX Generator** - Create custom .vsix with user's API key
3. **Documentation** - Clear setup guides

### Phase 2: Professional (Next Month)
1. **Publish to Marketplace** - Official Klyntos Guard extension
2. **OAuth Integration** - Extension authenticates via web app
3. **Deep Links** - One-click install from dashboard

---

## Technical Implementation

### 1. Settings Snippet Generator (Build NOW)

**Web Page:** `/ide-setup`

**Features:**
- Detects user's OS
- Shows personalized settings with their API key
- Copy button for quick paste
- Instructions for VS Code/Cursor

**Code:**
```typescript
// /ide-setup page
export default function IDESetup() {
  const user = useUser()
  const apiKey = useAPIKey()

  const vscodeSettings = {
    "klyntos.guard.apiKey": apiKey,
    "klyntos.guard.autoScan": true,
    "klyntos.guard.scanOnSave": true,
    "klyntos.guard.policy": "moderate"
  }

  return (
    <div>
      <h1>Connect Your IDE</h1>
      <button onClick={() => copyToClipboard(JSON.stringify(vscodeSettings))}>
        Copy VS Code Settings
      </button>
      <CodeBlock>{JSON.stringify(vscodeSettings, null, 2)}</CodeBlock>
    </div>
  )
}
```

### 2. VSIX Generator (Build NEXT)

**API Endpoint:** `POST /api/v1/generate-vsix`

**Flow:**
1. User clicks "Download Extension"
2. Server generates .vsix with API key embedded
3. User double-clicks .vsix to install
4. Extension is pre-configured!

**Code:**
```typescript
// Generates custom .vsix file
export async function POST(request: Request) {
  const user = await getUser(request)
  const apiKey = user.apiKeys[0]

  // Clone base extension
  const template = await readFile('./extension-template')

  // Inject API key
  const customized = injectAPIKey(template, apiKey)

  // Package as .vsix
  const vsix = await createVSIX(customized)

  return new Response(vsix, {
    headers: {
      'Content-Type': 'application/vsix',
      'Content-Disposition': `attachment; filename="klyntos-guard-${user.id}.vsix"`
    }
  })
}
```

### 3. VS Code Extension Structure

**Directory:**
```
extensions/vscode/
├── package.json
├── src/
│   ├── extension.ts        # Main extension entry
│   ├── scanner.ts          # Scan files on save
│   ├── diagnostics.ts      # Show inline warnings
│   ├── api.ts              # Connect to Guard API
│   └── config.ts           # Read API key
├── README.md
└── CHANGELOG.md
```

**package.json:**
```json
{
  "name": "klyntos-guard",
  "displayName": "Klyntos Guard",
  "description": "AI security scanner - catch vulnerabilities before deployment",
  "version": "1.0.0",
  "publisher": "klyntos",
  "engines": {
    "vscode": "^1.80.0"
  },
  "categories": ["Linters"],
  "activationEvents": ["onStartupFinished"],
  "main": "./out/extension.js",
  "contributes": {
    "configuration": {
      "title": "Klyntos Guard",
      "properties": {
        "klyntos.guard.apiKey": {
          "type": "string",
          "default": "",
          "description": "Your Klyntos Guard API key"
        },
        "klyntos.guard.scanOnSave": {
          "type": "boolean",
          "default": true,
          "description": "Automatically scan files on save"
        },
        "klyntos.guard.policy": {
          "type": "string",
          "enum": ["strict", "moderate", "relaxed"],
          "default": "moderate",
          "description": "Security scan policy"
        }
      }
    },
    "commands": [
      {
        "command": "klyntos.scanFile",
        "title": "Klyntos Guard: Scan Current File"
      },
      {
        "command": "klyntos.scanProject",
        "title": "Klyntos Guard: Scan Entire Project"
      }
    ]
  }
}
```

**extension.ts:**
```typescript
import * as vscode from 'vscode'

export function activate(context: vscode.ExtensionContext) {
  console.log('Klyntos Guard activated')

  // Register scan on save
  const saveDisposable = vscode.workspace.onDidSaveTextDocument(async (document) => {
    const config = vscode.workspace.getConfiguration('klyntos.guard')
    const scanOnSave = config.get('scanOnSave', true)
    const apiKey = config.get('apiKey', '')

    if (scanOnSave && apiKey) {
      await scanDocument(document, apiKey)
    }
  })

  // Register manual scan command
  const scanCommand = vscode.commands.registerCommand('klyntos.scanFile', async () => {
    const editor = vscode.window.activeTextEditor
    if (editor) {
      await scanDocument(editor.document)
    }
  })

  context.subscriptions.push(saveDisposable, scanCommand)
}

async function scanDocument(document: vscode.TextDocument, apiKey?: string) {
  const config = vscode.workspace.getConfiguration('klyntos.guard')
  apiKey = apiKey || config.get('apiKey', '')

  if (!apiKey) {
    vscode.window.showWarningMessage('Klyntos Guard API key not configured')
    return
  }

  // Show progress
  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'Scanning with Klyntos Guard...',
    cancellable: false
  }, async (progress) => {
    try {
      const code = document.getText()
      const language = document.languageId

      // Call API
      const response = await fetch('https://guard.klyntos.com/api/v1/scan', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code, language, policy: config.get('policy') })
      })

      const results = await response.json()

      // Show diagnostics
      showDiagnostics(document, results.violations)

    } catch (error: any) {
      vscode.window.showErrorMessage(`Scan failed: ${error.message}`)
    }
  })
}

function showDiagnostics(document: vscode.TextDocument, violations: any[]) {
  const diagnostics: vscode.Diagnostic[] = violations.map(v => {
    const range = new vscode.Range(
      v.line - 1, v.column || 0,
      v.endLine || v.line - 1, v.endColumn || 999
    )

    const severity = {
      'critical': vscode.DiagnosticSeverity.Error,
      'high': vscode.DiagnosticSeverity.Error,
      'medium': vscode.DiagnosticSeverity.Warning,
      'low': vscode.DiagnosticSeverity.Information
    }[v.severity] || vscode.DiagnosticSeverity.Warning

    const diagnostic = new vscode.Diagnostic(range, v.message, severity)
    diagnostic.source = 'Klyntos Guard'
    diagnostic.code = v.category

    return diagnostic
  })

  const collection = vscode.languages.createDiagnosticCollection('klyntos-guard')
  collection.set(document.uri, diagnostics)
}
```

---

## User Journey

### NEW USER FLOW (After signing up):

#### Step 1: Dashboard
```
┌─────────────────────────────────────────┐
│  🎉 Welcome to Klyntos Guard!           │
│                                          │
│  ✅ Account created                     │
│  ✅ API key generated                   │
│  ⏳ Connect your IDE                    │
│                                          │
│  [📥 Install VS Code Extension]         │
│  [📥 Install Cursor Extension]          │
│  [⚙️  Manual Setup (Advanced)]          │
└─────────────────────────────────────────┘
```

#### Step 2A: One-Click Install (Option 1)
```
User clicks "Install VS Code Extension"
  ↓
Opens: vscode://extension/klyntos.klyntos-guard
  ↓
VS Code Marketplace opens
  ↓
User clicks "Install"
  ↓
Extension prompts: "Sign in to Klyntos Guard"
  ↓
Opens browser → OAuth → Grants permission
  ↓
Extension receives API key
  ↓
✅ DONE! IDE is connected
```

#### Step 2B: VSIX Install (Option 2 - Faster to build)
```
User clicks "Download Extension"
  ↓
Server generates .vsix with API key
  ↓
Browser downloads klyntos-guard-user123.vsix
  ↓
User double-clicks .vsix
  ↓
VS Code prompts: "Install extension?"
  ↓
User clicks "Install"
  ↓
✅ DONE! Pre-configured with API key
```

#### Step 2C: Manual Setup (Option 3 - Fallback)
```
User clicks "Manual Setup"
  ↓
Page shows:
  1. Copy these settings
  2. Open VS Code settings (Cmd+,)
  3. Search "klyntos"
  4. Paste API key
  ↓
✅ DONE! Ready to scan
```

---

## Implementation Priority

### WEEK 1: Minimum Viable Integration
1. ✅ Create `/ide-setup` page
2. ✅ Settings snippet generator
3. ✅ VS Code extension template
4. ✅ Test locally with .vsix

### WEEK 2: Professional Launch
1. 📝 Publish extension to VS Code Marketplace
2. 🔐 Add OAuth flow for API key
3. 🔗 Add deep link from dashboard
4. 📚 Update documentation

### WEEK 3: Advanced Features
1. 🎨 Cursor-specific extension
2. ⚡ Real-time scanning (as you type)
3. 🔧 Quick fixes (click to apply suggestion)
4. 📊 Scan statistics in status bar

---

## Technical Requirements

### For Publishing to VS Code Marketplace:
1. **Publisher Account** - Create at https://marketplace.visualstudio.com
2. **Icons** - 128x128 extension icon
3. **Screenshots** - Extension in action
4. **README** - Feature list, setup guide
5. **Categories** - Tag as "Linters" and "Security"
6. **Testing** - Test on Windows/Mac/Linux

### For OAuth Integration:
1. **OAuth Endpoint** - `/api/v1/ide/authorize`
2. **Callback Handler** - Handle code exchange
3. **Token Storage** - Secure storage in VS Code settings
4. **Token Refresh** - Auto-refresh expired tokens

---

## Key Files to Create

### 1. Web App
```
web/src/app/ide-setup/page.tsx         # Setup page
web/src/app/api/v1/generate-vsix/route.ts  # VSIX generator
web/src/app/api/v1/ide/authorize/route.ts  # OAuth endpoint
```

### 2. Extension
```
extensions/vscode/
├── package.json           # Extension manifest
├── src/extension.ts       # Main activation
├── src/scanner.ts         # Scanning logic
├── src/auth.ts            # OAuth flow
└── media/
    └── icon.png           # Extension icon
```

### 3. Documentation
```
docs/ide-integration/
├── vscode-setup.md        # VS Code guide
├── cursor-setup.md        # Cursor guide
├── troubleshooting.md     # Common issues
└── api-reference.md       # Extension API
```

---

## Success Metrics

### Target User Flow Time:
- **Option 1 (Marketplace)**: < 30 seconds from signup to IDE connected
- **Option 2 (VSIX)**: < 2 minutes from signup to first scan
- **Option 3 (Manual)**: < 5 minutes from signup to first scan

### Adoption Goals:
- **Week 1**: 50% of new users install extension
- **Month 1**: 80% of active users have IDE connected
- **Month 3**: 95% prefer IDE over web scanning

---

## Next Steps

1. **TODAY**: Build `/ide-setup` page with settings snippet
2. **THIS WEEK**: Create VS Code extension template
3. **NEXT WEEK**: Test .vsix generation and distribution
4. **MONTH 1**: Publish to VS Code Marketplace
5. **MONTH 2**: Add Cursor support + advanced features
