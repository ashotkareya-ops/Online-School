import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from .models import Task, TaskStep, TaskCategory, TaskSubtype, Subject, ExamType


class SubjectListAPIView(APIView):
    """Предметы учителя по выбранному типу экзамена."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        exam_type_param = request.query_params.get('exam_type', '').lower()
        user_subjects = request.user.subjects  # JSONField из профиля

        # Поддержка старого формата (плоский список) и нового (словарь)
        if isinstance(user_subjects, list):
            subject_names = user_subjects
        else:
            subject_names = user_subjects.get(exam_type_param, [])

        if not subject_names:
            return Response([])

        exam_type_name = 'ОГЭ' if exam_type_param == 'oge' else 'ЕГЭ'
        exam_type_obj, _ = ExamType.objects.get_or_create(name=exam_type_name)

        # Только существующие предметы — не создаём новые здесь
        subjects = Subject.objects.filter(
            name__in=subject_names,
            exam_type=exam_type_obj,
        )

        result = [{'id': s.id, 'name': s.name} for s in subjects]
        return Response(result)


class AvailableSubjectsAPIView(APIView):
    """Какие экзамены и предметы доступны учителю (для переключателя)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        user_subjects = user.subjects
        user_exam_types = user.exam_type  # список: ['oge', 'ege'] или ['oge']

        result = {}
        for exam_key in user_exam_types:
            exam_name = 'ОГЭ' if exam_key == 'oge' else 'ЕГЭ'

            if isinstance(user_subjects, list):
                subject_names = user_subjects
            else:
                subject_names = user_subjects.get(exam_key, [])

            result[exam_key] = subject_names

        return Response(result)


