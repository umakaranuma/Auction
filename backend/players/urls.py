from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TournamentViewSet, PlayerViewSet

router = DefaultRouter()
router.register(r'tournaments', TournamentViewSet)
router.register(r'players', PlayerViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
