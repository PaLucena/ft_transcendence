from django.urls import path
from . import views
from . import consumers

""" urlpatterns = [
	
    path('', views.members, name='members'),
	path('room/<str:pk>/', views.room, name="room"),
] """

urlpatterns = [
    path('login/', views.login),
    path('signup/', views.signup),
    path('test-view/', views.TestView),
    path('logout/', views.logout),
    path('ws/status/', consumers.UserStatus.as_asgi()),
]