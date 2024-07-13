# routing.py

from django.urls import path
from your_app_name import consumers

websocket_urlpatterns = [
    re_path(r'ws/clicks/$', consumers.ClickConsumer.as_asgi()),
]