class TaskGroupListAPIView(APIView):
    """Категории и подтипы заданий по предмету."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        subject_id = request.query_params.get('subject_id')
        if not subject_id:
            return Response(
                {"error": "Не передан subject_id"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Проверяем, что этот предмет входит в профиль учителя
        try:
            subject = Subject.objects.get(id=subject_id)
        except Subject.DoesNotExist:
            return Response(
                {"error": "Предмет не найден"},
                status=status.HTTP_404_NOT_FOUND
            )

        if not self._has_subject_access(request.user, subject):
            return Response(
                {"error": "Нет доступа к этому предмету"},
                status=status.HTTP_403_FORBIDDEN
            )

        categories = (
            TaskCategory.objects
            .filter(subject_id=subject_id)
            .prefetch_related('subtypes')
        )

        data = [
            {
                'id': cat.id,
                'name': cat.name,
                'subtypes': [
                    {
                        'id': sub.id,
                        'name': sub.name,
                        'total': sub.tasks.count(),
                    }
                    for sub in cat.subtypes.all()
                ],
            }
            for cat in categories
        ]
        return Response(data)

    def _has_subject_access(self, user, subject):
        """Проверяет, что предмет входит в профиль пользователя."""
        user_subjects = user.subjects
        exam_key = 'oge' if subject.exam_type.name == 'ОГЭ' else 'ege'

        if isinstance(user_subjects, list):
            allowed_names = user_subjects
        else:
            allowed_names = user_subjects.get(exam_key, [])

        return subject.name in allowed_names


class TaskGroupCreateAPIView(APIView):
    """Создание новой категории с подтипами."""
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        subject_id = request.data.get('subject_id')
        name = request.data.get('name', '').strip()
        subtypes_raw = request.data.get('subtypes', [])

        if not subject_id:
            return Response(
                {"error": "Не передан subject_id"},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not name:
            return Response(
                {"error": "Введите название темы"},
                status=status.HTTP_400_BAD_REQUEST
            )

        valid_subtypes = [s for s in subtypes_raw if s.get('name', '').strip()]
        if not valid_subtypes:
            return Response(
                {"error": "Добавьте хотя бы один подтип"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Проверяем доступ к предмету
        try:
            subject = Subject.objects.get(id=subject_id)
        except Subject.DoesNotExist:
            return Response(
                {"error": "Предмет не найден"},
                status=status.HTTP_404_NOT_FOUND
            )

        if not self._has_subject_access(request.user, subject):
            return Response(
                {"error": "Нет доступа к этому предмету"},
                status=status.HTTP_403_FORBIDDEN
            )

        category = TaskCategory.objects.create(subject_id=subject_id, name=name)
        subtypes = [
            TaskSubtype.objects.create(category=category, name=s['name'].strip())
            for s in valid_subtypes
        ]

        return Response({
            'id': category.id,
            'name': category.name,
            'subtypes': [
                {'id': s.id, 'name': s.name, 'total': 0}
                for s in subtypes
            ],
        }, status=status.HTTP_201_CREATED)

    def _has_subject_access(self, user, subject):
        user_subjects = user.subjects
        exam_key = 'oge' if subject.exam_type.name == 'ОГЭ' else 'ege'
        if isinstance(user_subjects, list):
            allowed_names = user_subjects
        else:
            allowed_names = user_subjects.get(exam_key, [])
        return subject.name in allowed_names


class TaskCreateAPIView(APIView):
    """Создание задания учителем."""
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        data = request.data
        files = request.FILES

        subtype_id = data.get('subtype_id')
        if not subtype_id:
            return Response(
                {"error": "Не указан подтип задания (subtype_id)"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Проверяем, что подтип принадлежит предмету учителя
        try:
            subtype = TaskSubtype.objects.select_related(
                'category__subject__exam_type'
            ).get(id=subtype_id)
        except TaskSubtype.DoesNotExist:
            return Response(
                {"error": "Подтип задания не найден"},
                status=status.HTTP_404_NOT_FOUND
            )

        subject = subtype.category.subject
        if not self._has_subject_access(request.user, subject):
            return Response(
                {"error": "Нет доступа к этому предмету"},
                status=status.HTTP_403_FORBIDDEN
            )

        text = data.get('text', '').strip()
        answer = data.get('answer', '').strip()
        diff = int(data.get('diff', 1))
        year = int(data.get('year', 2025))
        task_image = files.get('task_image', None)

        if not answer:
            return Response(
                {"error": "Укажите ответ к заданию"},
                status=status.HTTP_400_BAD_REQUEST
            )

        task = Task.objects.create(
            subtype_id=subtype_id,
            author=request.user,
            text=text,
            answer=answer,
            diff=diff,
            year=year,
            task_image=task_image,
        )

        steps_raw = data.get('steps', '[]')
        try:
            steps_list = json.loads(steps_raw)
        except (json.JSONDecodeError, TypeError):
            return Response(
                {"error": "Неверный формат шагов"},
                status=status.HTTP_400_BAD_REQUEST
            )

        for index, step_info in enumerate(steps_list):
            step_text = step_info.get('text', '').strip()
            image_index = step_info.get('imageIndex', None)
            step_image_file = files.get(f'step_image_{image_index}') if image_index is not None else None

            TaskStep.objects.create(
                task=task,
                step_number=index + 1,
                text=step_text,
                image=step_image_file,
            )

        return Response(self._serialize_task(task, request.user), status=status.HTTP_201_CREATED)

    def _has_subject_access(self, user, subject):
        user_subjects = user.subjects
        exam_key = 'oge' if subject.exam_type.name == 'ОГЭ' else 'ege'
        if isinstance(user_subjects, list):
            allowed_names = user_subjects
        else:
            allowed_names = user_subjects.get(exam_key, [])
        return subject.name in allowed_names

    def _serialize_task(self, task, user):
        return {
            'id': task.id,
            'text': task.text,
            'taskImage': task.task_image.url if task.task_image else None,
            'answer': task.answer,
            'diff': task.diff,
            'year': task.year,
            'pop': task.popularity,
            'isMine': True,
            'steps': [
                {
                    'text': step.text,
                    'image': step.image.url if step.image else None,
                }
                for step in task.steps.all()
            ],
        }


class TaskListAPIView(APIView):
    """Список заданий по подтипу."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        subtype_id = request.query_params.get('subtype_id')
        sort = request.query_params.get('sort', 'default')

        if not subtype_id:
            return Response(
                {"error": "Не передан subtype_id"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Проверяем доступ к предмету через подтип
        try:
            subtype = TaskSubtype.objects.select_related(
                'category__subject__exam_type'
            ).get(id=subtype_id)
        except TaskSubtype.DoesNotExist:
            return Response(
                {"error": "Подтип не найден"},
                status=status.HTTP_404_NOT_FOUND
            )

        subject = subtype.category.subject
        if not self._has_subject_access(request.user, subject):
            return Response(
                {"error": "Нет доступа к этому предмету"},
                status=status.HTTP_403_FORBIDDEN
            )

        qs = Task.objects.filter(subtype_id=subtype_id).prefetch_related('steps')

        sort_map = {
            'easy': 'diff',
            'hard': '-diff',
            'new': '-created_at',
            'old': 'created_at',
        }
        if sort in sort_map:
            qs = qs.order_by(sort_map[sort])
        elif sort == 'mine':
            qs = qs.filter(author=request.user)

        data = [
            {
                'id': task.id,
                'text': task.text,
                'taskImage': task.task_image.url if task.task_image else None,
                'answer': task.answer,
                'diff': task.diff,
                'year': task.year,
                'pop': task.popularity,
                'isMine': task.author == request.user,
                'steps': [
                    {
                        'text': step.text,
                        'image': step.image.url if step.image else None,
                    }
                    for step in task.steps.all()
                ],
            }
            for task in qs
        ]
        return Response(data)

    def _has_subject_access(self, user, subject):
        user_subjects = user.subjects
        exam_key = 'oge' if subject.exam_type.name == 'ОГЭ' else 'ege'
        if isinstance(user_subjects, list):
            allowed_names = user_subjects
        else:
            allowed_names = user_subjects.get(exam_key, [])
        return subject.name in allowed_names