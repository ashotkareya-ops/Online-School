from django.db import models
from django.conf import settings

class Lesson(models.Model):
    LESSON_TYPE_CHOICES = (
        ('individual', 'Индивидуальное'),
        ('group', 'Групповое'),
        ('sparring', 'Спарринг'),
        ('trial', 'Пробное'),
    )

    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=200)
    lesson_type = models.CharField(max_length=20, choices=LESSON_TYPE_CHOICES, default='individual')
    
    # Время начала занятия
    starts_at = models.DateTimeField()
    
    # Сохраняем цвет для фронтенда (как в твоем примере)
    color = models.CharField(max_length=20, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.starts_at.strftime('%d.%m.%Y %H:%M')})"