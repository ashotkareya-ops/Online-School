from django.db import models
from django.conf import settings
from tasks.models import Subject


class Homework(models.Model):
    STATUS_CHOICES = [
        ('todo',   'К выполнению'),
        ('review', 'На проверке'),
        ('done',   'Выполнено'),
    ]

    title      = models.CharField(max_length=300)
    subject    = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='homeworks')
    teacher    = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='assigned_homeworks'
    )
    # Конкретному ученику или всему классу (всем студентам учителя)
    student    = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='homeworks',
        null=True, blank=True
    )
    due_date   = models.DateField(null=True, blank=True)
    status     = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    comment    = models.TextField(blank=True)          # комментарий учителя
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} → {self.student or "все"}'