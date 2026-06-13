from rest_framework import serializers
from .models import Homework


class HomeworkSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    exam_type    = serializers.CharField(source='subject.exam_type.name', read_only=True)
    teacher_name = serializers.SerializerMethodField()
    due_date     = serializers.DateField(format='%d.%m.%Y', input_formats=['%Y-%m-%d', '%d.%m.%Y'], allow_null=True, required=False)

    class Meta:
        model  = Homework
        fields = [
            'id', 'title', 'subject', 'subject_name', 'exam_type',
            'teacher', 'teacher_name', 'student',
            'due_date', 'status', 'auto_check', 'comment', 'created_at',
        ]
        read_only_fields = ['teacher', 'created_at']

    def get_teacher_name(self, obj):
        t = obj.teacher
        full = f'{t.first_name} {t.last_name}'.strip()
        return full or t.username


class HomeworkCreateSerializer(serializers.ModelSerializer):
    """Для учителя — создать задание одному ученику или без привязки."""
    due_date = serializers.DateField(format='%d.%m.%Y', input_formats=['%Y-%m-%d', '%d.%m.%Y'], allow_null=True, required=False)

    class Meta:
        model  = Homework
        fields = ['title', 'subject', 'student', 'due_date', 'auto_check', 'comment']

    def validate_subject(self, subject):
        teacher = self.context['request'].user
        if not teacher.subject_links.filter(id=subject.id).exists():
            raise serializers.ValidationError('Нет доступа к этому предмету.')
        return subject

    def validate_student(self, student):
        if student is None:
            return student
        teacher = self.context['request'].user
        # Ученик должен быть привязан к этому учителю
        if student.teacher_id != teacher.id:
            raise serializers.ValidationError('Этот ученик не ваш.')
        return student

    def create(self, validated_data):
        validated_data['teacher'] = self.context['request'].user
        return super().create(validated_data)


class HomeworkStatusSerializer(serializers.ModelSerializer):
    """Только для ученика — обновить статус."""
    class Meta:
        model  = Homework
        fields = ['status']

    def validate_status(self, value):
        if value not in ('todo', 'review', 'done'):
            raise serializers.ValidationError('Недопустимый статус.')
        return value