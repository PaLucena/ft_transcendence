from django.urls import path
from . import views
from .game_views import LocalMatch, AiMatch, RemoteMatch

urlpatterns = [
	path('get_code/<int:tournament_id>/', views.get_code, name='get_code'),
	path('create_tournament/', views.create_tournament, name='create_tournament'),
	path('close_tournament/<int:tournament_id>/', views.close_tournament, name='close_tournament'),
	path('display_tournaments/', views.display_tournaments, name='display_tournaments'),
	path('join_tournament/<int:tournament_id>/', views.join_tournament, name='join_tournament'),
	path('get_tournament_creator/<int:tournament_id>/', views.get_tournament_creator, name='get_tournament_creator'),
	path('remove_participation/<int:tournament_id>/', views.remove_participation, name='remove_participation'),
	path('start_local_match/', LocalMatch.as_view(), name='start_local_match'),
	path('start_ai_match/', AiMatch.as_view(), name='start_ai_match'),
	path('start_remote_match/', RemoteMatch.as_view(), name='start_remote_match'),
]