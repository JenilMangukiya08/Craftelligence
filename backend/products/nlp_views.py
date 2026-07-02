import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import re
from django.db.models import Q
from django.conf import settings
import requests
import google.generativeai as genai
from PIL import Image
import base64
import io

from products.models import Product
from accounts.models import Artisan


# ── Pull the keys exactly as defined in settings.py ───────────────────────────
HUGGINGFACE_API_KEY = settings.HUGGINGFACE_API_KEY   # "hf_..."
OPENROUTER_API_KEY  = settings.OPENROUTER_API_KEY    # "sk-or-..." (kept for future use)
GEMINI_API_KEY = settings.GEMINI_API_KEY            # "AIzaSy..."


# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)


# ─────────────────────────────────────────────
# 🌐 TRANSLATION
# ─────────────────────────────────────────────
def translate_to_english(text: str, hint_lang: str = "auto") -> dict:
    try:
        API_URL = "https://router.huggingface.co/hf-inference/models/Helsinki-NLP/opus-mt-mul-en"

        headers = {
            "Authorization": f"Bearer {HUGGINGFACE_API_KEY}",  # FIX: was OPENROUTER_API_KEY
            "Content-Type": "application/json",
        }

        response = requests.post(API_URL, headers=headers, json={"inputs": text}, timeout=10)

        if response.status_code != 200:
            return {"original": text, "translated": text, "detected_lang": "unknown"}

        data = response.json()
        translated = (
            data[0]["translation_text"]
            if isinstance(data, list) and "translation_text" in data[0]
            else text
        )

        return {
            "original": text,
            "translated": translated,
            "detected_lang": hint_lang if hint_lang != "auto" else "unknown",
        }

    except Exception:
        return {"original": text, "translated": text, "detected_lang": "unknown"}


# ─────────────────────────────────────────────
# 🔍 PRODUCT SEARCH
# ─────────────────────────────────────────────
WALL_SEARCH_TERMS = [
    "wall", "hang", "hanging", "mounted", "mount", "frame", "painting", "tapestry",
    "artwork", "mirror", "decor", "decoration", "wall art", "wall hanging", "wall decor"
]
TABLE_SEARCH_TERMS = [
    "table", "desk", "shelf", "countertop", "coffee table", "side table", "console", "dining table",
    "nightstand", "bookshelf", "end table"
]


def detect_placement_context(text: str):
    lower = text.lower()
    if any(keyword in lower for keyword in WALL_SEARCH_TERMS):
        return "wall"
    if any(keyword in lower for keyword in TABLE_SEARCH_TERMS):
        return "table"
    return None


def build_search_query(terms):
    q = Q()
    for term in terms:
        q |= (
            Q(name__icontains=term)
            | Q(description__icontains=term)
            | Q(category__icontains=term)
        )
    return q


def filter_by_placement(queryset, placement):
    if placement == "wall":
        wall_q = Q()
        for term in WALL_SEARCH_TERMS:
            wall_q |= (
                Q(name__icontains=term)
                | Q(description__icontains=term)
                | Q(category__icontains=term)
            )
        wall_products = queryset.filter(wall_q)
        if wall_products.exists():
            return wall_products
    elif placement == "table":
        table_q = Q()
        for term in TABLE_SEARCH_TERMS:
            table_q |= (
                Q(name__icontains=term)
                | Q(description__icontains=term)
                | Q(category__icontains=term)
            )
        table_products = queryset.filter(table_q)
        if table_products.exists():
            return table_products
    return queryset


def search_products(query: str, limit: int = 10):
    terms = query.strip().split()
    if not terms:
        return Product.objects.none()

    placement = detect_placement_context(query)
    q = build_search_query(terms)
    queryset = Product.objects.filter(q)
    filtered = filter_by_placement(queryset, placement)
    return filtered.select_related("artisan").distinct()[:limit]


# ─────────────────────────────────────────────
# 📦 SERIALIZER
# ─────────────────────────────────────────────
def serialize_products(products, request=None):
    results = []
    for p in products:
        first_image = p.images.first()
        image_url = None
        if first_image:
            try:
                image_url = request.build_absolute_uri(first_image.image.url) if request else first_image.image.url
            except Exception:
                image_url = first_image.image.url

        results.append({
            "product_id": p.id,
            "name": p.name,
            "description": (
                p.description[:120] + "..."
                if len(p.description) > 120
                else p.description
            ),
            "price": str(p.price),
            "category": p.category,
            "image": image_url,
            "artisan_name": str(p.artisan) if p.artisan else None,
        })
    return results


