from django.db import models
from django.conf import settings


class ExamType(models.Model):
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name


class Subject(models.Model):
    exam_type = models.ForeignKey(ExamType, on_delete=models.CASCADE, related_name='subjects')
    name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.name} ({self.exam_type.name})"


class TaskCategory(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=200)

    def __str__(self):
        return self.name


class TaskSubtype(models.Model):
    category = models.ForeignKey(TaskCategory, on_delete=models.CASCADE, related_name='subtypes')
    name = models.CharField(max_length=200)

    def __str__(self):
        return self.name


class Task(models.Model):
    subtype = models.ForeignKey(
        TaskSubtype, on_delete=models.CASCADE,
        related_name='tasks', null=True, blank=True
    )
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField(blank=True, null=True)

    # Вместо ImageField — URL из S3
    task_image_url = models.URLField(max_length=500, blank=True, null=True)

    answer = models.TextField()
    diff = models.IntegerField(default=1)
    year = models.IntegerField()
    popularity = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.text[:50] if self.text else f"Задание #{self.id}"


class TaskStep(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='steps')
    step_number = models.IntegerField()
    text = models.TextField(blank=True, null=True)

    # Вместо ImageField — URL из S3
    image_url = models.URLField(max_length=500, blank=True, null=True)

    def __str__(self):
        return f"Шаг {self.step_number} → задание #{self.task_id}"