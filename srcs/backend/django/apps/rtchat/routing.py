from django.urls import path, re_path
from rtchat.consumers import ChatConsumer


websocket_urlpatterns = [
    re_path(r"ws/chatroom/(?P<room_name>\w+)/$", ChatConsumer.as_asgi()),
]
