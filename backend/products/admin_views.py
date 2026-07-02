# products/admin_views.py
# ─────────────────────────────────────────────────────────────────────────────
# Fixed: Buyers now fetched from accounts.Buyer model (not Django User)
# Fixed: Stats use Buyer.objects.count() not User.objects.filter(is_staff=False)
# Fixed: Artisan uses verified field (not is_verified)
# ─────────────────────────────────────────────────────────────────────────────

import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from django.db.models import Sum
from django.contrib.auth import authenticate

from accounts.models import Artisan, Buyer                          # ← Buyer added
from .models import Product, Order, OrderItem, ShippingAddress, Review


# ── Admin auth via Django User (is_staff) ─────────────────────────────────────
def _get_admin_user(request):
    email = request.headers.get("X-Admin-Email", "").strip()
    if not email:
        return None
    try:
        return User.objects.get(email=email, is_staff=True)
    except User.DoesNotExist:
        return None


def _admin_required(fn):
    def wrapper(request, *args, **kwargs):
        if not _get_admin_user(request):
            return JsonResponse({"error": "Admin access required."}, status=403)
        return fn(request, *args, **kwargs)
    wrapper.__name__ = fn.__name__
    return wrapper


# ─────────────────────────────────────────────
#  ADMIN LOGIN
# ─────────────────────────────────────────────

