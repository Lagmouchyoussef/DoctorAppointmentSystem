from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'patients', views.PatientViewSet, basename='patient')
router.register(r'doctors', views.DoctorViewSet, basename='doctor')
router.register(r'appointments', views.AppointmentViewSet, basename='appointment')
router.register(r'history', views.MedicalHistoryViewSet, basename='history')

urlpatterns = [
    path('', include(router.urls)),
]