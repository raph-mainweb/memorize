import os
import json
import urllib.request

ENV_PATH = '.env'

def read_env():
    env = {}
    if os.path.exists(ENV_PATH):
        with open(ENV_PATH, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    parts = line.strip().split('=', 1)
                    if len(parts) == 2:
                        env[parts[0]] = parts[1]
    return env

def test_supabase(url, key):
    print(f"Testing Supabase at {url}...")
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}'
    }
    try:
        # Requesting swagger OpenAPI spec to verify credentials
        req = urllib.request.Request(f"{url}/rest/v1/", headers=headers, method='GET')
        with urllib.request.urlopen(req) as resp:
            if resp.status == 200:
                print("✅ Supabase: Service Role credentials verified.")
                return True
    except Exception as e:
        print(f"❌ Supabase validation failed: {e}")
        return False

def test_resend(key, sender, to_email):
    print(f"Testing Resend API from {sender} to {to_email}...")
    url = "https://api.resend.com/emails"
    headers = {
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json'
    }
    data = json.dumps({
        "from": sender,
        "to": [to_email],
        "subject": "System Verification: Nachklang Handshake",
        "html": "<p>If you receive this, the Resend API configuration is verified and working!</p>"
    }).encode('utf-8')
    try:
        req = urllib.request.Request(url, data=data, headers=headers, method='POST')
        with urllib.request.urlopen(req) as resp:
            if resp.status == 200:
                print("✅ Resend: Verification email dispatched successfully.")
                return True
    except Exception as e:
        print(f"❌ Resend API failed: {e}")
        return False

def main():
    print("Executing Phase 2 Link Handshake...\n")
    env = read_env()
    
    # 1. Supabase
    supa_url = env.get('NEXT_PUBLIC_SUPABASE_URL')
    supa_key = env.get('SUPABASE_SERVICE_ROLE_KEY')
    if supa_url and supa_key:
        test_supabase(supa_url, supa_key)
    else:
        print("❌ Supabase: Keys missing in .env")
        
    print("")
        
    # 2. Resend
    resend_key = env.get('RESEND_API_KEY')
    email_from = env.get('EMAIL_FROM')
    admin_email = env.get('ADMIN_EMAIL')
    if resend_key and email_from and admin_email:
        test_resend(resend_key, email_from, admin_email)
    else:
        print("❌ Resend: Keys missing in .env")
        
    print("\nHandshake complete.")

if __name__ == "__main__":
    main()
