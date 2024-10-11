from django.urls import path
from . import views


urlpatterns = [
    path("is_player_in_game/", views.is_player_in_game, name="is_player_in_game",),
    path("get_tournament_room_data/<str:tournament_id>/", views.get_tournament_room_data, name="get_tournament_room_data",),
    path("tournament/", views.tournament, name="tournament"),
]
