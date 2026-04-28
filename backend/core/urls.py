from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ContactRequestViewSet, EmergencyAlertViewSet, IncidentViewSet, IncidentUpdateViewSet, UserViewSet, AdminCheckView, AdminBootstrapView

router = DefaultRouter()
router.register(r'incidents', IncidentViewSet)
router.register(r'updates', IncidentUpdateViewSet)
router.register(r'users', UserViewSet)
router.register(r'contact_requests', ContactRequestViewSet)
router.register(r'emergency_alerts', EmergencyAlertViewSet)

urlpatterns = [
    path('admin/check/', AdminCheckView.as_view(), name='admin_check'),
    path('admin/bootstrap/', AdminBootstrapView.as_view(), name='admin_bootstrap'),
    path('', include(router.urls)),
]