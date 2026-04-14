from rest_framework import viewsets
from .models import Patient
from .serializers import PatientSerializer

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()  # type: ignore
    serializer_class = PatientSerializer

    def get_queryset(self):
        queryset = Patient.objects.all()  # type: ignore
        email = self.request.query_params.get('email')
        if email:
            queryset = queryset.filter(email=email)
        return queryset
