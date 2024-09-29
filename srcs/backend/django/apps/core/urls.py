"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)


# Django Container Health check view
def health_check(request):
    return JsonResponse({"status": "ok"}, status=200)


urlpatterns = [
    # The route for checking the health of the django container
    path("health/", health_check),
    # Admin and API routes
    path("api/admin/", admin.site.urls),
    path("api/", include("user.urls")),
    path("api/", include("user_stats.urls")),
    path("api/", include("tournament.urls")),
    path("api/", include("pongtournament.urls")),
    path("api/chat/", include("rtchat.urls")),
    path("api/friends/", include("friends.urls")),
    path("api/blockchain/", include("blockchain.urls")),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path(
        "api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"
    ),
    path("api/2fa/", include("twofactor.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