# ─────────────────────────────────────────────
# 🌍 MULTILINGUAL SEARCH
# ─────────────────────────────────────────────
@csrf_exempt
@require_POST
def multilingual_search(request):
    try:
        body = json.loads(request.body)
        raw_query = body.get("query", "").strip()
        hint_lang = body.get("lang", "auto")

        if not raw_query:
            return JsonResponse({"error": "Query is required"}, status=400)

        translation = translate_to_english(raw_query, hint_lang)
        products = search_products(translation["translated"])
        results = serialize_products(products, request)

        return JsonResponse({
            "original_query": raw_query,
            "translated_query": translation["translated"],
            "detected_lang": translation["detected_lang"],
            "product_count": len(results),
            "products": results,
        })

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# ─────────────────────────────────────────────
# 👁️ GEMINI VISION ANALYSIS
# ─────────────────────────────────────────────
def get_preferred_gemini_vision_model():
    """Return a supported Gemini vision model name if available."""
    try:
        models = genai.list_models()
        for model in models:
            name = getattr(model, "name", "") or ""
            methods = getattr(model, "supported_generation_methods", []) or []
            lc = name.lower()
            if any(key in lc for key in ["vision", "image", "1.5", "gemini-1.5", "gemini-2.0"]):
                methods_text = " ".join(str(m).lower() for m in methods)
                if "generatecontent" in methods_text or "generate" in methods_text:
                    return name
    except Exception:
        pass
    return "gemini-2.0-flash"


def analyze_image_with_gemini(image_data, prompt_text=""):
    """
    Analyze uploaded image using Gemini Vision API
    Returns description of the space and recommended product categories
    """
    model_name = None
    try:
        # Decode base64 image
        image_bytes = base64.b64decode(image_data.split(',')[1] if ',' in image_data else image_data)
        image = Image.open(io.BytesIO(image_bytes))

        model_name = get_preferred_gemini_vision_model()
        print(f"Using Gemini vision model: {model_name}")
        model = genai.GenerativeModel(model_name)

        prompt = f"""
        Analyze this image of a room/wall/table space. Describe:
        1. The type of space (living room, bedroom, office, kitchen, etc.)
        2. Color scheme and style (modern, traditional, rustic, minimalist, etc.)
        3. Key features (furniture, lighting, existing decor)
        4. What kind of handmade crafts would complement this space

        Additional context from user: {prompt_text}

        Provide a detailed description and suggest 3-5 categories of handmade products that would fit well.
        """

        response = model.generate_content([prompt, image])
        return response.text.strip()

    except Exception as e:
        error_str = str(e)
        if "quota" in error_str.lower() or "rate limit" in error_str.lower():
            return "⚠️ Gemini Vision API quota exceeded. The free tier limit has been reached. Please try again later or consider upgrading your API plan."
        if model_name and ("unsupported" in error_str.lower() or "not supported" in error_str.lower()):
            return f"⚠️ Gemini vision model '{model_name}' does not support image analysis with this SDK: {error_str}"
        return f"Error analyzing image: {error_str}"


# ─────────────────────────────────────────────
# 🏡 AI DESIGN RECOMMENDATION

