from django.urls import path
from . import views

urlpatterns = [
	path('user_stats_update', views.user_stats_update, name='user_stats_update'),
	path('show_stats', views.show_stats, name='show_stats'),
]
