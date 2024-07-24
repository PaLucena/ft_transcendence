from django.urls import path
from rtchat.views import chat_view

urlpatterns = [
    path("<str:chatroom_name>/", chat_view, name="room"),
]
