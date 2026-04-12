from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from accounts.models import Profile, Appointment
from datetime import datetime, timedelta

class Command(BaseCommand):
    help = 'Crée des données de test pour les diagrammes du tableau de bord'

    def handle(self, *args, **options):
        self.stdout.write('Création des données de test...')

        # Créer un patient de test
        patient, created = User.objects.get_or_create(
            username='patient_test',
            defaults={
                'email': 'patient@test.com',
                'first_name': 'Jean',
                'last_name': 'Dupont'
            }
        )
        if created:
            patient.set_password('test123')
            patient.save()

        # Créer le profil patient
        Profile.objects.get_or_create(
            user=patient,
            defaults={'role': 'patient'}
        )

        # Créer des médecins de test avec différentes spécialités
        doctors_data = [
            {'username': 'dr_generaliste', 'specialty': 'Généraliste', 'first_name': 'Marie', 'last_name': 'Martin'},
            {'username': 'dr_cardiologue', 'specialty': 'Cardiologie', 'first_name': 'Pierre', 'last_name': 'Dubois'},
            {'username': 'dr_dermatologue', 'specialty': 'Dermatologie', 'first_name': 'Sophie', 'last_name': 'Garcia'},
            {'username': 'dr_pediatre', 'specialty': 'Pédiatrie', 'first_name': 'Thomas', 'last_name': 'Lefebvre'},
        ]

        doctors = []
        for doc_data in doctors_data:
            doctor, created = User.objects.get_or_create(
                username=doc_data['username'],
                defaults={
                    'email': f"{doc_data['username']}@test.com",
                    'first_name': doc_data['first_name'],
                    'last_name': doc_data['last_name']
                }
            )
            if created:
                doctor.set_password('test123')
                doctor.save()

            # Créer le profil médecin
            Profile.objects.get_or_create(
                user=doctor,
                defaults={
                    'role': 'medecin',
                    'specialty': doc_data['specialty']
                }
            )
            doctors.append(doctor)

        # Créer des rendez-vous de test sur les 7 derniers jours
        today = datetime.now().date()

        appointments_data = [
            # Aujourd'hui - Lundi
            {'doctor': doctors[0], 'date': today, 'time': '09:00', 'status': 'confirmed'},
            {'doctor': doctors[1], 'date': today, 'time': '14:00', 'status': 'completed'},

            # Hier - Dimanche
            {'doctor': doctors[2], 'date': today - timedelta(days=1), 'time': '10:00', 'status': 'confirmed'},

            # 2 jours - Samedi
            {'doctor': doctors[3], 'date': today - timedelta(days=2), 'time': '11:00', 'status': 'confirmed'},
            {'doctor': doctors[0], 'date': today - timedelta(days=2), 'time': '15:00', 'status': 'completed'},

            # 3 jours - Vendredi
            {'doctor': doctors[1], 'date': today - timedelta(days=3), 'time': '08:00', 'status': 'completed'},

            # 4 jours - Jeudi
            {'doctor': doctors[2], 'date': today - timedelta(days=4), 'time': '12:00', 'status': 'confirmed'},
            {'doctor': doctors[3], 'date': today - timedelta(days=4), 'time': '16:00', 'status': 'completed'},

            # 5 jours - Mercredi
            {'doctor': doctors[0], 'date': today - timedelta(days=5), 'time': '13:00', 'status': 'confirmed'},

            # 6 jours - Mardi
            {'doctor': doctors[1], 'date': today - timedelta(days=6), 'time': '09:30', 'status': 'completed'},
        ]

        created_count = 0
        for appt_data in appointments_data:
            # Éviter les doublons
            if not Appointment.objects.filter(
                patient=patient,
                doctor=appt_data['doctor'],
                date=appt_data['date'],
                time=appt_data['time']
            ).exists():
                Appointment.objects.create(
                    patient=patient,
                    doctor=appt_data['doctor'],
                    date=appt_data['date'],
                    time=appt_data['time'],
                    status=appt_data['status']
                )
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(f'Donnees de test creees avec succes!\n'
                             f'   - Patient: {patient.username}\n'
                             f'   - Medecins crees: {len(doctors)}\n'
                             f'   - Rendez-vous crees: {created_count}\n\n'
                             f'Statistiques attendues:\n'
                             f'   - Rendez-vous a venir: 4\n'
                             f'   - Rendez-vous termines: 5\n'
                             f'   - Medecins differents: 4\n\n'
                             f'Connexion test:\n'
                             f'   - Utilisateur: patient_test\n'
                             f'   - Mot de passe: test123')
        )