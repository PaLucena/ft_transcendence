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
from .utils import Has2faEnabled
from rest_framework_simplejwt.tokens import RefreshToken

@api_view(["GET"])
@default_authentication_required
def check2fa(request):
	return Response({"has2faEnabled": Has2faEnabled(request.user.username)}, status=status.HTTP_200_OK)

# Create your views here.
@api_view(["POST"])
@default_authentication_required
def	enable2fa(request):
	userlogin = request.user
	user=userModel.objects.get(username=userlogin)
	device, created = TOTPDevice.objects.get_or_create(user=request.user, confirmed=False)
	if created or not device.confirmed:
		otp_uri = device.config_url
		qr = qrcode.make(otp_uri)
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

	try:
		user=userModel.objects.get(username=username)
		device = TOTPDevice.objects.get(user=user.pk, confirmed=True)
		if device.verify_token(otp_code):
			return Response({'success': True, 'message': 'OTP verified successfully.'}, status=200)
		else:
			return Response({'success': False, 'message': 'Invalid OTP code.'}, status=400)
	except TOTPDevice.DoesNotExist:
		return Response({'success': False, 'message': 'No TOTP device found.'}, status=404)
	except userModel.DoesNotExist:
		return Response({'success': False, 'message': f'User {request.user} found.'}, status=404)
		

@api_view(["POST"])
@default_authentication_required
def disable2fa(request):
	user = userModel.objects.get(username=request.user)
	try:
		device = TOTPDevice.objects.get(user=user.pk, confirmed=True)
		os.remove(os.path.join(settings.MEDIA_ROOT, "qrs") + "/" + user.username + ".jpg")
		TOTPDevice.delete(device)
	except TOTPDevice.DoesNotExist:
		return Response({'success': False, 'message': 'No TOTP device found.'}, status=404)
	response = Response(status=status.HTTP_200_OK)
	response.delete_cookie("twofactor_access_token")
	response.delete_cookie("twofactor_refresh_token")
	return response

@api_view(["POST"])
@default_authentication_required
def confirmDevice(request):
	user=userModel.objects.get(username=request.user)
	try:
		device = TOTPDevice.objects.get(user=user.pk, confirmed=False)
		device.confirmed = True
		device.save()
		response = Response(status=status.HTTP_200_OK)
		twofactor_refresh = RefreshToken.for_user(user)
		twofactor_access = twofactor_refresh.access_token
		response = Response({"message": "Login successful"}, status=status.HTTP_200_OK)
		response.set_cookie("twofactor_refresh_token", str(twofactor_refresh), httponly=True, secure=True)
		response.set_cookie("twofactor_access_token", str(twofactor_access), httponly=True, secure=True)
		return response
	except TOTPDevice.DoesNotExist:
		return Response({'success': False, 'message': 'No TOTP device found.'}, status=404)
