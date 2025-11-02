"""
Code Security Actions - Bridge to KlyntosGuard Scanner

These custom actions integrate NeMo Guardrails with our code security scanner.
When the LLM generates code, these actions automatically scan it for vulnerabilities.
"""

import os
import re
import requests
from typing import Optional, Dict, List, Any
from nemoguardrails.actions import action


# API Configuration
API_URL = os.getenv("KLYNTOS_GUARD_API", "http://localhost:3001/api/v1/scan")
API_KEY = os.getenv("KLYNTOS_GUARD_API_KEY", "")  # Set this in your environment


def extract_code_from_message(message: str) -> tuple[Optional[str], Optional[str]]:
    """
    Extract code blocks from LLM response.
    Returns (code, language) tuple.
    """
    # Match markdown code blocks
    code_block_pattern = r'```(\w+)?\n(.*?)\n```'
    matches = re.findall(code_block_pattern, message, re.DOTALL)

    if matches:
        language = matches[0][0] or 'python'  # Default to python
        code = matches[0][1]
        return code, language

    # No code blocks found
    return None, None


def detect_language_from_code(code: str) -> str:
    """
    Simple language detection based on code patterns.
    """
    patterns = {
        'python': [r'def\s+\w+', r'import\s+\w+', r'from\s+\w+\s+import'],
        'javascript': [r'function\s+\w+', r'const\s+\w+\s*=', r'let\s+\w+\s*=', r'=>'],
        'typescript': [r'interface\s+\w+', r'type\s+\w+\s*=', r':\s*string', r':\s*number'],
        'java': [r'public\s+class', r'private\s+\w+', r'@Override'],
        'go': [r'func\s+\w+', r'package\s+main', r'import\s+\('],
        'rust': [r'fn\s+\w+', r'let\s+mut', r'impl\s+\w+'],
        'sql': [r'SELECT\s+', r'INSERT\s+INTO', r'UPDATE\s+', r'DELETE\s+FROM'],
    }

    scores = {}
    code_lower = code.lower()

    for lang, patterns_list in patterns.items():
        score = sum(1 for pattern in patterns_list if re.search(pattern, code, re.IGNORECASE))
        if score > 0:
            scores[lang] = score

    if scores:
        return max(scores, key=scores.get)

    return 'python'  # Default fallback


