from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json
from .models import Artisan,Buyer
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q

@csrf_exempt
def artisan_signup(request):
    if request.method == "POST":
        data = json.loads(request.body)

        artisan = Artisan.objects.create(
            firstname=data["firstname"],
            lastname=data["lastname"],
            email=data["email"],
            password=data["password"],
            phone=data["phone"],
            address=data["address"],
            bio=data["bio"],
            gst_number=data["GSTNumber"],
            verified=False
        )

        # 📩 Email to Admin
        send_mail(
            subject="New Artisan Verification Request",
            message=f"""
New artisan registered.

Name: {artisan.firstname} {artisan.lastname}
Email: {artisan.email}
GST Number: {artisan.gst_number}
""",
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[settings.EMAIL_HOST_USER],  # admin email
            fail_silently=False,
        )

        return JsonResponse({"message": "Registration successful. Waiting for admin verification."})

    return JsonResponse({"error": "Invalid request"}, status=400)







@csrf_exempt
def buyer_signup(request):
    if request.method == "POST":
        data = json.loads(request.body)

        buyer = Buyer.objects.create(
            firstname=data.get("firstname"),
            lastname=data.get("lastname"),
            email=data.get("email"),
            password=data.get("password"),
            phone=data.get("phone"),
            address=data.get("address"),
        )

        return JsonResponse({"message": "Buyer created successfully"})

    return JsonResponse({"error": "Invalid request"})





@csrf_exempt
def login_view(request):
    if request.method == "POST":
        data = json.loads(request.body)
        email = data.get("email")
        password = data.get("password")

        # Check Artisan table
        try:
            artisan = Artisan.objects.get(email=email, password=password)

            # 🚨 BLOCK IF NOT VERIFIED
            if not artisan.verified:
                return JsonResponse({
                    "error": "Your account is not verified yet. Please wait for admin approval."
                }, status=403)

            return JsonResponse({
                "message": "Login successful",
                "role": "ARTISAN",
                "email": artisan.email
            })

        except Artisan.DoesNotExist:
            pass

        # Check Buyer table
        try:
            buyer = Buyer.objects.get(email=email, password=password)
            return JsonResponse({
                "message": "Login successful",
                "role": "BUYER",
                "email": buyer.email
            })
        except Buyer.DoesNotExist:
            return JsonResponse({"error": "Invalid credentials"}, status=400)



@csrf_exempt
def contact_view(request):
    if request.method == "POST":
        data = json.loads(request.body)

        name = data.get("name")
        email = data.get("email")
        message = data.get("message")

        full_message = f"""
        New Contact Message

        Name: {name}
        Email: {email}

        Message:
        {message}
        """

        send_mail(
            subject="New Contact Us Message",
            message=full_message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[settings.EMAIL_HOST_USER],
            fail_silently=False,
        )

        return JsonResponse({"message": "Email sent successfully"})

    return JsonResponse({"error": "Invalid request"}, status=400)




def verify_artisan(request, artisan_id):
    try:
        artisan = Artisan.objects.get(id=artisan_id)

        artisan.verified = True
        artisan.save()

        # 📩 Email to Artisan
        send_mail(
            subject="Your Account Has Been Verified",
            message=f"""
Dear {artisan.firstname},

Congratulations! 🎉

Your GST has been verified successfully.
You can now login and upload your products.

- Craftelligence Team
""",
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[artisan.email],
            fail_silently=False,
        )

        return JsonResponse({"message": "Artisan verified successfully"})

    except Artisan.DoesNotExist:
        return JsonResponse({"error": "Artisan not found"}, status=404)




def buyer_profile(request, email):
    email = email.strip().lower()

    try:
        buyer = Buyer.objects.get(email__iexact=email)

        return JsonResponse({
            "firstname": buyer.firstname,
            "lastname": buyer.lastname,
            "email": buyer.email,
            "phone": buyer.phone,
            "address": buyer.address,
        })

    except Buyer.DoesNotExist:
        return JsonResponse({"error": "Buyer not found"}, status=400)