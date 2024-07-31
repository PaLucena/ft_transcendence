from django.shortcuts import render
from user.models import AppUser as userModel
from rest_framework.response import Response
from rest_framework import status
import json

# Create your views here.
def	enable2fa(request):
	if request.method == "POST":
		userlogin = request.data.get("user")
		user=userModel.objects.get(username=userlogin)
		print("first name:", user.first_name)
		return Response(status=status.HTTP_200_OK)