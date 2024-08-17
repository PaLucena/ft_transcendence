from functools import wraps
from django.http import JsonResponse
from django.core.exceptions import PermissionDenied
from .authenticate import DefaultAuthentication

def default_authentication_required(view_func):
	@wraps(view_func)
	def _wrapped_view(request, *args, **kwargs):
		if request.path not in ['/login/', '/signup/', '/admin']:
			auth = DefaultAuthentication()
			new_access_token = None
			try:
				user, new_access_token = auth.authenticate(request)
			except Exception as e:
				return JsonResponse({'detail': str(e)}, status=401)

		response =  view_func(request, *args, **kwargs)
		if new_access_token:
			response.set_cookie('access_token', new_access_token, httponly=True, secure=True)

		return response
	return _wrapped_view