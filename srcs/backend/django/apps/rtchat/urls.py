from django.urls import path
from rtchat import views

urlpatterns = [
    path("<str:chatroom_name>/", views.chat_view, name="room"),
    path("block_user/<str:chatroom_name>/", views.block_user_view, name="block_user"),
    path(
        "unblock_user/<str:chatroom_name>/",
        views.unblock_user_view,
        name="unblock_user",
    ),
]
