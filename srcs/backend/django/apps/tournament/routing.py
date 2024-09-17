from django.urls import path
from user.consumers import OnlineStatusConsumer
from tournament.consumers import TournamentConsumer

websocket_urlpatterns = [
    path("ws/tournament-users/", OnlineStatusConsumer.as_asgi()),
    path('ws/tournament/<str:tournament_name>/', TournamentConsumer.as_asgi()),
]
