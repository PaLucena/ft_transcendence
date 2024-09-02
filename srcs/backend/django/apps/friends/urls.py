from django.urls import path
from friends.views import (
    invite_friend,
    accept_invitation,
    remove_friend,
    filter_users,
    search_friends,
)

urlpatterns = [
    path("filter/<str:filter_type>/", filter_users, name="filter_users"),
    path("action/invite_friend/", invite_friend, name="invite_friend"),
    path("action/accept_invitation/", accept_invitation, name="accept_invitation"),
    path("action/remove_friend/", remove_friend, name="remove_friend"),
    path("search/", search_friends, name="search_friends"),
]
