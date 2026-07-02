from django.db import models
from django.core.mail import send_mail
from django.conf import settings


from django.db import models
from django.core.mail import send_mail
from django.conf import settings


class Artisan(models.Model):
    firstname = models.CharField(max_length=100)
    lastname = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    address = models.TextField()
    bio = models.TextField()
    gst_number = models.CharField(max_length=50)
    verified = models.BooleanField(default=False)
    verification_requested = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        is_new = self.pk is None

        if not is_new:
            old = Artisan.objects.get(pk=self.pk)

            if old.verified == False and self.verified == True:
                print("Verification detected. Sending email...")

                # 🔗 LOGIN LINK
                login_link = "http://localhost:3000/login"

                send_mail(
                    subject="Your Account Has Been Verified 🎉",
                    message=f"""
Dear {self.firstname},

Congratulations! 🎉

Your GST has been verified successfully.

You can now login using the link below:
{login_link}
Or by visiting our website .

Thank you for being part of Craftelligence.

- Craftelligence Team
""",
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[self.email],
                    fail_silently=False,
                )

        super().save(*args, **kwargs)

    def __str__(self):
        return self.email    


    
class Buyer(models.Model):
    firstname = models.CharField(max_length=100)
    lastname = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    address = models.TextField()

    def __str__(self):
        return self.email