from django.urls import path
from .views import artisan_signup, buyer_signup, login_view,contact_view,verify_artisan,buyer_profile

urlpatterns = [
    path("artisan-signup/", artisan_signup),
    path("buyer-signup/", buyer_signup),
    path("login/", login_view),
    path("contact/", contact_view),
    path("verify-artisan/<int:artisan_id>/", verify_artisan),
    path("buyer-profile/<str:email>/",buyer_profile),
]
