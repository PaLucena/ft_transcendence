from django.urls import path
from . import views

urlpatterns = [
	path('api/user_stats_update', views.user_stats_update, name='user_stats_update')
]
