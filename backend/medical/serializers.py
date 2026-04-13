from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Patient, Doctor, Appointment, MedicalHistory

class PatientSerializer(serializers.ModelSerializer):
    user_first_name = serializers.CharField(source='user.first_name', read_only=True)
    user_last_name = serializers.CharField(source='user.last_name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Patient
        fields = ['id', 'user_first_name', 'user_last_name', 'user_email', 'date_of_birth', 'phone', 'address']

class DoctorSerializer(serializers.ModelSerializer):
    user_first_name = serializers.CharField(source='user.first_name', read_only=True)
    user_last_name = serializers.CharField(source='user.last_name', read_only=True)

    class Meta:
        model = Doctor
        fields = ['id', 'user_first_name', 'user_last_name', 'specialization', 'phone', 'address']

class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = ['id', 'patient_name', 'doctor_name', 'date', 'time', 'status', 'notes']

    def get_patient_name(self, obj):
        return f"{obj.patient.user.first_name} {obj.patient.user.last_name}"

    def get_doctor_name(self, obj):
        return f"Dr. {obj.doctor.user.first_name} {obj.doctor.user.last_name}"

class MedicalHistorySerializer(serializers.ModelSerializer):
    doctor_name = serializers.SerializerMethodField()

    class Meta:
        model = MedicalHistory
        fields = ['id', 'date', 'description', 'doctor_name']

    def get_doctor_name(self, obj):
        if obj.doctor:
            return f"Dr. {obj.doctor.user.first_name} {obj.doctor.user.last_name}"
        return None

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']