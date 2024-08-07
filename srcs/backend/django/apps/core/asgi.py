# project_name/asgi.py

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator
from django.urls import path
from user import consumers
from user import routing as UserAppRouting
from rtchat import routing as RtchatAppRouting
from ponggame import routing as PonggameAppRouting
from user.middleware import JWTAuthMiddleware
# from YourAppHere import consumers

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

websocket_urlpatterns = (
    UserAppRouting.websocket_urlpatterns +
    RtchatAppRouting.websocket_urlpatterns +
    PonggameAppRouting.websocket_urlpatterns
)

# ProtocolTypeRouter for routing different protocols
application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
        "websocket": AllowedHostsOriginValidator(
            JWTAuthMiddleware(
                URLRouter(websocket_urlpatterns)
            )
        )
    }
)
