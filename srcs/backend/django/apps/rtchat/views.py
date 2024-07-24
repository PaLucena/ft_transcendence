from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework import status
from rtchat.models import ChatGroup
from django.contrib.auth.decorators import login_required


@login_required
def chat_view(request, chatroom_name):
    chat_group = get_object_or_404(ChatGroup, group_name="public-chat")
    chat_messages = chat_group.chat_messages.all()[:30]

    return Response(
        {
            "chat_messages": chat_messages,
        },
        status=status.HTTP_200_OK,
    )
