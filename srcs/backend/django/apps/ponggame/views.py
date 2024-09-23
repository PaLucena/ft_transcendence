from django.shortcuts import render
from user.models import AppUser as userModel
from rest_framework.response import Response
from rest_framework import status
from user.decorators import default_authentication_required
from rest_framework.decorators import api_view
from django_otp.plugins.otp_totp.models import TOTPDevice
from django.shortcuts import render, redirect
import qrcode, json, os, base64
from rest_framework_simplejwt.tokens import RefreshToken
from .game_manager import game_manager

@api_view(["GET"])
@default_authentication_required
def userInGame(request):
	user = request.user
	print("is player in game?", game_manager.is_player_in_game(user.username))
	return Response({"userInGame": game_manager.is_player_in_game(user.username)}, status=status.HTTP_200_OK)