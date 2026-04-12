from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Profile, Appointment
from .serializers import (
    UserSerializer, ProfileSerializer, AppointmentSerializer,
    DoctorSerializer, DashboardStatsSerializer
)

class ProfileViewSet(viewsets.ModelViewSet):
    """API pour gérer les profils utilisateurs"""
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Profile.objects.filter(user=self.request.user)

    def get_object(self):
        return self.request.user.profile

    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Changer le mot de passe de l'utilisateur"""
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            return Response({
                'status': 'error',
                'message': 'Ancien et nouveau mot de passe requis'
            }, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if not user.check_password(old_password):
            return Response({
                'status': 'error',
                'message': 'Ancien mot de passe incorrect'
            }, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        return Response({
            'status': 'success',
            'message': 'Mot de passe changé avec succès'
        })

class DoctorViewSet(viewsets.ReadOnlyModelViewSet):
    """API pour lister les médecins"""
    queryset = Profile.objects.filter(role='medecin').select_related('user')
    serializer_class = DoctorSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        specialty = self.request.query_params.get('specialty', None)
        if specialty:
            queryset = queryset.filter(specialty=specialty)
        return queryset

class AppointmentViewSet(viewsets.ModelViewSet):
    """API pour gérer les rendez-vous"""
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Appointment.objects.filter(patient=self.request.user).select_related('doctor__profile')

    def perform_create(self, serializer):
        serializer.save(patient=self.request.user)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Annuler un rendez-vous"""
        appointment = self.get_object()

        if appointment.patient != request.user:
            return Response({
                'status': 'error',
                'message': 'Non autorisé'
            }, status=status.HTTP_403_FORBIDDEN)

        if appointment.status == 'cancelled':
            return Response({
                'status': 'error',
                'message': 'Rendez-vous déjà annulé'
            }, status=status.HTTP_400_BAD_REQUEST)

        appointment.status = 'cancelled'
        appointment.save()

        return Response({
            'status': 'success',
            'message': 'Rendez-vous annulé'
        })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_doctors(request):
    """Obtenir la liste des médecins"""
    doctors = Profile.objects.filter(role='medecin').select_related('user')
    serializer = DoctorSerializer(doctors, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_availability(request):
    """Obtenir les disponibilités d'un médecin"""
    doctor_id = request.query_params.get('doctor_id')
    date = request.query_params.get('date')

    if not doctor_id or not date:
        return Response({
            'status': 'error',
            'message': 'doctor_id et date requis'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        doctor = User.objects.get(id=doctor_id, profile__role='medecin')
    except User.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Médecin non trouvé'
        }, status=status.HTTP_404_NOT_FOUND)

    # Générer des créneaux horaires (8h-17h, toutes les heures)
    slots = []
    for hour in range(8, 18):
        time_str = f"{hour:02d}:00"
        # Vérifier si le créneau est disponible
        is_available = not Appointment.objects.filter(
            doctor=doctor,
            date=date,
            time=time_str,
            status__in=['confirmed', 'pending']
        ).exists()

        slots.append({
            'time': time_str,
            'available': is_available
        })

    return Response({
        'status': 'success',
        'slots': slots
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def book_appointment(request):
    """Prendre un rendez-vous"""
    doctor_id = request.data.get('doctor_id')
    date = request.data.get('date')
    time = request.data.get('time')

    if not all([doctor_id, date, time]):
        return Response({
            'status': 'error',
            'message': 'Tous les champs sont requis'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        doctor = User.objects.get(id=doctor_id, profile__role='medecin')
    except User.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Médecin non trouvé'
        }, status=status.HTTP_404_NOT_FOUND)

    # Vérifier si le créneau est disponible
    if Appointment.objects.filter(
        doctor=doctor,
        date=date,
        time=time,
        status__in=['confirmed', 'pending']
    ).exists():
        return Response({
            'status': 'error',
            'message': 'Ce créneau n\'est plus disponible'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Créer le rendez-vous
    appointment = Appointment.objects.create(
        patient=request.user,
        doctor=doctor,
        date=date,
        time=time,
        status='confirmed'
    )

    serializer = AppointmentSerializer(appointment)
    return Response({
        'status': 'success',
        'message': 'Rendez-vous pris avec succès',
        'appointment': serializer.data
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_dashboard_stats(request):
    """Statistiques du tableau de bord"""
    period = request.GET.get('period', 'weekly')

    # Statistiques de base
    user_appointments = Appointment.objects.filter(patient=request.user)

    upcoming = user_appointments.filter(
        status='confirmed',
        date__gte=datetime.now().date()
    ).count()

    completed = user_appointments.filter(status='completed').count()

    total_doctors = user_appointments.values('doctor').distinct().count()

    # Données de tendance (7 derniers jours)
    trend_data = []
    today = datetime.now().date()
    for i in range(6, -1, -1):
        date = today - timedelta(days=i)
        count = user_appointments.filter(date=date).count()
        trend_data.append(count)

    # Si pas de données, ajouter des données par défaut pour démonstration
    if all(c == 0 for c in trend_data) and upcoming == 0 and completed == 0:
        # Données de démonstration
        trend_data = [2, 1, 3, 0, 2, 1, 1]  # Exemple de tendance
        upcoming = 3
        completed = 5
        total_doctors = 2

        specialties_data = {
            'labels': ['Généraliste', 'Cardiologue', 'Dermatologue'],
            'values': [4, 2, 1]
        }

        weekly_data = {
            'labels': ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
            'values': [2, 1, 1, 2, 1, 1]
        }
    else:
        # Données réelles
        # Répartition par spécialité
        specialties_count = {}
        for appointment in user_appointments:
            try:
                doctor_profile = appointment.doctor.profile
                specialty = doctor_profile.specialty or 'Autre'
            except:
                specialty = 'Autre'
            specialties_count[specialty] = specialties_count.get(specialty, 0) + 1

        specialties_data = {
            'labels': list(specialties_count.keys()) if specialties_count else ['Aucune donnée'],
            'values': list(specialties_count.values()) if specialties_count else [0]
        }

        # Rendez-vous par jour de semaine
        weekday_counts = {}
        for appointment in user_appointments:
            weekday = appointment.date.weekday()
            weekday_name = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'][weekday]
            weekday_counts[weekday_name] = weekday_counts.get(weekday_name, 0) + 1

        weekly_data = {
            'labels': ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
            'values': [
                weekday_counts.get('Lundi', 0),
                weekday_counts.get('Mardi', 0),
                weekday_counts.get('Mercredi', 0),
                weekday_counts.get('Jeudi', 0),
                weekday_counts.get('Vendredi', 0),
                weekday_counts.get('Samedi', 0)
            ]
        }

    return Response({
        'stats': {
            'upcoming': upcoming,
            'completed': completed,
            'prescriptions': 0,  # À implémenter plus tard
            'doctors': total_doctors
        },
        'trend_data': trend_data,
        'specialties_data': specialties_data,
        'weekly_data': weekly_data
    })

# Authentification
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """Connexion utilisateur"""
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({
            'status': 'error',
            'message': 'Nom d\'utilisateur et mot de passe requis'
        }, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(username=username, password=password)
    if user is not None:
        login(request, user)
        serializer = UserSerializer(user)
        return Response({
            'status': 'success',
            'message': 'Connexion réussie',
            'user': serializer.data
        })
    else:
        return Response({
            'status': 'error',
            'message': 'Identifiants incorrects'
        }, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_view(request):
    """Inscription utilisateur"""
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    first_name = request.data.get('first_name')
    last_name = request.data.get('last_name')
    role = request.data.get('role', 'patient')

    if not all([username, email, password, first_name, last_name]):
        return Response({
            'status': 'error',
            'message': 'Tous les champs sont requis'
        }, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({
            'status': 'error',
            'message': 'Nom d\'utilisateur déjà pris'
        }, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({
            'status': 'error',
            'message': 'Email déjà utilisé'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Créer l'utilisateur
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name
    )

    # Créer le profil
    Profile.objects.create(user=user, role=role)

    return Response({
        'status': 'success',
        'message': 'Inscription réussie'
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """Déconnexion"""
    logout(request)
    return Response({
        'status': 'success',
        'message': 'Déconnexion réussie'
    })

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def profile_api(request):
    """API pour gérer le profil utilisateur"""
    profile = request.user.profile

    if request.method == 'GET':
        serializer = ProfileSerializer(profile)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = ProfileSerializer(profile, data=request.data, partial=True)

        if serializer.is_valid():
            # Gérer l'avatar (mais on l'a désactivé)
            # avatar handling removed

            serializer.save()
            return Response({
                'status': 'success',
                'message': 'Profil mis à jour',
                'profile': serializer.data
            })
        else:
            return Response({
                'status': 'error',
                'message': 'Données invalides',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)


# === VUES SPÉCIFIQUES AUX MÉDECINS ===

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def doctor_dashboard_stats(request):
    """Statistiques du tableau de bord médecin"""
    print(f"Doctor dashboard stats API called by user: {request.user}, role: {request.user.profile.role}")

    if request.user.profile.role != 'medecin':
        print("Access denied - user is not a doctor")
        return Response({'error': 'Accès non autorisé'}, status=status.HTTP_403_FORBIDDEN)

    period = request.GET.get('period', 'weekly')
    print(f"Requested period: {period}")

    # Rendez-vous d'aujourd'hui
    today = datetime.now().date()
    today_appointments = Appointment.objects.filter(doctor=request.user, date=today).count()

    # Total patients (patients uniques ayant eu des rendez-vous)
    total_patients = Appointment.objects.filter(doctor=request.user).values('patient').distinct().count()

    # Consultations effectuées
    completed_consultations = Appointment.objects.filter(doctor=request.user, status='completed').count()

    # Rendez-vous en attente
    pending_appointments = Appointment.objects.filter(doctor=request.user, status='confirmed', date__gte=today).count()

    # Données pour les graphiques
    trend_data = []
    for i in range(6, -1, -1):
        date = today - timedelta(days=i)
        count = Appointment.objects.filter(doctor=request.user, date=date).count()
        trend_data.append(count)

    # Répartition des patients par spécialité (si le médecin traite plusieurs spécialités)
    # Pour simplifier, on utilise la spécialité du médecin pour tous ses patients
    doctor_specialty = request.user.profile.specialty or 'Généraliste'
    patients_data = {
        'labels': [doctor_specialty],
        'values': [total_patients]
    }

    # Rendez-vous par jour de la semaine
    weekday_counts = {}
    appointments = Appointment.objects.filter(doctor=request.user)
    for appointment in appointments:
        weekday = appointment.date.weekday()
        weekday_name = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'][weekday]
        weekday_counts[weekday_name] = weekday_counts.get(weekday_name, 0) + 1

    weekly_data = {
        'labels': ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
        'values': [
            weekday_counts.get('Lundi', 0),
            weekday_counts.get('Mardi', 0),
            weekday_counts.get('Mercredi', 0),
            weekday_counts.get('Jeudi', 0),
            weekday_counts.get('Vendredi', 0),
            weekday_counts.get('Samedi', 0)
        ]
    }

    result = {
        'stats': {
            'today_appointments': today_appointments,
            'total_patients': total_patients,
            'completed_consultations': completed_consultations,
            'pending_appointments': pending_appointments
        },
        'trend_data': trend_data,
        'patients_data': patients_data,
        'weekly_data': weekly_data
    }

    print(f"Returning doctor stats: {result}")
    return Response(result)


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def doctor_availability(request):
    """Gestion des disponibilités du médecin"""
    if request.user.profile.role != 'medecin':
        return Response({'error': 'Accès non autorisé'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        # Récupérer les disponibilités du médecin
        # Pour l'instant, retourner des données vides (à implémenter avec un modèle Availability)
        return Response([])

    elif request.method == 'POST':
        # Créer une nouvelle disponibilité
        date = request.data.get('date')
        start_time = request.data.get('start_time')
        end_time = request.data.get('end_time')
        slot_duration = request.data.get('slot_duration', 30)

        if not all([date, start_time, end_time]):
            return Response({
                'status': 'error',
                'message': 'Date, heure de début et heure de fin requises'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Ici on devrait créer un objet Availability avec les données
        # Pour l'instant, on simule une création réussie
        return Response({
            'status': 'success',
            'message': 'Disponibilité ajoutée'
        })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def doctor_appointments(request):
    """Rendez-vous du médecin"""
    if request.user.profile.role != 'medecin':
        return Response({'error': 'Accès non autorisé'}, status=status.HTTP_403_FORBIDDEN)

    filter_type = request.GET.get('filter', 'all')

    appointments_query = Appointment.objects.filter(doctor=request.user).select_related('patient')

    if filter_type == 'today':
        today = datetime.now().date()
        appointments_query = appointments_query.filter(date=today)
    elif filter_type == 'week':
        today = datetime.now().date()
        week_end = today + timedelta(days=7)
        appointments_query = appointments_query.filter(date__gte=today, date__lte=week_end)

    appointments_data = []
    for appointment in appointments_query:
        appointments_data.append({
            'id': appointment.id,
            'patient_name': f"{appointment.patient.first_name} {appointment.patient.last_name}",
            'patient_email': appointment.patient.email,
            'patient_phone': appointment.patient.profile.phone if hasattr(appointment.patient, 'profile') else '',
            'date': appointment.date.strftime('%Y-%m-%d'),
            'time': appointment.time.strftime('%H:%M'),
            'reason': appointment.reason or 'Consultation',
            'status': appointment.status,
            'notes': appointment.notes or ''
        })

    return Response(appointments_data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def doctor_appointment_details(request, appointment_id):
    """Détails d'un rendez-vous pour le médecin"""
    if request.user.profile.role != 'medecin':
        return Response({'error': 'Accès non autorisé'}, status=status.HTTP_403_FORBIDDEN)

    try:
        appointment = Appointment.objects.get(id=appointment_id, doctor=request.user)
        data = {
            'id': appointment.id,
            'patient_name': f"{appointment.patient.first_name} {appointment.patient.last_name}",
            'patient_email': appointment.patient.email,
            'patient_phone': appointment.patient.profile.phone if hasattr(appointment.patient, 'profile') else '',
            'date': appointment.date.strftime('%d/%m/%Y'),
            'time': appointment.time.strftime('%H:%M'),
            'reason': appointment.reason or 'Consultation',
            'status': appointment.status,
            'notes': appointment.notes or ''
        }
        return Response(data)
    except Appointment.DoesNotExist:
        return Response({'error': 'Rendez-vous non trouvé'}, status=status.HTTP_404_NOT_FOUND)