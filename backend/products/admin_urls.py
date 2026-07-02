# products/admin_urls.py

from django.urls import path
from .admin_views import (
    admin_login,
    admin_stats,
    admin_artisans,    admin_verify_artisan,  admin_delete_artisan,
    admin_buyers,      admin_delete_buyer,
    admin_products,    admin_update_product,  admin_delete_product,
    admin_orders,      admin_update_order,
    admin_order_items, admin_update_order_item,
    admin_reviews,     admin_approve_review,  admin_reject_review,
    admin_artisan_analytics,
)

urlpatterns = [
    # Auth
    path("login/",                                  admin_login,              name="admin-login"),

    # Dashboard
    path("stats/",                                  admin_stats,              name="admin-stats"),

    # Artisans
    path("artisans/",                               admin_artisans,           name="admin-artisans"),
    path("artisans/<int:artisan_id>/verify/",       admin_verify_artisan,     name="admin-artisan-verify"),
    path("artisans/<int:artisan_id>/delete/",       admin_delete_artisan,     name="admin-artisan-delete"),

    # Buyers
    path("buyers/",                                 admin_buyers,             name="admin-buyers"),
    path("buyers/<int:buyer_id>/delete/",           admin_delete_buyer,       name="admin-buyer-delete"),

    # Products
    path("products/",                               admin_products,           name="admin-products"),
    path("products/<int:product_id>/update/",       admin_update_product,     name="admin-product-update"),
    path("products/<int:product_id>/delete/",       admin_delete_product,     name="admin-product-delete"),

    # Orders
    path("orders/",                                 admin_orders,             name="admin-orders"),
    path("orders/<int:order_id>/update/",           admin_update_order,       name="admin-order-update"),

    # Order Items
    path("order-items/",                            admin_order_items,        name="admin-order-items"),
    path("order-items/<int:item_id>/update/",       admin_update_order_item,  name="admin-order-item-update"),
    # Reviews
    path("reviews/",                                admin_reviews,         name="admin-reviews"),
    path("reviews/<int:review_id>/approve/",        admin_approve_review,  name="admin-review-approve"),
    path("reviews/<int:review_id>/reject/",         admin_reject_review,   name="admin-review-reject"),

    # Artisan Analytics
    path("artisan-analytics/", admin_artisan_analytics, name="admin-artisan-analytics"),
]