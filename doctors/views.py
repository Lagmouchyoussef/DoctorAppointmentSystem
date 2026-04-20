from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Doctor, Availability
from .serializers import DoctorSerializer, AvailabilitySerializer

class AvailabilityViewSet(viewsets.ModelViewSet):
    queryset = Availability.objects.all().order_by('id')
    serializer_class = AvailabilitySerializer

    def get_queryset(self):
        doctor_id = self.request.query_params.get('doctor')
        if doctor_id:
            return self.queryset.filter(doctor_id=doctor_id)
        return self.queryset

class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all().order_by('id')  # type: ignore
    serializer_class = DoctorSerializer

    def get_queryset(self):
        queryset = Doctor.objects.all()  # type: ignore
        email = self.request.query_params.get('email')
        if email:
            queryset = queryset.filter(email=email)
        return queryset

    @action(detail=False, methods=['post'])
    def login(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        try:
            doctor = Doctor.objects.get(email=email)
            if doctor.check_password(password):
                serializer = self.get_serializer(doctor)
                return Response(serializer.data)
            else:
                return Response({'detail': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)
        except Doctor.DoesNotExist:
            return Response({'detail': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)
