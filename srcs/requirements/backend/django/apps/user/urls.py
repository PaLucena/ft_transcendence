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
	path('invite_friend/', views.invite_friend, name='invite_friend'),
	path('accept_friend_request/', views.accept_friend_request, name='accept_friend_request'),
	path('remove_friend/', views.remove_friend, name='remove_friend'),

	path('api/login/', views.login),
	path('api/signup/', views.signup),
	path('api/test-view/', views.TestView),
	path('api/logout/', views.logout),
	path('api/setnickname/', views.set_nickname),
	path('api/uploadavatar/', views.upload_avatar),
	path('api/updateuserinfo/', views.update_user_info),
	path('api/invite_friend/', views.invite_friend, name='invite_friend'),
	path('api/accept_friend_request/', views.accept_friend_request, name='accept_friend_request'),
	path('api/remove_friend/', views.remove_friend, name='remove_friend'),

	path('ws/status/', consumers.UserStatus.as_asgi()),
]