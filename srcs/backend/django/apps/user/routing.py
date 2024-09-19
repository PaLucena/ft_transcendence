from django.urls import path
from user.consumers import UserSocketConsumer

websocket_urlpatterns = [
    path("ws/user-socket/", UserSocketConsumer.as_asgi()),
]
