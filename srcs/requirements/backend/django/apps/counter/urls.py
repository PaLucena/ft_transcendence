from django.urls import path
from .views import buttonCount

urlpatterns = [
    path('click/', buttonCount, name='buttonCount'),
    path('api/click/', buttonCount, name='buttonCount'),
]