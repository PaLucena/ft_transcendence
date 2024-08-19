from django.urls import path
from . import views

urlpatterns = [
	path('check-auth/', views.check_auth, name='check_auth'),
	path('get_user_data/', views.get_user_data, name='get_user_data'),
	path('login/', views.login),
	path('signup/', views.signup),
	path('test-view/', views.TestView),
	path('logout/', views.logout),
	path('updateuserinfo/', views.update_user_info),
	path('invite_friend/', views.invite_friend, name='invite_friend'),
	path('accept_friend_request/', views.accept_friend_request, name='accept_friend_request'),
	path('remove_friend/', views.remove_friend, name='remove_friend'),
	path('get_friends/', views.get_friends, name='get_friends'),
	path('delete_account/', views.delete_account, name='delete_account'),
	path('42api-login/', views.ftapiLogin, name='ftapiLogin'),
]
