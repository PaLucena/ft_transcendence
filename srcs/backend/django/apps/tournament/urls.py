from django.urls import path
from . import views
from . import game_views

urlpatterns = [
	path('get_code/<int:tournament_id>/', views.get_code, name='get_code'),
	path('create_tournament/', views.create_tournament, name='create_tournament'),
	path('close_tournament/<int:tournament_id>/', views.close_tournament, name='close_tournament'),
	path('display_tournaments/', views.display_tournaments, name='display_tournaments'),
	path('join_tournament/<int:tournament_id>/', views.join_tournament, name='join_tournament'),
	path('get_tournament_creator/<int:tournament_id>/', views.get_tournament_creator, name='get_tournament_creator'),
	path('remove_participation/<int:tournament_id>/', views.remove_participation, name='remove_participation'),
	
	path('start_local_match/', game_views.start_local_match, name='start_local_match'),

]