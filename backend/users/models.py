from django.contrib.auth.models import AbstractUser
from django.db import models

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
    
    # Эти два поля должны быть здесь
    exam_type = models.CharField(max_length=10, choices=EXAM_CHOICES, blank=True)
    subjects = models.JSONField(default=list, blank=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    def __str__(self):
        return self.email