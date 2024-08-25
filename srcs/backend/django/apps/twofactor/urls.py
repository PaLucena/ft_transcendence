from django.urls import path
from . import views

urlpatterns = [
	path("enable2fa/", name='enable2fa', view=views.enable2fa),
	path("disable2fa/", name='disable2fa', view=views.disable2fa),
	path("verify-2fa/", name='verify2fa', view=views.verifyTwoFactor),
	path("check2fa/", name='check2fa', view=views.check2fa),
]