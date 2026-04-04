import os
import re
import json
import urllib.request
import urllib.parse
from base64 import b64encode

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

def update_env(updates):
    if not os.path.exists(ENV_PATH):
        print("Error: .env file not found!")
        return
    with open(ENV_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    for key, val in updates.items():
        # Match standard key=val pattern in .env
        pattern = rf"^({key}=)(.*)$"
        if re.search(pattern, content, flags=re.MULTILINE):
            content = re.sub(pattern, rf"\1{val}", content, flags=re.MULTILINE)
        else:
            content += f"\n{key}={val}"
            
    with open(ENV_PATH, 'w', encoding='utf-8') as f:
        f.write(content)

def stripe_request(endpoint, data=None):
    env = read_env()
    api_key = env.get('STRIPE_SECRET_KEY')
    if not api_key or 'YOUR_' in api_key:
        print("Error: STRIPE_SECRET_KEY missing or not valid. Please ensure it is correctly filled in .env")
        return None
        
    url = f"https://api.stripe.com/v1/{endpoint}"
    headers = {
        'Authorization': b'Basic ' + b64encode((api_key + ':').encode('ascii')),
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    encoded_data = urllib.parse.urlencode(data).encode('ascii') if data else None
    
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method='POST' if data else 'GET')
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"HTTPError: {e.code} - {e.read().decode('utf-8')}")
        return None

def create_product(name, description):
    print(f"Creating product: {name}")
    data = {
        'name': name,
        'description': description
    }
    return stripe_request('products', data)

def create_price(product_id, amount_chf, type_='one_time'):
    print(f"Creating price for {product_id} ({amount_chf} CHF)")
    data = {
        'product': product_id,
        'currency': 'chf',
        'unit_amount': int(amount_chf * 100),
    }
    if type_ == 'recurring':
        data['recurring[interval]'] = 'month'
        
    return stripe_request('prices', data)

def main():
    print("Starting Stripe Setup...")
    products = [
        {"key": "STRIPE_PRICE_UNLOCK", "name": "Gedenkseite freischalten", "desc": "Einmalige Freischaltung der Gedenkseite (lebenslang)", "price": 19, "type": "one_time"},
        {"key": "STRIPE_PRICE_BASIC", "name": "Pflege-Abo Basic", "desc": "Pflege-Abo (Werbefrei, mehr Fotos)", "price": 4, "type": "recurring"},
        {"key": "STRIPE_PRICE_PREMIUM", "name": "Pflege-Abo Premium", "desc": "Pflege-Abo + Custom Domain + Haustier", "price": 7, "type": "recurring"},
        {"key": "STRIPE_PRICE_MEDALLION", "name": "QR-Medaillon", "desc": "Physisches QR-Medaillon mit Stock-Zuweisung", "price": 49, "type": "one_time"}
    ]
    
    updates = {}
    for p in products:
        prod = create_product(p['name'], p['desc'])
        if not prod:
            print("Aborting setup due to error creating product.")
            return
            
        price = create_price(prod['id'], p['price'], p['type'])
        if price:
            updates[p['key']] = price['id']
            print(f"Success: {p['key']} = {price['id']}")
        else:
            print("Aborting setup due to error creating price.")
            return
            
    print("\nUpdating .env file...")
    update_env(updates)
    print("Done. Stripe products created and .env updated successfully!")

if __name__ == "__main__":
    main()
