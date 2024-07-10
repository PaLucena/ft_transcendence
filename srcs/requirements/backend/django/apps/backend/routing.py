# project_name/asgi.py

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator
from django.urls import path
from counter import consumers  # Adjust based on your project structure

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Define WebSocket URL patterns
websocket_urlpatterns = [
    path('ws/clicks/', consumers.ClickConsumer.as_asgi()),
    # Add more WebSocket URL patterns as needed
]

# ProtocolTypeRouter for routing different protocols
application = ProtocolTypeRouter({
    "http": get_asgi_application(),  # HTTP handling
    "websocket": AllowedHostsOriginValidator(  # WebSocket handling
        AuthMiddlewareStack(
            URLRouter(
                websocket_urlpatterns
            )
        )
    ),
})
