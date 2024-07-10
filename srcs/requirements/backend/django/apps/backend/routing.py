from django.urls import re_path
from user.consumers import UserStatus

websocket_urlpatterns = [
	re_path(r'ws/status', UserStatus.as_asgi())
]