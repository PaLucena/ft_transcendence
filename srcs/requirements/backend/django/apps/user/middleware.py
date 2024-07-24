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
		if request.user.is_authenticated:
			User = get_user_model()
			user = User.objects.get(username=request.user)
			user.last_seen = timezone.now()
		return response
