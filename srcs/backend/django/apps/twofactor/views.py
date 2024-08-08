from django.shortcuts import render
from user.models import AppUser as userModel
from rest_framework.response import Response
from rest_framework import status
from user.decorators import default_authentication_required
import json
from rest_framework.decorators import api_view

# Create your views here.
@api_view(["POST"])
@default_authentication_required
def	enable2fa(request):
	print("HEY")
	if request.method == "POST":
		print(request.user)
		userlogin = request.user
		print(userlogin)
		user=userModel.objects.get(username=userlogin)
		print("first name:", user)
		return Response(status=status.HTTP_200_OK)