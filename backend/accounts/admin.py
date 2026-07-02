


from django.contrib import admin
from .models import Artisan, Buyer


@admin.register(Artisan)
class ArtisanAdmin(admin.ModelAdmin):
    list_display = ("firstname", "email", "gst_number", "verified")
    list_filter = ("verified",)
    list_editable = ("verified",)


@admin.register(Buyer)
class BuyerAdmin(admin.ModelAdmin):
    list_display = ("firstname", "email")