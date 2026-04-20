from rest_framework import serializers
from .models import Doctor, Availability

class AvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Availability
        fields = '__all__'

class DoctorSerializer(serializers.ModelSerializer):
    availabilities = AvailabilitySerializer(many=True, read_only=True)
    
    class Meta:
        model = Doctor
        fields = ['id', 'first_name', 'last_name', 'email', 'specialization', 'phone', 'bio', 'availabilities', 'created_at']