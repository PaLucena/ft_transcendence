from django.shortcuts import render
from user.models import AppUser as userModel
from rest_framework.response import Response
from rest_framework import status
from user.decorators import default_authentication_required
from rest_framework.decorators import api_view
from django_otp.plugins.otp_totp.models import TOTPDevice
from django.shortcuts import render, redirect
import qrcode, json, os
from core import settings

# Create your views here.
@api_view(["POST"])
@default_authentication_required
def	enable2fa(request):
	print("HEY")
	if request.method == "POST":
		userlogin = request.user
		user=userModel.objects.get(username=userlogin)
		device, created = TOTPDevice.objects.get_or_create(user=request.user, confirmed=False)
		print("login:", userlogin)
		if created or not device.confirmed:
			otp_uri = device.config_url
			qr = qrcode.make(otp_uri)
			imgs_dir = settings.MEDIA_ROOT + "/qrs/"
			imgs_dir = os.path.join(settings.MEDIA_ROOT, "qrs")
			img_path = os.path.join(imgs_dir, user.username + ".jpg")
			os.makedirs(imgs_dir, exist_ok=True)
			qr_img = qr.save(img_path)
			user.has_2fa_enabled = True
			user.tf_fk = device
			user.save()
			return Response({'qrpath': img_path}, status = status.HTTP_200_OK)