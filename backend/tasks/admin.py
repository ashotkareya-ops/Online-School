from django.contrib import admin
from .models import Task, TaskStep, ExamType, Subject, TaskCategory, TaskSubtype

@admin.register(ExamType)
class ExamTypeAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'exam_type')

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('id', 'author', 'year', 'diff', 'created_at')

@admin.register(TaskStep)
class TaskStepAdmin(admin.ModelAdmin):
    list_display = ('task', 'step_number', 'text')

@admin.register(TaskCategory)
class TaskCategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'subject')

@admin.register(TaskSubtype)
class TaskSubtypeAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category')