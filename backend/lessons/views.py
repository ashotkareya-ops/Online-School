from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils.dateparse import parse_datetime
from django.utils import timezone
from .models import Lesson

class LessonListCreateAPIView(APIView):
    """Получение расписания за месяц (GET) и создание нового занятия (POST)"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Отдаем только уроки текущего преподавателя
        qs = Lesson.objects.filter(teacher=request.user)

        # Фильтруем по датам, если фронтенд их передал (from и to)
        from_date = request.query_params.get('from')
        to_date = request.query_params.get('to')

        if from_date:
            qs = qs.filter(starts_at__gte=parse_datetime(from_date))
        if to_date:
            qs = qs.filter(starts_at__lte=parse_datetime(to_date))

        # Форматируем данные как в твоем TaskListAPIView
        data = [
            {
                'id': lesson.id,
                'title': lesson.title,
                'lesson_type': lesson.lesson_type,
                'starts_at': lesson.starts_at.isoformat(),
                'color': lesson.color,
            }
            for lesson in qs
        ]
        return Response(data)

    def post(self, request):
        data = request.data
        
        title = data.get('title', '').strip()
        lesson_type = data.get('lesson_type', 'individual')
        starts_at_raw = data.get('starts_at')

        if not title:
            return Response({"error": "Укажите ученика или название"}, status=status.HTTP_400_BAD_REQUEST)
        if not starts_at_raw:
            return Response({"error": "Укажите время занятия"}, status=status.HTTP_400_BAD_REQUEST)

        starts_at = parse_datetime(starts_at_raw)
        if not starts_at:
            return Response({"error": "Неверный формат даты"}, status=status.HTTP_400_BAD_REQUEST)

        # Простая логика цветов: индивидуальные - розовые, остальные - голубые
        color = '#f472b6' if lesson_type == 'individual' else '#60a5fa'

        lesson = Lesson.objects.create(
            teacher=request.user,
            title=title,
            lesson_type=lesson_type,
            starts_at=starts_at,
            color=color
        )

        return Response({
            'id': lesson.id,
            'title': lesson.title,
            'lesson_type': lesson.lesson_type,
            'starts_at': lesson.starts_at.isoformat(),
            'color': lesson.color,
        }, status=status.HTTP_201_CREATED)


class LessonDetailAPIView(APIView):
    """Удаление занятия с проверкой правила 24 часов (DELETE)"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            # Ищем занятие, проверяя, что оно принадлежит именно этому пользователю
            lesson = Lesson.objects.get(pk=pk, teacher=request.user)
        except Lesson.DoesNotExist:
            return Response({"error": "Занятие не найдено"}, status=status.HTTP_404_NOT_FOUND)

        # === ПРОВЕРКА 24 ЧАСОВ ===
        now = timezone.now()
        time_difference = lesson.starts_at - now
        
        # Переводим разницу в секунды. 24 часа = 86400 секунд
        if time_difference.total_seconds() < (24 * 3600):
            return Response(
                {"error": "Нельзя отменить занятие менее чем за 24 часа до его начала."},
                status=status.HTTP_400_BAD_REQUEST
            )

        lesson.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)