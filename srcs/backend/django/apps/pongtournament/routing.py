from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/pongtournament/', consumers.TournamentConsumer.as_asgi()),
]
