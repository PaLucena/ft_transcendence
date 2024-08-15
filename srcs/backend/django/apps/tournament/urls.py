from django.urls import path
from . import views

urlpatterns = [
	path('get_code/', views.get_code, name='get_code'),
	path('create_tournament/', views.create_tournament, name='create_tournament'),
	path('close_tournament/', views.close_tournament, name='close_tournament'),
	path('display_tournaments/', views.display_tournaments, name='display_tournaments'),
	path('join_tournament/', views.join_tournament, name='join_tournament'),
	path('remove_participation/', views.remove_participation, name='remove_participation'),
]