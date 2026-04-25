from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'username', 'role', 'teacher_code', 'is_staff')
    list_filter = ('role', 'exam_type', 'is_staff', 'is_active')
    search_fields = ('email', 'username', 'teacher_code')
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Доп. информация', {
            'fields': ('role', 'is_profile_filled', 'exam_type', 'subjects', 'teacher_code', 'teacher')
        }),
    )
    
    ordering = ['email']