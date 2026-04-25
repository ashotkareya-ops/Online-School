from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid

def generate_teacher_code():
    return uuid.uuid4().hex[:8].upper()  # Например: A3F9B2C1

class User(AbstractUser):
    ROLE_CHOICES = [
        ('student', 'Ученик'),
        ('teacher', 'Учитель'),
        ('admin', 'Администратор'),
    ]
    
    EXAM_CHOICES = [
        ('oge', 'ОГЭ'),
        ('ege', 'ЕГЭ'),
    ]

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    is_profile_filled = models.BooleanField(default=False)
    exam_type = models.CharField(max_length=10, choices=EXAM_CHOICES, blank=True)
    subjects = models.JSONField(default=list, blank=True)
    
    # Поля для системы учитель-ученик
    teacher_code = models.CharField(max_length=10, unique=True, blank=True, null=True)
    teacher = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='students'
    )
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    def save(self, *args, **kwargs):
        # Автоматически генерируем код только для учителей
        if self.role == 'teacher' and not self.teacher_code:
            code = generate_teacher_code()
            # На случай если такой код уже есть
            while User.objects.filter(teacher_code=code).exists():
                code = generate_teacher_code()
            self.teacher_code = code
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.email