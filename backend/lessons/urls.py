from django.urls import path
from .views import LessonListCreateAPIView, LessonDetailAPIView

urlpatterns = [
    # Путь для GET (список) и POST (создание)
    path('lessons/', LessonListCreateAPIView.as_view(), name='lesson_list_create'),
    
    # Путь для DELETE (удаление конкретного урока)
    path('lessons/<int:pk>/', LessonDetailAPIView.as_view(), name='lesson_detail'),
]