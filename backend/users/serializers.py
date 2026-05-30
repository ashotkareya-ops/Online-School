from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    students_count = serializers.SerializerMethodField()
    subject_links = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'role', 'is_profile_filled', 'is_approved',
            'exam_type', 'subjects', 'subject_links',
            'teacher_code', 'teacher', 'students_count'
        ]

    def get_students_count(self, obj):
        return obj.students.count() if obj.role == 'teacher' else None

    def get_subject_links(self, obj):
        return [
            {'id': s.id, 'name': s.name, 'exam_type': s.exam_type.name}
            for s in obj.subject_links.select_related('exam_type').all()
        ]


class SetupProfileSerializer(serializers.ModelSerializer):
    exam_type = serializers.ListField(
        child=serializers.ChoiceField(choices=['oge', 'ege']),
        allow_empty=False
    )
    # subjects принимается как словарь { "oge": [...], "ege": [...] }
    subjects = serializers.DictField(
        child=serializers.ListField(
            child=serializers.CharField(max_length=100)
        ),
        allow_empty=False
    )

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'exam_type', 'subjects']

    def validate_first_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError('Имя должно быть не менее 2 символов')
        return value.strip()

    def validate_last_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError('Фамилия должна быть не менее 2 символов')
        return value.strip()

    def validate_subjects(self, value):
        allowed_keys = {'oge', 'ege'}
        for key in value:
            if key not in allowed_keys:
                raise serializers.ValidationError(
                    f'Недопустимый тип экзамена: {key}. Допустимые значения: oge, ege'
                )
            if not value[key]:
                raise serializers.ValidationError(
                    f'Список предметов для {key.upper()} не может быть пустым'
                )
        return value

    def validate(self, attrs):
        exam_types = attrs.get('exam_type', [])
        subjects = attrs.get('subjects', {})

        # Каждый выбранный тип экзамена должен иметь хотя бы один предмет
        for exam_key in exam_types:
            if not subjects.get(exam_key):
                exam_label = 'ОГЭ' if exam_key == 'oge' else 'ЕГЭ'
                raise serializers.ValidationError(
                    {'subjects': f'Выберите хотя бы один предмет для {exam_label}'}
                )
        return attrs

    def update(self, instance, validated_data):
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.exam_type = validated_data.get('exam_type', instance.exam_type)
        instance.subjects = validated_data.get('subjects', instance.subjects)
        instance.is_profile_filled = True
        instance.save()
        return instance