from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from django.shortcuts import get_object_or_404
from rtchat.models import ChatGroup, GroupMessage
from django.contrib.auth.decorators import login_required


@login_required
@api_view(["GET"])
def chat_view(request, chatroom_name):
    chat_group = get_object_or_404(ChatGroup, group_name=chatroom_name)
    chat_messages = chat_group.chat_messages.all()[:30]

    messages = [
        {
            "body": message.body,
            "author": message.author.username,
            "created": message.created.isoformat(),
        }
        for message in chat_messages
    ]

    return Response(
        {
            "chat_messages": messages,
        },
        status=status.HTTP_200_OK,
    )
