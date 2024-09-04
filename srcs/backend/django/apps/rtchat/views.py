from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from django.shortcuts import get_object_or_404
from django.http import Http404
from rtchat.models import ChatGroup, Block
from user.models import AppUser
from rtchat.serializers import GroupMessageSerializer, UserSerializer
from user.decorators import default_authentication_required


@api_view(["GET"])
@default_authentication_required
def chat_view(request, chatroom_name):
    try:
        chat_group = ChatGroup.objects.filter(group_name=chatroom_name).first()

        if not chat_group:
            return Response(
                {"detail": f"Chatroom does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )

        other_user = None
        other_user_data = None
        block_status = None

        if chat_group.is_private:
            if request.user not in chat_group.members.all():
                return Response(
                    {"detail": "You do not have access to this private chat"},
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


def create_private_chat_if_not_exists(user1, user2):
    chatroom = (
        ChatGroup.objects.filter(is_private=True, members=user1)
        .filter(members=user2)
        .first()
    )

    if not chatroom:
        chatroom = ChatGroup.objects.create(is_private=True)
        chatroom.members.add(user1, user2)
        chatroom.save()


@api_view(["GET"])
@default_authentication_required
def get_or_create_chatroom(request, username):
    try:
        if request.user.username == username:
            return Response(
                {"detail": "You cannot create a private chat with yourself"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            other_user = get_object_or_404(AppUser, username=username)
        except Http404:
            return Response(
                {"detail": "The user does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )

        create_private_chat_if_not_exists(request.user, other_user)

        chatroom = (
            ChatGroup.objects.filter(is_private=True, members=request.user)
            .filter(members=other_user)
            .first()
        )

        return Response(
            {"chatroom_name": chatroom.group_name},
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        return Response(
            {"detail": f"An error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@default_authentication_required
def get_all_private_chats_view(request):
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
                    "other_user_online_status": other_user.is_online,
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
    try:
        blocker = request.user
        blocked_username = request.data.get("blocked_username")
        action = request.data.get("action")

        print(
            f"blocker: {blocker}, blocked_username: {blocked_username}, action: {action}"
        )

        if not blocked_username:
            return Response(
                {"detail": "No username provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if action not in ["block", "unblock"]:
            return Response(
                {"detail": "Invalid action. Action must be 'block' or 'unblock'"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            blocked_user = get_object_or_404(AppUser, username=blocked_username)
        except Http404:
            return Response(
                {"detail": "The user does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if action == "block":
            if Block.objects.filter(blocker=blocker, blocked=blocked_user).exists():
                response_message = f"User {blocked_user.username} already blocked"
                return Response(
                    {"detail": response_message},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            Block.objects.create(blocker=blocker, blocked=blocked_user)

            response_message = f"User {blocked_user.username} blocked successfully"
            return Response(
                {"detail": response_message},
                status=status.HTTP_201_CREATED,
            )

        elif action == "unblock":
            block = Block.objects.filter(blocker=blocker, blocked=blocked_user).first()
            if not block:
                response_message = f"User {blocked_user.username} not blocked"
                return Response(
                    {"detail": response_message},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            block.delete()

            response_message = f"User {blocked_user.username} unblocked successfully"
            return Response(
                {"detail": response_message},
                status=status.HTTP_200_OK,
            )

    except Exception as e:
        return Response(
            {"detail": f"An error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
