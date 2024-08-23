from sqlite3 import IntegrityError
from django.shortcuts import render
from rest_framework.decorators import api_view
from django.contrib.auth.models import AbstractUser
from rest_framework.response import Response
from .serializers import UserSerializerClass
from .models import AppUser, Friend, Match
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


@api_view(['GET'])
@default_authentication_required
def check_auth(request):
	print("USER: ", request.user)
	if request.user.is_authenticated:
		return JsonResponse({'authenticated': True})
	else:
		return JsonResponse({'authenticated': False}, status=401)

@api_view(["GET"])
@default_authentication_required
def get_user_data(request):
	try:
		user = request.user
		user_data = {
			'username': user.username,
			'avatar': user.avatar.url,
			'email': user.email,
			'number_of_friends': get_friend_count(user)
		}
		return Response(user_data, status=status.HTTP_200_OK)
	except Exception as e:
		return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(["POST"])
def signup(request):
	serializer = UserSerializerClass(data=request.data)
	if serializer.is_valid():
		try:
			serializer.save()
			user = AppUser.objects.get(username=request.data['username'])
			serializer = UserSerializerClass(user)
			auth_login(request, user)
			refresh = RefreshToken.for_user(user)
			access = refresh.access_token
			response = Response({"message": "Signup successful"}, status=status.HTTP_201_CREATED)
			response.set_cookie('refresh_token', str(refresh), httponly=True, secure=True)
			response.set_cookie('access_token', str(access), httponly=True, secure=True)

			return response
		except IntegrityError as e:
			return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

	error_field, error_message = next(iter(serializer.errors.items()))
	return Response({"error": error_message}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
def login(request):
	username = request.data.get('username')
	password = request.data.get('password')

	if not all ([username, password]):
		return Response({"error": "All fields are required."}, status=status.HTTP_400_BAD_REQUEST)

	authenticated_user: AbstractUser | None = authenticate(username=username, password=password)
	if authenticated_user is not None:
		user = AppUser.objects.get(username=username)
		user.save()
		auth_login(request, user)
		refresh = RefreshToken.for_user(user)
		access = refresh.access_token
		response = Response({"message": "Login successful", "has_2fa": True if user.has_2fa_enabled else False}, status=status.HTTP_200_OK)
		response.set_cookie('refresh_token', str(refresh), httponly=True, secure=True)
		response.set_cookie('access_token', str(access), httponly=True, secure=True)

		print("Access Token Expiry:", access['exp'])
		print("Refresh Token Expiry:", refresh['exp'])
		return response
	else:
		return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

#shit
@api_view(["GET"])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticated])
def TestView(request):

	return Response({"message": "test view page"})


@api_view(["GET"])
@default_authentication_required
def logout(request):
	user= request.user #delete later
	print("USER in logout: ", user)
	response = Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)
	response.delete_cookie('access_token')
	response.delete_cookie('refresh_token')
	auth_logout(request)
	return response


@api_view(["POST"])
@default_authentication_required
def update_user_info(request):
	try:
		user = request.user
		new_username = request.data.get('new_username')
		new_nickname = request.data.get('nickname')
		new_avatar = request.FILES.get('image')
		old_password = request.data.get('old_password')
		new_password = request.data.get('new_password')
		confirm_password = request.data.get('confirm_password')

		if new_username:
			if AppUser.objects.filter(username__iexact=new_username).exclude(pk=user.pk).exists():
				return Response({'error': 'This username is already taken.'}, status=status.HTTP_400_BAD_REQUEST)
			user.username = new_username

		if new_nickname:
			set_nickname(request)

		if new_avatar:
			upload_avatar(request)

		if old_password and new_password and confirm_password:
			print("user.password old_password new_password :", user.password, old_password, new_password)
			if not check_password(old_password, user.password):
				return Response({'error': 'Incorrect old password.'}, status=status.HTTP_400_BAD_REQUEST)
			if new_password != confirm_password:
				return Response({'error': "Passwords do not match."}, status=status.HTTP_400_BAD_REQUEST)
			user.password = make_password(new_password)

		user.save()
		return Response({'message': 'User info updated successfully.'}, status=status.HTTP_200_OK)

	except Exception as e:
		return Response({'error': str(e)}, status=status.HTTP_409_CONFLICT)


#CBV has to be created to not repeat code
@api_view (["POST"])
@default_authentication_required
def invite_friend(request):
	username = request.data.get('username')
	if not username:
		return Response({'error': 'Friend username required'}, status=status.HTTP_400_BAD_REQUEST)

	try:
		friend = AppUser.objects.get(username=username)
	except Exception as e:
		return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)

	if Friend.objects.filter(from_user=request.user, to_user=friend).exists():
		return Response({'error': 'Friend request already sent'}, status=status.HTTP_409_CONFLICT)

	Friend.objects.create(from_user=request.user, to_user=friend)
	return Response({'message': 'Friend request sent successfully.'}, status=status.HTTP_200_OK)


