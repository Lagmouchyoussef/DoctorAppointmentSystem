from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Patient
from .serializers import PatientSerializer

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all().order_by('id')  # type: ignore
    serializer_class = PatientSerializer

    def __init__(self, *args, **kwargs):
        print("DEBUG: PatientViewSet initialized")
        super().__init__(*args, **kwargs)

    def get_queryset(self):
        queryset = Patient.objects.all()  # type: ignore
        email = self.request.query_params.get('email')
        if email:
            queryset = queryset.filter(email=email)
        return queryset

    def create(self, request, *args, **kwargs):
        print("DEBUG: create method called")
        password = request.data.get('password')
        print(f"DEBUG: password = {password}")
        if password:
            # Remove password from data before serialization
            data = request.data.copy()
            data.pop('password', None)
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            instance = serializer.save()
            instance.set_password(password)
            instance.save()
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        else:
            return super().create(request, *args, **kwargs)

    @action(detail=False, methods=['post'])
    def login(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        try:
            patient = Patient.objects.get(email=email)
            if patient.check_password(password):
                serializer = self.get_serializer(patient)
                return Response(serializer.data)
            else:
                return Response({'detail': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)
        except Patient.DoesNotExist:
            return Response({'detail': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)
