from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, update_session_auth_hash
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_protect
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_protect
from django.shortcuts import get_object_or_404
from django.contrib import messages
from .models import Profile, Appointment
import json
from datetime import datetime, timedelta
from datetime import datetime
import os




@login_required
def patient_dashboard(request):
    """Dashboard pour les patients"""
    profile = request.user.profile
    print(f"Patient dashboard accessed by user {request.user} with role {profile.role}")  # Debug
    if profile.role != 'patient':
        messages.error(request, 'Accès non autorisé')
        return redirect('/')

    print("Rendering patient dashboard")  # Debug
    # TRAITEMENT FORMULAIRE PROFIL
    if request.method == 'POST' and 'update_profile' in request.POST:
        request.user.first_name = request.POST.get('first_name', request.user.first_name)
        request.user.last_name = request.POST.get('last_name', request.user.last_name)
        request.user.email = request.POST.get('email', request.user.email)
        request.user.username = request.POST.get('email', request.user.username)
        request.user.save()

        profile.phone = request.POST.get('phone', profile.phone)
        profile.address = request.POST.get('address', profile.address)
        profile.save()

        messages.success(request, 'Profil mis à jour avec succès')
        return redirect('/patient/')

    context = {
        'user': request.user,
        'profile': profile,
        'today': datetime.now().date()
    }

    return render(request, 'dashboard/patient.html', context)


@login_required
def doctor_dashboard(request):
    """Dashboard pour les médecins"""
    profile = request.user.profile
    print(f"Doctor dashboard accessed by user {request.user} with role {profile.role}")  # Debug
    if profile.role != 'medecin':
        messages.error(request, 'Accès non autorisé')
        return redirect('/')

    print("Rendering doctor dashboard")  # Debug
    # TRAITEMENT FORMULAIRE PROFIL
    if request.method == 'POST' and 'update_profile' in request.POST:
        request.user.first_name = request.POST.get('first_name', request.user.first_name)
        request.user.last_name = request.POST.get('last_name', request.user.last_name)
        request.user.email = request.POST.get('email', request.user.email)
        request.user.username = request.POST.get('email', request.user.username)
        request.user.save()

        profile.phone = request.POST.get('phone', profile.phone)
        profile.address = request.POST.get('address', profile.address)
        profile.specialty = request.POST.get('specialty', profile.specialty)
        profile.rpps_number = request.POST.get('rpps_number', profile.rpps_number)
        profile.save()

        messages.success(request, 'Profil mis à jour avec succès')
        return redirect('/medecin/')

    context = {
        'user': request.user,
        'profile': profile
    }
    return render(request, 'dashboard/doctor.html', context)


def login_view(request):
    # Traitement déconnexion
    if 'logout' in request.GET:
        from django.contrib.auth import logout
        logout(request)
        return redirect('/')

    # TRAITEMENT FORMULAIRES LOGIN/SIGNUP
    if request.method == 'POST':
        if 'signin' in request.POST:
            email = request.POST.get('email')
            password = request.POST.get('password')
            user = authenticate(request, username=email, password=password)
            if user is not None:
                profile = user.profile
                if profile.role == 'medecin':
                    login(request, user)
                    return redirect('/medecin/')
                elif profile.role == 'patient':
                    login(request, user)
                    return redirect('/patient/')
                else:
                    messages.error(request, 'Rôle non autorisé.')
                    return render(request, 'login.html')
            else:
                messages.error(request, 'Email ou mot de passe incorrect.')
                return render(request, 'login.html')

        elif 'signup' in request.POST:
            first_name = request.POST.get('first_name')
            last_name = request.POST.get('last_name')
            email = request.POST.get('email')
            password = request.POST.get('password')
            role = request.POST.get('role')

            if User.objects.filter(email=email).exists():
                messages.error(request, 'Un compte avec cet email existe déjà.')
                return render(request, 'login.html')

            user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            profile = Profile.objects.create(user=user, role=role)
            messages.success(request, 'Compte créé avec succès. Vous pouvez maintenant vous connecter.')
            return render(request, 'login.html')

    profile = None  # Initialize profile variable

    if request.user.is_authenticated:
        profile, created = Profile.objects.get_or_create(user=request.user)
        print(f"User {request.user} is authenticated, role: {profile.role}, created: {created}")  # Debug

        if profile.role == 'medecin':
            return redirect('/medecin/')
        elif profile.role == 'patient':
            return redirect('/patient/')
        else:
            # Logout users with invalid roles
            from django.contrib.auth import logout
            logout(request)
            messages.error(request, 'Accès non autorisé pour ce rôle')
            return render(request, 'login.html')

        # TRAITEMENT FORMULAIRE PROFIL
        if request.method == 'POST' and 'update_profile' in request.POST:

            request.user.first_name = request.POST.get('first_name', request.user.first_name)
            request.user.last_name = request.POST.get('last_name', request.user.last_name)
            request.user.email = request.POST.get('email', request.user.email)
            request.user.username = request.POST.get('email', request.user.username)
            request.user.save()

            # Mise à jour Profile
            profile.phone = request.POST.get('phone', profile.phone)
            profile.address = request.POST.get('address', profile.address)
            # Mise à jour des champs spécifiques aux médecins
            if profile.role == 'medecin':
                profile.specialty = request.POST.get('specialty', profile.specialty)
                profile.rpps_number = request.POST.get('rpps_number', profile.rpps_number)


            profile.save()

            # ✅ Post/Redirect/Get pattern pour éviter double soumission et problème cache
            return redirect('/')

        # TRAITEMENT CHANGEMENT MOT DE PASSE
        if request.method == 'POST' and 'new_password' in request.POST:
            new = request.POST.get('new_password', '')
            confirm = request.POST.get('confirm_password', '')

            if new and new == confirm and len(new) >= 8:
                request.user.set_password(new)
                request.user.save()
                update_session_auth_hash(request, request.user)



    # If user is not authenticated, show login page
    if not request.user.is_authenticated:
        return render(request, 'login.html')

    # If user is authenticated but we reach here, redirect to doctor dashboard
    return redirect('/medecin/')





