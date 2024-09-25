from typing import Any
from urllib import response
from django.utils import timezone
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async
from django.contrib.sessions.models import Session
from channels.db import database_sync_to_async
from django.db import connection
from django.http import JsonResponse


class JWTAuthMiddleware:
	def __init__(self, inner):
		self.inner = inner

	async def __call__(self, scope, receive, send):
		scope['user'] = None
		headers = dict(scope['headers'])

		if b'cookie' in headers:
			cookies = headers[b'cookie'].decode('utf-8')
			cookies = dict(item.split("=") for item in cookies.split("; "))
			session_id = cookies.get('sessionid')
			if session_id:
				try:
					session = await sync_to_async(Session.objects.get, thread_sensitive=True)(session_key=session_id)
					
					session_expiry_date = session.expire_date
					if session_expiry_date < timezone.now():
						scope['user'] = None 
					else:
						session_data = session.get_decoded()
						user_id = session_data.get('_auth_user_id', None)
					if user_id:
						User = get_user_model()
						try:
							user = await sync_to_async(User.objects.get, thread_sensitive=True)(id=user_id)
							scope['user'] = user
						except User.DoesNotExist:
							scope['user'] = None
				except Session.DoesNotExist:
					scope['user'] = None
		return await self.inner(scope, receive, send)

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

from django.conf import settings

class EnforceProxyMiddleware:
	def __init__(self, get_response):
		self.get_response = get_response
		self.nginx_ip = '172.23.0.1'

	def __call__(self, request):
		path_info = request.META.get("PATH_INFO")
		if path_info == "/health/":
			return self.get_response(request)
		if 'HTTP_X_REAL_IP' not in request.META or 'HTTP_X_FORWARDED_FOR' not in request.META:
			return JsonResponse({'error': 'Request must come through a proxy'}, status=403)
		real_ip = request.META['HTTP_X_REAL_IP']
		if real_ip != self.nginx_ip:
			return JsonResponse({'error': 'Request must come through the NGINX proxy'}, status=403)
		return self.get_response(request)
