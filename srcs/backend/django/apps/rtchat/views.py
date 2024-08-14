from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from django.shortcuts import get_object_or_404
from rtchat.models import ChatGroup, Block
from user.models import AppUser
from rtchat.serializers import GroupMessageSerializer, UserSerializer
from user.decorators import default_authentication_required


@api_view(["GET"])
@default_authentication_required
def chat_view(request, chatroom_name="public-chat"):
    if not request.user.is_authenticated:
        return Response(
            {"detail": "Authentication required."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        chat_group = get_object_or_404(ChatGroup, group_name=chatroom_name)
        other_user = None
        other_user_data = None
        block_status = None

        if chat_group.is_private:
            if request.user not in chat_group.members.all():
                return Response(
                    {"detail": "You do not have access to this private chat."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            for member in chat_group.members.all():
                if member != request.user:
                    other_user = member
                    other_user_data = UserSerializer(other_user).data
                    break

            if Block.objects.filter(blocker=request.user, blocked=other_user).exists():
                block_status = "blocker"
            elif Block.objects.filter(
                blocker=other_user, blocked=request.user
            ).exists():
                block_status = "blocked"

        chat_messages = chat_group.chat_messages.order_by("created")
        message_data = GroupMessageSerializer(chat_messages, many=True).data

        context = {
            "chat_messages": message_data,
            "chatroom_name": chatroom_name,
            "current_user": request.user.username,
            "other_user": other_user_data,
            "block_status": block_status,
        }

        return Response(context, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {"detail": f"An error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@default_authentication_required
def get_or_create_chatroom(request, username):
    if not request.user.is_authenticated:
        return Response(
            {"detail": "Authentication required."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

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


@api_view(["GET"])
@default_authentication_required
def get_all_private_chats_view(request):
    if not request.user.is_authenticated:
        return Response(
            {"detail": "Authentication required."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        private_chats = ChatGroup.objects.filter(
            is_private=True,
            members=request.user,
        )

        chat_data = []
        for chat in private_chats:
            other_user = chat.members.exclude(id=request.user.id).first()

            if other_user:
                chat_info = {
                    "chatroom_name": chat.group_name,
                    "other_user_username": other_user.username,
                    "other_user_online_status": other_user.online,
                    "other_user_avatar_url": (
                        other_user.avatar.url if other_user.avatar else None
                    ),
                }
                chat_data.append(chat_info)

        return Response(chat_data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {"detail": f"An error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@default_authentication_required
def block_or_unblock_user_view(request):
    if not request.user.is_authenticated:
        return Response(
            {"detail": "Authentication required."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        blocker = request.user
        blocked_username = request.data.get("blocked_username")
        action = request.data.get("action")

        if not blocked_username:
            return Response(
                {"detail": "No username provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if action not in ["block", "unblock"]:
            return Response(
                {"detail": "Invalid action. Action must be 'block' or 'unblock'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        blocked_user = get_object_or_404(AppUser, username=blocked_username)

        if action == "block":
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

        elif action == "unblock":
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