@login_required
@csrf_protect
@require_http_methods(["POST"])
@login_required
@csrf_protect
@require_http_methods(["GET"])
def get_doctors(request):
    doctors = Profile.objects.filter(role='medecin').select_related('user')
    doctor_list = []
    for profile in doctors:
        doctor_list.append({
            'id': profile.user.id,
            'first_name': profile.user.first_name,
            'last_name': profile.user.last_name,
            'specialty': profile.specialty or 'Médecin généraliste'
        })
    return JsonResponse(doctor_list, safe=False)


@login_required
@csrf_protect
@require_http_methods(["GET"])
def get_availability(request):
    doctor_id = request.GET.get('doctor_id')
    date_str = request.GET.get('date')
    
    if not doctor_id or not date_str:
        return JsonResponse({'error': 'Paramètres manquants'}, status=400)
    
    date = datetime.strptime(date_str, '%Y-%m-%d').date()
    
    # Plages horaires standard 09h-18h par tranche de 30min
    all_slots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
                 '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30']
    
    # Récupérer les rendez-vous existants
    booked_slots = Appointment.objects.filter(doctor_id=doctor_id, date=date).values_list('time', flat=True)
    booked_times = [t.strftime('%H:%M') for t in booked_slots]
    
    availability = []
    for slot in all_slots:
        availability.append({
            'time': slot,
            'available': slot not in booked_times
        })
    
    return JsonResponse(availability, safe=False)


@login_required
@csrf_protect
@require_http_methods(["POST"])
def book_appointment(request):
    try:
        data = json.loads(request.body)
        
        appointment = Appointment.objects.create(
            patient=request.user,
            doctor_id=data.get('doctor_id'),
            date=data.get('date'),
            time=data.get('time'),
            status='confirmed'
        )
        
        return JsonResponse({
            'success': True,
            'appointment_id': appointment.id,
            'message': 'Rendez-vous confirmé'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)


@login_required
@csrf_protect
@require_http_methods(["GET"])
def get_dashboard_stats(request):
    period = request.GET.get('period', 'weekly')
    
    # ✅ VRAIES DONNÉES DEPUIS LA BASE DE DONNÉES
    user_appointments = Appointment.objects.filter(patient=request.user)
    
    upcoming = user_appointments.filter(status='confirmed', date__gte=datetime.now().date()).count()
    completed = user_appointments.filter(status='completed').count()
    total_doctors = user_appointments.values('doctor').distinct().count()
    
    # Rendez-vous des 7 derniers jours pour le graphique
    trend_data = []
    today = datetime.now().date()
    for i in range(6, -1, -1):
        date = today - timedelta(days=i)
        count = user_appointments.filter(date=date).count()
        trend_data.append(count)
    
    # Répartition par spécialité - données réelles depuis la base
    specialties_count = {}
    for appointment in user_appointments:
        try:
            # Accéder à la spécialité via le profil du médecin
            doctor_profile = appointment.doctor.profile
            specialty = doctor_profile.specialty if doctor_profile.specialty else 'Autre'
        except:
            specialty = 'Autre'
        specialties_count[specialty] = specialties_count.get(specialty, 0) + 1

    specialties_data = {
        'labels': list(specialties_count.keys()),
        'values': list(specialties_count.values())
    }
    
    # Rendez-vous par jour de la semaine - données réelles
    weekday_counts = {}
    for appointment in user_appointments:
        # weekday() returns 0=Monday, 6=Sunday
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
    
    return JsonResponse({
        'stats': {
            'upcoming': upcoming,
            'completed': completed,
            'prescriptions': 0,
            'doctors': total_doctors
        },
        'trend_data': trend_data,
        'specialties_data': specialties_data,
        'weekly_data': weekly_data
    })


@login_required
@csrf_protect
@require_http_methods(["POST"])
def profile_api(request):
    profile, created = Profile.objects.get_or_create(user=request.user)

    if request.method == 'POST':
        try:
            # Handle avatar upload
            if 'avatar' in request.FILES:
                # Delete old avatar if exists
                if profile.avatar and profile.avatar.name:
                    if os.path.exists(profile.avatar.path):
                        os.remove(profile.avatar.path)
                profile.avatar = request.FILES['avatar']

            # Handle avatar deletion
            if request.POST.get('delete_avatar') == 'true':
                if profile.avatar and profile.avatar.name:
                    if os.path.exists(profile.avatar.path):
                        os.remove(profile.avatar.path)
                profile.avatar = None

            # Mise à jour User
            request.user.first_name = request.POST.get('first_name', request.user.first_name)
            request.user.last_name = request.POST.get('last_name', request.user.last_name)
            request.user.email = request.POST.get('email', request.user.email)
            request.user.username = request.POST.get('email', request.user.username)
            request.user.save()

            # Mise à jour Profile
            profile.phone = request.POST.get('phone', profile.phone)
            profile.address = request.POST.get('address', profile.address)
            profile.save()

            return JsonResponse({
                'status': 'success',
                'message': 'Profil mis à jour avec succès'
            })
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=400)


