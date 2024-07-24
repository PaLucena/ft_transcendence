from django.urls import path, re_path
from rtchat.consumers import ChatroomConsumer


websocket_urlpatterns = [
    path("ws/chatroom/<chatroom_name>/", ChatroomConsumer.as_asgi()),
]
