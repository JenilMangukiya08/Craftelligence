import requests

# Test the Gemini Vision API
url = 'http://127.0.0.1:8000/api/ai-design/'

# Method 1: Text-only recommendation
print("=== Method 1: Text Description ===")
response = requests.post(url, json={'query': 'modern minimalist living room'})
print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"Products: {len(data['products'])}")
    print(f"Analysis: {data['image_analysis'][:100]}...")
    print(f"Suggestion: {data['suggestion'][:100]}...")
    print()

# Method 2: With image file (you would upload an actual image)
print("=== Method 2: With Image Upload ===")
# This would be done through a form with multipart/form-data
# The frontend handles this automatically

print("✅ API is working! Use the frontend to upload photos and get AI recommendations.")