@login_required
@csrf_protect
@require_http_methods(["POST"])
def change_password(request):
    try:
        data = json.loads(request.body)
        current_password = data.get('current_password')
        new_password = data.get('new_password')

        if not request.user.check_password(current_password):
            return JsonResponse({
                'status': 'error',
                'message': 'Mot de passe actuel incorrect'
            }, status=400)

        request.user.set_password(new_password)
        request.user.save()
        update_session_auth_hash(request, request.user)

        return JsonResponse({
            'status': 'success',
            'message': 'Mot de passe modifié avec succès'
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=400)


# === VUES POUR LES MÉDECINS ===

@login_required
@csrf_protect
@require_http_methods(["GET"])
def doctor_dashboard_stats(request):
    """Statistiques du tableau de bord médecin"""
    if request.user.profile.role != 'medecin':
        return JsonResponse({'error': 'Accès non autorisé'}, status=403)

    period = request.GET.get('period', 'weekly')

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
            weekday_counts.get('Mardi', 0),  # Mercredi
            weekday_counts.get('Jeudi', 0),
            weekday_counts.get('Vendredi', 0),
            weekday_counts.get('Samedi', 0)
        ]
    }

    return JsonResponse({
        'stats': {
            'today_appointments': today_appointments,
            'total_patients': total_patients,
            'completed_consultations': completed_consultations,
            'pending_appointments': pending_appointments
        },
        'trend_data': trend_data,
        'patients_data': patients_data,
        'weekly_data': weekly_data
    })


@login_required
@csrf_protect
@require_http_methods(["GET", "POST"])
def doctor_availability(request):
    """Gestion des disponibilités du médecin"""
    if request.user.profile.role != 'medecin':
        return JsonResponse({'error': 'Accès non autorisé'}, status=403)

    if request.method == 'GET':
        # Récupérer les disponibilités du médecin
        # Pour l'instant, retourner des données vides (à implémenter avec un modèle Availability)
        return JsonResponse([], safe=False)

    elif request.method == 'POST':
        # Créer une nouvelle disponibilité
        try:
            data = json.loads(request.body)
            # Ici on devrait créer un objet Availability avec les données
            # Pour l'instant, on simule une création réussie
            return JsonResponse({'success': True, 'message': 'Disponibilité ajoutée'})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)


@login_required
@csrf_protect
@require_http_methods(["GET"])
def doctor_appointments(request):
    """Rendez-vous du médecin"""
    if request.user.profile.role != 'medecin':
        return JsonResponse({'error': 'Accès non autorisé'}, status=403)

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

    return JsonResponse(appointments_data, safe=False)


@login_required
@csrf_protect
@require_http_methods(["GET"])
def doctor_appointment_details(request, appointment_id):
    """Détails d'un rendez-vous pour le médecin"""
    if request.user.profile.role != 'medecin':
        return JsonResponse({'error': 'Accès non autorisé'}, status=403)

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
        return JsonResponse(data)
    except Appointment.DoesNotExist:
        return JsonResponse({'error': 'Rendez-vous non trouvé'}, status=404)
