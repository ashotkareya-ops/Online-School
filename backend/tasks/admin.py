from django.contrib import admin
from .models import (
    Subject, Exam, Topic,
    Task, TaskAnswerOption, TaskAttachment,
    FavoriteTask,
    HomeworkAssignment, HomeworkTask,
    StudentTaskResult,
)


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'order')
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('order', 'name')


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display  = ('name', 'subject', 'grade', 'slug', 'order')
    list_filter   = ('subject',)
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ('name', 'exam', 'order')
    list_filter  = ('exam__subject', 'exam')


class TaskAnswerOptionInline(admin.TabularInline):
    model = TaskAnswerOption
    extra = 2


class TaskAttachmentInline(admin.TabularInline):
    model = TaskAttachment
    extra = 0


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display  = ('id', 'subject', 'exam', 'topic', 'task_number',
                     'answer_type', 'difficulty', 'status', 'author', 'created_at')
    list_filter   = ('status', 'difficulty', 'answer_type', 'subject', 'exam')
    search_fields = ('text', 'tags')
    raw_id_fields = ('author', 'subject', 'exam', 'topic')
    inlines       = [TaskAnswerOptionInline, TaskAttachmentInline]
    actions       = ['publish_tasks', 'archive_tasks']

    @admin.action(description='Опубликовать выбранные задания')
    def publish_tasks(self, request, queryset):
        queryset.update(status=Task.Status.PUBLISHED)

    @admin.action(description='Архивировать выбранные задания')
    def archive_tasks(self, request, queryset):
        queryset.update(status=Task.Status.ARCHIVED)


class HomeworkTaskInline(admin.TabularInline):
    model = HomeworkTask
    extra = 0


@admin.register(HomeworkAssignment)
class HomeworkAssignmentAdmin(admin.ModelAdmin):
    list_display  = ('title', 'teacher', 'status', 'deadline', 'created_at')
    list_filter   = ('status',)
    search_fields = ('title', 'teacher__email')
    filter_horizontal = ('students',)
    inlines       = [HomeworkTaskInline]


@admin.register(StudentTaskResult)
class StudentTaskResultAdmin(admin.ModelAdmin):
    list_display  = ('student', 'task', 'status', 'attempt', 'submitted_at', 'checked_at')
    list_filter   = ('status',)
    search_fields = ('student__email',)
    raw_id_fields = ('student', 'task', 'homework')


@admin.register(FavoriteTask)
class FavoriteTaskAdmin(admin.ModelAdmin):
    list_display = ('user', 'task', 'created_at')
    raw_id_fields = ('user', 'task')