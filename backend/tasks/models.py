from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL


# ─────────────────────────────────────────────
#  Справочники
# ─────────────────────────────────────────────

class Subject(models.Model):
    """Предмет: Математика, Физика, Информатика…"""
    name = models.CharField(max_length=100, unique=True, verbose_name='Название')
    slug = models.SlugField(max_length=100, unique=True)
    order = models.PositiveSmallIntegerField(default=0, verbose_name='Порядок сортировки')

    class Meta:
        verbose_name = 'Предмет'
        verbose_name_plural = 'Предметы'
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


class Exam(models.Model):
    """Экзамен / формат: ОГЭ, ЕГЭ, ВПР, Олимпиада…"""
    name = models.CharField(max_length=100, verbose_name='Название')
    slug = models.SlugField(max_length=100, unique=True)
    subject = models.ForeignKey(
        Subject, on_delete=models.CASCADE,
        related_name='exams', verbose_name='Предмет'
    )
    grade = models.PositiveSmallIntegerField(
        null=True, blank=True, verbose_name='Класс (необязательно)'
    )
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name = 'Экзамен'
        verbose_name_plural = 'Экзамены'
        ordering = ['order', 'name']
        unique_together = [('subject', 'slug')]

    def __str__(self):
        return f'{self.subject.name} — {self.name}'


class Topic(models.Model):
    """Тема задания внутри экзамена: Уравнения, Геометрия…"""
    name = models.CharField(max_length=200, verbose_name='Название темы')
    exam = models.ForeignKey(
        Exam, on_delete=models.CASCADE,
        related_name='topics', verbose_name='Экзамен'
    )
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name = 'Тема'
        verbose_name_plural = 'Темы'
        ordering = ['order', 'name']
        unique_together = [('exam', 'name')]

    def __str__(self):
        return f'{self.exam} / {self.name}'


# ─────────────────────────────────────────────
#  Задание
# ─────────────────────────────────────────────

class Task(models.Model):

    class AnswerType(models.TextChoices):
        SHORT       = 'short',    'Краткий ответ'
        SINGLE      = 'single',   'Выбор одного варианта'
        MULTIPLE    = 'multiple', 'Выбор нескольких вариантов'
        DETAILED    = 'detailed', 'Развёрнутый ответ'
        MANUAL      = 'manual',   'Ручная проверка учителем'
        FILE        = 'file',     'Прикреплённый файл/изображение'

    class Difficulty(models.TextChoices):
        EASY   = 'easy',   'Лёгкое'
        MEDIUM = 'medium', 'Среднее'
        HARD   = 'hard',   'Сложное'

    class Status(models.TextChoices):
        DRAFT       = 'draft',      'Черновик'
        MODERATION  = 'moderation', 'На модерации'
        PUBLISHED   = 'published',  'Опубликовано'
        ARCHIVED    = 'archived',   'Архивировано'

    # Автор
    author = models.ForeignKey(
        User, on_delete=models.CASCADE,
        related_name='tasks', verbose_name='Автор'
    )

    # Структура
    subject = models.ForeignKey(
        Subject, on_delete=models.PROTECT,
        related_name='tasks', verbose_name='Предмет'
    )
    exam = models.ForeignKey(
        Exam, on_delete=models.PROTECT,
        related_name='tasks', verbose_name='Экзамен'
    )
    topic = models.ForeignKey(
        Topic, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='tasks', verbose_name='Тема'
    )
    task_number = models.PositiveSmallIntegerField(
        null=True, blank=True, verbose_name='Номер задания в экзамене'
    )

    # Контент
    text = models.TextField(verbose_name='Условие задания')
    answer_type = models.CharField(
        max_length=20, choices=AnswerType.choices,
        default=AnswerType.SHORT, verbose_name='Тип ответа'
    )
    correct_answer = models.TextField(
        blank=True, verbose_name='Правильный ответ'
    )
    explanation = models.TextField(
        blank=True, verbose_name='Объяснение'
    )

    # Метаданные
    difficulty = models.CharField(
        max_length=10, choices=Difficulty.choices,
        default=Difficulty.MEDIUM, verbose_name='Сложность'
    )
    tags = models.JSONField(default=list, blank=True, verbose_name='Теги')
    status = models.CharField(
        max_length=20, choices=Status.choices,
        default=Status.DRAFT, verbose_name='Статус'
    )

    # Времена
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Задание'
        verbose_name_plural = 'Задания'
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.exam}] #{self.task_number} — {self.text[:60]}'


