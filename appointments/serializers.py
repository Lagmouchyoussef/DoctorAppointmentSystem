from rest_framework import serializers
from .models import Appointment

class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.ReadOnlyField(source='patient.__str__')
    doctor_name = serializers.ReadOnlyField(source='doctor.__str__')

    class Meta:
        model = Appointment
        fields = ['id', 'patient', 'doctor', 'patient_name', 'doctor_name', 'appointment_date', 'reason', 'status', 'notes', 'created_at']