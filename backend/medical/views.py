from django.shortcuts import render
from django.db import models
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from .models import Patient, Doctor, Appointment, MedicalHistory
from .serializers import PatientSerializer, DoctorSerializer, AppointmentSerializer, MedicalHistorySerializer, UserSerializer

class PatientViewSet(viewsets.ModelViewSet):
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Patient.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def appointments(self, request):
        patient = self.get_queryset().first()
        if not patient:
            return Response({'error': 'Patient profile not found'}, status=status.HTTP_404_NOT_FOUND)
        appointments = Appointment.objects.filter(patient=patient)
        serializer = AppointmentSerializer(appointments, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def history(self, request):
        patient = self.get_queryset().first()
        if not patient:
            return Response({'error': 'Patient profile not found'}, status=status.HTTP_404_NOT_FOUND)
        history = MedicalHistory.objects.filter(patient=patient)
        serializer = MedicalHistorySerializer(history, many=True)
        return Response(serializer.data)

class DoctorViewSet(viewsets.ModelViewSet):
    serializer_class = DoctorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Doctor.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def appointments(self, request):
        doctor = self.get_queryset().first()
        if not doctor:
            return Response({'error': 'Doctor profile not found'}, status=status.HTTP_404_NOT_FOUND)
        appointments = Appointment.objects.filter(doctor=doctor)
        serializer = AppointmentSerializer(appointments, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def history(self, request):
        doctor = self.get_queryset().first()
        if not doctor:
            return Response({'error': 'Doctor profile not found'}, status=status.HTTP_404_NOT_FOUND)
        history = MedicalHistory.objects.filter(doctor=doctor)
        serializer = MedicalHistorySerializer(history, many=True)
        return Response(serializer.data)

class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'date']
    search_fields = ['notes']
    ordering_fields = ['date', 'time']
    ordering = ['-date']

    def get_queryset(self):
        user = self.request.user
        # Return appointments where user is patient or doctor
        return Appointment.objects.filter(
            models.Q(patient__user=user) | models.Q(doctor__user=user)
        ).distinct()

class MedicalHistoryViewSet(viewsets.ModelViewSet):
    serializer_class = MedicalHistorySerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['date']
    search_fields = ['description']
    ordering_fields = ['date']
    ordering = ['-date']

    def get_queryset(self):
        user = self.request.user
        return MedicalHistory.objects.filter(
            models.Q(patient__user=user) | models.Q(doctor__user=user)
        ).distinct()
