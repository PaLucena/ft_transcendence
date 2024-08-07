from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/ponggame/', consumers.GameConsumer.as_asgi()),
]
