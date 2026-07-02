import google.generativeai as genai
from django.conf import settings
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()

genai.configure(api_key=settings.GEMINI_API_KEY)
models = genai.list_models()
print('TOTAL MODELS:', len(models))
print('VISION-RELATED MODELS:')
for m in models:
    name = getattr(m, 'name', None)
    methods = getattr(m, 'supported_generation_methods', None)
    if name and ('vision' in name.lower() or 'image' in name.lower() or '1.5' in name.lower()):
        print(name, methods)
