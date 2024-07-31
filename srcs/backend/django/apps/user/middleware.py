from textwrap import indent
from typing import Any
from urllib import response
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.http import JsonResponse
from django.urls import resolve

from channels.middleware import BaseMiddleware
from asgiref.sync import sync_to_async
from django.contrib.auth.models import AnonymousUser


class CheckAccessTokenMiddleware(MiddlewareMixin):
	def check_cookie(slef,request):
		exempt_views = ['login', 'signup']
		current_view = resolve(request.path_info).url_name

		if current_view in exempt_views:
			return None

		access_token = request.COOKIE.get('access_token')
		refresh_token = request.COOKIES.get('refresh_token')

		if access_token:
			jwt_auth = JWTAuthentication()
			try:
				validated_token = jwt_auth.get_validated_token(access_token)
				request.user = jwt_auth.get_user(validated_token)
				return None
			except TokenError:
				pass
			
		if refresh_token:
			try:
				new_access_token = slef.create_access_token(refresh_token)
				response = JsonResponse({'message': 'Token refreshed'})
				response.set_cookie('access_token', new_access_token, secure=True, httponly=True)
				request.COOKIES['access_token'] = new_access_token
				return response
			except InvalidToken:
				#handle blacklist refresh token
				return JsonResponse({'error': 'Invalid refresh token'}, status=401)
		else:
			return JsonResponse({'error': 'Access token expired and no refresh token provided'}, status=401)

	def create_access_token(self, refresh_token):
		refresh = RefreshToken(refresh_token)
		new_access_token = str(refresh.access_token)
		return new_access_token


User = get_user_model()

@sync_to_async
def get_user_from_token(token_key):
	try:
		token = AccessToken(token_key)
		user_id = token['user_id']
		user = User.objects.get(id=user_id)
		print(f"Retrieved user: {user.username} with ID: {user_id}")
		return user
	except Exception as e:
		print(f"Failed to retrieve user: {e}")
		return AnonymousUser()

class JWTAuthMiddleware(BaseMiddleware):
	async def __call__(self, scope, receive, send):
		headers = dict(scope['headers'])
		cookie_header = headers.get(b'cookie', None)
		token_key = None

		if cookie_header:
			cookies = cookie_header.decode().split(';')
			for cookie in cookies:
				name, value = cookie.strip().split('=')
				if name == 'access_token':  # Adjust..
					token_key = value
					break

		if token_key:
			scope['user'] = await get_user_from_token(token_key)
		else:
			scope['user'] = AnonymousUser()
		
		if isinstance(scope['user'], AnonymousUser):
			await send({
				'type': 'websocket.close',
				'code': 4001,  # Custom close code indicating authentication failure
			})
		else:
			return await super().__call__(scope, receive, send)


class UpdateLastSeenMiddleware:

	def __init__(self, get_response) -> None:
		self.get_response = get_response

	def __call__(self, request) -> Any:
		response = self.get_response(request)
		if request.user.is_authenticated:
			User = get_user_model()
			user = User.objects.get(username=request.user)
			user.last_seen = timezone.now()
			user.save()
		return response
