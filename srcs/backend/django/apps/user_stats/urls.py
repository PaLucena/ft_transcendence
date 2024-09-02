from django.urls import path
from . import views

urlpatterns = [
	path('player_statistics/<str:username>/', views.player_statistics, name='player_statistics'),
]