@action(is_system_action=True)
async def validate_code(context: Optional[Dict] = None, code: Optional[str] = None) -> Dict[str, Any]:
    """
    Validate code using KlyntosGuard scanner.
    This is the main bridge between NeMo Guardrails and our security scanner.

    Args:
        context: NeMo context (contains bot_message, etc.)
        code: Optional explicit code to scan (overrides context)

    Returns:
        {
            "safe": bool,
            "issues": list of violations,
            "issue_count": int,
            "critical_count": int,
            "high_count": int
        }
    """

    # Get code from context if not provided
    if code is None and context:
        bot_message = context.get('bot_message', '')
        code, language = extract_code_from_message(bot_message)

        if code is None:
            # No code found, consider it safe
            return {
                "safe": True,
                "issues": [],
                "issue_count": 0,
                "critical_count": 0,
                "high_count": 0
            }
    elif code is None:
        # No code to validate
        return {
            "safe": True,
            "issues": [],
            "issue_count": 0,
            "critical_count": 0,
            "high_count": 0
        }

    # Detect language if not already known
    if 'language' not in locals():
        language = detect_language_from_code(code)

    # Call our scanner API
    try:
        headers = {
            "Content-Type": "application/json"
        }

        if API_KEY:
            headers["Authorization"] = f"Bearer {API_KEY}"

        payload = {
            "code": code,
            "language": language,
            "filename": "generated_code",
            "policies": ["moderate"]
        }

        response = requests.post(
            API_URL,
            json=payload,
            headers=headers,
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            violations = result.get('violations', [])

            # Count by severity
            critical_count = sum(1 for v in violations if v.get('severity') == 'critical')
            high_count = sum(1 for v in violations if v.get('severity') == 'high')

            # Consider code unsafe if it has critical or high severity issues
            is_safe = critical_count == 0 and high_count == 0

            return {
                "safe": is_safe,
                "issues": violations,
                "issue_count": len(violations),
                "critical_count": critical_count,
                "high_count": high_count,
                "scan_result": result
            }
        else:
            # Scanner API error - default to marking as potentially unsafe
            return {
                "safe": False,
                "issues": [{
                    "severity": "error",
                    "message": f"Scanner API error: {response.status_code}",
                    "line": 0
                }],
                "issue_count": 1,
                "critical_count": 0,
                "high_count": 0
            }

    except Exception as e:
        # Error calling scanner - default to unsafe to be cautious
        return {
            "safe": False,
            "issues": [{
                "severity": "error",
                "message": f"Scanner error: {str(e)}",
                "line": 0
            }],
            "issue_count": 1,
            "critical_count": 0,
            "high_count": 0
        }


@action()
async def generate_secure_alternative(
    context: Optional[Dict] = None,
    code: Optional[str] = None,
    issues: Optional[List] = None
) -> Dict[str, Any]:
    """
    Generate a secure alternative for vulnerable code.

    This action takes the issues found and generates explanations and
    suggestions for fixing them.

    Args:
        context: NeMo context
        code: The vulnerable code
        issues: List of vulnerability issues

    Returns:
        {
            "secure_code": str,
            "explanation": str,
            "changes": list
        }
    """

    if issues is None:
        issues = context.get('validate_code', {}).get('issues', []) if context else []

    # Generate explanation of issues
    explanations = []
    for issue in issues:
        severity = issue.get('severity', 'unknown')
        message = issue.get('message', '')
        category = issue.get('category', '')
        line = issue.get('line', 0)

        explanation = f"Line {line}: [{severity.upper()}] {message} (Category: {category})"
        explanations.append(explanation)

    explanation_text = "\n".join(explanations)

    # For now, we return the issues as explanations
    # In a full implementation, we could use the LLM to generate fixes
    return {
        "secure_code": "# Secure version would be generated here",
        "explanation": f"Found {len(issues)} security issue(s):\n\n{explanation_text}",
        "changes": [issue.get('suggestion', '') for issue in issues if 'suggestion' in issue]
    }


@action()
async def check_sql_injection(
    context: Optional[Dict] = None,
    query: Optional[str] = None
) -> Dict[str, Any]:
    """
    Check if SQL query is vulnerable to injection attacks.

    Returns:
        {
            "vulnerable": bool,
            "reason": str,
            "secure_alternative": str
        }
    """

    if query is None and context:
        query = context.get('bot_message', '')

    if not query:
        return {"vulnerable": False, "reason": "No query provided"}

    # Simple pattern matching for SQL injection vulnerabilities
    vulnerable_patterns = [
        r'[\'"]\s*\+\s*\w+\s*\+\s*[\'"]',  # String concatenation
        r'f[\'"].*\{.*\}.*[\'"]',  # Python f-strings in SQL
        r'`.*\$\{.*\}.*`',  # Template literals in SQL
        r'\.format\(',  # Python .format() in SQL
        r'%s|%d',  # Python % formatting (unsafe)
    ]

    is_vulnerable = any(re.search(pattern, query) for pattern in vulnerable_patterns)

    if is_vulnerable:
        secure_alt = """# Use parameterized queries instead:

# Python (SQLAlchemy)
from sqlalchemy import text
query = text("SELECT * FROM users WHERE username = :username")
result = db.execute(query, {"username": username})

# Python (psycopg2)
cursor.execute("SELECT * FROM users WHERE username = %s", (username,))

# JavaScript (pg)
const query = 'SELECT * FROM users WHERE username = $1'
await client.query(query, [username])"""

        return {
            "vulnerable": True,
            "reason": "Query uses string concatenation or formatting which is vulnerable to SQL injection",
            "secure_alternative": secure_alt
        }

    return {
        "vulnerable": False,
        "reason": "Query appears to use safe parameterization"
    }


@action()
async def check_xss_vulnerability(
    context: Optional[Dict] = None,
    code: Optional[str] = None
) -> Dict[str, Any]:
    """
    Check for XSS (Cross-Site Scripting) vulnerabilities.

    Returns:
        {
            "vulnerable": bool,
            "reason": str,
            "secure_alternative": str
        }
    """

    if code is None and context:
        code = context.get('bot_message', '')

    if not code:
        return {"vulnerable": False, "reason": "No code provided"}

    # Check for XSS-vulnerable patterns
    vulnerable_patterns = [
        r'innerHTML\s*=',
        r'\.html\(',
        r'dangerouslySetInnerHTML',
        r'document\.write\(',
        r'eval\(',
    ]

    is_vulnerable = any(re.search(pattern, code, re.IGNORECASE) for pattern in vulnerable_patterns)

    if is_vulnerable:
        secure_alt = """# Always escape user input before rendering:

# React
import DOMPurify from 'dompurify'
<div>{DOMPurify.sanitize(userInput)}</div>

# JavaScript
element.textContent = userInput  // Not innerHTML!

# Python (Jinja2 auto-escapes)
{{ user_input }}  {# Auto-escaped #}

# Python (manual)
from markupsafe import escape
safe_html = escape(user_input)"""

        return {
            "vulnerable": True,
            "reason": "Code uses unsafe HTML rendering which can lead to XSS attacks",
            "secure_alternative": secure_alt
        }

    return {
        "vulnerable": False,
        "reason": "No obvious XSS vulnerabilities detected"
    }


@action()
async def check_for_secrets(
    context: Optional[Dict] = None,
    code: Optional[str] = None
) -> Dict[str, Any]:
    """
    Check if code contains hardcoded secrets.

    Returns:
        {
            "found": bool,
            "secrets": list,
            "secure_alternative": str
        }
    """

    if code is None and context:
        code = context.get('bot_message', '')

    if not code:
        return {"found": False, "secrets": []}

    # Patterns for hardcoded secrets
    secret_patterns = [
        (r'password\s*=\s*[\'"][^\'"]+[\'"]', "password"),
        (r'api_key\s*=\s*[\'"][^\'"]+[\'"]', "API key"),
        (r'secret\s*=\s*[\'"][^\'"]+[\'"]', "secret"),
        (r'token\s*=\s*[\'"][^\'"]+[\'"]', "token"),
        (r'aws_access_key_id\s*=\s*[\'"][^\'"]+[\'"]', "AWS access key"),
        (r'aws_secret_access_key\s*=\s*[\'"][^\'"]+[\'"]', "AWS secret key"),
    ]

    found_secrets = []
    for pattern, secret_type in secret_patterns:
        if re.search(pattern, code, re.IGNORECASE):
            found_secrets.append(secret_type)

    if found_secrets:
        secure_alt = """# Use environment variables instead:

# Python
import os
api_key = os.getenv('API_KEY')
password = os.getenv('DB_PASSWORD')

# JavaScript
const apiKey = process.env.API_KEY
const password = process.env.DB_PASSWORD

# Store in .env file (never commit this!)
API_KEY=your-key-here
DB_PASSWORD=your-password-here

# Or use a secrets manager:
# - AWS Secrets Manager
# - HashiCorp Vault
# - Azure Key Vault"""

        return {
            "found": True,
            "secrets": found_secrets,
            "secure_alternative": secure_alt
        }

    return {
        "found": False,
        "secrets": []
    }


@action()
async def detect_programming_language(context: Optional[Dict] = None) -> Dict[str, str]:
    """
    Detect the programming language from the user's request or bot's message.

    Returns:
        {
            "language": str,
            "confidence": str
        }
    """

    if not context:
        return {"language": "unknown", "confidence": "low"}

    user_message = context.get('user_message', '').lower()

    # Language keywords in requests
    language_keywords = {
        'python': ['python', 'django', 'flask', 'fastapi', '.py'],
        'javascript': ['javascript', 'node', 'express', 'react', '.js'],
        'typescript': ['typescript', 'ts', '.ts'],
        'java': ['java', 'spring', '.java'],
        'go': ['go', 'golang', '.go'],
        'rust': ['rust', '.rs'],
        'php': ['php', 'laravel', '.php'],
        'ruby': ['ruby', 'rails', '.rb'],
        'sql': ['sql', 'database', 'query'],
    }

    for lang, keywords in language_keywords.items():
        if any(keyword in user_message for keyword in keywords):
            return {"language": lang, "confidence": "high"}

    # Default to Python if ambiguous
    return {"language": "python", "confidence": "low"}
