from django.db import models
from django.contrib.auth.models import User
from accounts.models import Artisan

CATEGORY_CHOICES = [
    ("Pottery",    "Pottery"),
    ("Weaving",    "Weaving"),
    ("Woodcraft",  "Woodcraft"),
    ("Embroidery", "Embroidery"),
    ("Metalwork",  "Metalwork"),
    ("Paintings",  "Paintings"),
    ("Other",      "Other"),
]

ORDER_STATUS_CHOICES = [
    ("Pending",    "Pending"),
    ("Processing", "Processing"),
    ("Shipped",    "Shipped"),
    ("Delivered",  "Delivered"),
    ("Cancelled",  "Cancelled"),
]


class Product(models.Model):
    artisan     = models.ForeignKey(
        Artisan,
        on_delete=models.CASCADE,
        related_name="products"
    )
    name        = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price       = models.DecimalField(max_digits=10, decimal_places=2)
    category    = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES,
        blank=True,
        default=""
    )
    created_at  = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Wishlist(models.Model):
    user    = models.ForeignKey(User,    on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.user.username} - {self.product.name}"


class Cart(models.Model):
    user     = models.ForeignKey(User,    on_delete=models.CASCADE)
    product  = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)

    def __str__(self):
        return f"{self.user.email} - {self.product.name}"


class Order(models.Model):
    user           = models.ForeignKey(User, on_delete=models.CASCADE)
    total_amount   = models.DecimalField(max_digits=10, decimal_places=2)
    created_at     = models.DateTimeField(auto_now_add=True)
    payment_status = models.CharField(max_length=20, default="Pending")
    payment_method = models.CharField(max_length=20, blank=True, default="")

    def __str__(self):
        return f"Order {self.id} - {self.user.email}"


class OrderItem(models.Model):
    order    = models.ForeignKey(Order,   on_delete=models.CASCADE)
    product  = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    price    = models.DecimalField(max_digits=10, decimal_places=2)

    # ── NEW: per-item status so artisan can track each item individually ──
    status   = models.CharField(
        max_length=20,
        choices=ORDER_STATUS_CHOICES,
        default="Pending"
    )

    def __str__(self):
        return f"OrderItem {self.id} - {self.product.name}"


# ── NEW: Shipping address stored per OrderItem (one product = one order) ──
class ShippingAddress(models.Model):
    order_item   = models.OneToOneField(
        OrderItem,
        on_delete=models.CASCADE,
        related_name="shipping_address"
    )
    full_name    = models.CharField(max_length=255)
    phone        = models.CharField(max_length=15)
    address_line = models.TextField()
    landmark     = models.CharField(max_length=255, blank=True, default="")
    city         = models.CharField(max_length=100)
    state        = models.CharField(max_length=100)
    pincode      = models.CharField(max_length=10)

    def __str__(self):
        return f"Address for OrderItem {self.order_item.id} - {self.full_name}"


class ProductImage(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="images"
    )
    image = models.ImageField(upload_to="products/")


# ─────────────────────────────────────────────────────────────────────────────
# ADD this to your products/models.py (at the bottom)
# ─────────────────────────────────────────────────────────────────────────────

class Review(models.Model):
    RATING_CHOICES = [(i, i) for i in range(1, 6)]  # 1 to 5 stars

    artisan  = models.ForeignKey(
        Artisan,
        on_delete=models.CASCADE,
        related_name="reviews"
    )
    buyer    = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="reviews"
    )
    rating   = models.IntegerField(choices=RATING_CHOICES)
    comment  = models.TextField()
    approved = models.BooleanField(default=False)   # ← Admin must approve
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # One review per buyer per artisan
        unique_together = ("artisan", "buyer")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.buyer.email} → {self.artisan.email} ({self.rating}★) {'✓' if self.approved else '⏳'}"