from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'username', 'role', 'approval_status', 'is_profile_filled', 'teacher_code', 'is_staff')
    list_filter = ('role', 'is_approved', 'is_profile_filled', 'is_staff', 'is_active')
    search_fields = ('email', 'username', 'teacher_code')
    actions = ['approve_teachers', 'revoke_approval']

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Доп. информация', {
            'fields': ('role', 'is_approved', 'is_profile_filled', 'exam_type', 'subjects', 'teacher_code', 'teacher')
        }),
    )

    ordering = ['email']

    @admin.display(description='Статус')
    def approval_status(self, obj):
        if obj.role != 'teacher':
            return '—'
        if obj.is_approved:
            return format_html('<span style="color:green;font-weight:bold">{}</span>', '✔ Подтверждён')
        return format_html('<span style="color:red;font-weight:bold">{}</span>', '⏳ Ожидает')

    @admin.action(description='✔ Подтвердить выбранных учителей')
    def approve_teachers(self, request, queryset):
        count = queryset.filter(role='teacher').update(is_approved=True)
        self.message_user(request, f'Подтверждено учителей: {count}')

    @admin.action(description='✖ Отозвать подтверждение')
    def revoke_approval(self, request, queryset):
        count = queryset.filter(role='teacher').update(is_approved=False)
        self.message_user(request, f'Подтверждение отозвано у {count} учителей')