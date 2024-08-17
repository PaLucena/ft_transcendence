from django.urls import path
from rtchat import views

urlpatterns = [
    path("block_or_unblock/", views.block_or_unblock_user_view, name="block_user"),
    path("get_all_private_chats/", views.get_all_private_chats_view, name="get_chats"),
    path("chatroom/<str:chatroom_name>/", views.chat_view, name="chatroom"),
    path("user/<str:username>/", views.get_or_create_chatroom, name="start-chat"),
]
