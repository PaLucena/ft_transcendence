from textwrap import indent
from typing import Any
from urllib import response
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.http import HttpResponse, JsonResponse
from django.urls import resolve
from .models import AppUser
from channels.middleware import BaseMiddleware
from asgiref.sync import sync_to_async
from django.contrib.auth.models import AnonymousUser


class CheckAccessTokenMiddleware(MiddlewareMixin):
	def __init__(self, get_response):
		self.get_response = get_response

	def __call__(self, request):
		#print(f"Scope: {json.dumps(request, default=str)}")
		exempt_views = ['login', 'signup']
		api_prefix = '/api/'
		admin_prefix = '/admin/'

		if request.path_info.startswith(admin_prefix):
			return self.get_response(request)
		if request.path_info.startswith(api_prefix):
			current_view = request.path_info[len(api_prefix):].strip('/')
		else:
			current_view = ''
		if current_view in exempt_views:
			return self.get_response(request)

		access_token = request.COOKIES.get('access_token')
		refresh_token = request.COOKIES.get('refresh_token')
		if access_token:
			jwt_auth = JWTAuthentication()
			try:
				validated_token = jwt_auth.get_validated_token(access_token)
				request.user = jwt_auth.get_user(validated_token)
				print("1 USER IN MIDDLEWARE: ", request.user)
			except TokenError:
				print("EXPIRED IN MIDDLEWARE: ", request.user)
				access_token = None

		if refresh_token and not access_token:
			new_access_token = self.refresh_access_token(refresh_token)
			if new_access_token:
				request.user = jwt_auth.get_user(jwt_auth.get_validated_token(new_access_token))
				response = self.get_response(request)
				response.set_cookie('access_token', new_access_token, secure=True, httponly=True)
				print("2 USER IN MIDDLEWARE: ", request.user)
				return response

		print("1111 USER IN MIDDLEWARE: ", request.user)
		return self.get_response(request)

	def create_access_token(self, refresh_token):
		try:
			refresh = RefreshToken(refresh_token)
			new_access_token = str(refresh.access_token)
			# Blacklist the old refresh token
			refresh.blacklist()
			return new_access_token
		except TokenError as e:
			print(f"Token error: {e}")
			return None


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
		exempt_views = ['login', 'signup']
		api_prefix = '/api/'		
		path = scope.get('path', '')
		if path.startswith(api_prefix):
			current_view = path[len(api_prefix):].strip('/')
		else:
			current_view = ''
		if current_view in exempt_views:
			return await super().__call__(scope, receive, send)

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
				'code': 4001,  # may change
			})
		else:
			return await super().__call__(scope, receive, send)


class UpdateLastSeenMiddleware:

	def __init__(self, get_response) -> None:
		self.get_response = get_response

	def __call__(self, request) -> Any:
		response = self.get_response(request)
		if request.user.is_authenticated:
			print("5 USER IN MIDDLEWARE: ")
			User = get_user_model()
			user = User.objects.get(username=request.user)
			user.last_seen = timezone.now()
			user.save()
		return response
