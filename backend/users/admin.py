from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'username', 'role', 'exam_type', 'is_staff', 'is_active')
    list_filter = ('role', 'exam_type', 'is_staff', 'is_active')
    search_fields = ('email', 'username')
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Доп. информация', {
            'fields': ('role', 'is_profile_filled', 'exam_type', 'subjects')
        }),
    )
    
    ordering = ['email']