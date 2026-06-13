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
from django.db import models  # <- Добавьте этот импорт, чтобы исправить ошибку "models" не определено
from django.db.models import Q

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
    if request.user.role == 'teacher' and not request.user.is_approved:
        return Response(
            {'detail': 'Аккаунт ещё не подтверждён.'},
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = SetupProfileSerializer(request.user, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = serializer.save()

    from tasks.models import Subject, ExamType

    exam_types = user.exam_type if isinstance(user.exam_type, list) else [user.exam_type]

    # subjects ВСЕГДА словарь { "oge": [...], "ege": [...] } — гарантировано сериализатором
    subjects_data = user.subjects

    if not isinstance(subjects_data, dict):
        return Response(
            {'subjects': 'Ожидается объект вида {"oge": [...], "ege": [...]}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    subject_ids = []

    for exam_key in exam_types:
        exam_name = 'ОГЭ' if exam_key == 'oge' else 'ЕГЭ'
        exam_obj, _ = ExamType.objects.get_or_create(name=exam_name)

        # Берём только предметы для конкретного типа экзамена
        names = subjects_data.get(exam_key, [])

        for name in names:
            name = name.strip()
            if not name:
                continue
            subject_obj, _ = Subject.objects.get_or_create(
                name=name,
                exam_type=exam_obj
            )
            subject_ids.append(subject_obj.id)

    # Привязываем Subject-объекты к пользователю (заменяем полностью)
    user.subject_links.set(subject_ids)

    return Response(UserSerializer(user).data)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    email = request.data.get('email', '').strip().lower()
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')
    role = request.data.get('role', 'student')
    teacher_code = request.data.get('teacher_code', '').strip().upper()

    try:
        validate_email(email)
    except ValidationError:
        return Response({'email': ['Введите корректный email']}, status=400)

    if not re.match(r'^[\w]{3,30}$', username):
        return Response(
            {'username': ['Имя пользователя: 3-30 символов, только буквы и цифры']},
            status=400
        )

    if len(password) < 8:
        return Response({'password': ['Пароль должен быть не менее 8 символов']}, status=400)

    if role not in ['student', 'teacher']:
        return Response({'role': ['Недопустимая роль']}, status=400)

    if not email or not password or not username:
        return Response({'error': 'Заполните все поля'}, status=400)

    if User.objects.filter(email=email).exists():
        return Response(
            {'email': ['Пользователь с таким email уже существует']},
            status=400
        )

    if User.objects.filter(username=username).exists():
        return Response({'username': ['Это имя пользователя уже занято']}, status=400)

    teacher = None
    if role == 'student':
        if not teacher_code:
            return Response({'teacher_code': ['Введите код учителя']}, status=400)
        try:
            teacher = User.objects.get(
                teacher_code=teacher_code,
                role='teacher',
                is_approved=True
            )
        except User.DoesNotExist:
            return Response(
                {'teacher_code': ['Неверный код учителя или учитель ещё не подтверждён']},
                status=400
            )

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        role=role,
        teacher=teacher
    )

    response_data = UserSerializer(user).data
    if role == 'teacher':
        response_data['pending_approval'] = True

    return Response(response_data, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def teacher_students(request):
    if request.user.role != 'teacher':
        return Response({'detail': 'Только для учителей.'}, status=status.HTTP_403_FORBIDDEN)

    from tasks.models import Subject, ExamType

    exam_type_param = request.query_params.get('exam_type', '').strip().lower()
    subject_param   = request.query_params.get('subject', '').strip()

    students = request.user.students.filter(role='student')

    if exam_type_param:
        exam_name = 'ОГЭ' if exam_type_param == 'oge' else 'ЕГЭ'

        # Фильтруем через subject_links → exam_type, так же как SubjectListAPIView
        students = students.filter(
            subject_links__exam_type__name=exam_name
        )

        if subject_param:
            students = students.filter(
                subject_links__name=subject_param,
                subject_links__exam_type__name=exam_name
            )

    students = students.distinct().order_by('last_name', 'first_name')

    data = UserSerializer(students, many=True).data
    return Response(data)

# ── GET /api/teacher/homeworks/ ──────────────────────────────────────────────
# Возвращает все домашние задания учеников текущего учителя
# Формат: [{id, title, subject, status, deadline, auto_check, grade, student_id}]
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def teacher_homeworks(request):
    if request.user.role != 'teacher':
        return Response({'detail': 'Только для учителей.'}, status=status.HTTP_403_FORBIDDEN)

    # Получаем id всех учеников этого учителя
    student_ids = request.user.students.filter(role='student').values_list('id', flat=True)

    # Импортируем модель домашних заданий
    # Замените 'tasks.Homework' на реальный путь к вашей модели
    try:
        from tasks.models import Homework  # ← поправьте импорт под свою структуру
    except ImportError:
        return Response(
            {'detail': 'Модель Homework не найдена. Поправьте импорт в teacher_views.py'},
            status=status.HTTP_501_NOT_IMPLEMENTED
        )

    homeworks = Homework.objects.filter(
        student_id__in=student_ids
    ).select_related('subject').order_by('-created_at')

    data = [
        {
            'id':         hw.id,
            'title':      hw.title,
            # subject — строка с названием (ForeignKey или CharField)
            'subject':    hw.subject.name if hasattr(hw.subject, 'name') else str(hw.subject),
            'status':     hw.status,       # 'todo' | 'review' | 'checked'
            'deadline':   hw.deadline.isoformat() if hw.deadline else None,
            'auto_check': hw.auto_check if hasattr(hw, 'auto_check') else False,
            'grade':      hw.grade if hasattr(hw, 'grade') else None,
            'student_id': hw.student_id,
        }
        for hw in homeworks
    ]

    return Response(data)

