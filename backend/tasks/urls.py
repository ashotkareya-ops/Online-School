from django.urls import path
from .views import (TaskCreateAPIView, TaskGroupListAPIView, TaskGroupCreateAPIView,
                    TaskListAPIView, SubjectListAPIView, AvailableSubjectsAPIView, GenerateTrainerAPIView)

urlpatterns = [
    path('',                   TaskCreateAPIView.as_view(),        name='task_create'),
    path('list/',              TaskListAPIView.as_view(),           name='task_list'),
    path('groups/',            TaskGroupListAPIView.as_view(),      name='task_groups'),
    path('groups/create/',     TaskGroupCreateAPIView.as_view(),    name='task_group_create'),
    path('subjects/',          SubjectListAPIView.as_view(),        name='subject_list'),
    path('subjects/available/',AvailableSubjectsAPIView.as_view(),  name='available_subjects'),
    path('generate/', GenerateTrainerAPIView.as_view(), name='trainer_generate'), 
]

