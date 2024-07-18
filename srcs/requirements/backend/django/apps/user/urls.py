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
	path('get_friends/', views.get_friends, name='get_friends'),
	path('delete_account/', views.delete_account, name='delete_account'),

    path('ws/status/', consumers.UserStatus.as_asgi()),
]
