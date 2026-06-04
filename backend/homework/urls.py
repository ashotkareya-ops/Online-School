from django.urls import path
from .views import HomeworkListView, HomeworkDetailView

urlpatterns = [
    path('',        HomeworkListView.as_view(),   name='homework_list'),
    path('<int:pk>/', HomeworkDetailView.as_view(), name='homework_detail'),
]