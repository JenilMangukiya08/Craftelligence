from django.shortcuts import render, redirect
from django.http import JsonResponse
from .models import Product, Wishlist, Cart, Order, OrderItem, ProductImage, ShippingAddress,Review
from django.views.decorators.csrf import csrf_exempt
import json
from django.contrib.auth.models import User
import stripe
from django.conf import settings
from accounts.models import Artisan
from django.core.mail import send_mail

# ─────────────────────────────────────────────
#  PRODUCTS
# ─────────────────────────────────────────────

@csrf_exempt
def add_product(request):
    """Add a product for the authenticated artisan."""
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request method"}, status=400)

    email = request.POST.get("email")
    if not email:
        return JsonResponse({"error": "Email is required"}, status=400)

    try:
        artisan = Artisan.objects.get(email=email)
    except Artisan.DoesNotExist:
        return JsonResponse({"error": "No artisan found with this email."}, status=404)

    name        = request.POST.get("name", "").strip()
    description = request.POST.get("description", "").strip()
    price       = request.POST.get("price", "").strip()
    category    = request.POST.get("category", "").strip()

    if not name or not price:
        return JsonResponse({"error": "Name and price are required"}, status=400)

    try:
        price = float(price)
        if price <= 0:
            raise ValueError
    except ValueError:
        return JsonResponse({"error": "Price must be a positive number"}, status=400)

    product = Product.objects.create(
        artisan=artisan,
        name=name,
        description=description,
        price=price,
        category=category,
    )

    images = request.FILES.getlist("images")
    for image in images:
        ProductImage.objects.create(product=product, image=image)

    return JsonResponse(
        {
            "message": "Product added successfully",
            "product_id": product.id,
        },
        status=201,
    )


def get_products(request):
    email = request.GET.get("email", "").strip()
    if email:
        products = Product.objects.filter(artisan__email=email).order_by("-created_at")
    else:
        products = Product.objects.all().order_by("-created_at")

    data = []
    for product in products:
        images = [img.image.url for img in product.images.all()]
        data.append({
            "id":            product.id,
            "name":          product.name,
            "price":         str(product.price),
            "description":   product.description,
            "category":      product.category,
            "images":        images,
            "artisan":       f"{product.artisan.firstname} {product.artisan.lastname}",
            "artisan_email": product.artisan.email,
        })
    return JsonResponse(data, safe=False)


def product_list(request):
    products = Product.objects.all().order_by("-created_at")
    data = []
    for product in products:
        first_image = product.images.first()
        data.append({
            "id":            product.id,
            "name":          product.name,
            "description":   product.description,
            "price":         str(product.price),
            "category":      product.category,
            "image":         first_image.image.url if first_image else None,
            "images":        [img.image.url for img in product.images.all()],
            "artisan":       f"{product.artisan.firstname} {product.artisan.lastname}",
            "artisan_email": product.artisan.email,
        })
    return JsonResponse(data, safe=False)


def get_product_detail(request, product_id):
    """Single product by ID (path param: product_id)."""
    try:
        product     = Product.objects.get(id=product_id)
        first_image = product.images.first()

        data = {
            "id":          product.id,
            "name":        product.name,
            "description": product.description,
            "price":       str(product.price),
            "category":    product.category,
            "image":       first_image.image.url if first_image else None,
            "images":      [img.image.url for img in product.images.all()],
            "artisan":     f"{product.artisan.firstname} {product.artisan.lastname}",
            "artisan_email": product.artisan.email,
        }
        return JsonResponse(data, safe=False)

    except Product.DoesNotExist:
        return JsonResponse({"error": "Product not found"}, status=404)


