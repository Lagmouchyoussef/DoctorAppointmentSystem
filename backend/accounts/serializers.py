from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, Appointment

class ProfileSerializer(serializers.ModelSerializer):
    """Serializer pour le profil utilisateur"""
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Profile
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone', 'address', 'role', 'specialty', 'rpps_number', 'avatar'
        ]
        read_only_fields = ['id', 'username']

    def update(self, instance, validated_data):
        # Mettre à jour l'utilisateur
        user_data = validated_data.pop('user', {})
        user = instance.user

        for attr, value in user_data.items():
            setattr(user, attr, value)
        user.save()

        # Mettre à jour le profil
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        return instance

class UserSerializer(serializers.ModelSerializer):
    """Serializer pour l'utilisateur de base"""
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']

class AppointmentSerializer(serializers.ModelSerializer):
    """Serializer pour les rendez-vous"""
    patient_name = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()
    doctor_specialty = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            'id', 'patient', 'patient_name', 'doctor', 'doctor_name',
            'doctor_specialty', 'date', 'time', 'status', 'reason', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}"

    def get_doctor_name(self, obj):
        return f"{obj.doctor.first_name} {obj.doctor.last_name}"

    def get_doctor_specialty(self, obj):
        return obj.doctor.profile.specialty if hasattr(obj.doctor, 'profile') else None

class DoctorSerializer(serializers.ModelSerializer):
    """Serializer pour les médecins"""
    full_name = serializers.SerializerMethodField()
    specialty = serializers.CharField(source='profile.specialty', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'email', 'specialty']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

# Serializer pour les statistiques du dashboard
class DashboardStatsSerializer(serializers.Serializer):
    """Serializer pour les statistiques du tableau de bord"""
    upcoming = serializers.IntegerField()
    completed = serializers.IntegerField()
    prescriptions = serializers.IntegerField()
    doctors = serializers.IntegerField()
    trend_data = serializers.ListField(child=serializers.IntegerField())
    specialties_data = serializers.DictField()
    weekly_data = serializers.DictField()