from rest_framework import viewsets
from .models import Doctor
from .serializers import DoctorSerializer

class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all()  # type: ignore
    serializer_class = DoctorSerializer

    def get_queryset(self):
        queryset = Doctor.objects.all()  # type: ignore
        email = self.request.query_params.get('email')
        if email:
            queryset = queryset.filter(email=email)
        return queryset
