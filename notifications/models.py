from django.db import models
from patients.models import Patient
from doctors.models import Doctor

class Notification(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, null=True, blank=True)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, null=True, blank=True)
    message = models.TextField()
    icon = models.CharField(max_length=50, default='fa-bell')
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.patient or self.doctor}: {self.message[:20]}..."
