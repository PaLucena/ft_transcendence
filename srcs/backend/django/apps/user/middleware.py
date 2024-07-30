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

class CheckAccessTokenMiddleware(MiddlewareMixin):
	def check_cookie(slef,request):
		exempt_views = ['login', 'signup']
		current_view = resolve(request.path_info).url_name

		if current_view in exempt_views:
			return None

		access_token = request.COOKIE.get('acces_token')
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