@csrf_exempt
@require_POST
def ai_design(request):
    try:
        # Handle both JSON and multipart form data
        if request.content_type.startswith('multipart/form-data'):
            # Handle file upload
            image_file = request.FILES.get('image')
            prompt_text = request.POST.get('query', '').strip()
            hint_lang = request.POST.get('lang', 'auto')

            if not image_file:
                return JsonResponse({"error": "Image file is required"}, status=400)

            # Read image data
            image_data = base64.b64encode(image_file.read()).decode('utf-8')
            image_data = f"data:{image_file.content_type};base64,{image_data}"

        else:
            # Handle JSON request (backward compatibility)
            body = json.loads(request.body)
            image_data = body.get("image", "")
            prompt_text = body.get("query", "").strip()
            hint_lang = body.get("lang", "auto")

        if not image_data and not prompt_text:
            return JsonResponse({"error": "Either image or query is required"}, status=400)

        # Analyze image with Gemini Vision
        image_analysis = ""
        if image_data:
            image_analysis = analyze_image_with_gemini(image_data, prompt_text)
            # If image analysis failed due to quota, fall back to text-only analysis
            if "quota exceeded" in image_analysis.lower():
                image_analysis = f"Image analysis unavailable due to API quota limits. Analyzing based on your description: '{prompt_text}'"
            print(f"Gemini Analysis: {image_analysis}")

        # Combine image analysis with text prompt for product search
        search_query = image_analysis or prompt_text
        if image_analysis and prompt_text:
            search_query = f"{image_analysis} {prompt_text}"

        # Translate if needed
        translation = translate_to_english(search_query, hint_lang)
        products = search_products(translation["translated"], limit=5)
        results = serialize_products(products, request)

        placement = detect_placement_context(search_query)
        placement_hint = ""
        if placement == "wall":
            placement_hint = "Focus on wall-mounted decor and avoid table-top-only items."
        elif placement == "table":
            placement_hint = "Focus on table-friendly decorative pieces."

        # Generate placement suggestion
        if image_analysis and "quota exceeded" not in image_analysis.lower():
            prompt = f"""
            Based on this room analysis: {image_analysis}
            User additional context: {prompt_text}
            {placement_hint}

            Suggest where to place a handmade craft in this space and how it would enhance the decor.
            Keep it to 2-3 sentences.
            """
        else:
            # Fallback to text-only analysis
            prompt = (
                f"You are an interior design assistant. The user wants a recommendation for placing a handmade craft in a space described as: '{search_query}'. "
                f"{placement_hint} "
                "Provide a concise suggestion for placement and styling in 2-3 sentences."
            )

        suggestion = get_chatbot_reply(prompt, [])

        # If chatbot fails, generate a simple suggestion
        if "error" in suggestion.lower() or "⚠️" in suggestion:
            if image_analysis and "quota exceeded" not in image_analysis.lower():
                suggestion = f"Based on your room photo, these handmade crafts would complement the space beautifully. Consider placing them on shelves, tables, or walls to enhance the existing decor."
            else:
                suggestion = f"These artisanal products would be perfect for a {search_query.lower()}. They add warmth and character to any space."

        return JsonResponse({
            "original_query": prompt_text,
            "image_analysis": image_analysis,
            "translated_query": translation["translated"],
            "suggestion": suggestion,
            "products": results,
        })

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# ─────────────────────────────────────────────
# 🤖 CHATBOT
# ─────────────────────────────────────────────

# FIX: System prompt is now actually injected into every API call
SYSTEM_PROMPT = (
    "You are Crafti, a friendly AI assistant for an Indian artisan ecommerce platform called Craftelligence. "
    "Keep answers short (2–3 lines). Be warm and helpful. "
    "Suggest relevant products when the user mentions shopping, gifts, or crafts. "
    "Ask follow-up questions to understand what the user needs."
)


HF_CHAT_MODEL = "HuggingFaceH4/starchat-alpha"
HF_TEXT_MODEL = "gpt2"


def query_huggingface_text(prompt: str) -> str:
    headers = {
        "Authorization": f"Bearer {HUGGINGFACE_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 150,
            "temperature": 0.7,
        },
    }

    try:
        response = requests.post(
            f"https://api-inference.huggingface.co/models/{HF_TEXT_MODEL}",
            headers=headers,
            json=payload,
            timeout=30,
        )

        print("HF RAW text:", response.status_code, response.text)

        if response.status_code == 503:
            return "⏳ Model is loading, please try again in a moment."
        if response.status_code != 200:
            return f"⚠️ Hugging Face text API error {response.status_code}: {response.text}"

        data = response.json()
        if isinstance(data, list) and data and "generated_text" in data[0]:
            return data[0]["generated_text"].strip()

        return "⚠️ Unable to parse Hugging Face text response."

    except Exception as e:
        return f"⚠️ Error: {str(e)}"


def query_huggingface(messages: list) -> str:
    headers = {
        "Authorization": f"Bearer {HUGGINGFACE_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": HF_CHAT_MODEL,
        "messages": messages,
        "max_tokens": 150,
        "temperature": 0.7,
    }

    try:
        response = requests.post(
            "https://api-inference.huggingface.co/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30,
        )

        print("HF RAW chat:", response.status_code, response.text)

        if response.status_code == 503:
            return "⏳ Model is loading, please try again in a moment."
        if response.status_code == 200:
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()

        if response.status_code == 400 and "Model not supported" in response.text:
            prompt = "\n\n".join([m["content"] for m in messages if m.get("role") in ("system", "user")])
            return query_huggingface_text(prompt)

        return f"⚠️ Hugging Face chat API error {response.status_code}: {response.text}"

    except Exception as e:
        return f"⚠️ Error: {str(e)}"


def get_chatbot_reply(user_message: str, history: list) -> str:
    # System prompt first, then last 5 turns of history, then new user message
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    for turn in history[-5:]:
        role = turn.get("role")
        content = turn.get("content")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": user_message})
    return query_huggingface(messages)


# ─────────────────────────────────────────────
# 🛍️ PRODUCT INTENT
# ─────────────────────────────────────────────
def extract_product_intent(message: str, request=None):
    keywords = [
        "show", "buy", "find", "gift", "craft",
        "handmade", "pottery", "saree", "art",
    ]
    if any(k in message.lower() for k in keywords):
        products = search_products(message, limit=3)
        return serialize_products(products, request)
    return []


