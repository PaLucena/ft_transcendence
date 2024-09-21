from sqlite3 import IntegrityError
from django.shortcuts import render
from rest_framework.decorators import api_view
from django.contrib.auth.models import AbstractUser
from rest_framework.response import Response
from .serializers import UserSerializerClass
from .models import AppUser, Match
from friends.models import Friend
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, logout
from rest_framework.decorators import authentication_classes, permission_classes
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated
import json
from django.contrib.auth.hashers import check_password, make_password
from django.db.models import Q
from django.core.files import File
from django.core.files.temp import NamedTemporaryFile
from django.conf import settings
import os
import requests
from .utils import set_nickname, upload_avatar, get_friend_count
from django.contrib.auth import logout as auth_logout
from django.contrib.auth import login as auth_login
from .decorators import default_authentication_required
from django.http import JsonResponse
from twofactor.utils import Has2faEnabled
from django.contrib.auth import update_session_auth_hash
from blockchain.views import load_test_data, get_face2face
from friends.views import get_friendship_status
from friends.models import Friend


@api_view(["GET"])
@default_authentication_required
def check_auth(request):
	user = request.user
	print("USER: ", user)
	return Response({"authenticated": user.is_authenticated}, status=status.HTTP_200_OK)


@api_view(["GET"])
@default_authentication_required
def get_user_data(request):
	try:
		user = request.user
		user_data = {
			"username": user.username,
			"avatar": user.avatar.url,
			"email": user.email,
			"number_of_friends": get_friend_count(user),
			"language": user.language
		}
		return Response(user_data, status=status.HTTP_200_OK)
	except Exception as e:
		return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(["GET"])
@default_authentication_required
def get_user_language(request):
    try:
        user = request.user
        user_data = {
            "language": user.language
        }
        return Response(user_data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(["GET"])
@default_authentication_required
def get_other_user_data(request, username):
	try:
		this_user = request.user
		other_user = AppUser.objects.get(username=username)

		if get_friendship_status(this_user, other_user) == "accepted":
			friendship = True
		else:
			friendship = False

		matches_in_common = get_face2face(request, this_user.id, other_user.id)
		if not matches_in_common:
			matches_in_common = False
		else:
			matches_in_common = True

		user_data = {
			"username": other_user.username,
			"avatar": other_user.avatar.url,
			"number_of_friends": get_friend_count(other_user),
			"friendship": friendship,
			"matches_in_common": matches_in_common
		}
		return Response(user_data, status=status.HTTP_200_OK)
	except Exception as e:
		return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
def signup(request):
	serializer = UserSerializerClass(data=request.data)
	if serializer.is_valid():
		try:
			serializer.save()
			user = AppUser.objects.get(username=request.data["username"])
			serializer = UserSerializerClass(user)
			auth_login(request, user)
			refresh = RefreshToken.for_user(user)
			access = refresh.access_token
			response = Response(
				{"message": "Signup successful"}, status=status.HTTP_201_CREATED
			)
			response.set_cookie(
				"refresh_token", str(refresh), httponly=True, secure=True
			)
			response.set_cookie("access_token", str(access), httponly=True, secure=True)

			return response
		except IntegrityError as e:
			return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

	error_field, error_message = next(iter(serializer.errors.items()))
	return Response({"error": error_message}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
def login(request):
	username = request.data.get("username")
	password = request.data.get("password")

	if not all([username, password]):
		return Response(
			{"error": "All fields are required."}, status=status.HTTP_400_BAD_REQUEST
		)
	try:
		user = AppUser.objects.get(username=username)
	except AppUser.DoesNotExist:
		return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

	authenticated_user: AbstractUser | None = authenticate(
		username=username, password=password
	)
	if authenticated_user is not None:
		user = AppUser.objects.get(username=username)
		user.save()
		if Has2faEnabled(user.username):
			response = Response({"has_2fa": True}, status=status.HTTP_200_OK)
		else:
			response = Response(
				{"message": "Login successful", "has_2fa": False}, status=status.HTTP_200_OK
			)
		auth_login(request, authenticated_user)
		refresh = RefreshToken.for_user(user)
		access = refresh.access_token
		response.set_cookie("refresh_token", str(refresh), httponly=True, secure=True)
		response.set_cookie("access_token", str(access), httponly=True, secure=True)

		print("Access Token Expiry:", access["exp"])
		print("Refresh Token Expiry:", refresh["exp"])
		load_test_data(request)
		return response
	else:
		return Response({"error": "Incorrect password"}, status=status.HTTP_404_NOT_FOUND)



@api_view(["POST"])
def loginWith2fa(request):
    user = request.data.get("username")
    print("username is", user["username"])
    user = AppUser.objects.get(username=user["username"])
    auth_login(request, user)
    twofactor_refresh = RefreshToken.for_user(user)
    twofactor_access = twofactor_refresh.access_token
    response = Response({"message": "Login successful"}, status=status.HTTP_200_OK)
    response.set_cookie("twofactor_refresh_token", str(twofactor_refresh), httponly=True, secure=True)
    response.set_cookie("twofactor_access_token", str(twofactor_access), httponly=True, secure=True)
    print("Access Token for 2FA Expiry:", twofactor_access["exp"])
    print("Refresh Token for 2FA Expiry:", twofactor_refresh["exp"])
    return response


# ...
@api_view(["GET"])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticated])
def TestView(request):

	return Response({"message": "test view page"})


