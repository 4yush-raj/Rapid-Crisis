from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ContactRequestViewSet, EmergencyAlertViewSet, IncidentViewSet, IncidentUpdateViewSet, UserViewSet

router = DefaultRouter()
router.register(r'incidents', IncidentViewSet)
router.register(r'updates', IncidentUpdateViewSet)
router.register(r'users', UserViewSet)
router.register(r'contact_requests', ContactRequestViewSet)
router.register(r'emergency_alerts', EmergencyAlertViewSet)

urlpatterns = [
    path('', include(router.urls)),
]