from django.urls import path
from . import views


urlpatterns = [
    path("get_active_tournaments/", views.get_active_tournaments, name="get_active_tournaments",),
    path("get_tournament_room_data/<str:tournament_id>/", views.get_tournament_room_data, name="get_tournament_room_data",),
    path("tournament/", views.tournament, name="tournament"),
]
