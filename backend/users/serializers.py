from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    students_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'role', 'is_profile_filled', 'is_approved',
            'exam_type', 'subjects',
            'teacher_code', 'teacher', 'students_count'
        ]

    def get_students_count(self, obj):
        if obj.role == 'teacher':
            return obj.students.count()
        return None


class SetupProfileSerializer(serializers.ModelSerializer):
    exam_type = serializers.ListField(
        child=serializers.ChoiceField(choices=['oge', 'ege']),
        allow_empty=False
    )
    subjects = serializers.ListField(
        child=serializers.CharField(max_length=100),
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

    def update(self, instance, validated_data):
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.exam_type = validated_data.get('exam_type', instance.exam_type)
        instance.subjects = validated_data.get('subjects', instance.subjects)
        instance.is_profile_filled = True
        instance.save()
        return instance