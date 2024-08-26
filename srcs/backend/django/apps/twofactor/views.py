from django.shortcuts import render
from user.models import AppUser as userModel
from rest_framework.response import Response
from rest_framework import status
from user.decorators import default_authentication_required
from rest_framework.decorators import api_view
from django_otp.plugins.otp_totp.models import TOTPDevice
from django.shortcuts import render, redirect
import qrcode, json, os, base64
from core import settings

def Has2faEnabled(user):
	if user == None:
		return False
	try:
		device = TOTPDevice.objects.get(user=user, confirmed=False)
		return True
	except TOTPDevice.DoesNotExist:
		return False

# Create your views here.
@api_view(["POST"])
@default_authentication_required
def	enable2fa(request):
	userlogin = request.user
	user=userModel.objects.get(username=userlogin)
	device, created = TOTPDevice.objects.get_or_create(user=request.user, confirmed=False)
	print("user:", userlogin, flush=True)
	if created or not device.confirmed:
		otp_uri = device.config_url
		qr = qrcode.make(otp_uri)
		imgs_dir = settings.MEDIA_ROOT + "/qrs/"
		imgs_dir = os.path.join(settings.MEDIA_ROOT, "qrs")
		img_name = user.username + ".jpg"
		img_path = os.path.join(imgs_dir, img_name)
		os.makedirs(imgs_dir, exist_ok=True)
		qr_img = qr.save(img_path)
		user.has_2fa_enabled = True
		user.tf_fk = device
		user.save()
		return Response({'qrpath': "qrs/" + img_name}, status = status.HTTP_200_OK)
		
@api_view(["POST"])
def verifyTwoFactor(request):
	body_unicode = request.body.decode('utf-8')
	body_data = json.loads(body_unicode)
	otp_code = body_data.get('otpCode')
	userInfo = body_data.get('jsonData')
	username = userInfo.get('username')

	user=userModel.objects.get(username=username)
	try:
		device = TOTPDevice.objects.get(user=user.pk, confirmed=False)
		if device.verify_token(otp_code):
			return Response({'success': True, 'message': 'OTP verified successfully.'}, status=200)
		else:
			return Response({'success': False, 'message': 'Invalid OTP code.'}, status=400)
	except TOTPDevice.DoesNotExist:
		return Response({'success': False, 'message': 'No TOTP device found.'}, status=404)
