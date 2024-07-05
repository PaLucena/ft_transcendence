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
	path('setnickname/', views.set_nickname),
	path('uploadavatar/', views.upload_avatar),
    path('updateuserinfo/', views.update_user_info),

    path('ws/status/', consumers.UserStatus.as_asgi()),
]