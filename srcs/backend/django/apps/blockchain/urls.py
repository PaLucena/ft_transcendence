from django.urls import path
from . import views

urlpatterns = [
    path('create_tournament/', views.create_tournament, name='create_tournament'),
    path('record_match/', views.record_match, name='record_match'),
    path('get_tournament/<int:tournament_id>/', views.get_tournament, name='get_tournament'),
    path('get_all_tournaments_ids/', views.get_all_tournaments_ids, name='get_all_tournaments_ids'),
    path('get_match/<int:match_id>/', views.get_match, name='get_match'),
    path('get_player_tournaments/<int:player_id>/', views.get_player_tournaments, name='get_player_tournaments'),
    path('get_player_matches/<int:player_id>/', views.get_player_matches, name='get_player_matches'),
    path('get_face2face/<int:player1_id>/<int:player2_id>/', views.get_face2face, name='get_face2face'),
    path('load_test_data/', views.load_test_data, name='load_test_data'),
]
