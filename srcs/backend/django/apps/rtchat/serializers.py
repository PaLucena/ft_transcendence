from rest_framework import serializers
from rtchat.models import GroupMessage


class GroupMessageSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()

    class Meta:
        model = GroupMessage
        fields = ["body", "author", "created"]

    def get_author(self, obj):
        return obj.author.username
