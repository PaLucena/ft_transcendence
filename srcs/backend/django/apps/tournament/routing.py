from django.urls import path
from tournament.consumers import TournamentConsumer

websocket_urlpatterns = [
    path('ws/tournament/<str:tournament_name>/', TournamentConsumer.as_asgi()),
]
