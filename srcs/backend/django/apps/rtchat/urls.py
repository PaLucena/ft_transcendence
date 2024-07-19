from django.urls import path
from rtchat.views import room

urlpatterns = [
    path("<str:room_name>/", room, name="room"),
]