@api_view(["GET"])
@default_authentication_required
def logout(request):
	user = request.user
	auth_logout(request)
	response = Response(
		{"message": "Logged out successfully"}, status=status.HTTP_200_OK
	)
	response.delete_cookie("access_token")
	response.delete_cookie("refresh_token")
	if (Has2faEnabled(user.username)):
		response.delete_cookie("twofactor_access_token")
		response.delete_cookie("twofactor_refresh_token")
	return response

from django.db import connection, reset_queries
from django.db import connections

from django.contrib.auth.models import update_last_login
from django.contrib.auth.signals import user_logged_in


@api_view(["POST"])
@default_authentication_required
def update_user_info(request):
	try:
		print("TEST 1", request.body)
		user = request.user
		new_username = request.data.get("new_username")
		new_avatar = request.FILES.get("avatar")
		old_password = request.data.get("old_password")
		new_password = request.data.get("new_password")
		confirm_password = request.data.get("confirm_password")
		language = request.data.get("language")
		print("TEST 1", new_avatar)
		if user.is_superuser or user.is_staff:
			if new_username and new_username != user.username:
				return Response(
					{"error": "Admin username cannot be changed."},
					status=status.HTTP_403_FORBIDDEN,
				)

		if new_username:
			if (
				AppUser.objects.filter(username__iexact=new_username)
				.exclude(pk=user.pk)
				.exists()
			):
				return Response(
					{"error": "This username is already taken."},
					status=status.HTTP_400_BAD_REQUEST,
				)
			user.username = new_username

		if new_avatar:
			upload_avatar(request)

		if old_password and new_password and confirm_password:
			print(
				"user.password old_password new_password :",
				user.password,
				old_password,
				new_password,
			)
			if not check_password(old_password, user.password):
				return Response(
					{"error": "Incorrect old password."},
					status=status.HTTP_400_BAD_REQUEST,
				)
			if new_password != confirm_password:
				return Response(
					{"error": "Passwords do not match."},
					status=status.HTTP_400_BAD_REQUEST,
				)
			user.password = make_password(new_password)
			user.save()
			request.session.flush()
			auth_logout(request)

		print("TEST 3:", language)
		if language and user.language != language:
			user.language = language
		print("TEST 4")
		user.save()
		#user.refresh_from_db()
		#request.session.flush()
		#auth_logout(request)
		# authenticated_user = authenticate(
		#     username=new_username, password=new_password
		# )
		# if authenticated_user is not None:
		#     user = AppUser.objects.get(username=new_username)
		#     user.save()

		#auth_login(request, user)
		#update_session_auth_hash(request, user)
		#user_logged_in.send(sender=user.__class__, request=request, user=user)

		response = Response(
			{"message": "User info updated successfully."}, status=status.HTTP_201_CREATED
		)

		return response
	except Exception as e:
		return Response({"error": str(e)}, status=status.HTTP_409_CONFLICT)


