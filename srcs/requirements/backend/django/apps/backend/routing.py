import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator
from django.urls import path
from user import consumers
from user import routing as UserAppRouting
# from YourAppHere import consumers

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')


# ProtocolTypeRouter for routing different protocols
application = ProtocolTypeRouter({
    "http": get_asgi_application(),  # HTTP handling
    "websocket": AllowedHostsOriginValidator(  # WebSocket handling
        AuthMiddlewareStack(
            URLRouter(
                UserAppRouting.websocket_urlpatterns
            )
        )
    ),
})
