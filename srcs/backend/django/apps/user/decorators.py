from functools import wraps
from django.http import JsonResponse
from django.core.exceptions import PermissionDenied
from .authenticate import DefaultAuthentication

def default_authentication_required(view_func):
	@wraps(view_func)
	def _wrapped_view(request, *args, **kwargs):
		if request.path not in ['/login/', '/signup/', '/admin']:
			auth = DefaultAuthentication()
			try:
				auth.authenticate(request)
			except Exception as e:
				return JsonResponse({'detail': str(e)}, status=401)
				print("PATH, ", request.path)
		return view_func(request, *args, **kwargs)
	return _wrapped_view