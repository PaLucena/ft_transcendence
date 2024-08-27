from django.urls import path
from friends.views import (
    invite_friend,
    accept_friend_request,
    remove_friend,
    get_friends,
)

urlpatterns = [
    path("invite_friend/", invite_friend, name="invite_friend"),
    path("accept_friend_request/", accept_friend_request, name="accept_friend_request"),
    path("remove_friend/", remove_friend, name="remove_friend"),
    path("get_friends/", get_friends, name="get_friends"),
]
