import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from .models import Task, TaskStep, TaskCategory, TaskSubtype, Subject, ExamType


class SubjectListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        exam_type_param = request.query_params.get('exam_type', '').lower()
        exam_name = 'ОГЭ' if exam_type_param == 'oge' else 'ЕГЭ'

        # Берём напрямую из БД через subject_links — никакой магии со строками
        subjects = request.user.subject_links.filter(
            exam_type__name=exam_name
        ).select_related('exam_type')

        return Response([{'id': s.id, 'name': s.name} for s in subjects])

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
        return user.subject_links.filter(id=subject.id).exists()


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
     return user.subject_links.filter(id=subject.id).exists()

class TaskCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        from .storage import upload_file_to_s3

        data = request.data
        files = request.FILES

        subtype_id = data.get('subtype_id')
        if not subtype_id:
            return Response(
                {"error": "Не указан подтип задания (subtype_id)"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Проверяем существование подтипа и права доступа
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

        answer = data.get('answer', '').strip()
        if not answer:
            return Response(
                {"error": "Укажите ответ к заданию"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Загружаем картинку условия в S3 (если есть)
        task_image_url = None
        if 'task_image' in files:
            try:
                task_image_url = upload_file_to_s3(files['task_image'], folder='tasks/conditions')
            except RuntimeError as e:
                return Response({"error": str(e)}, status=status.HTTP_502_BAD_GATEWAY)

        task = Task.objects.create(
            subtype_id=subtype_id,
            author=request.user,
            text=data.get('text', '').strip(),
            answer=answer,
            diff=int(data.get('diff', 1)),
            year=int(data.get('year', 2025)),
            task_image_url=task_image_url,
        )

        # Шаги решения
        steps_raw = data.get('steps', '[]')
        try:
            steps_list = json.loads(steps_raw)
        except (json.JSONDecodeError, TypeError):
            return Response(
                {"error": "Неверный формат шагов"},
                status=status.HTTP_400_BAD_REQUEST
            )

        for index, step_info in enumerate(steps_list):
            step_image_url = None
            image_index = step_info.get('imageIndex')

            if image_index is not None:
                step_file = files.get(f'step_image_{image_index}')
                if step_file:
                    try:
                        step_image_url = upload_file_to_s3(step_file, folder='tasks/steps')
                    except RuntimeError as e:
                        return Response({"error": str(e)}, status=status.HTTP_502_BAD_GATEWAY)

            TaskStep.objects.create(
                task=task,
                step_number=index + 1,
                text=step_info.get('text', '').strip(),
                image_url=step_image_url,
            )

        return Response(self._serialize_task(task), status=status.HTTP_201_CREATED)

    def _serialize_task(self, task):
        return {
            'id': task.id,
            'text': task.text,
            'taskImage': task.task_image_url,  # теперь URL
            'answer': task.answer,
            'diff': task.diff,
            'year': task.year,
            'pop': task.popularity,
            'isMine': True,
            'steps': [
                {
                    'text': step.text,
                    'image': step.image_url,  # теперь URL
                }
                for step in task.steps.all()
            ],
        }

    def _has_subject_access(self, user, subject):
        return user.subject_links.filter(id=subject.id).exists()
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
                'taskImage': task.task_image_url,
                'answer': task.answer,
                'diff': task.diff,
                'year': task.year,
                'pop': task.popularity,
                'isMine': task.author == request.user,
                'steps': [
                    {
                        'text': step.text,
                        'image': step.image_url,
                    }
                    for step in task.steps.all()
                ],
            }
            for task in qs
        ]
        return Response(data)

    def _has_subject_access(self, user, subject):
        return user.subject_links.filter(id=subject.id).exists()