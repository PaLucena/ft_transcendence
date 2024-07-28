from django.urls import path
from rtchat.consumers import ChatroomConsumer

websocket_urlpatterns = [
    path("ws/chatroom/<str:chatroom_name>/", ChatroomConsumer.as_asgi()),
]
