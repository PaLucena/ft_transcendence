from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from user.models import AppUser
from friends.models import Friend
from user.decorators import default_authentication_required
from rtchat.views import create_private_chat_if_not_exists

STATUS_ACCEPTED = "accepted"
STATUS_NO_RELATION = "no_relation"
STATUS_INCOMING = "incoming"
STATUS_PENDING = "pending"


def get_friendship_status(user, other_user):
    try:
        friendship = Friend.objects.get(
            Q(from_user=user, to_user=other_user)
            | Q(to_user=user, from_user=other_user)
        )

        if friendship.status == Friend.ACCEPTED:
            return STATUS_ACCEPTED

        if friendship.status == Friend.PENDING and friendship.from_user == other_user:
            return STATUS_INCOMING

        if friendship.status == Friend.PENDING and friendship.from_user == user:
            return STATUS_PENDING

    except Friend.DoesNotExist:
        return STATUS_NO_RELATION
    except Exception as e:
        print(f"Error in get_friendship_status: {str(e)}")
        return STATUS_NO_RELATION


def get_friend_data(user, friend):
    try:
        if friend.from_user == user:
            other_user = friend.to_user
        else:
            other_user = friend.from_user

        return {
            "id": other_user.username,
            "username": other_user.username,
            "is_online": other_user.is_online,
            "other_user_avatar_url": (
                other_user.avatar.url if other_user.avatar else None
            ),
        }
    except AttributeError as e:
        print(f"Error in get_friend_data: {str(e)}")
        return {
            "id": "",
            "username": "Unknown",
            "is_online": False,
            "other_user_avatar_url": None,
        }
    except Exception as e:
        print(f"Unexpected error in get_friend_data: {str(e)}")
        return {
            "username": "Unknown",
            "is_online": False,
            "other_user_avatar_url": None,
        }


