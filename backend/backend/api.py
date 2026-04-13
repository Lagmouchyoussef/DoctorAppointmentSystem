from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.models import Token

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    first_name = request.data.get('first_name')
    last_name = request.data.get('last_name')
    email = request.data.get('email')
    password = request.data.get('password')
    role = request.data.get('role')  # Assuming role is stored in user profile or something

    if not all([first_name, last_name, email, password]):
        return Response({'error': 'All fields required'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(
        username=email,  # Use email as username
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name
    )

    # Create profile based on role
    from medical.models import Patient, Doctor
    if role == 'patient':
        Patient.objects.create(user=user, date_of_birth='2000-01-01', phone='', address='')  # Default values
    elif role == 'doctor':
        Doctor.objects.create(user=user, specialization='', phone='', address='')

    token, created = Token.objects.get_or_create(user=user)
    return Response({'token': token.key, 'user': {'id': user.id, 'email': user.email, 'first_name': user.first_name, 'last_name': user.last_name}}, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response({'error': 'Email and password required'}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(username=email, password=password)  # Since username is email

    if user is None:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    token, created = Token.objects.get_or_create(user=user)
    return Response({'token': token.key, 'user': {'id': user.id, 'email': user.email, 'first_name': user.first_name, 'last_name': user.last_name}}, status=status.HTTP_200_OK)