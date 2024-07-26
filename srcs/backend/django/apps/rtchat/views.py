from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from django.shortcuts import get_object_or_404
from rtchat.models import ChatGroup, Block
from django.contrib.auth.decorators import login_required
from user.models import AppUser


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


@login_required
@api_view(["POST"])
def block_user_view(request, chatroom_name):
    blocker = request.user
    blocked_username = request.data.get("blocked_username")
    blocked_user = get_object_or_404(AppUser, username=blocked_username)

    if Block.objects.filter(blocker=blocker, blocked=blocked_user).exists():
        return Response(
            {"detail": "User already blocked"}, status=status.HTTP_400_BAD_REQUEST
        )

    Block.objects.create(blocker=blocker, blocked=blocked_user)
    return Response(
        {"detail": "User blocked successfully"}, status=status.HTTP_201_CREATED
    )


@login_required
@api_view(["POST"])
def unblock_user_view(request, chatroom_name):
    blocker = request.user
    blocked_username = request.data.get("blocked_username")
    blocked_user = get_object_or_404(AppUser, username=blocked_username)

    block = Block.objects.filter(blocker=blocker, blocked=blocked_user).first()
    if not block:
        return Response(
            {"detail": "User not blocked"}, status=status.HTTP_400_BAD_REQUEST
        )

    block.delete()
    return Response(
        {"detail": "User unblocked successfully"}, status=status.HTTP_200_OK
    )