@api_view (["DELETE"])
@default_authentication_required
def remove_friend(request):
	friend_username = request.data.get('username')
	if not friend_username:
		return Response({'error': 'Friend username required'}, status=status.HTTP_400_BAD_REQUEST)

	try:
		friend = AppUser.objects.get(username=friend_username)
	except Exception as e:
		return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)

	friendship = Friend.objects.filter(
		from_user=request.user, to_user=friend
	) | Friend.objects.filter(
		to_user=friend, from_user=request.user
	)

	if not friendship.exists():
		return Response({'error': 'Friendship does not exist.'}, status=status.HTTP_404_NOT_FOUND)

	friendship.delete()
	return Response({'message': 'Friend successfully removed.'}, status=status.HTTP_204_NO_CONTENT)


@api_view (["POST"])
@default_authentication_required
def accept_friend_request(request):
	try:
		friendship_request = Friend.objects.get(to_user=request.user)
	except Exception as e:
		return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)

	action = request.data.get('action')

	if friendship_request is None:
		return Response({'error': 'Missing friendship ID.'}, status=status.HTTP_400_BAD_REQUEST)

	if friendship_request.to_user == request.user:
		# friendship_request.to_user.friends.add(friendship_request.from_user)
		# friendship_request.user.from_user.add(friendship_request.to_user)
		friendship_request.status = Friend.ACCEPTED
		friendship_request.save()
		return Response({'message': 'Friend request accepted.'}, status=status.HTTP_200_OK)
	else:
		friendship_request.delete()
		return Response({'message': 'Friend request not accepted.'}, status=status.HTTP_200_OK)


@api_view(["GET"])
@default_authentication_required
def get_friends(request):
    user = request.user
    all_friends = []
    online_friends = []

    friendships = Friend.objects.filter(
        Q(from_user=user) | Q(to_user=user), status=Friend.ACCEPTED
    )

    for friendship in friendships:
        friend = (
            friendship.to_user if friendship.from_user == user else friendship.from_user
        )
        all_friends.append(friend)
        if friend.is_online:
            online_friends.append(friend)

    all_friends_data = [
        {
            "username": friend.username,
            "status": friend.is_online,
        }
        for friend in all_friends
    ]
    online_friends_data = [
        {"username": friend.username}
        for friend in online_friends
    ]

    response_data = {
        "all_friends": all_friends_data,
        "online_friends": online_friends_data,
    }

    return Response(response_data, status=status.HTTP_200_OK)



@api_view (["GET"])
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

    # Mark user in tournaments as deleted
	user.anonymize()
	user.is_deleted = True
	user.is_active = False
	user.save()

	return Response({'message': 'User account deleted sucessfully.'}, status=status.HTTP_204_NO_CONTENT)

@api_view(["POST"])
def ftapiLogin(request):
	print("im in")
	code = request.data.get("api-code");
	ftapiresponse = requests.post("https://api.intra.42.fr/v2/oauth/token", params={
		"grant_type": "authorization_code",
		"client_id": os.getenv("API42_UID"),
		"client_secret": os.getenv("API42_SECRET"),
		"code": code,
		"redirect_uri": os.getenv("API42_URI"),
	})

	print(ftapiresponse)
	if ftapiresponse == None:
		return Response(status=status.HTTP_400_BAD_REQUEST)

	token42 = json.loads(ftapiresponse.content)
	# needs adjustment
	user_info_response = requests.get("https://api.intra.42.fr/v2/me", params={"access_token": token42["access_token"]})
	user_json = json.loads(user_info_response.content)

	try:
		ExistingUser = AppUser.objects.get(username=user_json["login"])
		if not ExistingUser.api42auth:
			return Response({'error': 'Username already in use'}, status=status.HTTP_409_CONFLICT)
		refresh = RefreshToken.for_user(ExistingUser)
		access = refresh.access_token
		response = Response({"mesage": "Login successful"}, status=status.HTTP_200_OK)
		response.set_cookie('refresh_token', str(refresh), httponly=True, secure=True)
		response.set_cookie('access_token', str(access), httponly=True, secure=True)
		return response
	except AppUser.DoesNotExist:
		pass
	if AppUser.objects.filter(email=user_json["email"]):
		return Response({'error': 'Email already in use'}, status=status.HTTP_409_CONFLICT)

	imageResponse = requests.get(user_json["image"]["link"])
	if imageResponse.status_code == 200:
		img_temporary = NamedTemporaryFile(delete=True)
		img_temporary.write(imageResponse.content)
		img_temporary.flush()
		save_path = os.path.join(settings.MEDIA_ROOT, 'avatars', user_json["login"] + ".jpg")
		if not os.path.exists(os.path.dirname(save_path)):
			os.makedirs(os.path.dirname(save_path))
		with open(save_path, 'wb') as f:
			for chunck in imageResponse.iter_content(chunk_size=8192):
				f.write(chunck)
	else:
		return Response({'error': 'Error getting the user image'}, status=status.HTTP_409_CONFLICT)

	NewuserJson = {
		'username': user_json["login"],
		'email': user_json["email"],
		'avatar': "avatars/" + user_json["login"] + ".jpg"
	}
	user = AppUser.objects.create_user(**NewuserJson)
	user.api42auth = True
	user.save()
	refresh = RefreshToken.for_user(user)
	access = refresh.access_token
	response = Response({"mesage": "Signup successful"}, status=status.HTTP_201_CREATED)
	response.set_cookie('refresh_token', str(refresh), httponly=True, secure=True)
	response.set_cookie('access_token', str(access), httponly=True, secure=True)
	return response
