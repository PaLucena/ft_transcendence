from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
	re_path(r'ws/status', consumers.UserStatus.as_asgi())
]