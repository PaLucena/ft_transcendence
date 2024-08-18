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

def Has2faEnabled(user):
	if user == None:
		return False
	device = TOTPDevice.objects.get(user=user, confirmed=False)
	print(device)
	if device != None:
		return True
	return False

# Create your views here.
@api_view(["POST"])
@default_authentication_required
def	enable2fa(request):
	if request.method == "POST":
		userlogin = request.user
		user=userModel.objects.get(username=userlogin)
		device, created = TOTPDevice.objects.get_or_create(user=request.user, confirmed=False)
		print("user:", userlogin, flush=True)
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
			return Response({'qrpath': "qrs/" + user.username + ".jpg"}, status = status.HTTP_200_OK)
		
@api_view(["POST"])
def verifyTwoFactor(request):
	print(json.dumps(json.loads(request.body), indent=2))
	# Parse the JSON body
	body_unicode = request.body.decode('utf-8')  # Decode byte string to a Unicode string
	body_data = json.loads(body_unicode)  # Parse the JSON data to a Python dictionary
	otp_code = body_data.get('otpCode')
	userInfo = body_data.get('jsonData')
	username = userInfo.get('username')

	user=userModel.objects.get(username=username)
	try:
		device = TOTPDevice.objects.get(user=user.pk, confirmed=False)

		# Verify the OTP code
		if device.verify_token(otp_code):
			# OTP is correct
			return Response({'success': True, 'message': 'OTP verified successfully.'}, status=200)
		else:
			# OTP is incorrect
			return Response({'success': False, 'message': 'Invalid OTP code.'}, status=400)
	
	except TOTPDevice.DoesNotExist:
		# If the user doesn't have a confirmed TOTP device
		return Response({'success': False, 'message': 'No TOTP device found.'}, status=404)
