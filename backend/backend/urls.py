"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
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
from django.shortcuts import redirect
from rest_framework import routers
from accounts.api import (
    ProfileViewSet, DoctorViewSet, AppointmentViewSet,
    login_view as api_login_view, register_view, logout_view, profile_api,
    get_doctors, get_availability, book_appointment, get_dashboard_stats,
    doctor_dashboard_stats, doctor_availability, doctor_appointments, doctor_appointment_details
)
from accounts.views import login_view as html_login_view, patient_dashboard, doctor_dashboard

# Configuration du router REST Framework
router = routers.DefaultRouter()
router.register(r'api/profiles', ProfileViewSet, basename='profile')
router.register(r'api/doctors', DoctorViewSet, basename='doctor')
router.register(r'api/appointments', AppointmentViewSet, basename='appointment')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', html_login_view, name='login'),
    path('patient/', patient_dashboard, name='patient_dashboard'),
    path('medecin/', doctor_dashboard, name='doctor_dashboard'),

    # API REST Framework (nouveau et puissant)
    path('api/', include(router.urls)),
    path('api/auth/', include('rest_framework.urls', namespace='rest_framework')),

    # API d'authentification
    path('api/login/', api_login_view, name='api_login'),
    path('api/register/', register_view, name='register'),
    path('api/logout/', logout_view, name='logout'),

    # API compatibilité (anciennes routes)
    path('api/profile/', profile_api, name='profile_api'),
    path('api/profile/password/', ProfileViewSet.as_view({'post': 'change_password'}), name='change_password'),
    path('api/doctors/', get_doctors, name='get_doctors'),
    path('api/availability/', get_availability, name='get_availability'),
    path('api/appointments/book/', book_appointment, name='book_appointment'),
    path('api/dashboard/stats/', get_dashboard_stats, name='get_dashboard_stats'),

    # API médecins
    path('api/doctor/dashboard/stats/', doctor_dashboard_stats, name='doctor_dashboard_stats'),
    path('api/doctor/availability/', doctor_availability, name='doctor_availability'),
    path('api/doctor/appointments/', doctor_appointments, name='doctor_appointments'),
    path('api/doctor/appointments/<int:appointment_id>/', doctor_appointment_details, name='doctor_appointment_details'),
]

# Serve media files during development with no-cache headers
if settings.DEBUG:
    from django.views.static import serve
    from django.urls import re_path

    def serve_media_no_cache(request, path):
        """Serve media files with no-cache headers to prevent browser caching"""
        from django.http import HttpResponse
        import os
        import mimetypes

        file_path = os.path.join(settings.MEDIA_ROOT, path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            # Détecter le type MIME
            content_type, _ = mimetypes.guess_type(file_path)
            if content_type is None:
                content_type = 'application/octet-stream'

            # Lire le fichier
            with open(file_path, 'rb') as f:
                content = f.read()

            # Créer réponse avec headers anti-cache
            response = HttpResponse(content, content_type=content_type)
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
            response['ETag'] = f'"{hash(content)}-{os.path.getmtime(file_path)}"'
            return response

        from django.http import Http404
        raise Http404("File not found")

    # Servir les fichiers media normalement
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
