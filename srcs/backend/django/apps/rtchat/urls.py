from django.urls import path
from rtchat import views

urlpatterns = [
    path("", views.chat_view, name="home"),
    path("chatroom/<str:chatroom_name>/", views.chat_view, name="chatroom"),
    path("get_all_private_chats/", views.get_all_private_chats_view, name="get_chats"),
    path("<str:username>/", views.get_or_create_chatroom, name="start-chat"),
    path("block_user/<str:chatroom_name>/", views.block_user_view, name="block_user"),
    path(
        "unblock_user/<str:chatroom_name>/",
        views.unblock_user_view,
        name="unblock_user",
    ),
]
