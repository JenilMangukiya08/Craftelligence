import requests

url = 'http://127.0.0.1:8000/api/ai-design/'

# Test with text query
response = requests.post(url, json={'query': 'modern living room with wooden furniture'})
print('Text-only response:')
print(f'Status: {response.status_code}')
if response.status_code == 200:
    data = response.json()
    print(f'Products found: {len(data.get("products", []))}')
    print(f'Suggestion: {data.get("suggestion", "")[:100]}...')
else:
    print(f'Error: {response.text}')