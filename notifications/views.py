from rest_framework import viewsets
from .models import Notification
from .serializers import NotificationSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all().order_by('-created_at')
    serializer_class = NotificationSerializer

    def get_queryset(self):
        patient_id = self.request.query_params.get('patient')
        doctor_id = self.request.query_params.get('doctor')
        
        if patient_id:
            return self.queryset.filter(patient_id=patient_id)
        if doctor_id:
            return self.queryset.filter(doctor_id=doctor_id)
        return self.queryset