class TaskAnswerOption(models.Model):
    """Варианты ответа для заданий с выбором (single / multiple)."""
    task = models.ForeignKey(
        Task, on_delete=models.CASCADE,
        related_name='answer_options', verbose_name='Задание'
    )
    text = models.CharField(max_length=500, verbose_name='Текст варианта')
    is_correct = models.BooleanField(default=False, verbose_name='Правильный?')
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name = 'Вариант ответа'
        verbose_name_plural = 'Варианты ответа'
        ordering = ['order']

    def __str__(self):
        return f'{self.task_id} / {self.text[:40]}'


class TaskAttachment(models.Model):
    """Файлы и изображения к заданию."""
    task = models.ForeignKey(
        Task, on_delete=models.CASCADE,
        related_name='attachments', verbose_name='Задание'
    )
    file = models.FileField(upload_to='tasks/attachments/', verbose_name='Файл')
    name = models.CharField(max_length=255, blank=True, verbose_name='Название')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Вложение'
        verbose_name_plural = 'Вложения'

    def __str__(self):
        return f'{self.task_id} / {self.name or self.file.name}'


# ─────────────────────────────────────────────
#  Избранное
# ─────────────────────────────────────────────

class FavoriteTask(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE,
        related_name='favorite_tasks', verbose_name='Пользователь'
    )
    task = models.ForeignKey(
        Task, on_delete=models.CASCADE,
        related_name='favorited_by', verbose_name='Задание'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Избранное задание'
        verbose_name_plural = 'Избранные задания'
        unique_together = [('user', 'task')]

    def __str__(self):
        return f'{self.user} → {self.task_id}'


# ─────────────────────────────────────────────
#  Домашнее задание
# ─────────────────────────────────────────────

class HomeworkAssignment(models.Model):
    """Домашнее задание, созданное учителем."""

    class Status(models.TextChoices):
        ACTIVE    = 'active',    'Активно'
        COMPLETED = 'completed', 'Завершено'
        CANCELLED = 'cancelled', 'Отменено'

    teacher = models.ForeignKey(
        User, on_delete=models.CASCADE,
        related_name='homework_assignments', verbose_name='Учитель'
    )
    title = models.CharField(max_length=255, verbose_name='Название ДЗ')
    description = models.TextField(blank=True, verbose_name='Описание')
    deadline = models.DateTimeField(null=True, blank=True, verbose_name='Дедлайн')
    status = models.CharField(
        max_length=20, choices=Status.choices,
        default=Status.ACTIVE, verbose_name='Статус'
    )
    students = models.ManyToManyField(
        User, related_name='homework_received',
        blank=True, verbose_name='Ученики'
    )
    tasks = models.ManyToManyField(
        Task, through='HomeworkTask',
        related_name='homeworks', verbose_name='Задания'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Домашнее задание'
        verbose_name_plural = 'Домашние задания'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.teacher} / {self.title}'


class HomeworkTask(models.Model):
    """Промежуточная таблица задание↔ДЗ с порядком."""
    homework = models.ForeignKey(HomeworkAssignment, on_delete=models.CASCADE)
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['order']
        unique_together = [('homework', 'task')]


# ─────────────────────────────────────────────
#  Результаты ученика
# ─────────────────────────────────────────────

class StudentTaskResult(models.Model):
    """Ответ ученика на конкретное задание."""

    class ResultStatus(models.TextChoices):
        PENDING  = 'pending',  'Ожидает проверки'
        CORRECT  = 'correct',  'Верно'
        WRONG    = 'wrong',    'Неверно'
        PARTIAL  = 'partial',  'Частично верно'

    student = models.ForeignKey(
        User, on_delete=models.CASCADE,
        related_name='task_results', verbose_name='Ученик'
    )
    task = models.ForeignKey(
        Task, on_delete=models.CASCADE,
        related_name='student_results', verbose_name='Задание'
    )
    homework = models.ForeignKey(
        HomeworkAssignment, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='results', verbose_name='ДЗ (если из ДЗ)'
    )
    answer = models.TextField(blank=True, verbose_name='Ответ ученика')
    answer_file = models.FileField(
        upload_to='tasks/student_answers/',
        null=True, blank=True, verbose_name='Файл-ответ'
    )
    status = models.CharField(
        max_length=20, choices=ResultStatus.choices,
        default=ResultStatus.PENDING, verbose_name='Результат'
    )
    teacher_comment = models.TextField(
        blank=True, verbose_name='Комментарий учителя'
    )
    attempt = models.PositiveSmallIntegerField(default=1, verbose_name='Попытка')
    submitted_at = models.DateTimeField(auto_now_add=True)
    checked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Результат ученика'
        verbose_name_plural = 'Результаты учеников'
        ordering = ['-submitted_at']

    def __str__(self):
        return f'{self.student} / task#{self.task_id} / {self.status}'