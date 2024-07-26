from django.urls import path
from rtchat.views import chat_view, block_user_view, unblock_user_view

urlpatterns = [
    path("<str:chatroom_name>/", chat_view, name="room"),
    path("block_user/<chatroom_name>/", block_user_view, name="block_user"),
    path("unblock_user/<chatroom_name>/", unblock_user_view, name="unblock_user"),
]