@api_view(["GET"])
@default_authentication_required
def filter_users(request, filter_type):
    try:
        user = request.user

        all_users = AppUser.objects.exclude(id=user.id)
        friendships = Friend.objects.select_related("from_user", "to_user").filter(
            Q(from_user=user) | Q(to_user=user)
        )

        users_data = []

        if filter_type == "all":
            users_data = [
                {
                    "id": other_user.id,
                    "username": other_user.username,
                    "friendship_status": get_friendship_status(user, other_user),
                    "is_online": other_user.is_online,
                    "other_user_avatar_url": (
                        other_user.avatar.url if other_user.avatar else None
                    ),
                }
                for other_user in all_users
            ]

        elif filter_type == "my_friends":
            friends = friendships.filter(status=Friend.ACCEPTED)
            users_data = [get_friend_data(user, friend) for friend in friends]

        elif filter_type == "pending_requests":
            pending_requests = friendships.filter(from_user=user, status=Friend.PENDING)
            users_data = [
                {
                    "id": friend.to_user.id,
                    "username": friend.to_user.username,
                    "other_user_avatar_url": (
                        friend.to_user.avatar.url if friend.to_user.avatar else None
                    ),
                }
                for friend in pending_requests
            ]

        elif filter_type == "incoming_requests":
            incoming_requests = friendships.filter(to_user=user, status=Friend.PENDING)
            users_data = [
                {
                    "id": friend.from_user.id,
                    "username": friend.from_user.username,
                    "other_user_avatar_url": (
                        friend.from_user.avatar.url if friend.from_user.avatar else None
                    ),
                }
                for friend in incoming_requests
            ]

        else:
            return Response(
                {"detail": "Invalid filter type"}, status=status.HTTP_404_NOT_FOUND
            )

        users_data.sort(key=lambda x: x["username"].lower())

        return Response({"users": users_data}, status=status.HTTP_200_OK)

    except AppUser.DoesNotExist:
        return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(
            {"detail": f"An error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@default_authentication_required
def invite_friend(request):
    user_id = request.data.get("user_id")

    if not user_id:
        return Response(
            {"detail": "Friend user_id required"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        friend = AppUser.objects.get(id=user_id)
    except AppUser.DoesNotExist:
        return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(
            {"detail": f"An error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    try:
        existing_friendship = (
            Friend.objects.select_related("from_user", "to_user")
            .filter(
                Q(from_user=request.user, to_user=friend)
                | Q(from_user=friend, to_user=request.user)
            )
            .first()
        )

        if existing_friendship:
            return Response(
                {"detail": "Friend request already exists"},
                status=status.HTTP_409_CONFLICT,
            )

        Friend.objects.create(from_user=request.user, to_user=friend)
        return Response(
            {"detail": "Friend request sent successfully"}, status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response(
            {"detail": f"An error occurred while creating friend request: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@default_authentication_required
def accept_invitation(request):
    user_id = request.data.get("user_id")

    if not user_id:
        return Response(
            {"detail": "Friend id required"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        friend = AppUser.objects.get(id=user_id)
    except AppUser.DoesNotExist:
        return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(
            {"detail": f"An error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    try:
        friend_request = Friend.objects.select_related("from_user", "to_user").get(
            from_user=friend, to_user=request.user, status=Friend.PENDING
        )

        friend_request.status = Friend.ACCEPTED
        friend_request.save()

        create_private_chat_if_not_exists(request.user, friend)

        return Response(
            {"detail": "Friend request accepted successfully"},
            status=status.HTTP_200_OK,
        )
    except Friend.DoesNotExist:
        return Response(
            {"detail": "No pending friend request from this user"},
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        return Response(
            {"detail": f"An error occurred while accepting friend request: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@default_authentication_required
def remove_friend(request):
    user_id = request.data.get("user_id")

    if not user_id:
        return Response(
            {"detail": "Friend id required"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        friend = AppUser.objects.get(id=user_id)
    except AppUser.DoesNotExist:
        return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(
            {"detail": f"An error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    try:
        friendship = Friend.objects.select_related("from_user", "to_user").filter(
            Q(from_user=request.user, to_user=friend)
            | Q(to_user=request.user, from_user=friend)
        )

        if not friendship.exists():
            return Response(
                {"detail": "Friendship does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )

        friendship.delete()
        return Response(
            {"detail": "Friend successfully removed"}, status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response(
            {"detail": f"An error occurred while removing friend: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@default_authentication_required
def search_friends(request):
    user = request.user
    query = request.GET.get("query", "").strip().lower()
    filter_type = request.GET.get("filter", "all")

    try:
        all_users = AppUser.objects.exclude(id=user.id).filter(
            username__icontains=query
        )
        friendships = Friend.objects.select_related("from_user", "to_user").filter(
            Q(from_user=user) | Q(to_user=user)
        )

        if filter_type == "all":
            users_data = [
                {
                    "id": other_user.id,
                    "username": other_user.username,
                    "friendship_status": get_friendship_status(user, other_user),
                    "is_online": other_user.is_online,
                    "other_user_avatar_url": (
                        other_user.avatar.url if other_user.avatar else None
                    ),
                }
                for other_user in all_users
            ]

        elif filter_type == "my_friends":
            friends = friendships.filter(status=Friend.ACCEPTED).filter(
                Q(from_user__username__icontains=query)
                | Q(to_user__username__icontains=query)
            )
            users_data = [get_friend_data(user, friend) for friend in friends]

        elif filter_type == "pending_requests":
            pending_requests = friendships.filter(
                from_user=user, status=Friend.PENDING
            ).filter(to_user__username__icontains=query)
            users_data = [
                {
                    "id": friend.to_user.id,
                    "username": friend.to_user.username,
                    "other_user_avatar_url": (
                        friend.to_user.avatar.url if friend.to_user.avatar else None
                    ),
                }
                for friend in pending_requests
            ]

        elif filter_type == "incoming_requests":
            incoming_requests = friendships.filter(
                to_user=user, status=Friend.PENDING
            ).filter(from_user__username__icontains=query)
            users_data = [
                {
                    "id": friend.from_user.id,
                    "username": friend.from_user.username,
                    "other_user_avatar_url": (
                        friend.from_user.avatar.url if friend.from_user.avatar else None
                    ),
                }
                for friend in incoming_requests
            ]

        else:
            return Response(
                {"detail": "Invalid filter type"}, status=status.HTTP_400_BAD_REQUEST
            )

        users_data.sort(key=lambda x: x["username"].lower())

        return Response({"users": users_data}, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {"detail": f"An error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
