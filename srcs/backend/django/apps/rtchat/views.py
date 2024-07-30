from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from rtchat.models import ChatGroup, Block
from user.models import AppUser
from rtchat.serializers import GroupMessageSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def chat_view(request, chatroom_name="public-chat"):
    try:
        chat_group = get_object_or_404(ChatGroup, group_name=chatroom_name)

        # Check for private chat and user membership
        other_user = None
        if chat_group.is_private:
            if request.user not in chat_group.members.all():
                return Response(
                    {"detail": "You do not have access to this private chat."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            for member in chat_group.members.all():
                if member != request.user:
                    other_user = member
                    break

        chat_messages = chat_group.chat_messages.order_by("created")
        message_data = GroupMessageSerializer(chat_messages, many=True).data

        context = {
            "chat_messages": message_data,
            "chatroom_name": chatroom_name,
            "current_user": request.user.username,
            "other_user": other_user.username if other_user else None,
        }

        return Response(context, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {"detail": f"An error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_or_create_chatroom(request, username):
    print("HEKLEKLEELELE")
    if request.user.username == username:
        return Response(
            {"detail": "You cannot create a private chat with yourself."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        other_user = get_object_or_404(AppUser, username=username)
    except AppUser.DoesNotExist:
        return Response(
            {"detail": "The user does not exist."},
            status=status.HTTP_404_NOT_FOUND,
        )

    my_chatrooms = request.user.chat_group.filter(is_private=True)

    chatroom = None
    for room in my_chatrooms:
        if other_user in room.members.all():
            chatroom = room
            break

    if not chatroom:
        chatroom = ChatGroup.objects.create(is_private=True)
        chatroom.members.add(other_user, request.user)

    return Response(
        {"chatroom_name": chatroom.group_name},
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def block_user_view(request, chatroom_name):
    try:
        blocker = request.user
        blocked_username = request.data.get("blocked_username")

        if not blocked_username:
            return Response(
                {"detail": "No username provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        blocked_user = get_object_or_404(AppUser, username=blocked_username)

        if Block.objects.filter(blocker=blocker, blocked=blocked_user).exists():
            return Response(
                {"detail": "User already blocked"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        Block.objects.create(blocker=blocker, blocked=blocked_user)
        return Response(
            {"detail": "User blocked successfully"},
            status=status.HTTP_201_CREATED,
        )
    except Exception as e:
        return Response(
            {"detail": f"An error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def unblock_user_view(request, chatroom_name):
    try:
        blocker = request.user
        blocked_username = request.data.get("blocked_username")

        if not blocked_username:
            return Response(
                {"detail": "No username provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        blocked_user = get_object_or_404(AppUser, username=blocked_username)

        block = Block.objects.filter(blocker=blocker, blocked=blocked_user).first()
        if not block:
            return Response(
                {"detail": "User not blocked"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        block.delete()
        return Response(
            {"detail": "User unblocked successfully"},
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        return Response(
            {"detail": f"An error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
