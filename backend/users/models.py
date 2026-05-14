from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid

def generate_teacher_code():
    return uuid.uuid4().hex[:8].upper()

class User(AbstractUser):
    ROLE_CHOICES = [
        ('student', 'Ученик'),
        ('teacher', 'Учитель'),
        ('admin', 'Администратор'),
    ]

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    is_profile_filled = models.BooleanField(default=False)
    exam_type = models.JSONField(default=list, blank=True)
    subjects = models.JSONField(default=list, blank=True)

    # Подтверждение аккаунта — только для учителей
    # Студентам автоматически ставится True при save()
    is_approved = models.BooleanField(
        default=False,
        verbose_name='Аккаунт подтверждён',
        help_text='Для учителей: пока не подтверждён администратором — не может войти.'
    )

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
        # Студентам подтверждение не нужно
        if self.role == 'student':
            self.is_approved = True

        # Генерируем код учителя
        if self.role == 'teacher' and not self.teacher_code:
            code = generate_teacher_code()
            while User.objects.filter(teacher_code=code).exists():
                code = generate_teacher_code()
            self.teacher_code = code

        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.email} ({self.get_role_display()})'