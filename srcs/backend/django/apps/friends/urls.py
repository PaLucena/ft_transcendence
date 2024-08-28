from django.urls import path
from friends.views import (
    invite_friend,
    accept_invitation,
    remove_friend,
    get_friends,
    filter_users,
)

urlpatterns = [
    path("filter/<str:filter_type>/", filter_users, name="filter_users"),
    path("invite_friend/", invite_friend, name="invite_friend"),
    path("accept_invitation/", accept_invitation, name="accept_invitation"),
    path("remove_friend/", remove_friend, name="remove_friend"),
    path("get_friends/", get_friends, name="get_friends"),
]
