from textwrap import indent
from typing import Any
from django.utils import timezone
from django.contrib.auth import get_user_model
import json

class UpdateLastSeenMiddleware:
	def __init__(self, get_response) -> None:
		self.get_response = get_response

	def __call__(self, request) -> Any:
		response = self.get_response(request)
		print("request:", request)
		if request.user.is_authenticated:
			User = get_user_model()
			User.objects.filter(username=request['username']).update(last_seen=timezone.now())
		return response
