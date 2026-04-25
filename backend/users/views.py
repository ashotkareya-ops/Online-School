from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from .serializers import UserSerializer, SetupProfileSerializer
from .models import User
import re

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_me(request):
    return Response(UserSerializer(request.user).data)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def setup_profile(request):
    serializer = SetupProfileSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        user = serializer.save()
        return Response(UserSerializer(user).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    email = request.data.get('email', '').strip().lower()
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')
    role = request.data.get('role', 'student')
    teacher_code = request.data.get('teacher_code', '').strip().upper()

    # Валидация email
    try:
        validate_email(email)
    except ValidationError:
        return Response({'email': ['Введите корректный email']}, status=400)

    # Валидация username — только буквы, цифры, _
    if not re.match(r'^[\w]{3,30}$', username):
        return Response({'username': ['Имя пользователя: 3-30 символов, только буквы и цифры']}, status=400)

    # Валидация пароля
    if len(password) < 8:
        return Response({'password': ['Пароль должен быть не менее 8 символов']}, status=400)

    # Валидация роли
    if role not in ['student', 'teacher']:
        return Response({'role': ['Недопустимая роль']}, status=400)

    if not email or not password or not username:
        return Response({'error': 'Заполните все поля'}, status=400)

    if User.objects.filter(email=email).exists():
        return Response({'email': ['Пользователь с таким email уже существует']}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({'username': ['Это имя пользователя уже занято']}, status=400)

    # Если ученик — проверяем код учителя
    teacher = None
    if role == 'student':
        if not teacher_code:
            return Response({'teacher_code': ['Введите код учителя']}, status=400)
        try:
            teacher = User.objects.get(teacher_code=teacher_code, role='teacher')
        except User.DoesNotExist:
            return Response({'teacher_code': ['Неверный код учителя']}, status=400)

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        role=role,
        teacher=teacher
    )
    return Response(UserSerializer(user).data, status=201)