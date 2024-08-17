from rest_framework import serializers
from .models import GroupMessage
from user.models import AppUser


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppUser
        fields = ("username", "avatar", "is_online")


class GroupMessageSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = GroupMessage
        fields = ["id", "author", "body", "created"]
