from operator import imod
from re import T
from sqlite3 import IntegrityError
from urllib import response
from urllib.robotparser import RequestRate
from django.core import serializers
from django.shortcuts import render
from django.template import context
from rest_framework.decorators import api_view
from django.contrib.auth.models import User
from rest_framework.response import Response
from .serializers import UserSerializerClass
from .models import AppUser
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, logout
from rest_framework.decorators import authentication_classes, permission_classes
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated
import json
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model

@api_view(["POST"])
def signup(request):
		
	serializer = UserSerializerClass(data=request.data)
	if serializer.is_valid():
		try:
			serializer.save()
		
			user = AppUser.objects.get(username=request.data['username'])
			token = Token.objects.get(user=user)

			serializer = UserSerializerClass(user)

			data = {
				"user": serializer.data,
				"token": token.key
			}
			return Response(data, status=status.HTTP_201_CREATED)
		except IntegrityError as e:
			return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
	
	return Response(serializer.errors, status.HTTP_400_BAD_REQUEST)

#return Response({"message": "sign up page"})


@api_view(["POST"])
def login(request):

	data = request.data
	authenticate_user = authenticate(username=data['username'], password=data['password'])

	if authenticate_user is not None:
		user = AppUser.objects.get(username=data['username'])
		serializer = UserSerializerClass(user)

		response_data = {
			'user': serializer.data
		}

		token, created_token = Token.objects.get_or_create(user=user)

		if token:
			response_data['token'] = token.key
		elif created_token:
			response_data['token'] = created_token.key
		return Response(response_data, status=status.HTTP_200_OK)

	return Response({"detail": "User not found"}, status=status.HTTP_404_BAD_REQUEST)
#return Response({"message": "login page"})

#shit
@api_view(["GET"])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticated])
def TestView(request):

	return Response({"message": "test view page"})


@api_view(["GET"])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticated])
def logout(request):

	request.user.auth_token.delete()
	#logout(request)

	return Response({"message": "logout was successful"})


@api_view(["POST"])
def set_nickname(request):
	nickname = request.data.get('nickname')
	if not nickname:
		return Response({"error": "This nickname is already in use."}, status=status.HTTP_400_BAD_REQUEST)

	user = request.user
	if AppUser.objects.filter(nickname__iexact=nickname).exclude(pk=user.pk).exists():
		return Response({"error": "This nickname is already in use."}, status=status.HTTP_400_BAD_REQUEST)
	
	user.nickname = nickname
	user.save()
	return Response({"message": nickname}, status=status.HTTP_200_OK)


@api_view(["POST"])
def upload_avatar(request):
	try:
		user = AppUser.objects.get(username=request.data['username'])
		file = request.FILES.get('image')
		
		if not file:
			return Response({'error': 'No file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)
		if file.size == 0:
			return Response({'error': 'File is empty'}, status=status.HTTP_400_BAD_REQUEST)
		if not file.content_type.startswith('image'):
			return Response({'error': 'Invalid file type. Only PNG, JPG, JPEG, and GIF are allowed.'}, status=status.HTTP_400_BAD_REQUEST)
	
		user.avatar = file
		user.save()
		return Response({'message': 'Avatar updated successfully.'}, status=status.HTTP_200_OK)
	
	except Exception as e:
		return Response({"error": str(e)}, status=status.HTTP_409_CONFLICT)


@api_view(["POST"])
@login_required
def update_user_info(request):
	print("Request User:", request.headers)

	try:
		user = request.user
		new_username = request.data.get('new_username')
		new_nickname = request.data.get('nickname')
		new_avatar = request.FILES.get('image')

		if new_username:
			if AppUser.objects.filter(username__iexact=new_username).exclude(pk=user.pk).exists():
				return Response({'error': 'This username is already taken.'}, status=status.HTTP_400_BAD_REQUEST)
			user.username = new_username
		
		if new_nickname:
			set_nickname(request)

		if new_avatar:
			upload_avatar(request)
		
		user.save()
		return Response({'message': 'User info updated successfully.'}, status=status.HTTP_200_OK)
	
	except Exception as e:
		return Response({'error': str(e)}, status=status.HTTP_409_CONFLICT)