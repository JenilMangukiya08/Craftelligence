from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# ── Import accounts views directly so we can list all routes explicitly ──
# This avoids the duplicate "api/" prefix conflict where Django would only
# check accounts.urls and return 404 for any products.urls routes.
from accounts.views import (
    artisan_signup,
    buyer_signup,
    login_view,
    contact_view,
    verify_artisan,
    buyer_profile,
)
from products import nlp_views  
urlpatterns = [
    path('admin/', admin.site.urls),

    # ── Accounts routes (inlined to avoid prefix conflict) ────────────────
    path('api/artisan-signup/',                  artisan_signup),
    path('api/buyer-signup/',                    buyer_signup),
    path('api/login/',                           login_view),
    path('api/contact/',                         contact_view),
    path('api/verify-artisan/<int:artisan_id>/', verify_artisan),
    path('api/buyer-profile/<str:email>/',       buyer_profile),

    # ── Products app (cart, orders, wishlist, etc.) ───────────────────────
    path('api/', include('products.urls')),
    path('api/admin/', include('products.admin_urls')),

    path('api/nlp/search/', nlp_views.multilingual_search),
    path('api/ai-design/',   nlp_views.ai_design),
    path('api/chatbot/',    nlp_views.chatbot),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)