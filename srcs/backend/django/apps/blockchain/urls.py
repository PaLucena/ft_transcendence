from django.urls import path
from . import views

urlpatterns = [
    path('create_tournament/', views.create_tournament, name='create_tournament'),
    path('sws/', views.record_match, name='record_match'),
    path('get_tournament/<int:tournament_id>/', views.get_tournament, name='get_tournament'),
    path('get_match/<int:match_id>/', views.get_match, name='get_match'),
    path('get_player_tournaments/<int:player_id>/', views.get_player_tournaments, name='get_player_tournaments'),
]