@csrf_exempt
def admin_login(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    try:
        body     = json.loads(request.body)
        username = body.get("username", "").strip()
        password = body.get("password", "").strip()
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    user = authenticate(username=username, password=password)
    if user is None:
        return JsonResponse({"error": "Invalid username or password."}, status=401)
    if not user.is_staff:
        return JsonResponse({"error": "You do not have admin access."}, status=403)

    return JsonResponse({
        "email":        user.email,
        "username":     user.username,
        "first_name":   user.first_name,
        "is_superuser": user.is_superuser,
    })


# ─────────────────────────────────────────────
#  DASHBOARD STATS
# ─────────────────────────────────────────────

@_admin_required
def admin_stats(request):
    total_revenue = Order.objects.aggregate(t=Sum("total_amount"))["t"] or 0
    return JsonResponse({
        "total_artisans":  Artisan.objects.count(),
        "total_buyers":    Buyer.objects.count(),              # ← fixed
        "total_products":  Product.objects.count(),
        "total_orders":    Order.objects.count(),
        "total_revenue":   float(total_revenue),
        "pending_orders":  Order.objects.filter(payment_status="Pending").count(),
        "delivered_items": OrderItem.objects.filter(status="Delivered").count(),
    })


# ─────────────────────────────────────────────
#  ARTISANS
#  Fields: id, firstname, lastname, email,
#          password, phone, address, bio,
#          gst_number, verified, is_verified
# ─────────────────────────────────────────────

@_admin_required
def admin_artisans(request):
    artisans = Artisan.objects.all().order_by("firstname")
    data = []
    for a in artisans:
        data.append({
            "id":          a.id,
            "firstname":   a.firstname,
            "lastname":    a.lastname,
            "email":       a.email,
            "phone":       a.phone,
            "gst_number":  a.gst_number,
            "verified":    a.verified,       # used for email trigger
            "is_verified": a.is_verified,    # shown in admin panel
        })
    return JsonResponse(data, safe=False)


@csrf_exempt
@_admin_required
def admin_verify_artisan(request, artisan_id):
    """PATCH /api/admin/artisans/<id>/verify/ — toggle verified = True"""
    if request.method != "PATCH":
        return JsonResponse({"error": "PATCH required"}, status=405)
    try:
        artisan = Artisan.objects.get(id=artisan_id)
        artisan.verified    = True
        artisan.is_verified = True
        artisan.save()          # triggers email in Artisan.save()
        return JsonResponse({"message": f"{artisan.firstname} verified successfully"})
    except Artisan.DoesNotExist:
        return JsonResponse({"error": "Artisan not found"}, status=404)


@csrf_exempt
@_admin_required
def admin_delete_artisan(request, artisan_id):
    """DELETE /api/admin/artisans/<id>/delete/"""
    if request.method != "DELETE":
        return JsonResponse({"error": "DELETE required"}, status=405)
    try:
        Artisan.objects.get(id=artisan_id).delete()
        return JsonResponse({"message": "Artisan deleted"})
    except Artisan.DoesNotExist:
        return JsonResponse({"error": "Artisan not found"}, status=404)


# ─────────────────────────────────────────────
#  BUYERS
#  Fields: id, firstname, lastname, email,
#          password, phone, address
# ─────────────────────────────────────────────

@_admin_required
def admin_buyers(request):
    buyers = Buyer.objects.all().order_by("firstname")     # ← now from Buyer model
    data = []
    for b in buyers:
        data.append({
            "id":        b.id,
            "firstname": b.firstname,
            "lastname":  b.lastname,
            "email":     b.email,
            "phone":     b.phone,
            "address":   b.address,
        })
    return JsonResponse(data, safe=False)


@csrf_exempt
@_admin_required
def admin_delete_buyer(request, buyer_id):
    """DELETE /api/admin/buyers/<id>/delete/"""
    if request.method != "DELETE":
        return JsonResponse({"error": "DELETE required"}, status=405)
    try:
        Buyer.objects.get(id=buyer_id).delete()            # ← Buyer not User
        return JsonResponse({"message": "Buyer deleted"})
    except Buyer.DoesNotExist:
        return JsonResponse({"error": "Buyer not found"}, status=404)


# ─────────────────────────────────────────────
#  PRODUCTS
# ─────────────────────────────────────────────

@_admin_required
def admin_products(request):
    products = Product.objects.select_related("artisan").prefetch_related("images").order_by("-created_at")
    data = []
    for p in products:
        first_img = p.images.first()
        data.append({
            "id":            p.id,
            "name":          p.name,
            "description":   p.description,
            "price":         str(p.price),
            "category":      p.category,
            "artisan_name":  f"{p.artisan.firstname} {p.artisan.lastname}",
            "artisan_email": p.artisan.email,
            "image":         first_img.image.url if first_img else None,
            "created_at":    str(p.created_at),
        })
    return JsonResponse(data, safe=False)


@csrf_exempt
@_admin_required
def admin_update_product(request, product_id):
    if request.method != "PATCH":
        return JsonResponse({"error": "PATCH required"}, status=405)
    try:
        body    = json.loads(request.body)
        product = Product.objects.get(id=product_id)
        if "name"     in body: product.name     = body["name"]
        if "price"    in body: product.price    = float(body["price"])
        if "category" in body: product.category = body["category"]
        product.save()
        return JsonResponse({"message": "Product updated", "id": product.id})
    except Product.DoesNotExist:
        return JsonResponse({"error": "Product not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
@_admin_required
def admin_delete_product(request, product_id):
    if request.method != "DELETE":
        return JsonResponse({"error": "DELETE required"}, status=405)
    try:
        Product.objects.get(id=product_id).delete()
        return JsonResponse({"message": "Product deleted"})
    except Product.DoesNotExist:
        return JsonResponse({"error": "Product not found"}, status=404)


# ─────────────────────────────────────────────
#  ORDERS
#  Note: Order.user is Django User (used for
#        payment via Stripe), not your Buyer.
# ─────────────────────────────────────────────

@_admin_required
def admin_orders(request):
    orders = (
        Order.objects
        .select_related("user")
        .prefetch_related("orderitem_set__product")
        .order_by("-created_at")
    )
    data = []
    for o in orders:
        # Try to get buyer name from your Buyer table by email
        buyer_name = ""
        try:
            b = Buyer.objects.get(email=o.user.email)
            buyer_name = f"{b.firstname} {b.lastname}"
        except Buyer.DoesNotExist:
            buyer_name = o.user.get_full_name() or o.user.username

        data.append({
            "id":             o.id,
            "buyer_email":    o.user.email,
            "buyer_name":     buyer_name,
            "total_amount":   str(o.total_amount),
            "payment_status": o.payment_status,
            "payment_method": o.payment_method,
            "created_at":     str(o.created_at),
            "item_count":     o.orderitem_set.count(),
        })
    return JsonResponse(data, safe=False)


@csrf_exempt
@_admin_required
def admin_update_order(request, order_id):
    if request.method != "PATCH":
        return JsonResponse({"error": "PATCH required"}, status=405)
    try:
        body  = json.loads(request.body)
        order = Order.objects.get(id=order_id)
        if "payment_status" in body: order.payment_status = body["payment_status"]
        if "payment_method" in body: order.payment_method = body["payment_method"]
        order.save()
        return JsonResponse({"message": "Order updated"})
    except Order.DoesNotExist:
        return JsonResponse({"error": "Order not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


# ─────────────────────────────────────────────
#  ORDER ITEMS
# ─────────────────────────────────────────────

@_admin_required
def admin_order_items(request):
    items = (
        OrderItem.objects
        .select_related("order__user", "product__artisan")
        .order_by("-order__created_at")
    )
    data = []
    for oi in items:
        try:
            addr     = oi.shipping_address
            shipping = {
                "full_name":    addr.full_name,
                "phone":        addr.phone,
                "address_line": addr.address_line,
                "city":         addr.city,
                "state":        addr.state,
                "pincode":      addr.pincode,
            }
        except ShippingAddress.DoesNotExist:
            shipping = {}

        data.append({
            "id":               oi.id,
            "order_id":         oi.order.id,
            "product_name":     oi.product.name,
            "product_category": oi.product.category,
            "artisan_name":     f"{oi.product.artisan.firstname} {oi.product.artisan.lastname}",
            "buyer_email":      oi.order.user.email,
            "quantity":         oi.quantity,
            "price":            str(oi.price),
            "total":            str(oi.price * oi.quantity),
            "status":           oi.status,
            "created_at":       str(oi.order.created_at),
            **shipping,
        })
    return JsonResponse(data, safe=False)


@csrf_exempt
@_admin_required
def admin_update_order_item(request, item_id):
    if request.method != "PATCH":
        return JsonResponse({"error": "PATCH required"}, status=405)
    try:
        body  = json.loads(request.body)
        oi    = OrderItem.objects.get(id=item_id)
        valid = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]
        if "status" in body:
            if body["status"] not in valid:
                return JsonResponse({"error": f"Status must be one of: {valid}"}, status=400)
            oi.status = body["status"]
        oi.save()
        return JsonResponse({"message": "Order item updated", "status": oi.status})
    except OrderItem.DoesNotExist:
        return JsonResponse({"error": "Order item not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


# ─────────────────────────────────────────────
#  REVIEWS (admin approval)
# ─────────────────────────────────────────────

@_admin_required
def admin_reviews(request):
    """GET /api/admin/reviews/ — all reviews pending + approved"""
    reviews = Review.objects.select_related("artisan", "buyer").order_by("approved", "-created_at")
    data = []
    for r in reviews:
        try:
            b = Buyer.objects.get(email=r.buyer.email)
            buyer_name = f"{b.firstname} {b.lastname}"
        except Buyer.DoesNotExist:
            buyer_name = r.buyer.username

        data.append({
            "id":           r.id,
            "buyer_name":   buyer_name,
            "buyer_email":  r.buyer.email,
            "artisan_name": f"{r.artisan.firstname} {r.artisan.lastname}",
            "artisan_id":   r.artisan.id,
            "rating":       r.rating,
            "comment":      r.comment,
            "approved":     r.approved,
            "created_at":   str(r.created_at),
        })
    return JsonResponse(data, safe=False)


@csrf_exempt
@_admin_required
def admin_approve_review(request, review_id):
    """PATCH /api/admin/reviews/<id>/approve/"""
    if request.method != "PATCH":
        return JsonResponse({"error": "PATCH required"}, status=405)
    try:
        review = Review.objects.get(id=review_id)
        review.approved = True
        review.save()
        return JsonResponse({"message": "Review approved", "id": review.id})
    except Review.DoesNotExist:
        return JsonResponse({"error": "Review not found"}, status=404)


@csrf_exempt
@_admin_required
def admin_reject_review(request, review_id):
    """DELETE /api/admin/reviews/<id>/reject/"""
    if request.method != "DELETE":
        return JsonResponse({"error": "DELETE required"}, status=405)
    try:
        Review.objects.get(id=review_id).delete()
        return JsonResponse({"message": "Review rejected and deleted"})
    except Review.DoesNotExist:
        return JsonResponse({"error": "Review not found"}, status=404)





@_admin_required
def admin_artisan_analytics(request):
    """
    GET /api/admin/artisan-analytics/
    Returns each artisan ranked by orders, revenue, products, reviews.
    Supports ?category=Pottery&sort=orders
    """
    from django.db.models import Count, Sum, Avg
    from .models import Review

    category = request.GET.get("category", "").strip()
    sort_by  = request.GET.get("sort", "orders")  # orders | revenue | products | rating

    artisans = Artisan.objects.all()

    data = []
    for a in artisans:
        # All products by this artisan
        products = a.products.all()
        if category:
            products = products.filter(category=category)

        product_ids = list(products.values_list("id", flat=True))
        product_count = products.count()

        # Orders & revenue from OrderItems for this artisan's products
        from .models import OrderItem
        order_items = OrderItem.objects.filter(product_id__in=product_ids)
        total_orders  = order_items.count()
        total_revenue = float(
            order_items.aggregate(rev=Sum("price"))["rev"] or 0
        )

        # Status breakdown
        delivered  = order_items.filter(status="Delivered").count()
        pending    = order_items.filter(status="Pending").count()
        shipped    = order_items.filter(status="Shipped").count()
        cancelled  = order_items.filter(status="Cancelled").count()

        # Reviews
        reviews        = Review.objects.filter(artisan=a, approved=True)
        review_count   = reviews.count()
        avg_rating     = float(reviews.aggregate(avg=Avg("rating"))["avg"] or 0)

        # Categories sold
        categories = list(
            products.values_list("category", flat=True).distinct()
        )

        data.append({
            "id":             a.id,
            "firstname":      a.firstname,
            "lastname":       a.lastname,
            "email":          a.email,
            "is_verified":    a.is_verified,
            "gst_number":     a.gst_number,
            "product_count":  product_count,
            "total_orders":   total_orders,
            "total_revenue":  round(total_revenue, 2),
            "delivered":      delivered,
            "pending":        pending,
            "shipped":        shipped,
            "cancelled":      cancelled,
            "review_count":   review_count,
            "avg_rating":     round(avg_rating, 1),
            "categories":     categories,
        })

    # Sort
    sort_map = {
        "orders":   lambda x: x["total_orders"],
        "revenue":  lambda x: x["total_revenue"],
        "products": lambda x: x["product_count"],
        "rating":   lambda x: x["avg_rating"],
        "reviews":  lambda x: x["review_count"],
    }
    data.sort(key=sort_map.get(sort_by, sort_map["orders"]), reverse=True)

    # Add rank
    for i, d in enumerate(data):
        d["rank"] = i + 1

    return JsonResponse({
        "artisans":  data,
        "total":     len(data),
        "category":  category,
        "sorted_by": sort_by,
    })


