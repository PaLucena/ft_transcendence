from django.urls import path
from rtchat.consumers import ChatroomConsumer, OnlineStatusConsumer

websocket_urlpatterns = [
    path("ws/chatroom/<str:chatroom_name>/", ChatroomConsumer.as_asgi()),
    path("ws/online-status/", OnlineStatusConsumer.as_asgi()),
]