def product_detail(request, id):
    """Single product by ID (path param: id) — kept for backwards compat."""
    try:
        product = Product.objects.get(id=id)
        data = {
            "id":          product.id,
            "name":        product.name,
            "description": product.description,
            "price":       str(product.price),
            "category":    product.category,
            "images":      [img.image.url for img in product.images.all()],
            "artisan":     f"{product.artisan.firstname} {product.artisan.lastname}",
            "artisan_email": product.artisan.email,
        }
        return JsonResponse(data)

    except Product.DoesNotExist:
        return JsonResponse({"error": "Product not found"}, status=404)


@csrf_exempt
def delete_product(request, product_id):
    """Delete a product — only the owning artisan can do this."""
    if request.method != "DELETE":
        return JsonResponse({"error": "DELETE method required"}, status=405)

    try:
        body  = json.loads(request.body)
        email = body.get("email", "").strip()

        if not email:
            return JsonResponse({"error": "Email is required"}, status=400)

        artisan = Artisan.objects.get(email=email)
        product = Product.objects.get(id=product_id, artisan=artisan)
        product.delete()
        return JsonResponse({"message": "Product deleted successfully"})

    except Artisan.DoesNotExist:
        return JsonResponse({"error": "Artisan not found"}, status=404)
    except Product.DoesNotExist:
        return JsonResponse({"error": "Product not found or not yours"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


# ─────────────────────────────────────────────
#  WISHLIST
# ─────────────────────────────────────────────

@csrf_exempt
def add_to_wishlist(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    user_email = request.POST.get("email", "").strip()
    product_id = request.POST.get("product_id")

    if not user_email or not product_id:
        return JsonResponse({"error": "email and product_id are required"}, status=400)

    try:
        user    = User.objects.get(email=user_email)
        product = Product.objects.get(id=product_id)
        created = Wishlist.objects.get_or_create(user=user, product=product)
        return JsonResponse({
            "message": "Added to wishlist" if created else "Already in wishlist"
        })
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)
    except Product.DoesNotExist:
        return JsonResponse({"error": "Product not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


def get_wishlist(request, email):
    try:
        user           = User.objects.get(email=email)
        wishlist_items = Wishlist.objects.filter(user=user).select_related("product")

        data = []
        for item in wishlist_items:
            product     = item.product
            first_image = product.images.first()
            data.append({
                "id":       product.id,
                "name":     product.name,
                "price":    str(product.price),
                "category": product.category,
                "image":    first_image.image.url if first_image else None,
            })
        return JsonResponse(data, safe=False)

    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)


@csrf_exempt
def remove_from_wishlist(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    try:
        data       = json.loads(request.body)
        email      = data.get("email", "").strip()
        product_id = data.get("product_id")
        user       = User.objects.get(email=email)
        Wishlist.objects.filter(user=user, product_id=product_id).delete()
        return JsonResponse({"message": "Removed from wishlist"})
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


# ─────────────────────────────────────────────
#  CART
# ─────────────────────────────────────────────

@csrf_exempt
def add_to_cart(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    user_email = request.POST.get("email", "").strip()
    product_id = request.POST.get("product_id")

    if not user_email or not product_id:
        return JsonResponse({"error": "email and product_id are required"}, status=400)

    try:
        user    = User.objects.get(email=user_email)
        product = Product.objects.get(id=product_id)
        cart_item, created = Cart.objects.get_or_create(user=user, product=product)
        if not created:
            cart_item.quantity += 1
            cart_item.save()
        return JsonResponse({"message": "Added to cart"})
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)
    except Product.DoesNotExist:
        return JsonResponse({"error": "Product not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


def get_cart(request, email):
    try:
        user       = User.objects.get(email=email)
        cart_items = Cart.objects.filter(user=user).select_related("product")

        data = []
        for item in cart_items:
            first_image = item.product.images.first()
            data.append({
                "id":       item.product.id,
                "name":     item.product.name,
                "price":    str(item.product.price),
                "image":    first_image.image.url if first_image else None,
                "quantity": item.quantity,
            })
        return JsonResponse(data, safe=False)

    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)


@csrf_exempt
def update_cart_quantity(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    try:
        data       = json.loads(request.body)
        email      = data.get("email", "").strip()
        product_id = data.get("product_id")
        action     = data.get("action")  # "increase" | "decrease"

        user      = User.objects.get(email=email)
        cart_item = Cart.objects.get(user=user, product_id=product_id)

        if action == "increase":
            cart_item.quantity += 1
            cart_item.save()
        elif action == "decrease":
            cart_item.quantity -= 1
            if cart_item.quantity <= 0:
                cart_item.delete()
                return JsonResponse({"message": "Item removed from cart"})
            cart_item.save()
        else:
            return JsonResponse({"error": "action must be 'increase' or 'decrease'"}, status=400)

        return JsonResponse({"message": "Quantity updated", "quantity": cart_item.quantity})

    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)
    except Cart.DoesNotExist:
        return JsonResponse({"error": "Cart item not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
def remove_from_cart(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    try:
        data       = json.loads(request.body)
        email      = data.get("email", "").strip()
        product_id = data.get("product_id")
        user       = User.objects.get(email=email)
        Cart.objects.filter(user=user, product_id=product_id).delete()
        return JsonResponse({"message": "Item removed from cart"})
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


# ─────────────────────────────────────────────
#  ORDERS / CHECKOUT
# ─────────────────────────────────────────────

@csrf_exempt
def checkout(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    try:
        email = request.POST.get("email", "").strip()
        if not email:
            return JsonResponse({"error": "Email is required"}, status=400)

        user       = User.objects.get(email=email)
        cart_items = Cart.objects.filter(user=user).select_related("product")

        if not cart_items.exists():
            return JsonResponse({"error": "Cart is empty"}, status=400)

        total = sum(item.product.price * item.quantity for item in cart_items)

        payment_method = request.POST.get("payment_method", "COD")

        order = Order.objects.create(
            user=user,
            total_amount=total,
            payment_status="Pending" if payment_method == "COD" else "Paid",
            payment_method=payment_method,
        )

        for item in cart_items:
            OrderItem.objects.create(
                order=order,
                product=item.product,
                quantity=item.quantity,
                price=item.product.price,
            )

        cart_items.delete()
        return JsonResponse({"message": "Payment Successful 🎉", "order_id": order.id})

    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


def get_orders(request, email):
    try:
        user   = User.objects.get(email=email)
        orders = Order.objects.filter(user=user).order_by("-created_at")
 
        data = []
        for order in orders:
            items = []
            for oi in order.orderitem_set.select_related("product__artisan").prefetch_related("product__images").all():
                first_image = oi.product.images.first()
                items.append({
                    "product_id":    oi.product.id,
                    "product_name":  oi.product.name,
                    "category":      oi.product.category,
                    "artisan_name":  f"{oi.product.artisan.firstname} {oi.product.artisan.lastname}",
                    "quantity":      oi.quantity,
                    "price":         str(oi.price),
                    "status":        oi.status,       # ← per-item delivery status
                    "image":         first_image.image.url if first_image else None,
                })
            data.append({
                "id":             order.id,
                "total_amount":   str(order.total_amount),
                "payment_status": order.payment_status,
                "payment_method": order.payment_method,
                "created_at":     str(order.created_at),
                "items":          items,
            })
 
        return JsonResponse(data, safe=False)
 
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)


# ─────────────────────────────────────────────
#  NEW: PLACE ORDER (Buy Now flow with shipping)
# ─────────────────────────────────────────────

@csrf_exempt
def place_order(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    try:
        data         = json.loads(request.body)
        buyer_email  = data.get("buyer_email", "").strip()
        product_id   = data.get("product_id")
        quantity     = int(data.get("quantity", 1))
        total_price  = float(data.get("total_price", 0))
        full_name    = data.get("full_name", "")
        phone        = data.get("phone", "")
        address_line = data.get("address_line", "")
        landmark     = data.get("landmark", "")
        city         = data.get("city", "")
        state        = data.get("state", "")
        pincode      = data.get("pincode", "")

        user    = User.objects.get(email=buyer_email)
        product = Product.objects.get(id=product_id)

        # Create Order
        order = Order.objects.create(
            user=user,
            total_amount=total_price,
            payment_status="Pending",
            payment_method="COD",
        )

        # Create OrderItem
        order_item = OrderItem.objects.create(
            order=order,
            product=product,
            quantity=quantity,
            price=product.price,
            status="Pending",
        )

        # Save ShippingAddress
        ShippingAddress.objects.create(
            order_item=order_item,
            full_name=full_name,
            phone=phone,
            address_line=address_line,
            landmark=landmark,
            city=city,
            state=state,
            pincode=pincode,
        )

        # ── Email to BUYER ──────────────────────────────────────────
        send_mail(
            subject="✅ Order Confirmed — Craftelligence",
            message=f"""
Dear {full_name},

Your order has been placed successfully! 🎉

━━━━━━━━━━━━━━━━━━━━━━━━━
ORDER DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━
Product   : {product.name}
Quantity  : {quantity}
Amount    : ₹{total_price}
Payment   : Cash on Delivery

━━━━━━━━━━━━━━━━━━━━━━━━━
DELIVERY ADDRESS
━━━━━━━━━━━━━━━━━━━━━━━━━
{full_name}
{phone}
{address_line}{', ' + landmark if landmark else ''}
{city}, {state} — {pincode}

Your artisan has been notified and will prepare
your handcrafted item with love. 🙏

Thank you for shopping with Craftelligence!

— Craftelligence Team
""",
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[buyer_email],
            fail_silently=False,
        )

        # ── Email to ARTISAN ────────────────────────────────────────
        send_mail(
            subject=f"🛍️ New Order Received — {product.name}",
            message=f"""
Dear {product.artisan.firstname},

You have received a new order! 🎉

━━━━━━━━━━━━━━━━━━━━━━━━━
ORDER DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━
Order ID  : #{order_item.id}
Product   : {product.name}
Quantity  : {quantity}
Amount    : ₹{total_price}

━━━━━━━━━━━━━━━━━━━━━━━━━
BUYER DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━
Name      : {full_name}
Phone     : {phone}
Address   : {address_line}{', ' + landmark if landmark else ''}
City      : {city}, {state} — {pincode}

Please log in to your dashboard to update the
order status once shipped.

— Craftelligence Team
""",
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[product.artisan.email],
            fail_silently=False,
        )

        return JsonResponse({
            "message":       "Order placed successfully!",
            "order_id":      order.id,
            "order_item_id": order_item.id,
        }, status=201)

    except User.DoesNotExist:
        return JsonResponse({"error": "Buyer not found"}, status=404)
    except Product.DoesNotExist:
        return JsonResponse({"error": "Product not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


# ─────────────────────────────────────────────
#  NEW: ARTISAN ORDERS (orders page for artisan)
# ─────────────────────────────────────────────

def artisan_orders(request):
    """
    Returns all OrderItems whose product belongs to this artisan.
    GET /api/artisan-orders/?email=...
    """
    email = request.GET.get("email", "").strip()
    if not email:
        return JsonResponse({"error": "Email is required"}, status=400)
 
    try:
        artisan = Artisan.objects.get(email=email)
    except Artisan.DoesNotExist:
        return JsonResponse({"error": "Artisan not found"}, status=404)
 
    order_items = (
        OrderItem.objects
        .filter(product__artisan=artisan)
        .select_related("order", "order__user", "product")
        .prefetch_related("product__images")
        .order_by("-order__created_at")
    )
 
    # Import Buyer here to get real buyer names
    from accounts.models import Buyer
 
    data = []
    for oi in order_items:
        first_image = oi.product.images.first()
 
        # ── Get buyer name from your Buyer model (not Django User) ──
        buyer_name = ""
        try:
            buyer      = Buyer.objects.get(email=oi.order.user.email)
            buyer_name = f"{buyer.firstname} {buyer.lastname}"
        except Buyer.DoesNotExist:
            buyer_name = oi.order.user.get_full_name() or oi.order.user.username
 
        # ── Get shipping address ──
        try:
            addr     = oi.shipping_address
            shipping = {
                "full_name":    addr.full_name,
                "phone":        addr.phone,
                "address_line": addr.address_line,
                "landmark":     addr.landmark,
                "city":         addr.city,
                "state":        addr.state,
                "pincode":      addr.pincode,
            }
        except ShippingAddress.DoesNotExist:
            shipping = {
                "full_name":"", "phone":"", "address_line":"",
                "landmark":"", "city":"", "state":"", "pincode":"",
            }
 
        data.append({
            "id":            oi.id,
            "product_name":  oi.product.name,
            "product_image": first_image.image.url if first_image else None,
            "category":      oi.product.category,
            "quantity":      oi.quantity,
            "total_price":   str(oi.price * oi.quantity),
            "status":        oi.status,
            "created_at":    str(oi.order.created_at),
            "buyer_email":   oi.order.user.email,
            "buyer_name":    buyer_name,            # ← now from Buyer model
            **shipping,
        })
 
    return JsonResponse(data, safe=False)


# ─────────────────────────────────────────────
#  NEW: UPDATE ORDER STATUS (artisan updates status)
# ─────────────────────────────────────────────

@csrf_exempt
def update_order_status(request, order_item_id):
    """
    Called by ArtisanOrders.jsx status dropdown.
    PATCH /api/update-order-status/<order_item_id>/
    Body: { "status": "Shipped" }
    """
    if request.method != "PATCH":
        return JsonResponse({"error": "PATCH required"}, status=405)

    try:
        data       = json.loads(request.body)
        new_status = data.get("status", "").strip()

        valid = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]
        if new_status not in valid:
            return JsonResponse({"error": f"Status must be one of: {valid}"}, status=400)

        order_item        = OrderItem.objects.get(id=order_item_id)
        order_item.status = new_status
        order_item.save()

        return JsonResponse({
            "message": f"Status updated to {new_status}",
            "order_item_id": order_item.id,
            "status": order_item.status,
        })

    except OrderItem.DoesNotExist:
        return JsonResponse({"error": "Order item not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


# ─────────────────────────────────────────────
#  STRIPE
# ─────────────────────────────────────────────

stripe.api_key = settings.STRIPE_SECRET_KEY


@csrf_exempt
def create_payment_intent(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    try:
        email      = request.POST.get("email", "").strip()
        cart_items = Cart.objects.filter(user__email=email).select_related("product")

        if not cart_items.exists():
            return JsonResponse({"error": "Cart is empty"}, status=400)

        total = sum(float(item.product.price) * item.quantity for item in cart_items)

        intent = stripe.PaymentIntent.create(
            amount=int(total * 100),
            currency="inr",
            payment_method_types=["card"],
        )

        return JsonResponse({
            "clientSecret":   intent["client_secret"],
            "publishableKey": settings.STRIPE_PUBLISHABLE_KEY,
        })
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
def create_checkout_session(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    email = request.POST.get("email", "").strip()
    if not email:
        return JsonResponse({"error": "Email is required"}, status=400)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)

    cart_items = Cart.objects.filter(user=user).select_related("product")
    if not cart_items.exists():
        return JsonResponse({"error": "Cart is empty"}, status=400)

    line_items = [
        {
            "price_data": {
                "currency": "inr",
                "product_data": {"name": item.product.name},
                "unit_amount": int(float(item.product.price) * 100),
            },
            "quantity": item.quantity,
        }
        for item in cart_items
    ]

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=line_items,
            mode="payment",
            success_url="http://localhost:3000/success",
            cancel_url="http://localhost:3000/cancel",
        )
        return JsonResponse({"checkout_url": session.url})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    




# ── Submit a review (buyer submits, saved as unapproved) ──────────────────────
@csrf_exempt
def submit_review(request):
    """
    POST /api/submit-review/
    Body: { buyer_email, artisan_id, rating, comment }
    Saved with approved=False — admin must approve before it shows publicly.
    """
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    try:
        data         = json.loads(request.body)
        buyer_email  = data.get("buyer_email", "").strip()
        artisan_id   = data.get("artisan_id")
        rating       = int(data.get("rating", 0))
        comment      = data.get("comment", "").strip()

        if not buyer_email or not artisan_id:
            return JsonResponse({"error": "buyer_email and artisan_id are required"}, status=400)

        if rating < 1 or rating > 5:
            return JsonResponse({"error": "Rating must be between 1 and 5"}, status=400)

        if not comment:
            return JsonResponse({"error": "Comment is required"}, status=400)

        user    = User.objects.get(email=buyer_email)
        artisan = Artisan.objects.get(id=artisan_id)

        # Check if buyer already reviewed this artisan
        if Review.objects.filter(artisan=artisan, buyer=user).exists():
            return JsonResponse({"error": "You have already reviewed this artisan."}, status=400)

        review = Review.objects.create(
            artisan=artisan,
            buyer=user,
            rating=rating,
            comment=comment,
            approved=False,  # ← pending admin approval
        )

        return JsonResponse({
            "message": "Review submitted! It will appear after admin approval.",
            "review_id": review.id,
        }, status=201)

    except User.DoesNotExist:
        return JsonResponse({"error": "Buyer not found"}, status=404)
    except Artisan.DoesNotExist:
        return JsonResponse({"error": "Artisan not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


# ── Get approved reviews for an artisan (public) ──────────────────────────────
def get_reviews(request, artisan_id):
    """
    GET /api/reviews/<artisan_id>/
    Returns only approved=True reviews.
    """
    try:
        artisan = Artisan.objects.get(id=artisan_id)
        reviews = Review.objects.filter(artisan=artisan, approved=True).select_related("buyer")

        data = []
        for r in reviews:
            # Get buyer name from your Buyer model
            from accounts.models import Buyer as BuyerModel
            buyer_name = ""
            try:
                b = BuyerModel.objects.get(email=r.buyer.email)
                buyer_name = f"{b.firstname} {b.lastname}"
            except BuyerModel.DoesNotExist:
                buyer_name = r.buyer.get_full_name() or r.buyer.username

            data.append({
                "id":         r.id,
                "buyer_name": buyer_name,
                "rating":     r.rating,
                "comment":    r.comment,
                "created_at": str(r.created_at),
            })

        # Average rating
        avg = round(sum(r["rating"] for r in data) / len(data), 1) if data else 0

        return JsonResponse({
            "artisan_id":     artisan.id,
            "artisan_name":   f"{artisan.firstname} {artisan.lastname}",
            "reviews":        data,
            "total_reviews":  len(data),
            "average_rating": avg,
        })

    except Artisan.DoesNotExist:
        return JsonResponse({"error": "Artisan not found"}, status=404)
    


def artisan_by_email(request):
    email = request.GET.get("email", "").strip()
    if not email:
        return JsonResponse({"error": "Email required"}, status=400)
    try:
        artisan = Artisan.objects.get(email=email)
        return JsonResponse({
            "id":          artisan.id,
            "firstname":   artisan.firstname,
            "lastname":    artisan.lastname,
            "email":       artisan.email,
            "phone":       artisan.phone,        # ← ADD
            "address":     artisan.address,      # ← ADD
            "bio":         artisan.bio,          # ← ADD
            "gst_number":  artisan.gst_number,   # ← ADD
            "is_verified": artisan.is_verified,  # ← ADD
            "verified":    artisan.verified,     # ← ADD
        })
    except Artisan.DoesNotExist:
        return JsonResponse({"error": "Artisan not found"}, status=404)


