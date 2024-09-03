from django.urls import path
from . import views

urlpatterns = [
    path("check_auth", views.check_auth, name="check_auth"),
    path("get_user_data/", views.get_user_data, name="get_user_data"),
    path("login/", views.login),
    path("signup/", views.signup),
    path("test-view/", views.TestView),
    path("logout/", views.logout),
    path("update_user_info/", views.update_user_info, name="update_user_info"),
    path("delete_account/", views.delete_account, name="delete_account"),
    path("42api-login/", views.ftapiLogin, name="ftapiLogin"),
    path("2fa-login/", views.loginWith2fa, name="loginWith2fa"),
]
