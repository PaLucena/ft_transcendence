from django.urls import path
from user.consumers import OnlineStatusConsumer

websocket_urlpatterns = [
    path("ws/tournament-users/", OnlineStatusConsumer.as_asgi()),
]
