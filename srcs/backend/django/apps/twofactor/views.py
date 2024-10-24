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
from django.shortcuts import get_object_or_404
from django.http import Http404


@api_view(["GET"])
@default_authentication_required
def check2fa(request):
    return Response(
        {"has2faEnabled": Has2faEnabled(request.user.username)},
        status=status.HTTP_200_OK,
    )


# Create your views here.
@api_view(["POST"])
@default_authentication_required
def enable2fa(request):
    try:
        try:
            user = get_object_or_404(userModel, username=request.user.username)
        except Http404:
            return Response(
                {"detail": "The user does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if user.api42auth:
            return Response(
                {
                    "detail": "A user created via the 42 API cannot enable two factor authentication."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        device, created = TOTPDevice.objects.get_or_create(
            user=request.user, confirmed=False
        )

        if created or not device.confirmed:
            otp_uri = device.config_url
            qr = qrcode.make(otp_uri)
            imgs_dir = os.path.join(settings.MEDIA_ROOT, "qrs")
            img_name = f"qr_user_{user.id}.jpg"
            img_path = os.path.join(imgs_dir, img_name)
            os.makedirs(imgs_dir, exist_ok=True)
            qr_img = qr.save(img_path)
            user.has_2fa_enabled = True
            user.tf_fk = device
            user.save()
            return Response(
                {"qrpath": "qrs/" + img_name},
                status=status.HTTP_200_OK,
            )

    except Exception as e:
        return Response(
            {"detail": f"An error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
def verifyTwoFactor(request):
    try:
        body_unicode = request.body.decode("utf-8")
        body_data = json.loads(body_unicode)
        otp_code = body_data.get("otpCode")
        username = body_data.get("username")

        if not otp_code:
            return Response(
                {"detail": "No otp_code provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not username:
            return Response(
                {"detail": "No username provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        print("otp_code:", otp_code, "username:", username)

        try:
            user = get_object_or_404(userModel, username=username)
        except Http404:
            return Response(
                {"detail": "The user does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )

        device = TOTPDevice.objects.get(user=user.pk, confirmed=True)

        if device.verify_token(otp_code):
            return Response({"detail": "OTP verified successfully."}, status=200)
        else:
            return Response({"detail": "Invalid code."}, status=400)
    except TOTPDevice.DoesNotExist:
        return Response({"detail": "No TOTP device found."}, status=404)
    except Exception as e:
        return Response(
            {"detail": f"An error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@default_authentication_required
def disable2fa(request):
    try:
        try:
            user = get_object_or_404(userModel, username=request.user.username)
        except Http404:
            return Response(
                {"detail": "The user does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            device = TOTPDevice.objects.get(user=user.pk, confirmed=True)
            os.remove(
                os.path.join(settings.MEDIA_ROOT, "qrs") + f"/qr_user_{user.id}.jpg"
            )
            TOTPDevice.delete(device)
        except TOTPDevice.DoesNotExist:
            return Response(
                {"detail": "No TOTP device found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        response = Response(status=status.HTTP_200_OK)
        response.delete_cookie("twofactor_access_token")
        response.delete_cookie("twofactor_refresh_token")
        return response

    except Exception as e:
        return Response(
            {"detail": f"An error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@default_authentication_required
def confirmDevice(request):
    user = userModel.objects.get(username=request.user)
    try:
        device = TOTPDevice.objects.get(user=user.pk, confirmed=False)
        device.confirmed = True
        device.save()
        response = Response(status=status.HTTP_200_OK)
        twofactor_refresh = RefreshToken.for_user(user)
        twofactor_access = twofactor_refresh.access_token
        response = Response({"message": "Login successful"}, status=status.HTTP_200_OK)
        response.set_cookie(
            "twofactor_refresh_token",
            str(twofactor_refresh),
            httponly=True,
            secure=True,
        )
        response.set_cookie(
            "twofactor_access_token", str(twofactor_access), httponly=True, secure=True
        )
        return response
    except TOTPDevice.DoesNotExist:
        return Response(
            {"success": False, "error": "No TOTP device found."}, status=404
        )
