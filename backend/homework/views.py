from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Homework
from .serializers import HomeworkSerializer, HomeworkCreateSerializer, HomeworkStatusSerializer


class HomeworkListView(APIView):
    """
    GET  /api/homework/        — список ДЗ для текущего пользователя
    POST /api/homework/        — создать ДЗ (только учитель)

    Параметры GET:
        ?subject=<id>          — фильтр по предмету
        ?status=todo|review|done
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.role == 'student':
            # Ученик видит ДЗ назначенные ему
            qs = Homework.objects.filter(student=user)
        elif user.role == 'teacher':
            # Учитель видит все ДЗ которые он создал
            qs = Homework.objects.filter(teacher=user)
        else:
            return Response([])

        # Фильтры
        subject_id = request.query_params.get('subject')
        if subject_id:
            qs = qs.filter(subject_id=subject_id)

        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        qs = qs.select_related('subject__exam_type', 'teacher', 'student')
        return Response(HomeworkSerializer(qs, many=True).data)

    def post(self, request):
        if request.user.role != 'teacher':
            return Response(
                {'detail': 'Только учитель может создавать задания.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = HomeworkCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            hw = serializer.save()
            return Response(HomeworkSerializer(hw).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class HomeworkDetailView(APIView):
    """
    PATCH /api/homework/<id>/  — обновить статус (ученик) или комментарий (учитель)
    DELETE /api/homework/<id>/ — удалить (только учитель)
    """
    permission_classes = [IsAuthenticated]

    def _get_hw(self, pk, user):
        try:
            hw = Homework.objects.select_related('subject__exam_type', 'teacher', 'student').get(pk=pk)
        except Homework.DoesNotExist:
            return None, Response({'detail': 'Не найдено.'}, status=status.HTTP_404_NOT_FOUND)

        # Ученик может менять только своё ДЗ
        if user.role == 'student' and hw.student_id != user.id:
            return None, Response({'detail': 'Нет доступа.'}, status=status.HTTP_403_FORBIDDEN)

        # Учитель может менять только своё ДЗ
        if user.role == 'teacher' and hw.teacher_id != user.id:
            return None, Response({'detail': 'Нет доступа.'}, status=status.HTTP_403_FORBIDDEN)

        return hw, None

    def patch(self, request, pk):
        hw, err = self._get_hw(pk, request.user)
        if err:
            return err

        if request.user.role == 'student':
            # Ученик меняет только статус
            serializer = HomeworkStatusSerializer(hw, data=request.data, partial=True)
        else:
            # Учитель может менять title, due_date, comment
            serializer = HomeworkCreateSerializer(
                hw, data=request.data, partial=True, context={'request': request}
            )

        if serializer.is_valid():
            hw = serializer.save()
            return Response(HomeworkSerializer(hw).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if request.user.role != 'teacher':
            return Response({'detail': 'Нет доступа.'}, status=status.HTTP_403_FORBIDDEN)

        hw, err = self._get_hw(pk, request.user)
        if err:
            return err

        hw.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)