def format_product_reply(products: list) -> str:
    if not products:
        return "I couldn't find matching products in the catalog. Try another craft type, location, or keyword."

    names = [p["name"] for p in products[:3]]
    reply = f"I found {len(products)} artisanal product(s). Top picks: {', '.join(names)}."
    if len(products) > 3:
        reply += f" And {len(products) - 3} more are available."
    return reply


def extract_location_from_message(message: str) -> str:
    patterns = [
        r"\bnear\s+([a-z0-9\s,]+)",
        r"\bin\s+([a-z0-9\s,]+)",
        r"\baround\s+([a-z0-9\s,]+)",
        r"\bfrom\s+([a-z0-9\s,]+)",
        r"\bat\s+([a-z0-9\s,]+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, message)
        if match:
            location = match.group(1).strip()
            location = re.split(r"[\.\?!;,]|\band\b|\bwith\b|\bfor\b", location)[0].strip()
            parts = location.split()
            return " ".join(parts[:4])
    return ""


def extract_artisan_intent(message: str):
    lower = message.lower()
    artisan_keywords = ["artisan", "artist", "craftsman", "maker", "seller", "vendor", "local", "creator", "handicraft"]
    art_terms = [
        "pottery", "weaving", "woodcraft", "embroidery", "metalwork",
        "paintings", "saree", "ceramic", "jewellery", "textile", "leather",
        "sculpture", "craft", "handmade", "art", "furniture", "decor",
    ]

    has_artisan_intent = any(k in lower for k in artisan_keywords)
    has_art_term = any(term in lower for term in art_terms)
    location = extract_location_from_message(lower)

    # If user asks for artisans with craft type and/or location, treat it as an artisan search.
    if not has_artisan_intent and not has_art_term and not location:
        return []

    artisan_query = Q()
    if has_art_term:
        for term in art_terms:
            if term in lower:
                artisan_query |= Q(products__category__icontains=term)
                artisan_query |= Q(products__name__icontains=term)
                artisan_query |= Q(products__description__icontains=term)
                artisan_query |= Q(bio__icontains=term)
                artisan_query |= Q(firstname__icontains=term)
                artisan_query |= Q(lastname__icontains=term)
                artisan_query |= Q(address__icontains=term)

    if location:
        artisan_query &= Q(address__icontains=location)

    if not artisan_query.children:
        artisans = Artisan.objects.filter(is_verified=True).distinct()[:3]
    else:
        artisans = Artisan.objects.filter(artisan_query, is_verified=True).distinct()[:3]

    results = []
    for artisan in artisans:
        results.append({
            "name": f"{artisan.firstname} {artisan.lastname}",
            "email": artisan.email,
            "phone": artisan.phone,
            "address": artisan.address,
            "bio": artisan.bio,
        })
    return results


def format_artisan_reply(artisan_matches: list) -> str:
    if not artisan_matches:
        return "I couldn't find an artisan matching that description right now. Try another query with the craft type and location."

    artisan = artisan_matches[0]
    reply = (
        f"I found an artisan for you: {artisan['name']} ({artisan['email']}). "
        f"They work from {artisan['address']}. "
        f"Contact them by email to discuss their {artisan['bio'][:80].strip()}..."
    )
    if len(artisan_matches) > 1:
        reply += f" I also found {len(artisan_matches) - 1} more artisan(s) if you want additional options."
    return reply


# ─────────────────────────────────────────────
# 🚀 CHATBOT API ENDPOINT
# ─────────────────────────────────────────────
@csrf_exempt
@require_POST
def chatbot(request):
    try:
        body = json.loads(request.body)
        user_message = body.get("message", "").strip()
        history = body.get("history", [])

        if not user_message:
            return JsonResponse({"error": "Message required"}, status=400)

        artisan_matches = extract_artisan_intent(user_message)
        products = extract_product_intent(user_message, request)

        if artisan_matches:
            reply = format_artisan_reply(artisan_matches)
        elif products:
            reply = format_product_reply(products)
        else:
            reply = (
                "I can help you find handmade products and artisans on Craftelligence. "
                "Ask me for pottery, sarees, woodcraft, or artisans near your city."
            )

        print("REPLY:", reply)

        return JsonResponse({
            "reply": reply,
            "products": products,
            "artisan_details": artisan_matches,
        })

    except Exception as e:
        print("🔥 ERROR:", str(e))
        return JsonResponse(
            {"reply": "⚠️ Server error. Check backend logs."},
            status=200,
        )