@api_view(["GET"])
@default_authentication_required
def delete_account(request):
	user = request.user
	matches = Match.objects.filter(Q(user=user) | Q(opponent=user))

	for ghost_match in matches:
		if ghost_match.user == user:
			ghost_match.user.anonymize()
		if ghost_match.opponent == user:
			ghost_match.opponent.anonymize()
		ghost_match.save()

	Friend.objects.filter(Q(from_user=user) | Q(to_user=user)).delete()

	user.anonymize()
	user.is_deleted = True
	user.is_active = False
	user.save()

	return Response(
		{"message": "User account deleted sucessfully."},
		status=status.HTTP_204_NO_CONTENT,
	)


@api_view(["POST"])
def ftapiLogin(request):
	code = request.data.get("api-code")
	ftapiresponse = requests.post(
		"https://api.intra.42.fr/v2/oauth/token",
		params={
			"grant_type": "authorization_code",
			"client_id": os.getenv("API42_UID"),
			"client_secret": os.getenv("API42_SECRET"),
			"code": code,
			"redirect_uri": os.getenv("API42_URI"),
		},
	)
	if ftapiresponse == None:
		return Response(status=status.HTTP_400_BAD_REQUEST)

	token42 = json.loads(ftapiresponse.content)
	# needs adjustment
	user_info_response = requests.get(
		"https://api.intra.42.fr/v2/me",
		params={"access_token": token42["access_token"]},
	)
	user_json = json.loads(user_info_response.content)

	try:
		ExistingUser = AppUser.objects.get(username=user_json["login"])
		if not ExistingUser.api42auth:
			return Response(
				{"error": "Username already in use"}, status=status.HTTP_409_CONFLICT
			)
		auth_login(request, ExistingUser)
		ExistingUser.save()
		refresh = RefreshToken.for_user(ExistingUser)
		access = refresh.access_token
		response = Response(
			{"mesage": "Login successful", "username": user_json["login"]},
			status=status.HTTP_200_OK,
		)
		response.set_cookie("refresh_token", str(refresh), httponly=True, secure=True)
		response.set_cookie("access_token", str(access), httponly=True, secure=True)
		return response
	except AppUser.DoesNotExist:
		pass
	if AppUser.objects.filter(email=user_json["email"]):
		return Response(
			{"error": "Email already in use"}, status=status.HTTP_409_CONFLICT
		)

	imageResponse = requests.get(user_json["image"]["link"])
	if imageResponse.status_code == 200:
		img_temporary = NamedTemporaryFile(delete=True)
		img_temporary.write(imageResponse.content)
		img_temporary.flush()
		save_path = os.path.join(
			settings.MEDIA_ROOT, "avatars", user_json["login"] + ".jpg"
		)
		if not os.path.exists(os.path.dirname(save_path)):
			os.makedirs(os.path.dirname(save_path))
		with open(save_path, "wb") as f:
			for chunck in imageResponse.iter_content(chunk_size=8192):
				f.write(chunck)
	else:
		return Response(
			{"error": "Error getting the user image"}, status=status.HTTP_409_CONFLICT
		)

	NewuserJson = {
		"username": user_json["login"],
		"email": user_json["email"],
		"password": "",
		"avatar": "avatars/" + user_json["login"] + ".jpg",
	}
	user = AppUser.objects.create_user(**NewuserJson)
	user.api42auth = True
	auth_login(request, user)
	user.save()
	refresh = RefreshToken.for_user(user)
	access = refresh.access_token
	response = Response(
		{"mesage": "Signup successful", "username": user_json["login"]},
		status=status.HTTP_201_CREATED,
	)
	response.set_cookie("refresh_token", str(refresh), httponly=True, secure=True)
	response.set_cookie("access_token", str(access), httponly=True, secure=True)
	return response


@api_view(["GET"])
@default_authentication_required
def user_from_intra(request):
	user = request.user
	return Response({"intra_login": user.api42auth}, status=status.HTTP_200_OK)