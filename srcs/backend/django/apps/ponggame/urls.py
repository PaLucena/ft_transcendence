from django.urls import path
from . import views

urlpatterns = [
	path("userInGame/", name='userInGame', view=views.userInGame),
]